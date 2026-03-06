"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldError, FieldDescription } from "@/components/ui/field";

// ============================================================================
// Data
// ============================================================================

const JOB_OPTIONS = [
  { value: "STUDENT", label: "Student/in", description: "Ich studiere gerade." },
  { value: "APPRENTICE", label: "Auszubildende/r", description: "Ich mache eine Ausbildung." },
  { value: "EMPLOYEE", label: "Angestellte/r", description: "Ich bin fest angestellt." },
  { value: "SEARCHING", label: "Arbeitssuchend", description: "Ich suche gerade eine Stelle." },
] as const;

const HAS_EXPIRY = ["STUDENT", "APPRENTICE"];

const schema = z.object({
  jobType: z.string().min(1, "Bitte wähle eine Option aus."),
  // Stored as "" inside the form; converted to null on submit when empty
  jobExpiryDate: z.string(),
  salary: z.string(),
});

// ============================================================================
// Component
// ============================================================================

interface StepEmploymentProps {
  defaultJobType: string | null;
  defaultJobExpiryDate: string | null;
  defaultSalary: string;
  onComplete: (data: { jobType: string; jobExpiryDate: string | null; salary: string }) => void;
}

// Internal form values (jobExpiryDate is "" when empty, converted to null on submit)
type FormValues = { jobType: string; jobExpiryDate: string; salary: string };

export function StepEmployment({
  defaultJobType,
  defaultJobExpiryDate,
  defaultSalary,
  onComplete,
}: StepEmploymentProps) {
  const [selectedJobType, setSelectedJobType] = useState(defaultJobType ?? "");

  const form = useForm({
    defaultValues: {
      jobType: defaultJobType ?? "",
      // Use "" so the input is always controlled; convert back to null on submit
      jobExpiryDate: defaultJobExpiryDate ?? "",
      salary: defaultSalary,
    },
    validators: { onSubmit: schema },
    onSubmit: ({ value }: { value: FormValues }) =>
      onComplete({
        ...value,
        jobExpiryDate: value.jobExpiryDate || null,
      }),
  });

  const showExpiry = HAS_EXPIRY.includes(selectedJobType);

  return (
    <form
      id="step-form"
      className="px-5 py-6"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
        <h3 className="text-[20px] font-bold text-foreground mb-1">Beruf & Gehalt</h3>
        <p className="text-[13px] text-muted-foreground mb-6">
          Was trifft auf dich aktuell zu?
        </p>

        {/* Job type selection */}
        <form.Field
          name="jobType"
          children={(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <div className="flex flex-col gap-2.5 mb-6">
                {JOB_OPTIONS.map((option) => {
                  const isSelected = field.state.value === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                          field.handleChange(option.value);
                          setSelectedJobType(option.value);
                        }}
                      className={cn(
                        "w-full text-left rounded-2xl px-4 py-3.5 border-2 transition-all active:scale-[0.99]",
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border bg-background hover:border-primary/40"
                      )}
                    >
                      <span
                        className={cn(
                          "block text-[15px] font-semibold",
                          isSelected ? "text-primary" : "text-foreground"
                        )}
                      >
                        {option.label}
                      </span>
                      <span className="block text-[12px] text-muted-foreground mt-0.5">
                        {option.description}
                      </span>
                    </button>
                  );
                })}
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </div>
            );
          }}
        />

        {/* Conditional: Ausbildungs-/Studienende */}
        {showExpiry && (
          <form.Field
            name="jobExpiryDate"
            children={(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              const label =
                selectedJobType === "STUDENT"
                  ? "Voraussichtliches Studienende"
                  : "Voraussichtliches Ausbildungsende";
              return (
                <Field data-invalid={isInvalid} className="mb-5">
                  <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="date"
                    value={field.state.value ?? ""}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    min={new Date().toISOString().split("T")[0]}
                  />
                  <FieldDescription>Optional – hilft uns bei genaueren Empfehlungen.</FieldDescription>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />
        )}

        {/* Salary */}
        <form.Field
          name="salary"
          children={(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Monatliches Nettoeinkommen (€)</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="number"
                  inputMode="numeric"
                  value={field.state.value ?? ""}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  placeholder="z. B. 2.000"
                  min={0}
                />
                <FieldDescription>
                  Optional – für eine passgenauere Einschätzung deiner Absicherung.
                </FieldDescription>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        />
    </form>
  );
}
