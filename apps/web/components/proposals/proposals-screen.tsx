"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, TrendingDown, Sparkles, Loader2, Siren } from "lucide-react";
import { useDashboardQuery } from "@/lib/queries";
import { InsuranceTypeLabels, InsuranceTypeIcons, type CoverageItem } from "@/lib/api-client";
import { typeToSlug } from "@/lib/insurance-content";
import { ProcessingState } from "@/components/home/processing-state";
import { Skeleton } from "@/components/ui/skeleton";

const HUK_LOGO =
  "https://static.c.huk24.de/content/dam/huk24/web/allgemein/%C3%BCber-uns/HUK_Logo_gelb_nachtblau_RGB_800x800px.png";

const INTERVAL_LABELS: Record<string, string> = {
  MONTHLY: "/ Monat",
  YEARLY: "/ Jahr",
  QUARTERLY: "/ Quartal",
  WEEKLY: "/ Woche",
};

function ProposalCard({ item }: { item: CoverageItem }) {
  const proposal = item.proposal!;
  const intervalLabel = INTERVAL_LABELS[proposal.interval] ?? "";

  return (
    <Link
      href={`/vertragsempfehlungen/${typeToSlug(item.type)}`}
      className="bg-card rounded-2xl px-4 py-3.5 ring-1 ring-foreground/8 flex items-center justify-between active:bg-muted transition-colors"
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-[20px] leading-none shrink-0">
          {InsuranceTypeIcons[item.type] ?? "📋"}
        </span>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-foreground truncate">
            {InsuranceTypeLabels[item.type] ?? item.type}
          </p>
          {proposal.reason && (
            <p className="text-[11px] text-muted-foreground leading-snug line-clamp-1 mt-0.5">
              {proposal.reason}
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end shrink-0 ml-3 gap-1">
        <span className="text-[13px] font-bold text-foreground tabular-nums">
          ~{Number.parseFloat(proposal.rate).toFixed(2).replace(".", ",")} €
        </span>
        <span className="text-[9px] text-muted-foreground whitespace-nowrap">{intervalLabel}</span>
      </div>
    </Link>
  );
}

function AlternativeCard({ item }: { item: CoverageItem }) {
  const proposal = item.proposal!;
  const insurance = item.insurance!;
  const intervalLabel = INTERVAL_LABELS[proposal.interval] ?? "";
  const currentIntervalLabel = INTERVAL_LABELS[insurance.interval] ?? "";

  return (
    <Link
      href={`/vertragsempfehlungen/${typeToSlug(item.type)}`}
      className="bg-primary-2/5 rounded-2xl ring-1 ring-primary-2/20 overflow-hidden active:opacity-90 transition-opacity"
    >
      {/* Header badge */}
      <div className="bg-primary-2/10 px-4 py-2 flex items-center gap-2">
        <TrendingDown className="size-3.5 text-primary-2 shrink-0" />
        <p className="text-[10px] font-semibold uppercase tracking-widest text-primary-2">
          Wechsel-Empfehlung
        </p>
      </div>

      <div className="px-4 py-3.5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[18px] leading-none">{InsuranceTypeIcons[item.type] ?? "📋"}</span>
          <p className="text-[13px] font-semibold text-foreground">
            {InsuranceTypeLabels[item.type] ?? item.type}
          </p>
        </div>

        {/* Comparison: current vs HUK */}
        <div className="flex items-center gap-3 mb-3">
          {/* Current */}
          <div className="flex-1 bg-background/60 rounded-xl px-3 py-2.5">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Aktuell
            </p>
            <p className="text-[12px] font-medium text-foreground truncate">{insurance.company}</p>
            <p className="text-[15px] font-bold text-foreground tabular-nums leading-tight">
              {Number.parseFloat(insurance.rate).toFixed(2).replace(".", ",")} €
            </p>
            <p className="text-[9px] text-muted-foreground">{currentIntervalLabel}</p>
          </div>

          <ArrowRight className="size-4 text-primary-2 shrink-0" />

          {/* HUK */}
          <div className="flex-1 bg-primary-2/10 rounded-xl px-3 py-2.5">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-primary-2 mb-1">
              HUK-COBURG
            </p>
            <div className="flex items-center gap-1 mb-0.5">
              <Image src={HUK_LOGO} alt="HUK" width={14} height={14} className="object-contain" />
              <p className="text-[12px] font-medium text-foreground">{proposal.company}</p>
            </div>
            <p className="text-[15px] font-bold text-primary-2 tabular-nums leading-tight">
              ~{Number.parseFloat(proposal.rate).toFixed(2).replace(".", ",")} €
            </p>
            <p className="text-[9px] text-muted-foreground">{intervalLabel}</p>
          </div>
        </div>

        {/* Savings badge */}
        {item.savingsPerMonth !== null && item.savingsPerMonth > 0 && (
          <div className="bg-green-100 text-green-700 rounded-lg px-3 py-1.5 mb-2 flex items-center gap-1.5 w-full justify-center">
            <TrendingDown className="size-3" />
            <p className="text-[11px] font-semibold ">
              ~{item.savingsPerMonth.toFixed(2).replace(".", ",")} € / Monat sparen
            </p>
          </div>
        )}

        {proposal.reason && (
          <p className="text-[11px] text-muted-foreground leading-relaxed">{proposal.reason}</p>
        )}
      </div>
    </Link>
  );
}

function ProposalsPageSkeleton() {
  return (
    <div className="px-4 pt-4 pb-10">
      <Skeleton className="h-7 w-48 mb-1" />
      <Skeleton className="h-4 w-64 mb-6" />
      <div className="flex flex-col gap-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-[62px] w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export function ProposalsScreen() {
  const { data, isLoading, isError } = useDashboardQuery();

  if (isLoading) return <ProposalsPageSkeleton />;

  if (isError || !data) {
    return (
      <div className="px-5 py-10 text-center">
        <p className="text-sm text-muted-foreground">Daten konnten nicht geladen werden.</p>
      </div>
    );
  }

  const processingTypes = data.processingTypes ?? [];

  // Regular proposals: recommended items with a proposal (exclude currently processing)
  const regularProposals = data.items.filter(
    (i) => i.status === "recommended" && i.proposal !== null && !processingTypes.includes(i.type)
  );

  // Alternative proposals: covered items with a goal-relevant HUK alternative
  const alternatives = data.items.filter((i) => i.status === "covered" && i.isAlternative);

  // Covered types currently being analysed (no result yet)
  const processingCovered = data.items.filter(
    (i) => i.status === "covered" && processingTypes.includes(i.type) && !i.isAlternative
  );

  const hasAny = regularProposals.length > 0 || alternatives.length > 0 || processingCovered.length > 0;

  return (
    <div className="pb-10">
      <div className="px-5 pt-4 mb-4">
        <h2 className="text-[24px] font-bold text-foreground leading-tight mb-0.5">Empfehlungen</h2>
        <p className="text-[13px] text-muted-foreground">
          {hasAny
            ? `${regularProposals.length + alternatives.length} personalisierte Empfehlungen für dich`
            : "Deine persönlichen Versicherungsempfehlungen"}
        </p>
      </div>

      <div className="px-4 flex flex-col gap-6">
        {/* Alternatives section */}
        {alternatives.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Siren className="size-4 text-primary-2" />
              <p className="text-[12px] font-semibold uppercase tracking-widest text-primary-2">
                Wechsel lohnt sich
              </p>
            </div>
            <div className="flex flex-col gap-3">
              {alternatives.map((item) => (
                <AlternativeCard key={item.type} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* Processing: covered types being analysed right now */}
        {processingCovered.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Loader2 className="size-4 text-muted-foreground animate-spin" />
              <p className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground">
                Analyse läuft
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {processingCovered.map((item) => (
                <div
                  key={item.type}
                  className="bg-card rounded-2xl px-4 py-3.5 ring-1 ring-foreground/8 flex items-center gap-3"
                >
                  <span className="text-[20px] leading-none shrink-0">
                    {InsuranceTypeIcons[item.type] ?? "📋"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-foreground truncate">
                      {InsuranceTypeLabels[item.type] ?? item.type}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Vergleich wird berechnet…
                    </p>
                  </div>
                  <Loader2 className="size-4 text-muted-foreground shrink-0 animate-spin" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Regular proposals section */}
        {regularProposals.length > 0 && (
          <div>
            {alternatives.length > 0 && (
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="size-4 text-muted-foreground" />
                <p className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Neue Empfehlungen
                </p>
              </div>
            )}
            <div className="flex flex-col gap-2">
              {regularProposals.map((item) => (
                <ProposalCard key={item.type} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* Empty / processing state */}
        {!hasAny && (
          <div>
            {data.hasQuestionnaire ? (
              data.hasCompletedProposalJob ? (
                <div className="bg-muted/50 rounded-2xl px-6 py-10 text-center">
                  <p className="text-[22px] mb-3">🔍</p>
                  <p className="text-[14px] font-semibold text-foreground mb-1">
                    Keine Empfehlungen verfügbar
                  </p>
                  <p className="text-[12px] text-muted-foreground leading-relaxed">
                    Für dein Profil konnten aktuell keine Empfehlungen ermittelt werden.
                  </p>
                </div>
              ) : (
                <ProcessingState />
              )
            ) : (
              <div className="bg-card rounded-2xl px-5 py-6 ring-1 ring-foreground/8 text-center">
                <p className="text-[22px] mb-3">🔍</p>
                <p className="text-[14px] font-semibold text-foreground mb-1">
                  Noch keine Empfehlungen
                </p>
                <p className="text-[12px] text-muted-foreground leading-relaxed mb-4">
                  Starte den Bedarfscheck, damit wir passende Versicherungen für dich ermitteln können.
                </p>
                <Link
                  href="/bedarfscheck"
                  className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary"
                >
                  Jetzt starten
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            )}
          </div>
        )}

        {hasAny && (
          <p className="text-[11px] text-muted-foreground px-1 leading-relaxed">
            ~ Die angezeigten Beiträge sind KI-gestützte Schätzungen auf Basis deines Profils. Der
            tatsächliche Beitrag kann abweichen und wird beim Abschluss verbindlich berechnet.
          </p>
        )}
      </div>
    </div>
  );
}
