import { InsuranceTypeLabels, InsuranceTypeIcons } from "@/lib/api-client";
import type { CoverageAssessmentItem } from "@/lib/api-client";

type CoverageStatus = CoverageAssessmentItem["status"];

const STATUS_CONFIG: Record<
  CoverageStatus,
  { label: string; dotsFilled: number; badgeClass: string }
> = {
  MISSING: {
    label: "Fehlt",
    dotsFilled: 0,
    badgeClass: "bg-destructive/10 text-destructive",
  },
  WEAK: {
    label: "Schwach",
    dotsFilled: 1,
    badgeClass: "bg-primary/25 text-foreground",
  },
  ADEQUATE: {
    label: "Ordentlich",
    dotsFilled: 2,
    badgeClass: "bg-muted text-muted-foreground",
  },
  GOOD: {
    label: "Gut",
    dotsFilled: 3,
    badgeClass: "bg-primary/60 text-primary-foreground",
  },
  EXCELLENT: {
    label: "Sehr gut",
    dotsFilled: 4,
    badgeClass: "bg-primary text-primary-foreground",
  },
};

interface CoverageListProps {
  items: CoverageAssessmentItem[];
}

export function CoverageList({ items }: CoverageListProps) {
  return (
    <div className="bg-muted/50 px-4 pt-4 pb-10">
      <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-muted-foreground mb-3 px-1">
        Dein Überblick
      </p>

      {items.length === 0 ? (
        <div className="bg-card rounded-2xl px-5 py-6 ring-1 ring-foreground/8 text-center">
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            Noch keine Analyse vorhanden.
            <br />
            Starte den Bedarfscheck für deine persönliche Einschätzung.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item) => {
            const config = STATUS_CONFIG[item.status];
            const isCritical = item.status === "MISSING" && item.priority <= 2;

            return (
              <div
                key={item.id}
                className={`bg-card rounded-2xl px-4 py-3.5 ring-1 flex items-center justify-between ${
                  isCritical ? "ring-destructive/30" : "ring-foreground/8"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-[20px] leading-none">
                    {InsuranceTypeIcons[item.type] ?? "📋"}
                  </span>
                  <span className="text-[13px] font-medium text-foreground">
                    {InsuranceTypeLabels[item.type] ?? item.type}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <div className="flex gap-[3px] items-center">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`size-[5px] rounded-full ${
                          i < config.dotsFilled
                            ? "bg-foreground/65"
                            : "bg-foreground/15"
                        }`}
                      />
                    ))}
                  </div>
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full whitespace-nowrap ${config.badgeClass}`}
                  >
                    {config.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
