import { MainShell } from "@/components/layout/main-shell";
import { BedarfscheckScreen } from "@/components/bedarfscheck/bedarfscheck-screen";
import { requireServerSession } from "@/lib/auth";

export default async function BedarfscheckPage() {
  const { user } = await requireServerSession();

  return (
    <MainShell>
      <BedarfscheckScreen userName={user.name ?? null} />
    </MainShell>
  );
}
