"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useDashboardQuery } from "@/lib/queries";
import { CoverageList } from "@/components/home/coverage-list";
import { Skeleton } from "@/components/ui/skeleton";

function ProposalsPageSkeleton() {
  return (
    <div className="px-4 pt-4 pb-10">
      <Skeleton className="h-7 w-48 mb-1" />
      <Skeleton className="h-4 w-64 mb-6" />
      <div className="flex flex-col gap-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-[62px] w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export function ProposalsScreen() {
  const { data, isLoading, isError } = useDashboardQuery();

  if (isLoading) return <ProposalsPageSkeleton />;

  if (isError || !data) {
    return (
      <div className="px-5 py-10 text-center">
        <p className="text-sm text-muted-foreground">
          Daten konnten nicht geladen werden.
        </p>
      </div>
    );
  }

  const proposals = data.items.filter((i) => i.proposal !== null);

  return (
    <div className="pb-10">
      <div className="px-5 pt-4 pb-5">
        <h2 className="text-[24px] font-bold text-foreground leading-tight mb-0.5">
          Empfehlungen
        </h2>
        <p className="text-[13px] text-muted-foreground">
          {data.hasQuestionnaire && proposals.length > 0
            ? `${proposals.length} personalisierte Versicherungsempfehlungen`
            : "Deine persönlichen Versicherungsempfehlungen"}
        </p>
      </div>

      <div className="px-4">
        <CoverageList
          items={data.items}
          hasQuestionnaire={data.hasQuestionnaire}
          standalone
        />
      </div>
    </div>
  );
}
