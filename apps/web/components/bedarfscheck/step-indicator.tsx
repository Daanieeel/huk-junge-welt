"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const STEP_LABELS = [
  "Persönl.\nDaten",
  "Beruf &\nGehalt",
  "Mobilität",
  "Adresse\n& Wohnen",
  "Familie",
  "Dein Ziel",
];

interface StepIndicatorProps {
  currentStep: number; // 1-based
  completedSteps: number[];
}

export function StepIndicator({ currentStep, completedSteps }: StepIndicatorProps) {
  return (
    <div className="flex items-start justify-between w-full">
      {STEP_LABELS.map((label, index) => {
        const step = index + 1;
        const isCompleted = completedSteps.includes(step);
        const isCurrent = currentStep === step;
        const isUpcoming = !isCompleted && !isCurrent;
        const isLast = index === STEP_LABELS.length - 1;

        return (
          <div key={step} className="flex flex-1 items-start">
            <div className="flex flex-col items-center gap-1 min-w-0">
              {/* Dot */}
              <div
                className={cn(
                  "size-6 rounded-full flex items-center justify-center border-2 transition-all shrink-0",
                  isCompleted && "bg-primary border-primary text-primary-foreground",
                  isCurrent && "bg-background border-primary",
                  isUpcoming && "bg-background border-muted-foreground/30"
                )}
              >
                {isCompleted ? (
                  <Check className="size-3 stroke-[3]" />
                ) : (
                  <span
                    className={cn(
                      "text-[9px] font-bold",
                      isCurrent ? "text-primary" : "text-muted-foreground/40"
                    )}
                  >
                    {step}
                  </span>
                )}
              </div>
              {/* Label */}
              <span
                className={cn(
                  "text-[8px] leading-tight text-center whitespace-pre-line",
                  isCurrent ? "text-foreground font-semibold" : "text-muted-foreground/50"
                )}
              >
                {label}
              </span>
            </div>

            {/* Connector */}
            {!isLast && (
              <div className="flex-1 h-[2px] mt-3 mx-0.5">
                <div
                  className={cn(
                    "h-full rounded-full transition-colors",
                    isCompleted ? "bg-primary" : "bg-muted-foreground/20"
                  )}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
