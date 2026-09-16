"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { LogIn } from "lucide-react";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setIsLoading(false);

    if (result?.error) {
      setError("Email o contraseña incorrectos.");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  };

  return (
    // Última pasada de ajustes (2026-09-16, punto 2) — dos intentos
    // previos: min-h-[80vh] y luego min-h-[70vh], ambos centrando contra
    // un % arbitrario del alto TOTAL del viewport, sin descontar el
    // header fijo (56px mobile / 72px lg) ni el bottom-nav fijo (80px
    // mobile, ya reservados como padding por MainContent). Un padding fijo
    // (probado en la iteración intermedia) tampoco resultó: al no centrar,
    // todo el espacio sobrante caía abajo (268px en 390×844), peor que
    // antes. La solución: centrar contra el alto REAL disponible —
    // 100dvh menos exactamente el header+bottom-nav que MainContent ya
    // reserva como padding — así el espacio arriba/abajo del formulario
    // queda proporcional en cualquier alto de viewport, sin usar un
    // porcentaje mágico. `dvh` (no `vh`) para que el teclado móvil
    // (viewport visual más chico) no dispare un min-height mayor al
    // espacio real disponible.
    <div className="flex min-h-[calc(100dvh-136px)] lg:min-h-[calc(100dvh-72px)] items-center justify-center px-6 py-6">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-center">
          Iniciar sesión
        </h1>
        <p className="font-body text-sm text-ink-muted text-center mt-1.5 mb-6">
          Guarda tus proyectos, revisiones y cálculos en un solo lugar.
        </p>

        <button
          onClick={() => signIn("google", { callbackUrl })}
          className="w-full rounded-full px-6 py-3 text-sm font-semibold border border-ink flex items-center justify-center gap-2 bg-white"
        >
          <LogIn className="w-4 h-4" />
          Continuar con Google
        </button>

        <div className="flex items-center gap-3 my-6">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-ink-muted">o con tu email</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleCredentialsLogin} className="grid gap-3">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-xl px-4 py-3 text-sm bg-white border border-border outline-none focus:border-ink"
          />
          <input
            type="password"
            required
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-xl px-4 py-3 text-sm bg-white border border-border outline-none focus:border-ink"
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-full px-6 py-3 text-sm font-semibold text-white bg-action disabled:opacity-50"
          >
            {isLoading ? "Ingresando…" : "Ingresar"}
          </button>
        </form>

        <p className="mt-6 text-sm text-ink-muted text-center">
          ¿No tienes cuenta?{" "}
          <Link
            href={`/registro?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            className="text-ink font-medium underline underline-offset-4"
          >
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
}
