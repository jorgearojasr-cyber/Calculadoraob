// Design Spec v1.0 — Parte 3 (Flujo de calculadora/wizard), 2026-09-15,
// punto 6 del pedido. Reemplaza la barra segmentada continua (tramos
// finos, bg-safety/bg-border) por el indicador de dots + conector que
// pide el Spec: dot 24-26px, conector 2px, completado/actual en
// orange-600 con texto blanco, futuro con borde 2px ds-border y texto
// tertiary.
//
// Genérico a propósito (punto 6: "no hardcodear 4 pasos") — recibe
// `total` del wizard real (buildSteps().length en module-wizard.tsx),
// nunca un número fijo. Usado por WizardHeader, que también sigue
// mostrando "Paso X de Y" como complemento textual (permitido
// explícitamente por el pedido).
export function WizardStepper({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center" role="progressbar" aria-valuenow={current + 1} aria-valuemin={1} aria-valuemax={total}>
      {Array.from({ length: total }).map((_, i) => {
        const done = i <= current;
        return (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div
              className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-body text-[11px] font-bold transition-colors ${
                done ? "bg-ds-orange-600 text-white" : "border-2 border-ds-border text-ds-text-tertiary"
              }`}
            >
              {i + 1}
            </div>
            {i < total - 1 && (
              <div className={`flex-1 h-[2px] mx-1.5 rounded-full transition-colors ${i < current ? "bg-ds-orange-600" : "bg-ds-border"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
