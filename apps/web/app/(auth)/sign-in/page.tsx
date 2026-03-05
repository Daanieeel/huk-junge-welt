"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, LoaderCircle } from "lucide-react";
import Image from "next/image";
import { signIn } from "@/lib/auth-client";
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

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: authError } = await signIn.email({ email, password });
    setLoading(false);
    if (authError) {
      setError(authError.message ?? "Anmeldung fehlgeschlagen.");
      return;
    }
    router.push(searchParams.get("redirect") ?? "/");
  }

  return (
    <div
      className="h-svh flex flex-col overflow-hidden bg-background"
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      {/* ── Amber hero ── */}
      <div
        className="bg-primary relative shrink-0 flex flex-col justify-between px-6 pt-8 pb-8 gap-12"
      >

        {/* Logo + app name */}
        <div className="flex items-center py-4 w-full justify-center">
           <Image src={HUK_LOGO} alt="HUK Logo" width={56} height={56} className="object-cover" />
          <span className="text-sm font-black tracking-tight text-primary-foreground leading-none">
              JUNGE WELT
            </span>
        </div>

        {/* Page heading */}
        <div className="relative">
          <h1 className="text-[26px] font-bold text-primary-foreground leading-tight">
            Willkommen zurück
          </h1>
          <p className="text-sm text-primary-foreground/60 mt-1 leading-snug">
            Melde dich an, um deine Versicherungen zu verwalten.
          </p>
        </div>
      </div>

      {/* ── Form ── */}
      <div className="flex-1 bg-background px-6 pt-6 pb-8 flex flex-col overflow-hidden">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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
            {loading ? <LoaderCircle className="animate-spin" /> : <><span>Anmelden</span><ArrowRight /></>}
          </Button>
        </form>

        <p className="mt-auto text-sm text-muted-foreground text-center">
          Noch kein Konto?{" "}
          <Link href="/sign-up" className="font-semibold text-foreground underline underline-offset-4">
            Jetzt registrieren
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
