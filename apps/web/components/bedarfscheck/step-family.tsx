"use client";

import { useForm } from "@tanstack/react-form";
import * as z from "zod";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { FieldError } from "@/components/ui/field";

// ============================================================================
// Data
// ============================================================================

const RELATIONSHIP_OPTIONS = [
  { value: "SINGLE", label: "Ledig", emoji: "🙋" },
  { value: "IN_A_RELATIONSHIP", label: "In einer Beziehung", emoji: "💑" },
  { value: "MARRIED", label: "Verheiratet", emoji: "💍" },
] as const;

const schema = z.object({
  relationshipStatus: z.string().min(1, "Bitte wähle deinen Familienstand aus."),
  childrenCount: z.number().min(0).max(10),
});

// ============================================================================
// Component
// ============================================================================

interface StepFamilyProps {
  defaultRelationshipStatus: string | null;
  defaultChildrenCount: number;
  onComplete: (data: { relationshipStatus: string; childrenCount: number }) => void;
}

export function StepFamily({
  defaultRelationshipStatus,
  defaultChildrenCount,
  onComplete,
}: StepFamilyProps) {
  const form = useForm({
    defaultValues: {
      relationshipStatus: defaultRelationshipStatus ?? "",
      childrenCount: defaultChildrenCount,
    },
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
        <h3 className="text-[20px] font-bold text-foreground mb-1">Familienstand</h3>
        <p className="text-[13px] text-muted-foreground mb-6">
          Diese Angaben helfen uns, passende Versicherungen zu empfehlen.
        </p>

        <div className="flex flex-col gap-6">
          {/* Relationship status */}
          <form.Field
            name="relationshipStatus"
            children={(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <div>
                  <p className="text-[13px] font-semibold text-foreground mb-2.5">
                    Familienstand
                  </p>
                  <div className="flex flex-col gap-2">
                    {RELATIONSHIP_OPTIONS.map((option) => {
                      const isSelected = field.state.value === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => field.handleChange(option.value)}
                          className={cn(
                            "flex items-center gap-3 w-full text-left rounded-2xl px-4 py-3.5 border-2 transition-all active:scale-[0.99]",
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-border bg-background hover:border-primary/40"
                          )}
                        >
                          <span className="text-xl">{option.emoji}</span>
                          <span
                            className={cn(
                              "text-[15px] font-semibold",
                              isSelected ? "text-primary" : "text-foreground"
                            )}
                          >
                            {option.label}
                          </span>
                        </button>
                      );
                    })}
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} className="mt-1" />
                    )}
                  </div>
                </div>
              );
            }}
          />

          {/* Children count */}
          <form.Field
            name="childrenCount"
            children={(field) => (
              <div>
                <p className="text-[13px] font-semibold text-foreground mb-2.5">
                  Wie viele Kinder hast du?
                </p>
                <div className="flex items-center gap-4 bg-muted/50 rounded-2xl px-4 py-3">
                  <button
                    type="button"
                    onClick={() =>
                      field.handleChange(Math.max(0, field.state.value - 1))
                    }
                    disabled={field.state.value === 0}
                    className="size-9 rounded-xl bg-background border border-border flex items-center justify-center disabled:opacity-40 active:bg-muted transition-colors"
                  >
                    <Minus className="size-4 text-foreground" />
                  </button>

                  <div className="flex-1 text-center">
                    <span className="text-[28px] font-bold text-foreground tabular-nums">
                      {field.state.value}
                    </span>
                    <p className="text-[11px] text-muted-foreground -mt-1">
                      {field.state.value === 1 ? "Kind" : "Kinder"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      field.handleChange(Math.min(10, field.state.value + 1))
                    }
                    disabled={field.state.value === 10}
                    className="size-9 rounded-xl bg-background border border-border flex items-center justify-center disabled:opacity-40 active:bg-muted transition-colors"
                  >
                    <Plus className="size-4 text-foreground" />
                  </button>
                </div>
              </div>
            )}
          />
        </div>
    </form>
  );
}
