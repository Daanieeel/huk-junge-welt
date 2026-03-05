"use client";

import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepNavBarProps {
  onBack?: () => void;
  onNext: () => void;
  isLastStep?: boolean;
  isLoading?: boolean;
}

export function StepNavBar({ onBack, onNext, isLastStep, isLoading }: StepNavBarProps) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-t border-border/60 bg-background">
      <button
        type="button"
        onClick={onBack}
        disabled={!onBack}
        className={cn(
          "flex items-center gap-1.5 text-[15px] font-medium transition-opacity",
          onBack ? "text-muted-foreground active:opacity-60" : "opacity-0 pointer-events-none"
        )}
      >
        <ArrowLeft className="size-4" />
        Zurück
      </button>

      <button
        type="button"
        onClick={onNext}
        disabled={isLoading}
        className="flex items-center gap-1.5 text-[15px] font-semibold text-primary active:opacity-60 disabled:opacity-50 transition-opacity"
      >
        {isLoading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Wird gespeichert…
          </>
        ) : (
          <>
            {isLastStep ? "Absenden" : "Weiter"}
            <ArrowRight className="size-4" />
          </>
        )}
      </button>
    </div>
  );
}
