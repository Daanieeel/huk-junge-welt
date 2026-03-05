"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { StepNavBar } from "./step-nav-bar";

// ============================================================================
// Data
// ============================================================================

const HOUSING_OPTIONS = [
  { value: "HOUSE", label: "Haus" },
  { value: "APARTMENT", label: "Wohnung" },
  { value: "SHARED_ROOM", label: "WG" },
] as const;

const OWNERSHIP_OPTIONS = [
  { value: "RENTING", label: "Miete" },
  { value: "MORTGAGE", label: "Finanziert" },
  { value: "OWNER", label: "Eigentum" },
] as const;

const schema = z.object({
  streetName: z.string().min(1, "Bitte gib deine Straße ein."),
  streetNumber: z.string().min(1, "Bitte gib die Hausnummer ein."),
  zipcode: z
    .string()
    .regex(/^\d{5}$/, "PLZ muss 5 Ziffern haben."),
  city: z.string().min(1, "Bitte gib deinen Wohnort ein."),
  housingType: z.string().min(1, "Bitte wähle eine Wohnart aus."),
  housingOwnershipType: z.string().nullable(),
});

type AddressData = z.infer<typeof schema>;

// ============================================================================
// Component
// ============================================================================

interface StepAddressProps {
  defaultValues: {
    streetName: string;
    streetNumber: string;
    zipcode: string;
    city: string;
    housingType: string | null;
    housingOwnershipType: string | null;
  };
  onComplete: (data: AddressData) => void;
  onBack: () => void;
}

export function StepAddress({ defaultValues, onComplete, onBack }: StepAddressProps) {
  const [selectedHousingType, setSelectedHousingType] = useState(
    defaultValues.housingType ?? ""
  );

  const form = useForm({
    defaultValues: {
      streetName: defaultValues.streetName,
      streetNumber: defaultValues.streetNumber,
      zipcode: defaultValues.zipcode,
      city: defaultValues.city,
      housingType: defaultValues.housingType ?? "",
      housingOwnershipType: defaultValues.housingOwnershipType ?? null,
    },
    validators: { onSubmit: schema },
    onSubmit: ({ value }) => onComplete(value),
  });

  const showOwnership =
    selectedHousingType === "HOUSE" || selectedHousingType === "APARTMENT";

  return (
    <div className="flex flex-col h-full">
      <form
        className="flex-1 overflow-y-auto px-5 py-6"
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <h3 className="text-[20px] font-bold text-foreground mb-1">Adresse & Wohnen</h3>
        <p className="text-[13px] text-muted-foreground mb-6">
          Damit können wir Empfehlungen wie Hausrat besser einschätzen.
        </p>

        <div className="flex flex-col gap-5">
          {/* Street + number on same row */}
          <div className="flex gap-2">
            <form.Field
              name="streetName"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid} className="flex-1">
                    <FieldLabel htmlFor={field.name}>Straße</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      placeholder="Musterstraße"
                      autoComplete="address-line1"
                    />
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            />
            <form.Field
              name="streetNumber"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid} className="w-24">
                    <FieldLabel htmlFor={field.name}>Nr.</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      placeholder="12a"
                    />
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            />
          </div>

          {/* PLZ + city on same row */}
          <div className="flex gap-2">
            <form.Field
              name="zipcode"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid} className="w-28">
                    <FieldLabel htmlFor={field.name}>PLZ</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      placeholder="12345"
                      inputMode="numeric"
                      maxLength={5}
                    />
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            />
            <form.Field
              name="city"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid} className="flex-1">
                    <FieldLabel htmlFor={field.name}>Wohnort</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      placeholder="München"
                      autoComplete="address-level2"
                    />
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            />
          </div>

          {/* Housing type – segmented button group */}
          <form.Field
            name="housingType"
            children={(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <div>
                  <p className="text-[13px] font-semibold text-foreground mb-2">
                    Ich wohne in einem/einer…
                  </p>
                  <div className="flex gap-2">
                    {HOUSING_OPTIONS.map((opt) => {
                      const isSelected = field.state.value === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                              field.handleChange(opt.value);
                              setSelectedHousingType(opt.value);
                            }}
                          className={cn(
                            "flex-1 py-3 rounded-2xl border-2 text-[14px] font-semibold transition-all active:scale-[0.98]",
                            isSelected
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-border bg-background text-foreground hover:border-primary/40"
                          )}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                  {isInvalid && <FieldError errors={field.state.meta.errors} className="mt-1.5" />}
                </div>
              );
            }}
          />

          {/* Conditional: ownership type */}
          {showOwnership && (
            <form.Field
              name="housingOwnershipType"
              children={(field) => (
                <div>
                  <p className="text-[13px] font-semibold text-foreground mb-2">
                    Eigentumsverhältnis
                  </p>
                  <div className="flex gap-2">
                    {OWNERSHIP_OPTIONS.map((opt) => {
                      const isSelected = field.state.value === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() =>
                            field.handleChange(isSelected ? null : opt.value)
                          }
                          className={cn(
                            "flex-1 py-3 rounded-2xl border-2 text-[13px] font-semibold transition-all active:scale-[0.98]",
                            isSelected
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-border bg-background text-foreground hover:border-primary/40"
                          )}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            />
          )}
        </div>
      </form>

      <StepNavBar onBack={onBack} onNext={() => form.handleSubmit()} />
    </div>
  );
}
