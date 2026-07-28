import { Smartphone } from "lucide-react";

// Ilustración decorativa del lado derecho del Hero (solo desktop). No hay
// asset de diseño disponible (sin foto de herramientas sobre plano ni el
// mockup de teléfono del diseño original) — esta es una aproximación
// construida con los tokens de marca existentes: un marco de teléfono con
// una vista simplificada de la propia Home adentro, sobre la textura
// `blueprint-bg` ya usada en el Hero, con la píldora "Úsala desde tu
// celular o computador" superpuesta, igual que en la referencia.
export function HeroIllustration() {
  return (
    <div className="relative hidden lg:flex items-center justify-center w-full h-full min-h-[420px]">
      <div className="blueprint-bg absolute inset-0 rounded-3xl opacity-60 [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,black,transparent)]" />

      {/* Marco del teléfono */}
      <div className="relative w-[220px] rounded-[2rem] bg-white border-[6px] border-ink shadow-xl p-3 -rotate-2">
        <div className="rounded-2xl bg-concrete overflow-hidden">
          <div className="px-3 py-2.5 bg-safety flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-md bg-white/20" />
            <div className="h-2 w-14 rounded-full bg-white/30" />
          </div>
          <div className="p-3 grid gap-2">
            <div className="h-8 rounded-lg bg-white border border-border" />
            <div className="grid grid-cols-4 gap-1.5">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="aspect-square rounded-lg bg-white border border-border" />
              ))}
            </div>
            <div className="grid gap-1.5 mt-1">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-6 rounded-lg bg-white border border-border" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Píldora "Úsala desde tu celular o computador" */}
      <div className="absolute bottom-6 right-2 w-32 h-32 rounded-full bg-safety text-white flex flex-col items-center justify-center text-center p-4 shadow-lg">
        <Smartphone className="w-5 h-5 mb-1.5" />
        <p className="text-[11px] font-medium leading-tight">Úsala desde tu celular o computador</p>
      </div>
    </div>
  );
}
