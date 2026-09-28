import { ArrowLeft, Play } from "lucide-react";
import { AgentTrace } from "@/components/lab/agent-trace";
import { Briefing } from "@/components/lab/briefing";
import { InboxPanel } from "@/components/lab/inbox-panel";
import { PolicyPanel } from "@/components/lab/policy-panel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLabStore, type WorkspaceTab } from "@/stores/lab-store";

const TABS: { id: WorkspaceTab; label: string }[] = [
  { id: "inbox", label: "Inbox" },
  { id: "agent", label: "Agent" },
  { id: "policy", label: "Policy" },
];

export function LabShell() {
  const screen = useLabStore((s) => s.screen);
  if (screen === "briefing") return <Briefing />;
  return <LabWorkspace />;
}

function LabWorkspace() {
  const back = useLabStore((s) => s.backToBriefing);
  const tab = useLabStore((s) => s.workspaceTab);
  const setTab = useLabStore((s) => s.setWorkspaceTab);
  const run = useLabStore((s) => s.run);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[1400px] flex-col px-4 py-4 sm:px-6 sm:py-6">
      <header className="flex items-center justify-between gap-3 pb-4">
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-[0.18em] text-muted uppercase">
            Injection Lab
          </p>
          <h1 className="font-display truncate text-2xl leading-tight tracking-[-0.03em] text-fg sm:text-3xl">
            Office agent
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button onClick={() => run()} className="min-w-11">
            <Play className="size-4" />
            <span className="hidden sm:inline">Run</span>
          </Button>
          <Button variant="outline" onClick={back}>
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">Briefing</span>
          </Button>
        </div>
      </header>

      <div className="mb-3 grid grid-cols-3 gap-1 rounded-lg bg-surface p-1 lg:hidden">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "h-11 rounded-md text-sm font-medium transition-colors duration-[var(--motion-quick)] ease-[var(--ease-out)]",
              tab === item.id ? "bg-surface-2 text-fg" : "text-muted",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-3 lg:gap-4">
        <div className={cn("min-h-0 lg:block", tab === "inbox" ? "block" : "hidden")}>
          <div className="flex h-full min-h-[70dvh] flex-col lg:min-h-[calc(100dvh-8rem)]">
            <InboxPanel />
          </div>
        </div>
        <div className={cn("min-h-0 lg:block", tab === "agent" ? "block" : "hidden")}>
          <div className="flex h-full min-h-[70dvh] flex-col lg:min-h-[calc(100dvh-8rem)]">
            <AgentTrace />
          </div>
        </div>
        <div className={cn("min-h-0 lg:block", tab === "policy" ? "block" : "hidden")}>
          <div className="flex h-full min-h-[70dvh] flex-col lg:min-h-[calc(100dvh-8rem)]">
            <PolicyPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
