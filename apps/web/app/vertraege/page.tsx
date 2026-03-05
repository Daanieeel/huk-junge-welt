import { FileText } from "lucide-react";
import { MainShell } from "@/components/layout/main-shell";

export default function VertraegePage() {
  return (
    <MainShell>
      <div className="px-5 pt-4 pb-6">
        <h2 className="text-[24px] font-bold text-foreground leading-tight mb-0.5">
          Meine Verträge
        </h2>
        <p className="text-[13px] text-muted-foreground">
          Alle deine Versicherungsverträge im Überblick.
        </p>
      </div>

      <div className="px-4 pb-10">
        <div className="flex flex-col items-center justify-center gap-3 bg-muted/50 rounded-2xl px-6 py-12 text-center">
          <FileText className="size-10 text-muted-foreground/40" strokeWidth={1.5} />
          <p className="text-[14px] font-medium text-foreground">Noch keine Verträge</p>
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            Füge deine Versicherungsverträge hinzu,
            <br />
            um sie hier zu verwalten.
          </p>
        </div>
      </div>
    </MainShell>
  );
}
