"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Logo } from "@/components/ui/logo";

const ROLE_REDIRECT: Record<string, string> = {
  admin: "/admin",
  waiter: "/mozo",
  kitchen: "/cocina",
  stock: "/stock",
};

function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError("Email o contraseña incorrectos.");
      return;
    }

    router.push(ROLE_REDIRECT[data.role] ?? "/");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f8f4ef] px-4 py-10">
      <div
        aria-hidden
        className="absolute -left-28 -top-32 h-80 w-80 rounded-full bg-red-200/45 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-amber-100/70 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/30 via-primary to-primary/30"
      />

      <Card className="relative w-full max-w-md rounded-[1.75rem] border-white/80 bg-white/90 shadow-[0_24px_80px_-32px_rgba(49,34,24,0.35)] backdrop-blur">
        <CardHeader className="items-center px-6 pb-4 pt-8 text-center sm:px-9">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-primary">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <Logo className="text-4xl" />
          <p className="mt-2 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-primary">
            Control de stock
          </p>
        </CardHeader>
        <CardContent className="px-6 pb-8 sm:px-9">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nombre@ejemplo.com"
                className="rounded-xl bg-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-xl bg-white pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            {error && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </p>
            )}
            <Button type="submit" className="h-12 w-full rounded-xl" disabled={loading}>
              {loading ? "Ingresando..." : "Ingresar"}
            </Button>
          </form>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Acceso seguro para el equipo de La Cuadra
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return <LoginForm />;
}
