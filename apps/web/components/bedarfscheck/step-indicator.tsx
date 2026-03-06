"use client";

import { Fragment } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const STEP_LABELS = [
  "Persönl.\nDaten",
  "Beruf &\nGehalt",
  "Mobilität",
  "Familie",
  "Dein Ziel",
];

interface StepIndicatorProps {
  currentStep: number; // 1-based
  completedSteps: number[];
}

export function StepIndicator({ currentStep, completedSteps }: StepIndicatorProps) {
  return (
    <div className="flex items-start w-full">
      {STEP_LABELS.map((label, index) => {
        const step = index + 1;
        const isCompleted = completedSteps.includes(step);
        const isCurrent = currentStep === step;
        const isUpcoming = !isCompleted && !isCurrent;
        const isFirst = index === 0;

        // Connector is colored when the *previous* step is completed
        const connectorFilled = completedSteps.includes(step - 1);

        return (
          <Fragment key={step}>
            {/* Connector between steps */}
            {!isFirst && (
              <div className="flex-1 h-[3px] mt-4 mx-0.5 self-start">
                <div
                  className={cn(
                    "h-full rounded-full transition-colors",
                    connectorFilled ? "bg-primary" : "bg-muted-foreground/20"
                  )}
                />
              </div>
            )}

            {/* Step column */}
            <div className="flex flex-col items-center gap-1.5">
              {/* Dot */}
              <div
                className={cn(
                  "size-8 rounded-full flex items-center justify-center border-2 transition-all shrink-0",
                  isCompleted && "bg-primary border-primary text-primary-foreground",
                  isCurrent && "bg-background border-primary-foreground",
                  isUpcoming && "bg-background border-muted-foreground/30"
                )}
              >
                {isCompleted ? (
                  <Check className="size-4 stroke-[3]" />
                ) : (
                  <span
                    className={cn(
                      "text-[11px] font-bold",
                      isCurrent ? "text-primary-foreground" : "text-muted-foreground/40"
                    )}
                  >
                    {step}
                  </span>
                )}
              </div>
              {/* Label */}
              <span
                className={cn(
                  "text-[9px] leading-tight text-center whitespace-pre-line",
                  isCurrent ? "text-foreground font-semibold" : "text-muted-foreground/50"
                )}
              >
                {label}
              </span>
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}
