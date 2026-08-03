import { formatQuantity } from "@/lib/format-number";
import { pluralizeUnit } from "@/lib/pluralize";
import type { CalculationResult, InfoResult } from "@/lib/formula-engine";

const currencyFormatter = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 });

// Tarjeta protagonista del resultado — nuevo estándar de UX (spec
// "ObraBien Calculadora - Flujo rediseñado", 2026-08-01): "el resultado
// debe mostrar como protagonista el dato más importante" (ej. "9 bolsas
// de cemento"), con el total aproximado al lado.
//
// Genérico para cualquier módulo, no solo Radier: el "dato más
// importante" es el mismo primer resultado no-secundario que
// PricedResults ya destacaba a 40-44px (mismo criterio, ver comentario
// en priced-results.tsx — "único elemento de esa escala en toda la
// pantalla"), ahora en su propia tarjeta en vez de la primera fila de la
// lista. Si el módulo no tiene un resultado con materialName (ej. un
// módulo que solo da un total en dinero o una cantidad sin material),
// este componente no se renderiza — ver `heroResult` en result-screen.tsx.
export function ResultHero({
  moduleName,
  result,
  otherMaterialNames,
  primaryInfo,
  total,
}: {
  moduleName: string;
  result: CalculationResult;
  // Nombres de los demás materiales del cálculo (sin el protagonista) —
  // arma "Más arena, gravilla y agua" genéricamente, sin hardcodear nada
  // de Radier.
  otherMaterialNames: string[];
  // Primer infoResult del módulo (ej. "Tipo de hormigón recomendado: G17-N"
  // en Radier) — si el módulo no tiene ninguno, se omite sin más.
  primaryInfo: InfoResult | null;
  total: number | null;
}) {
  const otherMaterialsText =
    otherMaterialNames.length > 0
      ? `Más ${otherMaterialNames.slice(0, -1).join(", ")}${otherMaterialNames.length > 1 ? " y " : ""}${otherMaterialNames.slice(-1)}.`
      : null;

  return (
    <div className="rounded-2xl p-6 mb-3 bg-navy text-white">
      <p className="font-mono text-xs uppercase tracking-wider text-white/60 mb-3">Tu {moduleName}</p>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-display text-[44px] sm:text-[52px] font-extrabold leading-none">
            {formatQuantity(result.value)}
          </p>
          <p className="mt-1 text-lg font-medium text-white/90">
            {pluralizeUnit(result.value, result.unit)} de {(result.materialName ?? result.label).toLowerCase()}
          </p>
          {(otherMaterialsText || primaryInfo) && (
            <p className="mt-2 text-sm text-white/60 max-w-md">
              {otherMaterialsText}
              {otherMaterialsText && primaryInfo && " "}
              {primaryInfo && (
                <>
                  {primaryInfo.label}: <span className="text-white/80">{String(primaryInfo.value)}</span>
                </>
              )}
            </p>
          )}
        </div>
        {total !== null && (
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-white/60">Total aproximado</p>
            <p className="font-display text-xl font-bold whitespace-nowrap">${currencyFormatter.format(total)}</p>
          </div>
        )}
      </div>
    </div>
  );
}
