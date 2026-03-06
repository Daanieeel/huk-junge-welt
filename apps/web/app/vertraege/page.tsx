import { MainShell } from "@/components/layout/main-shell";
import { AppHeader } from "@/components/nav/app-header";
import { VertraegeScreen } from "@/components/vertraege/vertraege-screen";

export default function VertraegePage() {
  return (
    <MainShell>
      <AppHeader />
      <div className="px-5 pt-4 pb-5">
        <h2 className="text-[24px] font-bold text-foreground leading-tight mb-0.5">
          Meine Verträge
        </h2>
        <p className="text-[13px] text-muted-foreground">
          Deine bestehenden Versicherungen im Überblick.
        </p>
      </div>
      <VertraegeScreen />
    </MainShell>
  );
}
