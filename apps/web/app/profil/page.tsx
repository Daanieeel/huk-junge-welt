import { MainShell } from "@/components/layout/main-shell";
import { AppHeader } from "@/components/nav/app-header";
import { requireServerSession } from "@/lib/auth";
import { ProfileScreen } from "@/components/profile/profile-screen";

export default async function ProfilPage() {
  const { user } = await requireServerSession();

  return (
    <MainShell>
      <AppHeader />
      <ProfileScreen user={{ name: user.name ?? null, email: user.email }} />
    </MainShell>
  );
}
