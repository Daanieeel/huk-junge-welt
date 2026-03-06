"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, LoaderCircle } from "lucide-react";
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
import { AppHeader } from "@/components/nav/app-header";

const BUBBLES = [
  { emoji: "🚗", top: "18%", left: "6%",  size: "52px", delay: "0ms",   dur: "2.8s" },
  { emoji: "✈️", top: "12%", left: "68%", size: "44px", delay: "400ms", dur: "3.2s" },
  { emoji: "🏠", top: "52%", left: "4%",  size: "48px", delay: "700ms", dur: "2.5s" },
  { emoji: "🦷", top: "60%", left: "72%", size: "44px", delay: "200ms", dur: "3.0s" },
  { emoji: "💼", top: "30%", left: "78%", size: "40px", delay: "900ms", dur: "2.7s" },
  { emoji: "🛵", top: "72%", left: "30%", size: "42px", delay: "500ms", dur: "3.4s" },
  { emoji: "👨‍👩‍👧", top: "20%", left: "38%", size: "38px", delay: "1100ms", dur: "2.6s" },
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
      {/* ── Hero ── */}
      <div
        className="select-none shrink-0 relative overflow-hidden"
        style={{ height: "42svh", background: "linear-gradient(135deg, var(--primary) 0%, color-mix(in oklch, var(--primary) 70%, #000) 100%)" }}
      >
        {/* Decorative blobs */}
        <div className="absolute -top-16 -right-16 size-56 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-20 -left-20 size-64 rounded-full bg-black/20 blur-2xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-48 rounded-full bg-white/5 blur-xl" />

        <AppHeader />

        {/* Central shield */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative flex items-center justify-center">
            <div className="absolute size-28 rounded-full bg-white/10 blur-lg" />
            <span style={{ fontSize: 72, filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.3))" }}>🛡️</span>
          </div>
        </div>

        {/* Floating emoji bubbles */}
        {BUBBLES.map((b) => (
          <div
            key={b.emoji}
            className="absolute flex items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm animate-bounce"
            style={{
              top: b.top,
              left: b.left,
              width: b.size,
              height: b.size,
              fontSize: `calc(${b.size} * 0.52)`,
              animationDelay: b.delay,
              animationDuration: b.dur,
            }}
          >
            {b.emoji}
          </div>
        ))}
      </div>

      {/* ── Form ── */}
      <div className="flex-1 bg-background px-6 pt-5 pb-7 flex flex-col overflow-hidden">
        <div className="mb-4">
          <h1 className="text-[22px] font-bold text-foreground leading-tight">Konto erstellen</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Starte jetzt und entdecke deine Versicherungsoptionen.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="name"
              className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground"
            >
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
            <Label
              htmlFor="email"
              className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground"
            >
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
            <Label
              htmlFor="password"
              className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground"
            >
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
            {loading ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <>
                <span>Konto erstellen</span>
                <ArrowRight />
              </>
            )}
          </Button>
        </form>

        <p className="mt-auto text-sm text-muted-foreground text-center">
          Bereits registriert?{" "}
          <Link
            href="/sign-in"
            className="font-semibold text-foreground underline underline-offset-4"
          >
            Anmelden
          </Link>
        </p>
      </div>
    </div>
  );
}
        