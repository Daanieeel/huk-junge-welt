"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight, ExternalLink, CheckCircle2 } from "lucide-react";
import { useDashboardQuery } from "@/lib/queries";
import { InsuranceTypeLabels } from "@/lib/api-client";
import { INSURANCE_CONTENT, slugToType } from "@/lib/insurance-content";
import { Skeleton } from "@/components/ui/skeleton";

const HUK_LOGO =
  "https://static.c.huk24.de/content/dam/huk24/web/allgemein/%C3%BCber-uns/HUK_Logo_gelb_nachtblau_RGB_800x800px.png";

const INTERVAL_LABELS: Record<string, string> = {
  MONTHLY: "/ Monat",
  YEARLY: "/ Jahr",
  QUARTERLY: "/ Quartal",
  WEEKLY: "/ Woche",
};

export function ProposalDetailScreen({ slug }: { slug: string }) {
  const { data, isLoading } = useDashboardQuery();
  const type = slugToType(slug);
  const content = INSURANCE_CONTENT[type];

  if (!content) {
    return (
      <div className="px-5 py-10 text-center">
        <p className="text-sm text-muted-foreground">Unbekannter Versicherungstyp.</p>
      </div>
    );
  }

  const item = data?.items.find((i) => i.type === type);
  const proposal = item?.proposal ?? null;

  const intervalLabel = proposal ? (INTERVAL_LABELS[proposal.interval] ?? "") : "";

  return (
    <div className="flex flex-col min-h-full">
      {/* ── White header section ─────────────────────────────────────── */}
      <div className="bg-background px-5 pt-4 pb-3">
        <Link
          href="/vertragsempfehlungen"
          className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground mb-5"
        >
          <ArrowLeft className="size-4" />
          Zurück
        </Link>

        <h1 className="text-[22px] font-bold text-foreground leading-tight mb-4">
          {content.fullName}
        </h1>

        <div className="flex items-center gap-2">
          <Image
            src={HUK_LOGO}
            alt="HUK-COBURG Logo"
            width={32}
            height={32}
            className="object-contain"
          />
          <span className="text-[13px] font-semibold text-foreground">HUK-COBURG</span>
        </div>
      </div>

      {/* ── Off-white body section ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-between bg-muted/50 p-4 gap-4">
        <div className="flex-1 flex flex-col gap-3">
        {/* Was ist X? */}
        <div className="bg-card rounded-2xl px-5 py-4 ring-1 ring-foreground/8">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            Was ist {InsuranceTypeLabels[type] ?? content.fullName}?
          </p>
          <p className="text-[13px] text-foreground leading-relaxed">{content.shortDescription}</p>
          <Link
            href={`/vertragsempfehlungen/${slug}/mehr-infos`}
            className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary-foreground mt-2"
          >
            Mehr lesen
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        {/* Was ist abgedeckt? */}
        <div className="bg-card rounded-2xl px-5 py-4 ring-1 ring-foreground/8">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Was ist abgedeckt?
          </p>
          <ul className="flex flex-col gap-2">
            {content.topCoveredCases.map((c) => (
              <li key={c} className="flex items-start gap-2.5">
                <CheckCircle2 className="size-4 text-success shrink-0 mt-0.5" />
                <span className="text-[13px] text-foreground leading-snug">{c}</span>
              </li>
            ))}
          </ul>
          <Link
            href={`/vertragsempfehlungen/${slug}/leistungen`}
            className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary-foreground mt-2"
          >
            Mehr ansehen
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        {/* Price box */}
        <div className="bg-card rounded-2xl px-4 py-4 ring-1 ring-foreground/8 flex flex-col justify-center">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
            Beitrag
          </p>
          {isLoading ? (
            <div className="flex items-end gap-1.5 mt-1">
              <Skeleton className="h-4.5 w-28" />
              <Skeleton className="h-3 w-16" />
            </div>
          ) : proposal ? (
            <div className="flex gap-2 items-end">
              <p className="text-[22px] font-bold text-foreground tabular-nums leading-none">
                ~{Number.parseFloat(proposal.rate).toFixed(2).replace(".", ",")} €
              </p>
              <p className="text-[11px] text-muted-foreground mb-0.5">{intervalLabel}</p>
            </div>
          ) : (
            <p className="text-[13px] text-muted-foreground mt-1">Kein Angebot verfügbar</p>
          )}
        </div>

        
      </div>
      {/* CTA */}
        <a
          href={content.applyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-primary text-primary-foreground rounded-2xl px-5 py-4 flex items-center justify-center gap-2 text-[15px] font-semibold active:opacity-90 transition-opacity mt-1"
        >
          Antrag stellen
          <ExternalLink className="size-4" />
        </a>
      </div>
    </div>
  );
}