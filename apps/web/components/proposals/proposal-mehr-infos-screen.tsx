"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Play } from "lucide-react";
import { INSURANCE_CONTENT, slugToType } from "@/lib/insurance-content";

export function ProposalMehrInfosScreen({ slug }: { slug: string }) {
  const type = slugToType(slug);
  const content = INSURANCE_CONTENT[type];

  if (!content) {
    return (
      <div className="px-5 py-10 text-center">
        <p className="text-sm text-muted-foreground">Unbekannter Versicherungstyp.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-background">
      <div className="px-5 pt-4 pb-2">
        <Link
          href={`/vertragsempfehlungen/${slug}`}
          className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground mb-5"
        >
          <ArrowLeft className="size-4" />
          Zurück
        </Link>
        <h1 className="text-[22px] font-bold text-foreground leading-tight mb-5">
          {content.fullName}
        </h1>
      </div>

      <div className="px-4 pb-8 flex flex-col gap-4">
        {/* YouTube thumbnail → opens on YouTube */}
        {content.youtubeVideoId ? (
          <a
            href={`https://www.youtube.com/watch?v=${content.youtubeVideoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-card rounded-2xl overflow-hidden ring-1 ring-foreground/8 block"
          >
            <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
              <Image
                src={`https://img.youtube.com/vi/${content.youtubeVideoId}/hqdefault.jpg`}
                alt={content.youtubeCaption}
                fill
                className="object-cover"
              />
              {/* Play button overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="size-14 rounded-full bg-black/60 flex items-center justify-center">
                  <Play className="size-6 text-white fill-white ml-0.5" />
                </div>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground px-4 py-2.5">
              {content.youtubeCaption}
            </p>
          </a>
        ) : (
          <div className="bg-card rounded-2xl ring-1 ring-foreground/8 px-5 py-8 flex flex-col items-center justify-center gap-2">
            <div className="size-12 rounded-full bg-muted flex items-center justify-center">
              <Play className="size-5 text-muted-foreground fill-muted-foreground ml-0.5" />
            </div>
            <p className="text-[12px] text-muted-foreground text-center">{content.youtubeCaption}</p>
            <p className="text-[11px] text-muted-foreground/60 text-center">Video folgt in Kürze</p>
          </div>
        )}

        {/* Long description */}
        <div className="bg-card rounded-2xl px-5 py-4 ring-1 ring-foreground/8">
          {content.longDescription.split("\n\n").map((paragraph, i) => (
            <p
              key={i}
              className={`text-[13px] text-foreground leading-relaxed ${i > 0 ? "mt-3" : ""}`}
            >
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
