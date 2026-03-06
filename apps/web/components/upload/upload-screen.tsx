"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, FileText, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useAddInsurance, useUploadDocument } from "@/lib/queries";
import { InsuranceTypeLabels, InsuranceTypeIcons } from "@/lib/api-client";

const SUPPORTED_TYPES = [
  "PRIVATHAFTPFLICHT",
  "HAUSRAT",
  "KFZ",
  "BERUFSUNFAEHIGKEIT",
  "ZAHNZUSATZ",
  "PFLEGE",
  "UNFALL",
  "RECHTSSCHUTZ",
  "AUSLANDS_KRANKEN",
] as const;

const PAYMENT_INTERVALS = [
  { value: "MONTHLY", label: "Monatlich" },
  { value: "YEARLY", label: "Jährlich" },
  { value: "QUARTERLY", label: "Vierteljährlich" },
  { value: "WEEKLY", label: "Wöchentlich" },
] as const;

interface UploadedFile {
  file: File;
  id: string;
}

export function UploadScreen() {
  const router = useRouter();
  const addInsurance = useAddInsurance();
  const uploadDocument = useUploadDocument();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [type, setType] = useState<string>("");
  const [company, setCompany] = useState("");
  const [rate, setRate] = useState("");
  const [interval, setInterval] = useState("MONTHLY");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [step, setStep] = useState<"form" | "uploading" | "success">("form");

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    const newFiles = selected.map((file) => ({ file, id: crypto.randomUUID() }));
    setFiles((prev) => [...prev, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!type || !company.trim() || !rate) {
      toast.error("Bitte alle Pflichtfelder ausfüllen.");
      return;
    }

    const rateNum = Number.parseFloat(rate.replace(",", "."));
    if (isNaN(rateNum) || rateNum <= 0) {
      toast.error("Bitte einen gültigen Beitrag eingeben.");
      return;
    }

    setStep("uploading");

    try {
      const result = await addInsurance.mutateAsync({
        type,
        company: company.trim(),
        rate: rateNum,
        interval,
      });

      const insuranceId =
        (result as unknown as { data: { id: string } }).data?.id ??
        (result as unknown as { id: string }).id;

      // Upload documents in parallel
      if (files.length > 0) {
        await Promise.allSettled(
          files.map((f) => uploadDocument.mutateAsync({ insuranceId, file: f.file }))
        );
      }

      setStep("success");
      setTimeout(() => router.push("/vertraege"), 1500);
    } catch (err) {
      setStep("form");
      toast.error(err instanceof Error ? err.message : "Fehler beim Speichern.");
    }
  }

  if (step === "uploading") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 px-8 text-center">
        <Loader2 className="size-10 text-primary-foreground animate-spin" strokeWidth={1.5} />
        <p className="text-[15px] font-semibold text-foreground">Vertrag wird gespeichert…</p>
        <p className="text-[13px] text-muted-foreground">
          Wir starten direkt eine Analyse und suchen die beste Alternative für dich.
        </p>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 px-8 text-center">
        <CheckCircle2 className="size-12 text-green-500" strokeWidth={1.5} />
        <p className="text-[15px] font-semibold text-foreground">Vertrag gespeichert!</p>
        <p className="text-[13px] text-muted-foreground">Du wirst gleich weitergeleitet…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="px-4 pb-10 flex flex-col gap-5">
      {/* Insurance Type */}
      <div>
        <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2 block">
          Versicherungsart *
        </label>
        <div className="grid grid-cols-3 gap-2">
          {SUPPORTED_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-3 text-center transition-all ring-1 ${
                type === t
                  ? "bg-primary/10 ring-primary text-primary"
                  : "bg-card ring-foreground/8 text-foreground"
              }`}
            >
              <span className="text-[20px] leading-none">{InsuranceTypeIcons[t] ?? "📋"}</span>
              <span className="text-[10px] font-medium leading-tight">
                {InsuranceTypeLabels[t] ?? t}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Company Name */}
      <div>
        <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2 block">
          Versicherungsgesellschaft *
        </label>
        <input
          type="text"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="z.B. Allianz, AXA, DEVK…"
          className="w-full bg-card ring-1 ring-foreground/10 rounded-xl px-4 py-3 text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-primary"
        />
      </div>

      {/* Premium */}
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2 block">
            Beitrag *
          </label>
          <div className="relative">
            <input
              type="text"
              inputMode="decimal"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              placeholder="0,00"
              className="w-full bg-card ring-1 ring-foreground/10 rounded-xl px-4 py-3 pr-8 text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-primary"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-muted-foreground">
              €
            </span>
          </div>
        </div>
        <div className="flex-1">
          <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2 block">
            Zahlweise
          </label>
          <select
            value={interval}
            onChange={(e) => setInterval(e.target.value)}
            className="w-full bg-card ring-1 ring-foreground/10 rounded-xl px-4 py-3 text-[14px] text-foreground focus:outline-none focus:ring-primary appearance-none"
          >
            {PAYMENT_INTERVALS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Document Upload */}
      <div>
        <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2 block">
          Dokumente (optional)
        </label>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full bg-muted/50 rounded-2xl px-6 py-8 flex flex-col items-center gap-2 text-center border-2 border-dashed border-border active:bg-muted transition-colors"
        >
          <Upload className="size-7 text-muted-foreground/60" strokeWidth={1.5} />
          <p className="text-[13px] font-medium text-foreground">Dokument hinzufügen</p>
          <p className="text-[11px] text-muted-foreground">PDF, JPEG oder PNG · max. 20 MB</p>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />

        {files.length > 0 && (
          <div className="mt-3 flex flex-col gap-2">
            {files.map((f) => (
              <div
                key={f.id}
                className="flex items-center gap-3 bg-card ring-1 ring-foreground/8 rounded-xl px-4 py-3"
              >
                <FileText className="size-5 text-muted-foreground shrink-0" strokeWidth={1.5} />
                <p className="text-[13px] text-foreground flex-1 truncate">{f.file.name}</p>
                <button
                  type="button"
                  onClick={() => removeFile(f.id)}
                  className="shrink-0 text-muted-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!type || !company.trim() || !rate}
        className="w-full bg-primary text-primary-foreground rounded-2xl px-5 py-4 text-[15px] font-semibold disabled:opacity-40 transition-opacity active:opacity-90 mt-2"
      >
        Vertrag speichern
      </button>
    </form>
  );
}
