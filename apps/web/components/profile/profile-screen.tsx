"use client";

import { useRouter } from "next/navigation";
import { LogOut, RefreshCw, Sparkles, User } from "lucide-react";
import { toast } from "sonner";
import { signOut } from "@/lib/auth-client";
import { useBedarfscheckStore } from "@/lib/bedarfscheck-store";
import { useRegenerateProposals, useQuestionnaireQuery } from "@/lib/queries";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProfileScreenProps {
  user: { name: string | null; email: string };
}

export function ProfileScreen({ user }: ProfileScreenProps) {
  const router = useRouter();
  const { reset, prefillFromQuestionnaire } = useBedarfscheckStore();
  const regenerate = useRegenerateProposals();
  const { data: questionnaireData } = useQuestionnaireQuery();

  async function handleSignOut() {
    await signOut();
    router.push("/sign-in");
    router.refresh();
  }

  function handleResetBedarfscheck() {
    if (questionnaireData) {
      prefillFromQuestionnaire(questionnaireData);
    } else {
      reset();
    }
    router.push("/bedarfscheck");
  }

  return (
    <div className="pb-10">
      {/* User info */}
      <div className="px-5 pt-4 pb-5">
        <h2 className="text-[24px] font-bold text-foreground leading-tight mb-0.5">Profil</h2>
        <p className="text-[13px] text-muted-foreground">Einstellungen und Konto</p>
      </div>

      <div className="px-4 flex flex-col gap-4">
        {/* Account card */}
        <section className="flex flex-col gap-2">
          <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-muted-foreground mb-2 px-1">
            Konto
          </p>
          <div className="bg-card rounded-2xl ring-1 ring-foreground/8 divide-y divide-border">
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="size-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                <User className="size-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-foreground truncate">
                  {user.name ?? "–"}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
          </div>
          <Button
          onClick={handleSignOut}
          className="w-full"
          variant={'destructive'}
          size={'xl'}
        >
          <LogOut className="size-4 shrink-0" />
          <p>Abmelden</p>
        </Button>
        </section>

        {/* Appearance */}
        <section>
          <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-muted-foreground mb-2 px-1">
            Darstellung
          </p>
          <div className="bg-card rounded-2xl ring-1 ring-foreground/8 px-4 py-3.5">
            <p className="text-[13px] font-medium text-foreground mb-2.5">Farbschema</p>
            <ThemeSwitcher />
          </div>
        </section>

        {/* Settings */}
        <section className="flex flex-col gap-2">
          <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-muted-foreground mb-2 px-1">
            Einstellungen
          </p>
          <Button
            onClick={async () => {
              try {
                await regenerate.mutateAsync();
                toast("Empfehlungen werden neu generiert", {
                  description: "Wir analysieren dein Profil im Hintergrund.",
                });
                router.push("/");
              } catch (err) {
                toast.error("Fehler", {
                  description: err instanceof Error ? err.message : "Unbekannter Fehler",
                });
              }
            }}
            disabled={regenerate.isPending}
            className="w-full flex items-center justify-start h-auto gap-3 px-4 py-3.5"
            variant="outline"
          >
            <Sparkles
              className={cn('size-4 shrink-0', regenerate.isPending ? "animate-pulse" : "")}
            />
            <div>
              <p className="text-[13px] font-medium text-foreground">
                Empfehlungen neu generieren
              </p>
              <p className="text-[11px] flex text-muted-foreground mt-0.5">
                {regenerate.isPending ? "Wird gestartet…" : "KI-Analyse jetzt erneut starten"}
              </p>
            </div>
          </Button>
          <Button
            onClick={handleResetBedarfscheck}
            className="w-full flex items-center justify-start h-auto gap-3 px-4 py-3.5"
            variant="outline"
          >
            <RefreshCw className="size-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-[13px] font-medium text-foreground">Bedarfscheck zurücksetzen</p>
              <p className="text-[11px] flex text-muted-foreground mt-0.5">Fragebogen erneut ausfüllen</p>
            </div>
          </Button>
        </section>
      </div>
    </div>
  );
}
