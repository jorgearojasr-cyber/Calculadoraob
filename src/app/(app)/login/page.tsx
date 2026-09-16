"use client";

import { Suspense, useId, useState } from "react";
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
  const errorId = useId();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Lógica de autenticación SIN CAMBIOS (fase auth-design-system-v1,
  // 2026-09-16) — esta fase es visual + accesibilidad, no toca callbackUrl,
  // signIn, ni el redirect posterior. Ver protected-routes.ts/middleware.ts
  // para la protección real, ya validada en la fase anterior.
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
    <div className="flex min-h-[calc(100dvh-136px)] lg:min-h-[calc(100dvh-72px)] items-center justify-center px-6 py-6">
      <div className="w-full max-w-sm">
        {/* Migración a ds-* (2026-09-16, punto 3 del pedido) — mismo
            lenguaje visual que las ActionCard del Home: contenedor blanco,
            borde ds-border, radio ds-card-lg, sombra ds-card-rest. Antes
            el formulario flotaba directamente sobre el fondo de página sin
            ningún contenedor propio — el card lo alinea con el resto del
            sistema (Home/nav) sin cambiar ningún contenido. */}
        <div className="bg-white border border-ds-border rounded-ds-card-lg shadow-ds-card-rest p-6 sm:p-8">
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-center text-ds-navy-900">
            Iniciar sesión
          </h1>
          <p className="font-body text-sm text-ds-text-secondary text-center mt-1.5 mb-6">
            Guarda tus proyectos, revisiones y cálculos en un solo lugar.
          </p>

          <button
            onClick={() => signIn("google", { callbackUrl })}
            className="w-full rounded-full px-6 py-3 text-sm font-semibold border border-ds-border flex items-center justify-center gap-2 bg-white text-ds-navy-900 hover:bg-ds-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-orange-600 focus-visible:ring-offset-2"
          >
            <LogIn className="w-4 h-4" aria-hidden="true" />
            Continuar con Google
          </button>

          <div className="flex items-center gap-3 my-6">
            <div className="h-px flex-1 bg-ds-border" />
            <span className="text-xs text-ds-text-tertiary">o con tu email</span>
            <div className="h-px flex-1 bg-ds-border" />
          </div>

          <form onSubmit={handleCredentialsLogin} className="grid gap-3" noValidate>
            {/* Accesibilidad (2026-09-16, punto 5/9 del pedido) — labels
                reales asociados (antes solo había placeholder, que
                desaparece al escribir y no es un sustituto válido de
                label). sr-only: mismo aspecto visual exacto que antes. */}
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
                Contraseña
              </label>
              <input
                id={`${errorId}-password`}
                type="password"
                required
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={error ? "true" : undefined}
                aria-describedby={error ? `${errorId}-error` : undefined}
                className="w-full rounded-ds-input px-4 py-3 text-sm bg-white border border-ds-border text-ds-navy-900 placeholder:text-ds-text-tertiary outline-none focus:border-ds-orange-600 focus:ring-2 focus:ring-ds-orange-600/30 transition-colors"
              />
            </div>
            {/* role="alert" (2026-09-16, punto 7/9 del pedido) — antes el
                error solo se comunicaba visualmente (text-danger); un
                lector de pantalla no se enteraba de que apareció. role="alert"
                lo anuncia automáticamente sin necesitar aria-live explícito.
                No se inventa un mensaje nuevo, es el mismo texto funcional
                de siempre. */}
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
              {isLoading ? "Ingresando…" : "Ingresar"}
            </button>
          </form>

          <p className="mt-6 text-sm text-ds-text-secondary text-center">
            ¿No tienes cuenta?{" "}
            <Link
              href={`/registro?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              className="text-ds-navy-900 font-semibold underline underline-offset-4 hover:text-ds-orange-700 transition-colors"
            >
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
