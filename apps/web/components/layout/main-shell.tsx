import { AppHeader } from "@/components/nav/app-header";
import { BottomNav } from "@/components/nav/bottom-nav";

export function MainShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-svh flex flex-col bg-background">
      <AppHeader />
      <main className="flex-1 overflow-y-auto min-h-0">{children}</main>
      <BottomNav />
    </div>
  );
}
