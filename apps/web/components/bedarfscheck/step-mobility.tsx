"use client";

import { useForm } from "@tanstack/react-form";
import * as z from "zod";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { StepNavBar } from "./step-nav-bar";

// ============================================================================
// Data – mapped to the VehicleType Prisma enum
// ============================================================================

const VEHICLE_OPTIONS = [
  { value: "CAR", label: "Auto" },
  { value: "SCOOTER", label: "Scooter" },
  { value: "MOTORCYCLE", label: "Roller / Moped" },
  { value: "PUBLIC_TRANSPORT", label: "Fahrrad / ÖPNV" },
] as const;

const NONE_VALUE = "NONE";

const schema = z.object({
  vehicleTypes: z.array(z.string()),
});

// ============================================================================
// Component
// ============================================================================

interface StepMobilityProps {
  defaultVehicleTypes: string[];
  onComplete: (data: { vehicleTypes: string[] }) => void;
  onBack: () => void;
}

export function StepMobility({ defaultVehicleTypes, onComplete, onBack }: StepMobilityProps) {
  const form = useForm({
    defaultValues: { vehicleTypes: defaultVehicleTypes },
    validators: { onSubmit: schema },
    onSubmit: ({ value }) => onComplete(value),
  });

  return (
    <div className="flex flex-col h-full">
      <form
        className="flex-1 overflow-y-auto px-5 py-6"
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <h3 className="text-[20px] font-bold text-foreground mb-1">Mobilität</h3>
        <p className="text-[13px] text-muted-foreground mb-6">
          Welche Fahrzeuge nutzt du? Mehrfachauswahl möglich.
        </p>

        <form.Field
          name="vehicleTypes"
          children={(field) => {
            const selected = field.state.value;
            const hasNone = selected.includes(NONE_VALUE);

            const toggle = (value: string) => {
              if (value === NONE_VALUE) {
                field.handleChange(hasNone ? [] : [NONE_VALUE]);
                return;
              }
              const withoutNone = selected.filter((v) => v !== NONE_VALUE);
              if (withoutNone.includes(value)) {
                field.handleChange(withoutNone.filter((v) => v !== value));
              } else {
                field.handleChange([...withoutNone, value]);
              }
            };

            return (
              <div className="flex flex-col gap-2.5">
                {VEHICLE_OPTIONS.map((option) => {
                  const isSelected = selected.includes(option.value) && !hasNone;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => toggle(option.value)}
                      className={cn(
                        "w-full flex items-center justify-between rounded-2xl px-4 py-4 border-2 transition-all active:scale-[0.99]",
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border bg-background hover:border-primary/40"
                      )}
                    >
                      <span
                        className={cn(
                          "text-[15px] font-semibold",
                          isSelected ? "text-primary" : "text-foreground"
                        )}
                      >
                        {option.label}
                      </span>
                      <div
                        className={cn(
                          "size-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0",
                          isSelected
                            ? "bg-primary border-primary"
                            : "border-muted-foreground/30"
                        )}
                      >
                        {isSelected && <Check className="size-3 text-primary-foreground stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}

                {/* None option */}
                <button
                  type="button"
                  onClick={() => toggle(NONE_VALUE)}
                  className={cn(
                    "w-full flex items-center justify-between rounded-2xl px-4 py-4 border-2 transition-all active:scale-[0.99]",
                    hasNone
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background hover:border-primary/40"
                  )}
                >
                  <span
                    className={cn(
                      "text-[15px] font-semibold",
                      hasNone ? "text-primary" : "text-foreground"
                    )}
                  >
                    Kein eigenes Fahrzeug
                  </span>
                  <div
                    className={cn(
                      "size-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0",
                      hasNone ? "bg-primary border-primary" : "border-muted-foreground/30"
                    )}
                  >
                    {hasNone && <Check className="size-3 text-primary-foreground stroke-[3]" />}
                  </div>
                </button>
              </div>
            );
          }}
        />
      </form>

      <StepNavBar onBack={onBack} onNext={() => form.handleSubmit()} />
    </div>
  );
}
