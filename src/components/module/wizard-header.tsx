import { LogoMark } from "@/components/brand/logo-mark";

// Encabezado compartido del wizard de módulos — antes esto era un <p> con
// el nombre del módulo y, por separado, una barra de progreso continua
// (ver conversación 2026-07-30, rediseño de pasos con diagrama). Se
// mantiene fuera de QuestionGroupStep/QuestionStep porque también se
// muestra (sin la fila de progreso) en la pantalla de resultado, donde no
// hay un "paso" que contar.
export function WizardHeader({
  moduleName,
  step,
}: {
  moduleName: string;
  // Ausente en la pantalla de resultado — ahí no se muestra la fila de
  // "Paso X de Y" ni la barra segmentada, solo el nombre del módulo.
  step?: { index: number; total: number };
}) {
  return (
    <div className="mt-6 mb-8">
      <div className="flex items-start justify-between gap-4">
        <p className="font-mono text-xs uppercase tracking-wider text-safety">{moduleName}</p>
        <LogoMark className="w-6 h-[15px] text-safety flex-shrink-0" />
      </div>
      {step && (
        <>
          <p className="mt-3 font-mono text-xs text-ink-faint">
            Paso {step.index + 1} de {step.total}
          </p>
          {/* Segmentada (un tramo por paso) en vez de una barra continua —
              deja ver de un vistazo cuántos pasos faltan, no solo el %. */}
          <div className="mt-2 flex gap-1.5">
            {Array.from({ length: step.total }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i <= step.index ? "bg-safety" : "bg-border"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
