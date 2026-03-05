"use client";

import { useDashboardQuery } from "@/lib/queries";
import { ScoreSection } from "./score-section";
import { CoverageList } from "./coverage-list";
import { HomeScreenSkeleton } from "./home-skeleton";

function getScoreInfo(score: number): { label: string; sublabel: string } {
  if (score >= 86)
    return { label: "Sehr gut geschützt", sublabel: "Hervorragende Absicherung – weiter so!" };
  if (score >= 71)
    return { label: "Gut geschützt", sublabel: "Du hast einen soliden Versicherungsschutz." };
  if (score >= 51)
    return { label: "Teilweise geschützt", sublabel: "Einige Lücken solltest du schließen." };
  if (score >= 31)
    return { label: "Verbesserungswürdig", sublabel: "Wichtige Versicherungen fehlen noch." };
  return {
    label: "Kaum geschützt",
    sublabel: "Starte jetzt deinen persönlichen Bedarfscheck.",
  };
}

export function HomeScreen() {
  const { data, isLoading, isError } = useDashboardQuery();

  if (isLoading) return <HomeScreenSkeleton />;

  if (isError || !data) {
    return (
      <div className="px-5 py-10 text-center">
        <p className="text-sm text-muted-foreground">
          Daten konnten nicht geladen werden.
        </p>
      </div>
    );
  }

  const { label: scoreLabel, sublabel: scoreSubLabel } = getScoreInfo(data.score);
  const proposals = data.items.filter((i) => i.proposal !== null);
  const isProcessing = data.hasQuestionnaire && proposals.length === 0;
  const hasCriticalGap = isProcessing;
  const firstName = data.user.name?.split(" ")[0] ?? "";

  return (
    <>
      <div className="px-5 pt-1 pb-2 flex items-center flex-col">
        <h2 className="text-[28px] font-extrabold text-foreground leading-tight">
          Hallo, {firstName}!
        </h2>
      </div>

      <ScoreSection
        score={data.score}
        scoreLabel={scoreLabel}
        scoreSubLabel={scoreSubLabel}
        hasCriticalGap={hasCriticalGap}
        hasQuestionnaire={data.hasQuestionnaire}
        isProcessing={isProcessing}
      />

      <CoverageList
        items={data.items}
        hasQuestionnaire={data.hasQuestionnaire}
      />
    </>
  );
}
