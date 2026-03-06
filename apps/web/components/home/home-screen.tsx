"use client";

import { useDashboardQuery } from "@/lib/queries";
import { useProposalsStore } from "@/lib/proposals-store";
import { ScoreSection } from "./score-section";
import { CoverageList } from "./coverage-list";
import { HomeScreenSkeleton } from "./home-skeleton";

function getScoreInfo(score: number): { label: string; sublabel: string } {
  if (score === 0)
    return {
      label: "Noch kein Schutz",
      sublabel: "Starte jetzt den Bedarfscheck und sieh, was du brauchst.",
    };
  if (score <= 15)
    return { label: "Kaum abgesichert", sublabel: "Ein paar wichtige Versicherungen fehlen noch." };
  if (score <= 30)
    return {
      label: "Grundschutz vorhanden",
      sublabel: "Du hast einen Anfang – aber noch deutlich Luft nach oben.",
    };
  if (score <= 45)
    return {
      label: "Ausbaufähig",
      sublabel: "Solide Basis, aber einige Lücken solltest du schließen.",
    };
  if (score <= 60)
    return {
      label: "Gut unterwegs",
      sublabel: "Du bist ordentlich aufgestellt – noch ein paar Details fehlen.",
    };
  if (score <= 75)
    return {
      label: "Gut geschützt",
      sublabel: "Starke Absicherung – mit kleinen Anpassungen wird's noch besser.",
    };
  if (score <= 89)
    return { label: "Sehr gut geschützt", sublabel: "Du hast deinen Schutz ernsthaft im Griff." };
  return {
    label: "Rundum abgesichert",
    sublabel: "Ausgezeichnete Absicherung – alles Wichtige ist abgedeckt.",
  };
}

export function HomeScreen() {
  const { data, isLoading, isError } = useDashboardQuery();
  const isRegenerating = useProposalsStore((s) => s.isRegenerating);

  if (isLoading) return <HomeScreenSkeleton />;

  if (isError || !data) {
    return (
      <div className="px-5 py-10 text-center">
        <p className="text-sm text-muted-foreground">Daten konnten nicht geladen werden.</p>
      </div>
    );
  }

  const { label: scoreLabel, sublabel: scoreSubLabel } = getScoreInfo(data.score);
  const proposals = data.items.filter((i) => i.proposal !== null);
  const isProcessing =
    isRegenerating ||
    (data.hasQuestionnaire && !data.hasCompletedProposalJob && proposals.length === 0);
  const hasNoData =
    !isRegenerating &&
    data.hasQuestionnaire &&
    data.hasCompletedProposalJob &&
    proposals.length === 0;
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
        hasNoData={hasNoData}
      />
    </>
  );
}
