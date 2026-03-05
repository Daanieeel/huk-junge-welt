import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CoverageItem } from "@/lib/api-client";
import { InsuranceTypeLabels, InsuranceTypeIcons } from "@/lib/api-client";
import { ProcessingState } from "./processing-state";

const INTERVAL_LABELS: Record<string, string> = {
  MONTHLY: "/ Monat",
  YEARLY: "/ Jahr",
  QUARTERLY: "/ Quartal",
  WEEKLY: "/ Woche",
};

interface CoverageListProps {
  items: CoverageItem[];
  hasQuestionnaire: boolean;
  /** When true, renders without the section wrapper (e.g. inside a full page) */
  standalone?: boolean;
}

export function CoverageList({ items, hasQuestionnaire, standalone }: CoverageListProps) {
  const proposals = items.filter((i) => i.proposal !== null);

  const content = (() => {
    // ── State 1: Onboarding not done ──────────────────────────────────────────
    if (!hasQuestionnaire) {
      return (
        <div className="bg-card rounded-2xl px-5 py-6 ring-1 ring-foreground/8 text-center">
          <p className="text-[22px] mb-3">🔍</p>
          <p className="text-[14px] font-semibold text-foreground mb-1">
            Noch keine Empfehlungen
          </p>
          <p className="text-[12px] text-muted-foreground leading-relaxed mb-4">
            Starte den Bedarfscheck, damit wir passende Versicherungen
            für dich ermitteln können.
          </p>
          <Link
            href="/bedarfscheck"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary"
          >
            Jetzt starten
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      );
    }

    // ── State 2: Processing ────────────────────────────────────────────────────
    if (proposals.length === 0) {
      return <ProcessingState />;
    }

    // ── State 3: Show proposals ────────────────────────────────────────────────
    return (
      <div className="flex flex-col gap-2">
        {proposals.map((item) => {
          const proposal = item.proposal!;
          const intervalLabel = INTERVAL_LABELS[proposal.interval] ?? "";

          return (
            <div
              key={item.type}
              className="bg-card rounded-2xl px-4 py-3.5 ring-1 ring-foreground/8 flex items-center justify-between"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-[20px] leading-none shrink-0">
                  {InsuranceTypeIcons[item.type] ?? "📋"}
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-foreground truncate">
                    {InsuranceTypeLabels[item.type] ?? item.type}
                  </p>
                  {proposal.reason && (
                    <p className="text-[11px] text-muted-foreground leading-snug line-clamp-1 mt-0.5">
                      {proposal.reason}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end shrink-0 ml-3 gap-1">
                <span className="text-[13px] font-bold text-foreground tabular-nums">
                  {parseFloat(proposal.rate).toFixed(2).replace(".", ",")} €
                </span>
                <span className="text-[9px] text-muted-foreground whitespace-nowrap">
                  {intervalLabel}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  })();

  if (standalone) {
    return content;
  }

  return (
    <div className="bg-muted/50 px-4 pt-4 pb-10">
      <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-muted-foreground mb-3 px-1">
        {proposals.length > 0 ? "Deine Empfehlungen" : "Dein Überblick"}
      </p>
      {content}
    </div>
  );
}
