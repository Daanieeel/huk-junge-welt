"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { signUp } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

const HUK_LOGO =
  "https://static.c.huk24.de/content/dam/huk24/web/allgemein/%C3%BCber-uns/HUK_Logo_gelb_nachtblau_RGB_800x800px.png";

const SMALL_TILES = [
  { category: "Hausrat", name: "Inventar & Wertsachen", emoji: "🏠" },
  { category: "Privat", name: "Familie & Haftpflicht", emoji: "🛡️" },
  { category: "Berufsunfähigkeit", name: "Versicherung", emoji: "💼" },
  { category: "Zahnzusatz", name: "Dental Plus", emoji: "🦷" },
];

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: authError } = await signUp.email({ name, email, password });
    setLoading(false);
    if (authError) {
      setError(authError.message ?? "Registrierung fehlgeschlagen.");
      return;
    }
    router.push("/");
  }

  return (
    <div
      className="h-svh flex flex-col overflow-hidden bg-background"
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      {/* ── Mosaic hero ── */}
      <div className="bg-muted select-none shrink-0 flex flex-col" style={{ height: "42svh" }}>
        {/* Logo + app name strip */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-2.5 shrink-0">
          <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white shadow-md shrink-0">
            <Image src={HUK_LOGO} alt="HUK Logo" width={48} height={48} className="object-cover w-full h-full" />
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-[9px] font-semibold tracking-[0.2em] uppercase text-muted-foreground/60 leading-none mb-0.5">
              HUK
            </span>
            <span className="text-[20px] font-black tracking-tight text-foreground leading-none">
              JUNGE WELT
            </span>
          </div>
        </div>

        {/* Tiles */}
        <div className="flex-1 flex gap-2 px-2.5 pb-2.5">
          {/* Left — tall tile */}
          <div className="w-[45%] rounded-2xl overflow-hidden relative bg-primary shadow-sm">
            <div
              className="absolute inset-0 flex items-center justify-center opacity-70"
              style={{ fontSize: 68 }}
            >
              🛵
            </div>
            <div
              className="absolute bottom-0 left-0 right-0 p-2.5"
              style={{ background: "linear-gradient(to top, rgba(0,0,0,0.28) 0%, transparent 100%)" }}
            >
              <p className="text-[9px] font-medium text-primary-foreground/60 mb-0.5">Auto/Kfz/E-Roller</p>
              <p className="text-[12px] font-bold text-primary-foreground leading-tight">
                Mobilitäts-<br />Schutz
              </p>
            </div>
          </div>

          {/* Right — 2×2 grid */}
          <div className="flex-1 grid grid-cols-2 gap-2">
            {SMALL_TILES.map((tile, i) => (
              <div
                key={tile.category}
                className="rounded-xl overflow-hidden flex flex-col p-2 shadow-sm"
                style={{
                  background: `color-mix(in oklch, var(--primary) ${100 - i * 6}%, var(--muted))`,
                }}
              >
                <p className="text-[8px] font-semibold leading-tight text-primary-foreground/50">
                  {tile.category}
                </p>
                <div className="flex-1 flex items-center justify-center" style={{ fontSize: 22 }}>
                  {tile.emoji}
                </div>
                <p className="text-[8px] font-bold leading-tight text-primary-foreground/80">
                  {tile.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Form ── */}
      <div className="flex-1 bg-background px-6 pt-5 pb-7 flex flex-col overflow-hidden">
        <div className="mb-4">
          <h1 className="text-[22px] font-bold text-foreground leading-tight">Konto erstellen</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Starte jetzt und entdecke deine Versicherungsoptionen.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name" className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
              Vollständiger Name
            </Label>
            <Input
              id="name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Max Mustermann"
              className="h-10"
            />
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email" className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
              E-Mail Adresse
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="deine@email.de"
              className="h-10"
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password" className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
              Passwort
            </Label>
            <InputGroup className="h-10">
              <InputGroupInput
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mindestens 8 Zeichen"
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton size="icon-sm" onClick={() => setShowPassword((v) => !v)}>
                  {showPassword ? <EyeOff /> : <Eye />}
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" size="cta" disabled={loading} className="mt-1">
            {loading ? "Einen Moment…" : <><span>Konto erstellen</span><ArrowRight /></>}
          </Button>
        </form>

        <p className="mt-auto text-sm text-muted-foreground text-center">
          Bereits registriert?{" "}
          <Link href="/sign-in" className="font-semibold text-foreground underline underline-offset-4">
            Anmelden
          </Link>
        </p>
      </div>
    </div>
  );
}
