import { Skeleton } from "@/components/ui/skeleton";

/**
 * Shown when the user has completed onboarding but the background worker
 * hasn't generated proposals yet. Gives visual feedback that something is
 * happening without blocking the UI.
 */
export function ProcessingState() {
  return (
    <div className="flex flex-col gap-3">
      {/* Explanation card */}
      <div className="bg-card rounded-2xl px-5 py-4 ring-1 ring-foreground/8 flex items-start gap-3.5">
        <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-[18px] animate-pulse">⚙️</span>
        </div>
        <div>
          <p className="text-[13px] font-semibold text-foreground leading-snug">
            Dein Profil wird analysiert…
          </p>
          <p className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed">
            Im Hintergrund erstellen wir deine persönlichen Empfehlungen.
            Wir benachrichtigen dich, sobald alles bereit ist.
          </p>
        </div>
      </div>

      {/* Skeleton placeholder rows suggesting upcoming proposals */}
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-card rounded-2xl px-4 py-3.5 ring-1 ring-foreground/8 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="size-8 rounded-lg shrink-0" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}
