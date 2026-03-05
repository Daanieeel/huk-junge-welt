import { Upload } from "lucide-react";
import { MainShell } from "@/components/layout/main-shell";
import { AppHeader } from "@/components/nav/app-header";

export default function UploadPage() {
  return (
    <MainShell>
      <AppHeader />
      <div className="px-5 pt-4 pb-6">
        <h2 className="text-[24px] font-bold text-foreground leading-tight mb-0.5">
          Dokument hochladen
        </h2>
        <p className="text-[13px] text-muted-foreground">
          Lade Versicherungsdokumente hoch, um sie zu verwalten.
        </p>
      </div>

      <div className="px-4 pb-10">
        <div className="flex flex-col items-center justify-center gap-3 bg-muted/50 rounded-2xl px-6 py-12 text-center border-2 border-dashed border-border">
          <Upload className="size-10 text-muted-foreground/40" strokeWidth={1.5} />
          <p className="text-[14px] font-medium text-foreground">Bald verfügbar</p>
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            Lade PDFs oder Fotos deiner Verträge hoch
            <br />
            und lass sie automatisch analysieren.
          </p>
        </div>
      </div>
    </MainShell>
  );
}
