export type ToolName =
  | "read_inbox"
  | "read_calendar"
  | "search_files"
  | "send_email"
  | "fetch_url";

export type ToolStatus = "allowed" | "blocked" | "needs_confirm";

export type ToolCall = {
  id: string;
  name: ToolName;
  args: Record<string, string>;
  status: ToolStatus;
  reason: string;
  result?: string;
};

export type Policy = {
  isolateRetrieved: boolean;
  allowlist: boolean;
  confirmHighImpact: boolean;
  urlAllowlist: boolean;
};

export type Email = {
  id: string;
  fromName: string;
  fromAddr: string;
  subject: string;
  preview: string;
  body: string;
  planted: boolean;
};

export type TraceEvent =
  | { id: string; kind: "system"; text: string }
  | { id: string; kind: "user"; text: string }
  | { id: string; kind: "thought"; text: string; tone: "neutral" | "hijack" | "safe" }
  | { id: string; kind: "tool"; call: ToolCall }
  | { id: string; kind: "reply"; visible: string; honest: string }
  | {
      id: string;
      kind: "verdict";
      compromised: boolean;
      leaks: string[];
      blocked: string[];
      keptGoal: boolean;
    };

export type InjectionFinding = {
  present: boolean;
  signals: string[];
  wantsCalendar: boolean;
  wantsFiles: boolean;
  wantsExfilUrl: string | null;
  wantsForward: boolean;
};

export const HIGH_IMPACT: ToolName[] = ["send_email", "fetch_url"];

export const TASK_ALLOWLIST: ToolName[] = ["read_inbox"];

export const URL_ALLOWLIST = [
  "northline.example",
  "calendar.example",
  "workday.example",
];

export const OPEN_POLICY: Policy = {
  isolateRetrieved: false,
  allowlist: false,
  confirmHighImpact: false,
  urlAllowlist: false,
};

export const HARDENED_POLICY: Policy = {
  isolateRetrieved: true,
  allowlist: true,
  confirmHighImpact: true,
  urlAllowlist: true,
};

export function policyPreset(policy: Policy): "open" | "hardened" | "custom" {
  const keys: (keyof Policy)[] = [
    "isolateRetrieved",
    "allowlist",
    "confirmHighImpact",
    "urlAllowlist",
  ];
  if (keys.every((k) => policy[k] === OPEN_POLICY[k])) return "open";
  if (keys.every((k) => policy[k] === HARDENED_POLICY[k])) return "hardened";
  return "custom";
}

export const TOOL_META: Record<
  ToolName,
  { label: string; impact: "read" | "high" }
> = {
  read_inbox: { label: "read_inbox", impact: "read" },
  read_calendar: { label: "read_calendar", impact: "read" },
  search_files: { label: "search_files", impact: "read" },
  send_email: { label: "send_email", impact: "high" },
  fetch_url: { label: "fetch_url", impact: "high" },
};
