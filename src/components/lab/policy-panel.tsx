import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { policyPreset, type Policy } from "@/lib/lab/types";
import { cn } from "@/lib/utils";
import { useLabStore } from "@/stores/lab-store";

const CONTROLS: Array<{
  key: keyof Policy;
  title: string;
  body: string;
}> = [
  {
    key: "isolateRetrieved",
    title: "Isolate retrieved content",
    body: "Mail, files, and pages are data. They cannot set a new goal or spawn tools.",
  },
  {
    key: "allowlist",
    title: "Task tool allowlist",
    body: "Summarize-inbox may call read_inbox only. Calendar, files, send, fetch are out.",
  },
  {
    key: "confirmHighImpact",
    title: "Confirm high-impact tools",
    body: "send_email and fetch_url wait for a human. No confirm means no call.",
  },
  {
    key: "urlAllowlist",
    title: "Outbound URL allowlist",
    body: "fetch_url may only hit northline.example hosts. Exfil domains fail closed.",
  },
];

export function PolicyPanel() {
  const policy = useLabStore((s) => s.policy);
  const setPolicy = useLabStore((s) => s.setPolicy);
  const applyPreset = useLabStore((s) => s.applyPreset);
  const run = useLabStore((s) => s.run);
  const preset = policyPreset(policy);

  return (
    <section className="flex min-h-0 flex-col rounded-2xl bg-surface p-3 shadow-[var(--shadow-border)] sm:p-4">
      <header className="flex items-start justify-between gap-3 px-1 pt-1">
        <div>
          <p className="text-xs font-medium tracking-[0.14em] text-subtle uppercase">
            Host
          </p>
          <h2 className="mt-1 text-sm font-medium text-fg">Sandbox policy</h2>
        </div>
        <div className="flex rounded-lg bg-bg p-1">
          <PresetChip
            active={preset === "open"}
            onClick={() => applyPreset("open")}
          >
            Open
          </PresetChip>
          <PresetChip
            active={preset === "hardened"}
            onClick={() => applyPreset("hardened")}
          >
            Hardened
          </PresetChip>
        </div>
      </header>

      <ul className="mt-4 space-y-2">
        {CONTROLS.map((control) => (
          <li
            key={control.key}
            className="flex items-start gap-3 rounded-lg bg-bg px-3 py-3"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-fg">{control.title}</p>
              <p className="mt-1 text-xs leading-normal text-muted">
                {control.body}
              </p>
            </div>
            <Switch
              className="mt-0.5"
              checked={policy[control.key]}
              onCheckedChange={(v) => setPolicy({ [control.key]: v })}
              aria-label={control.title}
            />
          </li>
        ))}
      </ul>

      <div className="mt-auto flex flex-col gap-2 pt-4">
        {preset === "custom" ? (
          <p className="text-xs text-subtle">
            Mixed policy. Flip one control at a time to see which layer stops
            which tool.
          </p>
        ) : null}
        <Button size="lg" className="w-full" onClick={() => run()}>
          Ask agent to summarize inbox
        </Button>
      </div>
    </section>
  );
}

function PresetChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-9 min-w-20 rounded-md px-3 text-xs font-medium transition-colors duration-[var(--motion-quick)] ease-[var(--ease-out)]",
        active ? "bg-surface-2 text-fg" : "text-muted hover:text-fg",
      )}
    >
      {children}
    </button>
  );
}
