import { MainShell } from "@/components/layout/main-shell";
import { BedarfscheckScreen } from "@/components/bedarfscheck/bedarfscheck-screen";
import { requireServerSession } from "@/lib/auth";
import { AppHeader } from "@/components/nav/app-header";

export default async function BedarfscheckPage() {
  const { user } = await requireServerSession();

  return (
    <MainShell>
      <AppHeader />
      <BedarfscheckScreen userName={user.name ?? null} />
    </MainShell>
  );
}
