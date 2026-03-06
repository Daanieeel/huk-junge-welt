import { Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Shown when a proposal job has completed but the RAG had no data to work with.
 */
export function NoDataState() {
  return (
    <div className="flex flex-col gap-3">
      <div className="bg-card rounded-2xl px-5 py-5 ring-1 ring-foreground/8 flex items-start gap-3.5">
        <div className="size-9 rounded-xl bg-muted flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles className="size-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-foreground leading-snug">
            Noch keine Empfehlungen verfügbar
          </p>
          <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">
            Unsere KI hat aktuell nicht genug Informationen, um passende
            Empfehlungen für dich zu erstellen. Sobald neue Tarife verfügbar
            sind, kannst du es erneut versuchen.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="mt-3"
            render={<Link href="/profil" />}
            nativeButton={false}
          >
            <Sparkles className="size-3.5" />
            Neu generieren
          </Button>
        </div>
      </div>
    </div>
  );
}
