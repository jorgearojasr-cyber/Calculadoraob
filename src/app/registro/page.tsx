"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { registerUserAction } from "./actions";

export default function RegistroPage() {
  return (
    <Suspense>
      <RegistroForm />
    </Suspense>
  );
}

function RegistroForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const result = await registerUserAction({ name, email, password });
    if (result.error) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    const signInResult = await signIn("credentials", { email, password, redirect: false });
    setIsLoading(false);

    if (signInResult?.error) {
      router.push("/login");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  };

  return (
    <div className="min-h-screen w-full bg-concrete text-ink font-body flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-2xl font-semibold tracking-tight mb-6 text-center">
          Crear cuenta
        </h1>

        <form onSubmit={handleSubmit} className="grid gap-3">
          <input
            type="text"
            required
            placeholder="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-xl px-4 py-3 text-sm bg-white border border-border outline-none focus:border-ink"
          />
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
            placeholder="Contraseña (mínimo 8 caracteres)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-xl px-4 py-3 text-sm bg-white border border-border outline-none focus:border-ink"
          />
          {error && <p className="text-sm text-safety">{error}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-full px-6 py-3 text-sm font-semibold text-white bg-blueprint disabled:opacity-50"
          >
            {isLoading ? "Creando cuenta…" : "Crear cuenta"}
          </button>
        </form>

        <p className="mt-6 text-sm text-ink-muted text-center">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-ink font-medium underline underline-offset-4">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
