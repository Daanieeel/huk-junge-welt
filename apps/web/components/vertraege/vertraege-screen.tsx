"use client";

import Link from "next/link";
import { Plus, ArrowRight, FileText, Info } from "lucide-react";
import { useInsurancesQuery } from "@/lib/queries";
import { InsuranceTypeLabels, InsuranceTypeIcons } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const INTERVAL_LABELS: Record<string, string> = {
  MONTHLY: "/ Monat",
  YEARLY: "/ Jahr",
  QUARTERLY: "/ Quartal",
  WEEKLY: "/ Woche",
};

function CoverageScoreBadge({ score }: { score: number | null }) {
  if (score === null) return null;
  const color =
    score >= 80
      ? "bg-green-100 text-green-700"
      : score >= 55
      ? "bg-yellow-100 text-yellow-700"
      : "bg-red-100 text-red-700";
  const label = score >= 80 ? "Gut" : score >= 55 ? "Mittel" : "Schwach";
  return (
    <div className="flex items-center gap-1">
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${color}`}>
        {label} · {score}
      </span>
      <Popover>
        <PopoverTrigger className="text-muted-foreground/50 hover:text-muted-foreground transition-colors">
          <Info className="size-3" />
        </PopoverTrigger>
        <PopoverContent side="top" className="w-60 text-[12px] leading-relaxed">
          Der <span className="font-semibold">Qualitätsscore (0–100)</span> zeigt, wie gut dein Vertrag dich absichert – bewertet anhand von Leistungsumfang, Deckungsgrenzen und Ausschlüssen.
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function VertraegeScreen() {
  const { data, isLoading } = useInsurancesQuery();

  if (isLoading) {
    return (
      <div className="px-4 pb-10 flex flex-col gap-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[72px] w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  type InsuranceRow = { id: string; type: string; company: string; rate: string; interval: string; coverageScore: number | null; documents?: unknown[] };
  const insurances = (data as unknown as InsuranceRow[]) ?? [];

  if (insurances.length === 0) {
    return (
      <div className="px-4 pb-10">
        <div className="flex flex-col items-center justify-center gap-3 bg-muted/50 rounded-2xl px-6 py-12 text-center">
          <FileText className="size-10 text-muted-foreground/40" strokeWidth={1.5} />
          <p className="text-[14px] font-medium text-foreground">Noch keine Verträge</p>
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            Füge bestehende Versicherungen hinzu,
            <br />
            damit wir sie mit HUK-Angeboten vergleichen können.
          </p>
          <Link
            href="/upload"
            className="mt-2 inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-4 py-2.5 text-[13px] font-semibold"
          >
            <Plus className="size-4" />
            Vertrag hinzufügen
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-10 flex flex-col gap-2">
      {insurances.map((ins) => {
        const intervalLabel = INTERVAL_LABELS[ins.interval] ?? "";
        const docCount = Array.isArray(ins.documents) ? ins.documents.length : 0;

        return (
          <Link
            key={ins.id}
            href={`/vertraege/${ins.id}`}
            className="bg-card rounded-2xl px-4 py-3.5 ring-1 ring-foreground/8 flex items-center justify-between active:bg-muted transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-[20px] leading-none shrink-0">
                {InsuranceTypeIcons[ins.type] ?? "📋"}
              </span>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-foreground truncate">
                  {InsuranceTypeLabels[ins.type] ?? ins.type}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-[11px] text-muted-foreground truncate">{ins.company}</p>
                  {docCount > 0 && (
                    <span className="text-[10px] text-muted-foreground/70">
                      · {docCount} Dok.
                    </span>
                  )}
                </div>
                {ins.coverageScore !== null && (
                  <div className="mt-1">
                    <CoverageScoreBadge score={ins.coverageScore} />
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 ml-3">
              <div className="flex flex-col items-end">
                <span className="text-[13px] font-bold text-foreground tabular-nums">
                  {Number.parseFloat(ins.rate).toFixed(2).replace(".", ",")} €
                </span>
                <span className="text-[9px] text-muted-foreground whitespace-nowrap">
                  {intervalLabel}
                </span>
              </div>
              <ArrowRight className="size-4 text-muted-foreground/50" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
