import { MainShell } from "@/components/layout/main-shell";
import { AppHeader } from "@/components/nav/app-header";
import { ProposalsScreen } from "@/components/proposals/proposals-screen";

export default function VertragsempfehlungenPage() {
  return (
    <MainShell>
      <AppHeader />
      <ProposalsScreen />
    </MainShell>
  );
}
