import Link from "next/link";
import { ArrowRight, CpuIcon, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScoreGauge } from "./score-gauge";

interface ScoreSectionProps {
  score: number;
  scoreLabel: string;
  scoreSubLabel: string;
  hasCriticalGap: boolean;
  hasQuestionnaire: boolean;
  isProcessing: boolean;
}

export function ScoreSection({
  score,
  scoreLabel,
  scoreSubLabel,
  hasCriticalGap,
  hasQuestionnaire,
  isProcessing,
}: ScoreSectionProps) {
  return (
    <div className="px-5 flex flex-col gap-2">
      <p className="text-[10px] font-semibold uppercase text-muted-foreground text-center mb-6">
        Dein Versicherungsschutz
      </p>

      <ScoreGauge score={score} isProcessing={isProcessing} />

      <div className="flex flex-col items-center text-center mb-4">
        {isProcessing ? (
          <div className="flex items-center gap-1">
            <CpuIcon className="size-4" />
            <p className="text-xs opacity-80">Score wird ermittelt</p>
          </div>
        ) : (
          <>
            <p className="text-[15px] font-bold text-foreground">{scoreLabel}</p>
            {hasCriticalGap ? (
              <p className="text-[12px] text-destructive mt-1 flex items-center justify-center gap-1">
                <ShieldAlert className="size-3 shrink-0" />
                Kritische Lücken erkannt
              </p>
            ) : (
              <p className="text-[12px] text-muted-foreground mt-1">{scoreSubLabel}</p>
            )}
          </>
        )}
      </div>

      {hasQuestionnaire ? (
        <Button
          size="cta"
          variant="primary2"
          render={<Link href="/vertragsempfehlungen" />}
          nativeButton={false}
        >
          <span>Empfehlungen anzeigen</span>
          <ArrowRight />
        </Button>
      ) : (
        <Button
          size="cta"
          variant="default"
          render={<Link href="/bedarfscheck" />}
          nativeButton={false}
        >
          <span>Bedarfscheck starten</span>
          <ArrowRight />
        </Button>
      )}

      <p className="text-[11px] text-muted-foreground text-center mt-2.5 mb-6">
        {hasQuestionnaire
          ? "Deine personalisierten Versicherungsempfehlungen"
          : "Persönliche Analyse in 5 Minuten"}
      </p>
    </div>
  );
}
