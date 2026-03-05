"use client";

import { useHomeQuery } from "@/lib/queries";
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
  const { data, isLoading, isError } = useHomeQuery();

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
  const hasCriticalGap = data.coverageItems.some(
    (item) => item.status === "MISSING" && item.priority <= 2
  );
  const firstName = data.user.name?.split(" ")[0] ?? "";

  return (
    <>
      <div className="px-5 pt-1 pb-2">
        <h2 className="text-[28px] font-bold text-foreground leading-tight">
          Hallo, {firstName}!
        </h2>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Dein Versicherungsüberblick
        </p>
      </div>

      <ScoreSection
        score={data.score}
        scoreLabel={scoreLabel}
        scoreSubLabel={scoreSubLabel}
        hasCriticalGap={hasCriticalGap}
      />

      <CoverageList items={data.coverageItems} />
    </>
  );
}
