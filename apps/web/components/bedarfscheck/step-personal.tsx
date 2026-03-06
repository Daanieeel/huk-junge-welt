"use client";

import { useState } from "react";
import { format, isValid, parse } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useForm } from "@tanstack/react-form";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Field, FieldLabel, FieldError, FieldDescription } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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

// ============================================================================
// Schema
// ============================================================================

const schema = z.object({
  dateOfBirth: z
    .string()
    .min(1, "Bitte gib dein Geburtsdatum ein.")
    .refine((val) => {
      const date = new Date(val);
      if (Number.isNaN(date.getTime())) return false;
      const age = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      return age >= 16 && age <= 100;
    }, "Bitte gib ein gültiges Geburtsdatum ein (über 16)."),
  streetName: z.string().min(1, "Bitte gib deine Straße ein."),
  streetNumber: z.string().min(1, "Bitte gib die Hausnummer ein."),
  zipcode: z.string().regex(/^\d{5}$/, "PLZ muss 5 Ziffern haben."),
  city: z.string().min(1, "Bitte gib deinen Wohnort ein."),
  housingType: z.string().min(1, "Bitte wähle eine Wohnart aus."),
  housingOwnershipType: z.string().nullable(),
});

type PersonalData = z.infer<typeof schema>;

// ============================================================================
// Date Picker
// ============================================================================

interface DatePickerProps {
  value: string;
  onChange: (val: string) => void;
}

function DatePicker({ value, onChange }: DatePickerProps) {
  const parsedInit = value ? parse(value, "yyyy-MM-dd", new Date()) : undefined;
  const [inputValue, setInputValue] = useState(value);
  const [date, setDate] = useState<Date | undefined>(
    parsedInit && isValid(parsedInit) ? parsedInit : undefined,
  );
  const [month, setMonth] = useState<Date>(
    parsedInit && isValid(parsedInit) ? parsedInit : new Date(),
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    if (val) {
      const parsed = parse(val, "yyyy-MM-dd", new Date());
      if (isValid(parsed)) {
        setDate(parsed);
        setMonth(parsed);
        onChange(val);
      }
    } else {
      setDate(undefined);
      onChange("");
    }
  };

  const handleSelect = (selected: Date | undefined) => {
    setDate(selected);
    if (selected) {
      const formatted = format(selected, "yyyy-MM-dd");
      setInputValue(formatted);
      setMonth(selected);
      onChange(formatted);
    } else {
      setInputValue("");
      onChange("");
    }
  };

  return (
    <Popover>
      <InputGroup>
        <InputGroupInput
          aria-label="Geburtsdatum eingeben"
          type="date"
          value={inputValue}
          onChange={handleInputChange}
          onClick={(e) => e.stopPropagation()}
          max={new Date().toISOString().split("T")[0]}
          className="[&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
        />
        <InputGroupAddon align="inline-end">
          <PopoverTrigger
            aria-label="Kalender öffnen"
            render={
              <Button
                aria-label="Kalender öffnen"
                size="icon-xs"
                variant="ghost"
              />
            }
          >
            <CalendarIcon aria-hidden="true" />
          </PopoverTrigger>
        </InputGroupAddon>
      </InputGroup>
      <PopoverContent align="start" alignOffset={-4} sideOffset={8}>
        <Calendar
          mode="single"
          month={month}
          onMonthChange={setMonth}
          onSelect={handleSelect}
          selected={date}
        />
      </PopoverContent>
    </Popover>
  );
}

// ============================================================================
// Component
// ============================================================================

interface StepPersonalProps {
  defaultDateOfBirth: string;
  defaultValues: {
    streetName: string;
    streetNumber: string;
    zipcode: string;
    city: string;
    housingType: string | null;
    housingOwnershipType: string | null;
  };
  onComplete: (data: PersonalData) => void;
}

export function StepPersonal({
  defaultDateOfBirth,
  defaultValues,
  onComplete,
}: StepPersonalProps) {
  const [selectedHousingType, setSelectedHousingType] = useState(
    defaultValues.housingType ?? "",
  );

  const form = useForm({
    defaultValues: {
      dateOfBirth: defaultDateOfBirth,
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
    <form
      id="step-form"
      className="px-5 py-6"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
        {/* ── Personal ─────────────────────────────────────────────────── */}
        <h3 className="text-[20px] font-bold text-foreground mb-1">Persönliche Daten</h3>
        <p className="text-[13px] text-muted-foreground mb-6">
          Wir benötigen diese Angaben, um passende Angebote für dich zu berechnen.
        </p>

        <div className="flex flex-col gap-5">
          {/* Date of birth */}
          <form.Field
            name="dateOfBirth"
            children={(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Geburtsdatum</FieldLabel>
                  <DatePicker
                    value={field.state.value}
                    onChange={(val) => {
                      field.handleChange(val);
                      field.handleBlur();
                    }}
                  />
                  <FieldDescription>Deine Daten sind bei uns sicher.</FieldDescription>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />

          {/* ── Address ──────────────────────────────────────────────────── */}
          <div className="pt-2">
            <h3 className="text-[18px] font-bold text-foreground mb-1">Adresse & Wohnen</h3>
            <p className="text-[13px] text-muted-foreground ">
              Damit können wir Empfehlungen wie Hausrat besser einschätzen.
            </p>
          </div>

          {/* Street + number */}
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

          {/* PLZ + city */}
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

          {/* Housing type */}
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
                              : "border-border bg-background text-foreground hover:border-primary/40",
                          )}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                  {isInvalid && (
                    <FieldError errors={field.state.meta.errors} className="mt-1.5" />
                  )}
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
                              : "border-border bg-background text-foreground hover:border-primary/40",
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
  );
}
