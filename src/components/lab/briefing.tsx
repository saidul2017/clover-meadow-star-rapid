import { ArrowRight, Mail, Shield, Unplug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLabStore } from "@/stores/lab-store";

const BEATS = [
  {
    icon: Mail,
    kicker: "Indirect",
    title: "The attacker never chats.",
    body: "They hide orders in a vendor invoice. Your agent reads the inbox to help you — and treats that text as commands.",
  },
  {
    icon: Unplug,
    kicker: "Agency",
    title: "Tools are the blast radius.",
    body: "A hijacked model is only as dangerous as send_email, fetch_url, and file search. Sandbox those, and a jailbreak is a weird paragraph.",
  },
  {
    icon: Shield,
    kicker: "Host policy",
    title: "Assume the model will fold.",
    body: "Isolate retrieved content, allowlist tools per task, confirm high-impact calls, and block unknown URLs. That is the product, not the prompt.",
  },
];

export function Briefing() {
  const enterLab = useLabStore((s) => s.enterLab);

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-5xl flex-col justify-center px-5 py-12 sm:px-8 sm:py-16">
      <p className="text-xs font-medium tracking-[0.18em] text-muted uppercase">
        Northline · security studio
      </p>
      <h1 className="font-display mt-4 max-w-xl text-4xl leading-[1.05] tracking-[-0.03em] text-fg sm:mt-5 sm:text-6xl">
        Injection Lab
      </h1>
      <p className="mt-4 max-w-lg text-base leading-normal text-muted sm:mt-5 sm:text-lg">
        An office agent that can read mail will obey a hidden invoice — unless
        the host sandboxes the tools. This is a simulated copilot. No live
        model, no real mailbox.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:items-center">
        <Button size="lg" onClick={enterLab} className="min-h-12 px-5">
          Open the lab
          <ArrowRight className="size-4" />
        </Button>
        <p className="text-sm text-subtle sm:ml-2">
          Plant a payload, run the open agent, then harden the policy.
        </p>
      </div>

      <ol className="mt-10 grid gap-3 sm:mt-12 sm:grid-cols-3">
        {BEATS.map((beat, i) => (
          <li
            key={beat.title}
            className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] sm:p-5"
          >
            <div className="flex items-center justify-between">
              <beat.icon className="size-4 text-muted" strokeWidth={1.75} />
              <span className="font-mono text-xs text-subtle tabular-nums">
                0{i + 1}
              </span>
            </div>
            <p className="mt-4 text-xs font-medium tracking-[0.14em] text-subtle uppercase sm:mt-6">
              {beat.kicker}
            </p>
            <h2 className="mt-2 text-base font-medium leading-snug text-fg">
              {beat.title}
            </h2>
            <p className="mt-2 text-sm leading-normal text-muted">{beat.body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
