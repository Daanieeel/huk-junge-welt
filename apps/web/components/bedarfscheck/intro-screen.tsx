"use client";

import { ArrowRight, UserRound, Briefcase, Car, Users, Target } from "lucide-react";

const STEPS = [
  { icon: UserRound, label: "Persönliche Daten" },
  { icon: Briefcase, label: "Beruf & Gehalt" },
  { icon: Car, label: "Mobilität" },
  { icon: Users, label: "Familienstand" },
  { icon: Target, label: "Dein Absicherungsziel" },
];

interface IntroScreenProps {
  userName: string | null;
  onStart: () => void;
}

export function IntroScreen({ userName, onStart }: IntroScreenProps) {
  const firstName = userName?.split(" ")[0] ?? "dort";

  return (
    <div className="flex flex-col">
      <div className="px-5 pt-6 pb-4">
        {/* Greeting */}
        <p className="text-[15px] text-muted-foreground mb-0.5">Hi {firstName} 👋</p>
        <h2 className="text-[22px] font-bold text-foreground leading-snug mb-6">
          Darf ich dir ein paar Fragen stellen, um dich besser kennenzulernen?
        </h2>

        {/* Step checklist */}
        <div className="flex flex-col gap-2">
          {STEPS.map(({ icon: Icon, label }, index) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-2xl px-4 py-3 bg-muted/50 border border-border/50"
            >
              <div className="size-8 rounded-xl flex items-center justify-center shrink-0 bg-muted">
                <Icon
                  className="size-4 text-muted-foreground"
                  strokeWidth={1.75}
                />
              </div>
              <span className="text-[13px] font-medium text-foreground">
                {index + 1}. {label}
              </span>
            </div>
          ))}
        </div>

        <p className="text-[12px] text-muted-foreground mt-4 leading-relaxed text-center">
          Dauert ca. 3 Minuten · Deine Daten sind sicher
        </p>
      </div>

      {/* CTA */}
      <div className="px-5 pb-6 pt-3">
        <button
          type="button"
          onClick={onStart}
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-2xl py-4 text-[16px] font-semibold active:opacity-90 transition-opacity cursor-pointer"
        >
          Los geht's
          <ArrowRight className="size-5" />
        </button>
      </div>
    </div>
  );
}
