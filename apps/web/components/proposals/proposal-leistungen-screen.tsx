"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { INSURANCE_CONTENT, slugToType } from "@/lib/insurance-content";

export function ProposalLeistungenScreen({ slug }: { slug: string }) {
  const type = slugToType(slug);
  const content = INSURANCE_CONTENT[type];

  if (!content) {
    return (
      <div className="px-5 py-10 text-center">
        <p className="text-sm text-muted-foreground">Unbekannter Versicherungstyp.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-background">
      <div className="px-5 pt-4 pb-2">
        <Link
          href={`/vertragsempfehlungen/${slug}`}
          className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground mb-5"
        >
          <ArrowLeft className="size-4" />
          Zurück
        </Link>
        <h1 className="text-[22px] font-bold text-foreground leading-tight mb-1">
          Leistungsübersicht
        </h1>
        <p className="text-[13px] text-muted-foreground mb-5">{content.fullName}</p>
      </div>

      <div className="px-4 pb-8 flex flex-col gap-3">
        {/* Covered */}
        <div className="bg-card rounded-2xl px-5 py-4 ring-1 ring-foreground/8">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Das ist abgedeckt
          </p>
          <ul className="flex flex-col gap-2.5">
            {content.allCoveredCases.map((c) => (
              <li key={c} className="flex items-start gap-2.5">
                <CheckCircle2 className="size-4 text-success shrink-0 mt-0.5" />
                <span className="text-[13px] text-foreground leading-snug">{c}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Not covered */}
        <div className="bg-card rounded-2xl px-5 py-4 ring-1 ring-foreground/8">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Das ist nicht abgedeckt
          </p>
          <ul className="flex flex-col gap-2.5">
            {content.notCoveredCases.map((c) => (
              <li key={c} className="flex items-start gap-2.5">
                <XCircle className="size-4 text-destructive shrink-0 mt-0.5" />
                <span className="text-[13px] text-muted-foreground leading-snug">{c}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
