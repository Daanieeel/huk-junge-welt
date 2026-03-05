import { Headphones } from "lucide-react";
import { MainShell } from "@/components/layout/main-shell";

export default function ServicesPage() {
  return (
    <MainShell>
      <div className="px-5 pt-4 pb-6">
        <h2 className="text-[24px] font-bold text-foreground leading-tight mb-0.5">
          Services
        </h2>
        <p className="text-[13px] text-muted-foreground">
          Hilfe, Beratung und weitere Angebote.
        </p>
      </div>

      <div className="px-4 pb-10">
        <div className="flex flex-col items-center justify-center gap-3 bg-muted/50 rounded-2xl px-6 py-12 text-center">
          <Headphones className="size-10 text-muted-foreground/40" strokeWidth={1.5} />
          <p className="text-[14px] font-medium text-foreground">Bald verfügbar</p>
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            Hier findest du bald direkten Zugang
            <br />
            zu Beratung und HUK-Services.
          </p>
        </div>
      </div>
    </MainShell>
  );
}
