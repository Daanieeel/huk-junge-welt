"use client";

import type { CoverageItem } from "@/lib/api-client";
import { InsuranceTypeLabels, InsuranceTypeIcons } from "@/lib/api-client";
import { CheckCircle2, CircleDashed } from "lucide-react";
import { cn } from "@/lib/utils";

interface CoverageItemCardProps {
  item: CoverageItem;
}

const IntervalLabels: Record<string, string> = {
  WEEKLY: "wöch.",
  MONTHLY: "mtl.",
  QUARTERLY: "quarterl.",
  YEARLY: "jährl.",
};

const QUALITY_SEGS = [0, 1, 2, 3, 4] as const;

function CoverageQualityBar({ score }: { score: number }) {
  const filled = Math.ceil((score / 100) * QUALITY_SEGS.length);
  return (
    <div className="flex gap-0.5 items-center">
      {QUALITY_SEGS.map((seg) => (
        <div
          key={seg}
          className={cn("h-1 w-4 rounded-full", seg < filled ? "bg-primary" : "bg-muted")}
        />
      ))}
      <span className="ml-1.5 text-[10px] font-medium text-muted-foreground">{score}%</span>
    </div>
  );
}

function StatusBadge({ status }: { status: CoverageItemCardProps["item"]["status"] }) {
  if (status === "covered") return <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" strokeWidth={2.5} />;
  if (status === "recommended") {
    return (
      <span className="text-[10px] font-semibold tracking-wide uppercase text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full shrink-0">
        Empfohlen
      </span>
    );
  }
  return <CircleDashed className="h-4 w-4 shrink-0 text-muted-foreground/50" />;
}

function CoverageDetail({ item }: CoverageItemCardProps) {
  if (item.status === "covered") {
    if (item.coverageScore !== null) return <CoverageQualityBar score={item.coverageScore} />;
    if (item.insurance) return <p className="text-[11px] text-muted-foreground">{item.insurance.company}</p>;
  }
  if (item.status === "recommended" && item.proposal) {
    const rate = Number.parseFloat(item.proposal.rate).toFixed(2).replace(".", ",");
    const interval = IntervalLabels[item.proposal.interval] ?? item.proposal.interval;
    return (
      <p className="text-[11px] text-muted-foreground">
        ab {rate} €/{interval}
        {item.proposal.reason ? <span> · {item.proposal.reason}</span> : null}
      </p>
    );
  }
  return <p className="text-[11px] text-muted-foreground">Nicht abgesichert</p>;
}

export function CoverageItemCard({ item }: CoverageItemCardProps) {
  const label = InsuranceTypeLabels[item.type] ?? item.type;
  const icon = InsuranceTypeIcons[item.type] ?? "📋";

  const isCovered = item.status === "covered";
  const isRecommended = item.status === "recommended";

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border px-4 py-3.5",
        isCovered && "bg-white border-border",
        isRecommended && "bg-white border-primary/30",
        !isCovered && !isRecommended && "bg-muted/40 border-border"
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl",
          isCovered && "bg-primary/15",
          isRecommended && "bg-amber-50",
          !isCovered && !isRecommended && "bg-muted"
        )}
      >
        {icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "text-sm font-semibold leading-tight",
              item.status === "not_covered" && "text-muted-foreground"
            )}
          >
            {label}
          </span>
          <StatusBadge status={item.status} />
        </div>
        <div className="mt-1">
          <CoverageDetail item={item} />
        </div>
      </div>
    </div>
  );
}

