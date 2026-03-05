"use client";

import { useForm } from "@tanstack/react-form";
import * as z from "zod";
import { Field, FieldLabel, FieldError, FieldDescription } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { StepNavBar } from "./step-nav-bar";

// ============================================================================
// Schema
// ============================================================================

const schema = z.object({
  name: z.string().min(2, "Bitte gib deinen Namen ein."),
  dateOfBirth: z
    .string()
    .min(1, "Bitte gib dein Geburtsdatum ein.")
    .refine((val) => {
      const date = new Date(val);
      if (isNaN(date.getTime())) return false;
      const age = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      return age >= 16 && age <= 100;
    }, "Bitte gib ein gültiges Geburtsdatum ein (über 16)."),
});

// ============================================================================
// Component
// ============================================================================

interface StepPersonalProps {
  defaultName: string;
  defaultDateOfBirth: string;
  onComplete: (data: { name: string; dateOfBirth: string }) => void;
  onBack: () => void;
}

export function StepPersonal({
  defaultName,
  defaultDateOfBirth,
  onComplete,
  onBack,
}: StepPersonalProps) {
  const form = useForm({
    defaultValues: {
      name: defaultName,
      dateOfBirth: defaultDateOfBirth,
    },
    validators: { onSubmit: schema },
    onSubmit: ({ value }) => onComplete(value),
  });

  return (
    <div className="flex flex-col h-full">
      <form
        id="step-personal-form"
        className="flex-1 overflow-y-auto px-5 py-6"
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <h3 className="text-[20px] font-bold text-foreground mb-1">Persönliche Daten</h3>
        <p className="text-[13px] text-muted-foreground mb-6">
          Wir benötigen diese Angaben, um passende Angebote für dich zu berechnen.
        </p>

        <div className="flex flex-col gap-5">
          {/* Name */}
          <form.Field
            name="name"
            children={(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Dein Name</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    placeholder="Max Mustermann"
                    autoComplete="name"
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />

          {/* Date of birth */}
          <form.Field
            name="dateOfBirth"
            children={(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Geburtsdatum</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="date"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    max={new Date().toISOString().split("T")[0]}
                  />
                  <FieldDescription>
                    Deine Daten sind bei uns sicher.
                  </FieldDescription>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />
        </div>
      </form>

      <StepNavBar onBack={onBack} onNext={() => form.handleSubmit()} />
    </div>
  );
}
