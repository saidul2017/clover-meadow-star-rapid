import { Eye, EyeOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { INBOX } from "@/lib/lab/content";
import { cn } from "@/lib/utils";
import { useLabStore } from "@/stores/lab-store";

export function InboxPanel() {
  const selectedEmailId = useLabStore((s) => s.selectedEmailId);
  const selectEmail = useLabStore((s) => s.selectEmail);
  const humanView = useLabStore((s) => s.humanView);
  const setHumanView = useLabStore((s) => s.setHumanView);
  const payloadEnabled = useLabStore((s) => s.payloadEnabled);
  const setPayloadEnabled = useLabStore((s) => s.setPayloadEnabled);
  const payload = useLabStore((s) => s.payload);
  const setPayload = useLabStore((s) => s.setPayload);

  const selected = INBOX.find((e) => e.id === selectedEmailId) ?? INBOX[0];
  const showHidden = selected.planted && !humanView && payloadEnabled;

  return (
    <section className="flex min-h-0 flex-col rounded-2xl bg-surface p-3 shadow-[var(--shadow-border)] sm:p-4">
      <header className="flex items-start justify-between gap-3 px-1 pt-1">
        <div>
          <p className="text-xs font-medium tracking-[0.14em] text-subtle uppercase">
            Inbox
          </p>
          <h2 className="mt-1 text-sm font-medium text-fg">Attack surface</h2>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-11 shrink-0"
          onClick={() => setHumanView(!humanView)}
        >
          {humanView ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
          {humanView ? "Human" : "Model"}
        </Button>
      </header>

      <ul className="mt-4 space-y-1">
        {INBOX.map((email) => {
          const active = email.id === selected.id;
          return (
            <li key={email.id}>
              <button
                type="button"
                onClick={() => selectEmail(email.id)}
                className={cn(
                  "flex w-full min-h-11 flex-col rounded-lg px-3 py-2.5 text-left transition-colors duration-[var(--motion-quick)] ease-[var(--ease-out)]",
                  active ? "bg-surface-2" : "hover:bg-surface-2/60",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium text-fg">
                    {email.fromName}
                  </span>
                  {email.planted ? (
                    <Badge variant={payloadEnabled ? "warn" : "default"}>
                      planted
                    </Badge>
                  ) : null}
                </div>
                <span className="truncate text-sm text-fg/90">{email.subject}</span>
                <span className="truncate text-xs text-muted">{email.preview}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <article className="mt-3 min-h-0 flex-1 overflow-y-auto rounded-lg bg-bg p-4">
        <p className="font-mono text-xs text-subtle">{selected.fromAddr}</p>
        <h3 className="mt-1 text-base font-medium text-fg">{selected.subject}</h3>
        <pre className="mt-3 font-sans text-sm leading-normal whitespace-pre-wrap text-muted">
          {selected.body}
        </pre>
        {selected.planted ? (
          <div className="mt-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium tracking-[0.12em] text-subtle uppercase">
                  Hidden instruction
                </p>
                <p className="mt-1 text-xs text-muted">
                  White-on-white / HTML comment. Humans skip it; the model does not.
                </p>
              </div>
              <Switch
                checked={payloadEnabled}
                onCheckedChange={setPayloadEnabled}
                aria-label="Plant hidden instruction"
              />
            </div>
            {showHidden ? (
              <textarea
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
                spellCheck={false}
                className="mt-3 min-h-40 w-full resize-y rounded-md bg-compromised/10 p-3 font-mono text-xs leading-relaxed text-fg shadow-[var(--shadow-border)] outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            ) : (
              <p className="mt-3 rounded-md bg-surface-2 px-3 py-2 text-xs text-subtle">
                {payloadEnabled
                  ? humanView
                    ? "Payload is planted but not painted. Switch to model view to read or edit it."
                    : "Payload is off."
                  : "Payload off — this invoice is only an invoice."}
              </p>
            )}
          </div>
        ) : null}
      </article>
    </section>
  );
}
