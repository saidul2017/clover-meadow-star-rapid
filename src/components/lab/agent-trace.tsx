import type { ComponentType, CSSProperties, ReactNode } from "react";
import {
  Ban,
  Check,
  Eye,
  Lock,
  MessageSquare,
  ShieldAlert,
  Terminal,
  Wrench,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { TOOL_META, type ToolCall, type TraceEvent } from "@/lib/lab/types";
import { cn } from "@/lib/utils";
import { useLabStore } from "@/stores/lab-store";

export function AgentTrace() {
  const events = useLabStore((s) => s.events);
  const runNonce = useLabStore((s) => s.runNonce);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (events.length === 0) return;
    const delay = events.length * 70 + 280;
    const id = window.setTimeout(() => {
      endRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }, delay);
    return () => window.clearTimeout(id);
  }, [runNonce, events.length]);

  return (
    <section className="flex min-h-0 flex-col rounded-2xl bg-surface p-3 shadow-[var(--shadow-border)] sm:p-4">
      <header className="flex items-start justify-between gap-3 px-1 pt-1">
        <div>
          <p className="text-xs font-medium tracking-[0.14em] text-subtle uppercase">
            Agent
          </p>
          <h2 className="mt-1 text-sm font-medium text-fg">
            Northline office copilot
          </h2>
        </div>
        {events.length === 0 ? <Badge>idle</Badge> : <Badge>trace</Badge>}
      </header>

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
        {events.length === 0 ? (
          <EmptyTrace />
        ) : (
          <ol key={runNonce} className="space-y-2">
            {events.map((event, i) => (
              <li
                key={event.id}
                className="trace-enter"
                style={
                  {
                    "--trace-delay": `${i * 70}ms`,
                  } as CSSProperties
                }
              >
                <TraceRow event={event} />
              </li>
            ))}
            <div ref={endRef} />
          </ol>
        )}
      </div>
    </section>
  );
}

function EmptyTrace() {
  return (
    <div className="flex h-full min-h-56 flex-col items-center justify-center rounded-lg bg-bg px-6 text-center">
      <Terminal className="size-5 text-subtle" strokeWidth={1.5} />
      <p className="mt-3 max-w-xs text-sm text-muted">
        Plant or clear the hidden instruction, set the sandbox, then run a
        summarize. The trace is the lesson.
      </p>
    </div>
  );
}

function TraceRow({ event }: { event: TraceEvent }) {
  switch (event.kind) {
    case "system":
      return (
        <Block icon={Lock} kicker="system">
          <p className="font-mono text-xs leading-relaxed whitespace-pre-wrap text-muted">
            {event.text}
          </p>
        </Block>
      );
    case "user":
      return (
        <Block icon={MessageSquare} kicker="user task">
          <p className="text-sm text-fg">{event.text}</p>
        </Block>
      );
    case "thought":
      return (
        <Block
          icon={event.tone === "hijack" ? ShieldAlert : Check}
          kicker={
            event.tone === "hijack"
              ? "goal hijack"
              : event.tone === "safe"
                ? "goal held"
                : "plan"
          }
          tone={event.tone}
        >
          <p className="text-sm leading-normal text-fg">{event.text}</p>
        </Block>
      );
    case "tool":
      return <ToolBlock call={event.call} />;
    case "reply":
      return (
        <div className="space-y-2">
          <Block icon={MessageSquare} kicker="what the user sees">
            <p className="text-sm leading-normal text-fg">{event.visible}</p>
          </Block>
          <Block icon={Eye} kicker="what actually happened">
            <p className="text-sm leading-normal text-muted">{event.honest}</p>
          </Block>
        </div>
      );
    case "verdict":
      return (
        <div
          className={cn(
            "rounded-lg px-3 py-3",
            event.compromised ? "bg-compromised/10" : "bg-blocked/10",
          )}
        >
          <div className="flex flex-wrap items-center gap-2">
            {event.compromised ? (
              <Badge variant="compromised">compromised</Badge>
            ) : (
              <Badge variant="blocked">contained</Badge>
            )}
            {event.keptGoal ? (
              <Badge>user goal kept</Badge>
            ) : (
              <Badge variant="warn">goal replaced</Badge>
            )}
          </div>
          <p className="mt-2 text-sm text-fg">
            {event.compromised
              ? `Leaked: ${event.leaks.join(", ")}.`
              : "No data left the box."}
          </p>
          {event.blocked.length > 0 ? (
            <p className="mt-1 text-xs text-muted">
              Blocked tools: {event.blocked.join(", ")}.
            </p>
          ) : null}
        </div>
      );
  }
}

function ToolBlock({ call }: { call: ToolCall }) {
  const meta = TOOL_META[call.name];
  const status =
    call.status === "allowed"
      ? "allowed"
      : call.status === "needs_confirm"
        ? "needs confirm"
        : "blocked";
  const variant =
    call.status === "allowed"
      ? call.name === "read_inbox"
        ? "default"
        : "compromised"
      : "blocked";

  return (
    <Block icon={call.status === "allowed" ? Wrench : Ban} kicker="tool">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-sm text-fg">{meta.label}</span>
        <Badge variant={variant}>{status}</Badge>
        {meta.impact === "high" ? <Badge variant="warn">high impact</Badge> : null}
      </div>
      <dl className="mt-2 space-y-1 font-mono text-xs text-muted">
        {Object.entries(call.args).map(([k, v]) => (
          <div key={k} className="flex gap-2">
            <dt className="text-subtle">{k}</dt>
            <dd className="min-w-0 break-all">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-xs leading-normal text-muted">{call.reason}</p>
      {call.result ? (
        <pre className="mt-2 max-h-32 overflow-y-auto rounded-md bg-bg p-2 font-mono text-xs leading-relaxed whitespace-pre-wrap text-subtle">
          {call.result.length > 420 ? `${call.result.slice(0, 420)}…` : call.result}
        </pre>
      ) : null}
    </Block>
  );
}

function Block({
  icon: Icon,
  kicker,
  tone = "neutral",
  children,
}: {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  kicker: string;
  tone?: "neutral" | "hijack" | "safe";
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-lg bg-bg px-3 py-3",
        tone === "hijack" && "bg-compromised/10",
        tone === "safe" && "bg-blocked/10",
      )}
    >
      <div className="mb-2 flex items-center gap-2 text-subtle">
        <Icon className="size-3.5" strokeWidth={1.75} />
        <span className="text-xs font-medium tracking-[0.12em] uppercase">
          {kicker}
        </span>
      </div>
      {children}
    </div>
  );
}
