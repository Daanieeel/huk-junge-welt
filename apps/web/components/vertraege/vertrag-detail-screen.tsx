"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  FileText,
  Trash2,
  Upload,
  ExternalLink,
  TrendingDown,
  AlertCircle,
  Loader2,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import {
  useInsuranceQuery,
  useDeleteInsurance,
  useUploadDocument,
  useDeleteDocument,
  useDashboardQuery,
} from "@/lib/queries";
import { InsuranceTypeLabels, InsuranceTypeIcons } from "@/lib/api-client";
import { typeToSlug, INSURANCE_CONTENT } from "@/lib/insurance-content";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const HUK_LOGO =
  "https://static.c.huk24.de/content/dam/huk24/web/allgemein/%C3%BCber-uns/HUK_Logo_gelb_nachtblau_RGB_800x800px.png";

const INTERVAL_LABELS: Record<string, string> = {
  MONTHLY: "/ Monat",
  YEARLY: "/ Jahr",
  QUARTERLY: "/ Quartal",
  WEEKLY: "/ Woche",
};

interface Insurance {
  id: string;
  type: string;
  company: string;
  rate: string;
  interval: string;
  coverageScore: number | null;
  number?: string;
  createdAt: string;
  documents: Array<{ id: string; title: string; url: string }>;
}

export function VertragDetailScreen({ insuranceId }: { insuranceId: string }) {
  const router = useRouter();
  const { data: insuranceData, isLoading } = useInsuranceQuery(insuranceId);
  const { data: dashboard } = useDashboardQuery();
  const deleteInsurance = useDeleteInsurance();
  const uploadDocument = useUploadDocument();
  const deleteDocument = useDeleteDocument();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  const insurance = (insuranceData as unknown as { data: Insurance })?.data ?? null;

  // Look up if there's a goal-relevant alternative proposal
  const dashboardItem = dashboard?.items.find((i) => i.type === insurance?.type);
  const alternativeProposal =
    dashboardItem?.isAlternative && dashboardItem.proposal ? dashboardItem.proposal : null;
  const savingsPerMonth = dashboardItem?.savingsPerMonth ?? null;
  const isProcessing = insurance
    ? (dashboard?.processingTypes ?? []).includes(insurance.type)
    : false;

  async function handleDelete() {
    if (!insurance) return;
    try {
      await deleteInsurance.mutateAsync(insurance.id);
      toast.success("Vertrag gelöscht");
      router.push("/vertraege");
    } catch {
      toast.error("Fehler beim Löschen");
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !insurance) return;
    e.target.value = "";
    setUploadingFile(true);
    try {
      await uploadDocument.mutateAsync({ insuranceId: insurance.id, file });
      toast.success("Dokument hochgeladen");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload fehlgeschlagen");
    } finally {
      setUploadingFile(false);
    }
  }

  async function handleDeleteDoc(docId: string) {
    if (!insurance) return;
    try {
      await deleteDocument.mutateAsync({ insuranceId: insurance.id, docId });
      toast.success("Dokument gelöscht");
    } catch {
      toast.error("Fehler beim Löschen");
    }
  }

  if (isLoading) {
    return (
      <div className="px-5 pt-4 flex flex-col gap-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  if (!insurance) {
    return (
      <div className="px-5 py-10 text-center">
        <p className="text-sm text-muted-foreground">Vertrag nicht gefunden.</p>
      </div>
    );
  }

  const content = INSURANCE_CONTENT[insurance.type];
  const intervalLabel = INTERVAL_LABELS[insurance.interval] ?? "";

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="bg-background px-5 pt-4 pb-4">
        <Link
          href="/vertraege"
          className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground mb-4"
        >
          <ArrowLeft className="size-4" />
          Zurück
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[22px]">{InsuranceTypeIcons[insurance.type] ?? "📋"}</span>
              <h1 className="text-[20px] font-bold text-foreground leading-tight">
                {InsuranceTypeLabels[insurance.type] ?? insurance.type}
              </h1>
            </div>
            <p className="text-[13px] text-muted-foreground">{insurance.company}</p>
          </div>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2 text-muted-foreground"
          >
            <Trash2 className="size-5" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 bg-muted/50 p-4 flex flex-col gap-3">
        {/* Price card */}
        <div className="bg-card rounded-2xl px-5 py-4 ring-1 ring-foreground/8">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
            Dein Beitrag
          </p>
          <div className="flex gap-2 items-end">
            <p className="text-[22px] font-bold text-foreground tabular-nums leading-none">
              {Number.parseFloat(insurance.rate).toFixed(2).replace(".", ",")} €
            </p>
            <p className="text-[11px] text-muted-foreground mb-0.5">{intervalLabel}</p>
          </div>
          {insurance.coverageScore !== null && (
            <div className="flex items-center gap-1.5 mt-2">
              <p className="text-[12px] text-muted-foreground">
                Qualitätsscore:{" "}
                <span className="font-semibold text-foreground">{insurance.coverageScore}/100</span>
              </p>
              <Popover>
                <PopoverTrigger className="text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                  <Info className="size-3.5" />
                </PopoverTrigger>
                <PopoverContent side="top" className="w-64 text-[12px] leading-relaxed">
                  Der <span className="font-semibold">Qualitätsscore (0–100)</span> zeigt, wie gut dein Vertrag dich absichert – bewertet anhand von Leistungsumfang, Deckungsgrenzen und Ausschlüssen. Er wird automatisch aus deinen Vertragsunterlagen berechnet.
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>

        {/* Processing state: job is running for this type */}
        {isProcessing && !alternativeProposal && (
          <div className="bg-muted rounded-2xl px-5 py-4 ring-1 ring-foreground/8 flex items-center gap-3">
            <Loader2 className="size-5 text-primary shrink-0 animate-spin" />
            <div>
              <p className="text-[13px] font-semibold text-foreground">Analyse läuft…</p>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                Wir vergleichen deinen Vertrag gerade mit unseren Angeboten.
              </p>
            </div>
          </div>
        )}

        {/* Alternative proposal card */}
        {alternativeProposal && (
          <div className="bg-primary-2/5 rounded-2xl px-5 py-4 ring-1 ring-primary-2/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="size-4 text-primary-2 shrink-0" />
              <p className="text-[11px] font-semibold uppercase tracking-widest text-primary-2">
                Bessere Alternative verfügbar
              </p>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <Image
                src={HUK_LOGO}
                alt="HUK-COBURG"
                width={28}
                height={28}
                className="object-contain"
              />
              <div>
                <p className="text-[13px] font-semibold text-foreground">
                  {alternativeProposal.company}
                </p>
                <div className="flex gap-1.5 items-end">
                  <p className="text-[18px] font-bold text-primary-2 tabular-nums leading-none">
                    ~{Number.parseFloat(alternativeProposal.rate).toFixed(2).replace(".", ",")} €
                  </p>
                  <p className="text-[10px] text-muted-foreground mb-0.5">
                    {INTERVAL_LABELS[alternativeProposal.interval] ?? ""}
                  </p>
                </div>
              </div>
            </div>
            {savingsPerMonth !== null && savingsPerMonth > 0 && (
              <p className="text-[12px] text-primary-2 font-semibold mb-3">
                Mögliche Ersparnis: ~{savingsPerMonth.toFixed(2).replace(".", ",")} € / Monat
              </p>
            )}
            {alternativeProposal.reason && (
              <p className="text-[12px] text-muted-foreground leading-relaxed mb-3">
                {alternativeProposal.reason}
              </p>
            )}
            {content && (
              <a
                href={content.applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary-2"
              >
                Jetzt wechseln
                <ExternalLink className="size-3.5" />
              </a>
            )}
          </div>
        )}

        {/* Insurance info */}
        {content && (
          <div className="bg-card rounded-2xl px-5 py-4 ring-1 ring-foreground/8">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              Was ist abgedeckt?
            </p>
            <p className="text-[13px] text-foreground leading-relaxed">
              {content.shortDescription}
            </p>
            <Link
              href={`/vertragsempfehlungen/${typeToSlug(insurance.type)}/mehr-infos`}
              className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary-foreground mt-2"
            >
              Mehr erfahren
            </Link>
          </div>
        )}

        {/* Documents */}
        <div className="bg-card rounded-2xl p-4 ring-1 ring-foreground/8">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Dokumente ({insurance.documents.length})
            </p>
            <Button variant={'ghost'} size={'sm'}>
              {uploadingFile ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Upload className="size-3.5" />
              )}
              Hochladen
              <input
                type="file"
                accept=".pdf,image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploadingFile}
              />
            </Button>
          </div>

          {insurance.documents.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">Noch keine Dokumente hochgeladen.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {insurance.documents.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3">
                  <FileText className="size-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[13px] text-foreground flex-1 truncate hover:text-primary"
                  >
                    {doc.title}
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDeleteDoc(doc.id)}
                    className="shrink-0 text-muted-foreground/60"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="w-full bg-background rounded-t-3xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <AlertCircle className="size-6 text-destructive shrink-0" />
              <p className="text-[15px] font-semibold text-foreground">Vertrag löschen?</p>
            </div>
            <p className="text-[13px] text-muted-foreground mb-6 leading-relaxed">
              Der Vertrag und alle zugehörigen Dokumente werden unwiderruflich gelöscht.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-muted rounded-xl px-4 py-3 text-[14px] font-semibold text-foreground"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteInsurance.isPending}
                className="flex-1 bg-destructive rounded-xl px-4 py-3 text-[14px] font-semibold text-destructive-foreground disabled:opacity-60"
              >
                {deleteInsurance.isPending ? "Löschen…" : "Löschen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}