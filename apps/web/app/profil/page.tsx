import { User } from "lucide-react";
import { MainShell } from "@/components/layout/main-shell";
import { AppHeader } from "@/components/nav/app-header";

export default function ProfilPage() {
  return (
    <MainShell>
      <AppHeader />
      <div className="px-5 pt-4 pb-6">
        <h2 className="text-[24px] font-bold text-foreground leading-tight mb-0.5">
          Profil
        </h2>
        <p className="text-[13px] text-muted-foreground">
          Deine persönlichen Daten und Einstellungen.
        </p>
      </div>

      <div className="px-4 pb-10">
        <div className="flex flex-col items-center justify-center gap-3 bg-muted/50 rounded-2xl px-6 py-12 text-center">
          <User className="size-10 text-muted-foreground/40" strokeWidth={1.5} />
          <p className="text-[14px] font-medium text-foreground">Bald verfügbar</p>
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            Hier kannst du bald dein Profil
            <br />
            und deine Einstellungen verwalten.
          </p>
        </div>
      </div>
    </MainShell>
  );
}
