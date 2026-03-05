"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Home, Plus, Sparkles, User } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/vertraege", icon: FileText, label: "Verträge" },
  { href: "/upload", icon: null, label: "" }, // centre action
  { href: "/vertragsempfehlungen", icon: Sparkles, label: "Empfehlungen" },
  { href: "/profil", icon: User, label: "Profil" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="shrink-0 bg-background border-t border-border">
      <div className="flex items-end justify-around px-1 h-[62px]">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          // Centre "+" action button
          if (!Icon) {
            return (
              <div key={href} className="flex flex-col items-center -translate-y-4">
                <Link
                  href={href}
                  className="flex items-center justify-center w-14 h-14 rounded-full bg-primary shadow-lg active:scale-95 transition-transform"
                >
                  <Plus className="size-6 text-primary-foreground" strokeWidth={2.5} />
                </Link>
              </div>
            );
          }

          const isActive = href === "/" ? pathname === href : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 py-2.5 px-3 transition-colors ${
                isActive ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              <Icon
                className={`size-[22px] transition-all ${isActive ? "stroke-[2.2px]" : "stroke-[1.6px]"}`}
              />
              <span className={`text-[10px] leading-none ${isActive ? "font-semibold" : "font-normal"}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
