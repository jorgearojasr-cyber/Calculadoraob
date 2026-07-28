import { TriangleAlert, Lock } from "lucide-react";

// Nivel 4 de disclaimer (dirección visual 2026-07-28): tratamiento especial
// SOLO para los módulos de Gas con checkbox obligatorio existente (Cañería
// de gas visible, Instalar un calefón a gas) — más severo que el aviso
// reforzado normal. NO generalizar a otros módulos con reinforcedWarning.
// Se renderiza junto al checkbox de confirmación SEC (ver QuestionStep):
// en vez de ocultar el resultado hasta confirmar, muestra su forma como
// esqueleto/placeholder bloqueado, para comunicar "hay algo esperando acá"
// sin revelar valores antes de la confirmación.
export function GasConfirmationGate() {
  return (
    <div className="mb-6 rounded-2xl overflow-hidden border-2 border-danger">
      <div
        className="relative px-5 py-4 bg-danger text-white"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, rgba(255,255,255,0.09) 0 10px, transparent 10px 20px)",
        }}
      >
        <div className="flex items-start gap-2.5">
          <TriangleAlert className="w-6 h-6 flex-shrink-0 mt-0.5" strokeWidth={2.75} />
          <div>
            {/* TODO: titular pendiente de confirmación del dueño de producto (tono/alcance legal) */}
            <p className="font-display font-semibold text-[17px] leading-snug">
              Instalación de gas: riesgo real si no la hace un profesional certificado
            </p>
            <p className="text-sm text-white/85 mt-1">
              El resultado queda bloqueado hasta que confirmes abajo.
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 bg-white">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-3.5 h-3.5 text-ink-faint" />
          <span className="text-[11px] font-mono uppercase tracking-wider text-ink-faint">Bloqueado</span>
        </div>
        <div className="grid gap-3" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-xl p-4 bg-concrete animate-pulse">
              <div className="flex items-center justify-between">
                <div className="h-3 w-28 rounded bg-ink-faint/25" />
                <div className="h-4 w-16 rounded bg-ink-faint/25" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
