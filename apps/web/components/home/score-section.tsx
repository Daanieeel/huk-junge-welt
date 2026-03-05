import Link from "next/link";
import { ArrowRight, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScoreGauge } from "./score-gauge";

interface ScoreSectionProps {
  score: number;
  scoreLabel: string;
  scoreSubLabel: string;
  hasCriticalGap: boolean;
}

export function ScoreSection({
  score,
  scoreLabel,
  scoreSubLabel,
  hasCriticalGap,
}: ScoreSectionProps) {
  return (
    <div className="px-5">
      <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-muted-foreground text-center mb-1">
        Versicherungsschutz
      </p>

      <ScoreGauge score={score} />

      <div className="text-center -mt-24 mb-5">
        <p className="text-[15px] font-bold text-foreground">{scoreLabel}</p>
        {hasCriticalGap ? (
          <p className="text-[12px] text-destructive mt-1 flex items-center justify-center gap-1">
            <ShieldAlert className="size-3 shrink-0" />
            Kritische Lücken erkannt
          </p>
        ) : (
          <p className="text-[12px] text-muted-foreground mt-1">{scoreSubLabel}</p>
        )}
      </div>

      <Button size="cta" render={<Link href="/bedarfscheck" />} nativeButton={false}>
        <span>Bedarfscheck starten</span>
        <ArrowRight />
      </Button>

      <p className="text-[11px] text-muted-foreground text-center mt-2.5 mb-6">
        Persönliche Analyse in 5 Minuten
      </p>
    </div>
  );
}
