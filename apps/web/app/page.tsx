import { headers } from "next/headers";
import Link from "next/link";
import { ArrowRight, ShieldAlert } from "lucide-react";
import { clientEnv } from "@repo/env/client";
import { Button } from "@/components/ui/button";
import { ScoreGauge } from "@/components/home/score-gauge";

// ─── Types ────────────────────────────────────────────────────────────────────

type CoverageStatus = "MISSING" | "WEAK" | "ADEQUATE" | "GOOD" | "EXCELLENT";
type InsuranceType =
  | "PRIVATHAFTPFLICHT"
  | "HAUSRAT"
  | "KFZ"
  | "BERUFSUNFAEHIGKEIT"
  | "ZAHNZUSATZ"
  | "PFLEGE"
  | "UNFALL"
  | "RECHTSSCHUTZ"
  | "KRANKENZUSATZ";

interface CoverageItem {
  id: string;
  type: InsuranceType;
  status: CoverageStatus;
  score: number;
  priority: number;
  notes: string | null;
}

interface HomeData {
  user: { name: string | null; email: string };
  score: number;
  coverageItems: CoverageItem[];
}

// ─── Data fetching ─────────────────────────────────────────────────────────────

async function getHomeData(): Promise<HomeData | null> {
  const cookieHeader = (await headers()).get("cookie") ?? "";
  try {
    const res = await fetch(`${clientEnv.NEXT_PUBLIC_REST_URL}/home`, {
      headers: { cookie: cookieHeader },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data as HomeData;
  } catch {
    return null;
  }
}

// ─── Display helpers ───────────────────────────────────────────────────────────

const INSURANCE_LABELS: Record<InsuranceType, string> = {
  PRIVATHAFTPFLICHT: "Privathaftpflicht",
  HAUSRAT: "Hausrat",
  KFZ: "Kfz-Versicherung",
  BERUFSUNFAEHIGKEIT: "Berufsunfähigkeit",
  ZAHNZUSATZ: "Zahnzusatz",
  PFLEGE: "Pflegeversicherung",
  UNFALL: "Unfallversicherung",
  RECHTSSCHUTZ: "Rechtsschutz",
  KRANKENZUSATZ: "Krankenzusatz",
};

const INSURANCE_EMOJIS: Record<InsuranceType, string> = {
  PRIVATHAFTPFLICHT: "🛡️",
  HAUSRAT: "🏠",
  KFZ: "🚗",
  BERUFSUNFAEHIGKEIT: "💼",
  ZAHNZUSATZ: "🦷",
  PFLEGE: "🏥",
  UNFALL: "⚠️",
  RECHTSSCHUTZ: "⚖️",
  KRANKENZUSATZ: "❤️‍🩹",
};

const STATUS_CONFIG: Record<
  CoverageStatus,
  { label: string; dotsFilled: number; badgeClass: string }
> = {
  MISSING: {
    label: "Fehlt",
    dotsFilled: 0,
    badgeClass: "bg-destructive/10 text-destructive",
  },
  WEAK: {
    label: "Schwach",
    dotsFilled: 1,
    badgeClass: "bg-primary/25 text-foreground",
  },
  ADEQUATE: {
    label: "Ordentlich",
    dotsFilled: 2,
    badgeClass: "bg-muted text-muted-foreground",
  },
  GOOD: {
    label: "Gut",
    dotsFilled: 3,
    badgeClass: "bg-primary/60 text-primary-foreground",
  },
  EXCELLENT: {
    label: "Sehr gut",
    dotsFilled: 4,
    badgeClass: "bg-primary text-primary-foreground",
  },
};

function getScoreInfo(score: number): { label: string; sublabel: string } {
  if (score >= 86)
    return { label: "Sehr gut geschützt", sublabel: "Hervorragende Absicherung – weiter so!" };
  if (score >= 71)
    return { label: "Gut geschützt", sublabel: "Du hast einen soliden Versicherungsschutz." };
  if (score >= 51)
    return { label: "Teilweise geschützt", sublabel: "Einige Lücken solltest du schließen." };
  if (score >= 31)
    return { label: "Verbesserungswürdig", sublabel: "Wichtige Versicherungen fehlen noch." };
  return { label: "Kaum geschützt", sublabel: "Starte jetzt deinen persönlichen Bedarfscheck." };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const data = await getHomeData();
  const score = data?.score ?? 0;
  const coverageItems = data?.coverageItems ?? [];
  const firstName = data?.user.name?.split(" ")[0] ?? "dort";

  const { label: scoreLabel, sublabel: scoreSubLabel } = getScoreInfo(score);
  const hasCriticalGap = coverageItems.some(
    (item) => item.status === "MISSING" && item.priority <= 2
  );

  return (
    <div className="flex flex-col min-h-svh bg-background">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 pt-5 pb-2">
        <div>
          <p className="text-[9px] font-semibold tracking-[0.2em] uppercase text-muted-foreground/60 leading-none mb-0.5">
            HUK
          </p>
          <p className="text-[18px] font-black tracking-tight text-foreground leading-none">
            JUNGE WELT
          </p>
        </div>
        <div className="text-right">
          <p className="text-[13px] font-semibold text-foreground">Hallo, {firstName}!</p>
          <p className="text-[11px] text-muted-foreground">Dein Überblick</p>
        </div>
      </div>

      {/* ── Score section ── */}
      <div className="px-5 pt-3">
        <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-muted-foreground text-center mb-1">
          Versicherungsschutz
        </p>

        <ScoreGauge score={score} />

        {/* Text pulled up to overlap the empty half of the gauge square */}
        <div className="text-center -mt-24 mb-5">
          <p className="text-[15px] font-bold text-foreground">{scoreLabel}</p>
          {hasCriticalGap ? (
            <p className="text-[12px] text-destructive mt-1 flex items-center justify-center gap-1">
              <ShieldAlert className="size-3 shrink-0" />
              Kritische Lücken erkannt
            </p>
          ) : (
            <p className="text-[12px] text-muted-foreground mt-1">{scoreSubLabel}</p>
          )}
        </div>

        {/* ── CTA ── */}
        <Button size="cta" render={<Link href="/bedarfscheck" />} nativeButton={false}>
          <span>Bedarfscheck starten</span>
          <ArrowRight />
        </Button>
        <p className="text-[11px] text-muted-foreground text-center mt-2.5 mb-6">
          Persönliche Analyse in 5 Minuten
        </p>
      </div>

      {/* ── Coverage list ── */}
      <div className="flex-1 bg-muted/50 px-4 pt-4 pb-10">
        <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-muted-foreground mb-3 px-1">
          Dein Überblick
        </p>

        {coverageItems.length === 0 ? (
          <div className="bg-card rounded-2xl px-5 py-6 ring-1 ring-foreground/8 text-center">
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              Noch keine Analyse vorhanden.
              <br />
              Starte den Bedarfscheck für deine persönliche Einschätzung.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {coverageItems.map((item) => {
              const config = STATUS_CONFIG[item.status];
              const emoji = INSURANCE_EMOJIS[item.type];
              const label = INSURANCE_LABELS[item.type];
              const isCritical = item.status === "MISSING" && item.priority <= 2;

              return (
                <div
                  key={item.id}
                  className={`bg-card rounded-2xl px-4 py-3.5 ring-1 flex items-center justify-between ${
                    isCritical ? "ring-destructive/30" : "ring-foreground/8"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[20px] leading-none">{emoji}</span>
                    <span className="text-[13px] font-medium text-foreground">{label}</span>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    {/* Dot indicators */}
                    <div className="flex gap-[3px] items-center">
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`size-[5px] rounded-full ${
                            i < config.dotsFilled
                              ? "bg-foreground/65"
                              : "bg-foreground/15"
                          }`}
                        />
                      ))}
                    </div>

                    {/* Status badge */}
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full whitespace-nowrap ${config.badgeClass}`}
                    >
                      {config.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
