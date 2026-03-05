"use client";

import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";

interface CompletionScreenProps {
  userName: string | null;
}

export function CompletionScreen({ userName }: CompletionScreenProps) {
  const firstName = userName?.split(" ")[0] ?? "dir";

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center gap-6">
      {/* Icon */}
      <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center">
        <CheckCircle2 className="size-10 text-primary" strokeWidth={1.5} />
      </div>

      {/* Text */}
      <div className="flex flex-col gap-2">
        <h2 className="text-[24px] font-bold text-foreground">
          Super, {firstName}! 🎉
        </h2>
        <p className="text-[14px] text-muted-foreground leading-relaxed max-w-[280px]">
          Wir haben dein Profil gespeichert und berechnen jetzt deine optimale
          Absicherung.
        </p>
      </div>

      {/* What happens next */}
      <div className="w-full bg-muted/50 rounded-2xl px-5 py-4 text-left flex flex-col gap-3">
        <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide">
          Was passiert jetzt?
        </p>
        {[
          "Wir analysieren dein Profil",
          "Du erhältst personalisierte Empfehlungen",
          "Dein Absicherungs-Score wird berechnet",
        ].map((text, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <div className="size-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-[10px] font-bold text-primary">{i + 1}</span>
            </div>
            <p className="text-[13px] text-foreground leading-snug">{text}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <Link
        href="/"
        className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-2xl py-4 text-[16px] font-semibold active:opacity-90 transition-opacity"
      >
        Zur Startseite
        <ArrowRight className="size-5" />
      </Link>
    </div>
  );
}
