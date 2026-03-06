"use client";

import { useForm } from "@tanstack/react-form";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { FieldError } from "@/components/ui/field";

// ============================================================================
// Data – GoalType enum
// ============================================================================

const GOAL_OPTIONS = [
  {
    value: "CHEAPEST",
    label: "Möglichst günstig",
    description: "Ich möchte nur das Nötigste zu einem kleinen Preis absichern.",
    emoji: "💰",
  },
  {
    value: "BEST_VALUE",
    label: "Bestes Preis-Leistungs-Verhältnis",
    description: "Ich will solide abgesichert sein, ohne zu viel zu zahlen.",
    emoji: "⚖️",
  },
  {
    value: "COMPREHENSIVE",
    label: "Umfassend abgesichert",
    description: "Ich möchte möglichst lückenlos geschützt sein.",
    emoji: "🛡️",
  },
] as const;

const schema = z.object({
  goal: z.string().min(1, "Bitte wähle dein Absicherungsziel aus."),
});

// ============================================================================
// Component
// ============================================================================

interface StepGoalProps {
  defaultGoal: string | null;
  onComplete: (data: { goal: string }) => void;
}

export function StepGoal({ defaultGoal, onComplete }: StepGoalProps) {
  const form = useForm({
    defaultValues: { goal: defaultGoal ?? "" },
    validators: { onSubmit: schema },
    onSubmit: ({ value }) => onComplete(value),
  });

  return (
    <form
      id="step-form"
      className="px-5 py-6"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
        <h3 className="text-[20px] font-bold text-foreground mb-1">Dein Absicherungsziel</h3>
        <p className="text-[13px] text-muted-foreground mb-6">
          Was ist dir bei deiner Versicherung am wichtigsten?
        </p>

        <form.Field
          name="goal"
          children={(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <div className="flex flex-col gap-3">
                {GOAL_OPTIONS.map((option) => {
                  const isSelected = field.state.value === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => field.handleChange(option.value)}
                      className={cn(
                        "w-full text-left rounded-2xl px-4 py-4 border-2 transition-all active:scale-[0.99]",
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border bg-background hover:border-primary/40"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl mt-0.5 shrink-0">{option.emoji}</span>
                        <div>
                          <span
                            className={cn(
                              "block text-[15px] font-semibold leading-snug",
                              isSelected ? "text-primary" : "text-foreground"
                            )}
                          >
                            {option.label}
                          </span>
                          <span className="block text-[12px] text-muted-foreground mt-0.5 leading-relaxed">
                            {option.description}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </div>
            );
          }}
        />
    </form>
  );
}
