import { MainShell } from "@/components/layout/main-shell";
import { HomeScreen } from "@/components/home/home-screen";
import { AppHeader } from "@/components/nav/app-header";

export default function HomePage() {
  return (
    <MainShell>
      <main><AppHeader />
      <HomeScreen /></main>
    </MainShell>
  );
}
