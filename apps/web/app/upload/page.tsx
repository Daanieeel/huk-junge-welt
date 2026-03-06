import { MainShell } from "@/components/layout/main-shell";
import { AppHeader } from "@/components/nav/app-header";
import { UploadScreen } from "@/components/upload/upload-screen";

export default function UploadPage() {
  return (
    <MainShell>
      <AppHeader />
      <div className="px-5 pt-4 pb-5">
        <h2 className="text-[24px] font-bold text-foreground leading-tight mb-0.5">
          Vertrag hinzufügen
        </h2>
        <p className="text-[13px] text-muted-foreground">
          Trag deinen bestehenden Vertrag ein und wir vergleichen ihn mit unseren Angeboten.
        </p>
      </div>
      <UploadScreen />
    </MainShell>
  );
}
