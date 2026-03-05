import { MainShell } from "@/components/layout/main-shell";
import { BedarfscheckScreen } from "@/components/bedarfscheck/bedarfscheck-screen";
import { requireServerSession } from "@/lib/auth";
import { AppHeader } from "@/components/nav/app-header";
import { getServerQuestionnaire } from "@/lib/server-api";

export default async function BedarfscheckPage() {
  const { user } = await requireServerSession();

  const existing = await getServerQuestionnaire();

  return (
    <MainShell>
      <AppHeader />
      <BedarfscheckScreen
        userName={user.name ?? null}
        hasExistingQuestionnaire={existing !== null}
      />
    </MainShell>
  );
}
