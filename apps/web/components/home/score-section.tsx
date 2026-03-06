"use client";

import Link from "next/link";
import { ArrowRight, CpuIcon, ShieldAlert, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
      <div className="flex items-center justify-center gap-1.5 mb-6">
        <p className="text-[10px] font-semibold uppercase text-muted-foreground">
          Dein Versicherungsschutz
        </p>
        <Popover>
          <PopoverTrigger className="text-muted-foreground hover:text-muted-foreground transition-colors">
            <Info className="size-3.5" />
          </PopoverTrigger>
          <PopoverContent side="bottom" className="w-72 text-[12px] leading-relaxed">
            <p className="font-semibold text-foreground mb-1">Wie wird der Score berechnet?</p>
            <p className="text-muted-foreground">
              Der Score setzt sich aus zwei Faktoren zusammen:
            </p>
            <div className="bg-muted rounded-lg px-3 py-2 font-mono text-[11px] text-foreground">
              Score = (Abdeckung × 70) + (Qualität × 30)
            </div>
            <ul className="text-muted-foreground flex flex-col gap-1.5">
              <li><span className="font-semibold text-foreground">Abdeckung (70 %)</span> – Anteil der empfohlenen Versicherungsarten, die du bereits hast.</li>
              <li><span className="font-semibold text-foreground">Qualität (30 %)</span> – Durchschnittlicher Qualitätsscore deiner bestehenden Verträge (KI-Analyse).</li>
            </ul>
          </PopoverContent>
        </Popover>
      </div>

      <ScoreGauge score={score} isProcessing={isProcessing} />

      <div className="flex flex-col items-center text-center mb-4 mt-3">
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

      <p className="text-[11px] text-muted-foreground -mt-0.5 text-center mb-6">
        {hasQuestionnaire
          ? "Deine personalisierten Versicherungsempfehlungen"
          : "Persönliche Analyse in 5 Minuten"}
      </p>
    </div>
  );
}
