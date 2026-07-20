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
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-2xl font-semibold tracking-tight mb-6 text-center">
          Iniciar sesión
        </h1>

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
          {error && <p className="text-sm text-safety">{error}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-full px-6 py-3 text-sm font-semibold text-white bg-safety disabled:opacity-50"
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
