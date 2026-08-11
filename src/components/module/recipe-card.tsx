import { formatQuantity } from "@/lib/format-number";
import { pluralizeUnit } from "@/lib/pluralize";
import type { CalculationResult } from "@/lib/formula-engine";

// Fase 9B, sprint UX V1.2 (04-ago-2026) — componente puramente
// presentacional, sin conocimiento de ningún módulo: recibe un resultado
// "primario" (ej. cantidad de cargas de betonera) y sus "ingredientes"
// (ej. cemento/arena/gravilla/agua por carga) ya calculados por el motor
// de fórmulas, y los pinta como una tarjeta de receta — grilla de 2
// columnas en vez de la lista apilada genérica de PricedResults, porque
// acá el objetivo es que un maestro lea la receta completa de un
// vistazo, no comparar precios unitarios (por eso no tiene campo de
// precio: estos resultados no traen materialName). Reutilizable por
// cualquier módulo futuro con el mismo patrón "cantidad base + desglose
// de ingredientes por unidad" — no hay nada específico de Radier acá,
// toda esa configuración vive en RECIPE_GROUPS (module-visual-config.ts).
export function RecipeCard({
  title,
  primary,
  items,
}: {
  title: string;
  primary: CalculationResult;
  items: CalculationResult[];
}) {
  return (
    <div className="rounded-2xl p-5 mb-3 bg-white border border-border">
      <p className="text-xs font-mono uppercase tracking-wider text-ink-muted mb-3">{title}</p>

      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="font-medium text-[15px]">{primary.label}</span>
        <span className="font-display text-2xl font-semibold text-right">
          {formatQuantity(primary.value)}{" "}
          <span className="text-sm font-body font-normal text-ink-muted">
            {pluralizeUnit(primary.value, primary.unit)}
          </span>
        </span>
      </div>
      {primary.note && <p className="mt-2 text-xs text-ink-muted">{primary.note}</p>}

      {items.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-x-4 gap-y-3">
          {items.map((item) => (
            <div key={item.key}>
              <p className="text-xs text-ink-muted">{item.label}</p>
              <p className="font-display text-lg font-semibold">
                {formatQuantity(item.value)}{" "}
                <span className="text-xs font-body font-normal text-ink-muted">
                  {pluralizeUnit(item.value, item.unit)}
                </span>
              </p>
              {item.note && <p className="mt-0.5 text-[11px] text-ink-faint">{item.note}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
