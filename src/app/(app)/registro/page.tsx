"use client";

import { Suspense, useId, useState } from "react";
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
  const errorId = useId();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Lógica de registro SIN CAMBIOS (fase auth-design-system-v1,
  // 2026-09-16) — esta fase es visual + accesibilidad. Única excepción:
  // el link "Inicia sesión" más abajo ahora preserva callbackUrl (bug
  // real, ver comentario ahí) — el resto del flujo de creación de cuenta,
  // signIn y redirect queda idéntico.
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
    // Mismo centrado por alto real disponible que Login (ver ese archivo
    // para la justificación completa) — Registro seguía en min-h-[80vh],
    // una inconsistencia real entre ambas pantallas (punto 4 del pedido:
    // "evitar que Login y Registro parezcan diseñados en momentos
    // diferentes").
    <div className="flex min-h-[calc(100dvh-136px)] lg:min-h-[calc(100dvh-72px)] items-center justify-center px-6 py-6">
      <div className="w-full max-w-sm">
        <div className="bg-white border border-ds-border rounded-ds-card-lg shadow-ds-card-rest p-6 sm:p-8">
          <h1 className="font-display text-2xl font-extrabold tracking-tight mb-6 text-center text-ds-navy-900">
            Crear cuenta
          </h1>

          <form onSubmit={handleSubmit} className="grid gap-3" noValidate>
            <div>
              <label htmlFor={`${errorId}-name`} className="sr-only">
                Nombre
              </label>
              <input
                id={`${errorId}-name`}
                type="text"
                required
                placeholder="Nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={error ? "true" : undefined}
                aria-describedby={error ? `${errorId}-error` : undefined}
                className="w-full rounded-ds-input px-4 py-3 text-sm bg-white border border-ds-border text-ds-navy-900 placeholder:text-ds-text-tertiary outline-none focus:border-ds-orange-600 focus:ring-2 focus:ring-ds-orange-600/30 transition-colors"
              />
            </div>
            <div>
              <label htmlFor={`${errorId}-email`} className="sr-only">
                Email
              </label>
              <input
                id={`${errorId}-email`}
                type="email"
                required
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={error ? "true" : undefined}
                aria-describedby={error ? `${errorId}-error` : undefined}
                className="w-full rounded-ds-input px-4 py-3 text-sm bg-white border border-ds-border text-ds-navy-900 placeholder:text-ds-text-tertiary outline-none focus:border-ds-orange-600 focus:ring-2 focus:ring-ds-orange-600/30 transition-colors"
              />
            </div>
            <div>
              <label htmlFor={`${errorId}-password`} className="sr-only">
                Contraseña (mínimo 8 caracteres)
              </label>
              <input
                id={`${errorId}-password`}
                type="password"
                required
                placeholder="Contraseña (mínimo 8 caracteres)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={error ? "true" : undefined}
                aria-describedby={error ? `${errorId}-error` : undefined}
                className="w-full rounded-ds-input px-4 py-3 text-sm bg-white border border-ds-border text-ds-navy-900 placeholder:text-ds-text-tertiary outline-none focus:border-ds-orange-600 focus:ring-2 focus:ring-ds-orange-600/30 transition-colors"
              />
            </div>
            {error && (
              <p id={`${errorId}-error`} role="alert" className="text-sm text-danger font-medium">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-full px-6 py-3 text-sm font-semibold text-white bg-ds-orange-700 hover:bg-ds-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-orange-600 focus-visible:ring-offset-2"
            >
              {isLoading ? "Creando cuenta…" : "Crear cuenta"}
            </button>
          </form>

          <p className="mt-6 text-sm text-ds-text-secondary text-center">
            ¿Ya tienes cuenta?{" "}
            {/* Bug real corregido (2026-09-16) — antes apuntaba a "/login"
                sin callbackUrl: un usuario que llegaba a /registro desde
                una ruta protegida (ej. /regularizacion) y usaba este link
                en vez de registrarse, perdía el destino y terminaba en
                Inicio tras loguearse. Login ya preservaba este mismo
                parámetro en su link recíproco a /registro — se replica
                acá para simetría, sin tocar ninguna otra lógica. */}
            <Link
              href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              className="text-ds-navy-900 font-semibold underline underline-offset-4 hover:text-ds-orange-700 transition-colors"
            >
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
