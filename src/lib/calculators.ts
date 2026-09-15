// Design Spec v1.0 — Parte 2 (Calculadoras/Herramientas), 2026-09-15.
//
// Mapeo estático de Category → chip de "Calculadoras". El Spec sugiere
// "Todas / Obra gruesa / Terminaciones" como ejemplo, pero advierte
// explícitamente no hardcodear esos nombres si chocan con la taxonomía
// real — así que primero se inspeccionaron las 19 categorías reales
// (ver investigación de esta fase) antes de definir esto:
//
//   - 2 categorías (fierros, quinchos) no tienen NINGÚN módulo publicado
//     hoy — mismo criterio ya aprobado en el saneamiento de Home
//     (2026-09-14): no se muestran ni se cuentan acá tampoco.
//   - Las 17 categorías restantes SÍ mapean limpio en 4 buckets
//     temáticos sin inventar nada: Obra gruesa (estructura/base),
//     Terminaciones (revestimientos/acabados), Instalaciones
//     (electricidad/gas/agua) y Exterior (jardín/patio). No hay un 5º
//     bucket "Reparaciones" con una fuente de datos propia y limpia
//     (los módulos de reparación puntual, ej. "Cambiar burlete"/"Cambiar
//     silicona", ya viven dentro de Exterior/Baño) — se prefirió NO
//     inventar esa categoría (punto 5 del pedido: "mantener menos
//     filtros antes que inventar categorías inconsistentes").
//
// Resultado: 4 chips + "Todas" = 5, dentro del máximo de 4-6 pedido.
export type CalculatorChipId = "obra-gruesa" | "terminaciones" | "instalaciones" | "exterior";

export const CALCULATOR_CHIPS: { id: CalculatorChipId; label: string }[] = [
  { id: "obra-gruesa", label: "Obra gruesa" },
  { id: "terminaciones", label: "Terminaciones" },
  { id: "instalaciones", label: "Instalaciones" },
  { id: "exterior", label: "Exterior" },
];

// Category.slug → chip. Cualquier categoría NO listada acá (fierros,
// quinchos, o una nueva categoría futura sin mapear todavía) simplemente
// no aparece bajo ningún chip salvo "Todas" — no rompe nada, solo queda
// sin filtro temático hasta que se documente acá.
export const CATEGORY_CHIP_MAP: Record<string, CalculatorChipId> = {
  hormigon: "obra-gruesa",
  albanileria: "obra-gruesa",
  madera: "obra-gruesa",
  metalcon: "obra-gruesa",
  excavaciones: "obra-gruesa",
  piscinas: "obra-gruesa",
  ceramica: "terminaciones",
  pintura: "terminaciones",
  "yeso-carton": "terminaciones",
  techumbres: "terminaciones",
  impermeabilizacion: "terminaciones",
  bano: "terminaciones",
  electricidad: "instalaciones",
  gas: "instalaciones",
  agua: "instalaciones",
  paisajismo: "exterior",
  exterior: "exterior",
};

export function getCalculatorChip(categorySlug: string): CalculatorChipId | null {
  return CATEGORY_CHIP_MAP[categorySlug] ?? null;
}

export type CalculatorModule = {
  id: string;
  slug: string;
  name: string;
  description: string;
  imageUrl: string | null;
  categorySlug: string;
  categoryName: string;
};

// Filtro local de calculadoras — punto 3 del pedido: el buscador global
// (searchContent, ver lib/search.ts) mezcla Module con Category/
// ProjectTask/features standalone (Guías, Inspecciones, Regularización,
// Biblioteca), que es ruido en una pantalla que solo debe mostrar
// calculadoras. Reutiliza el MISMO algoritmo de score (normalize +
// scoreMatch) en vez de inventar una lógica de búsqueda nueva — corre
// 100% en el cliente sobre la lista ya cargada (46 módulos publicados
// hoy, un volumen chico que no justifica una Server Action por tecla).
//
// Se importa de `search-scoring.ts` (no de `search.ts`) a propósito:
// search.ts trae `@/lib/prisma` a nivel de módulo (usa Node natives) y
// este archivo lo consume calculators-explorer.tsx, un client component —
// importar desde search.ts arrastraba ese import al bundle del navegador
// y rompía `next build` ("Module not found: fs/net/tls/dns", ver commit).
// search-scoring.ts es la extracción 100% pura de esa misma lógica, sin
// ninguna dependencia de servidor.
import { normalize, scoreMatch } from "./search-scoring";

export function filterCalculators(
  modules: CalculatorModule[],
  query: string,
  chip: CalculatorChipId | "todas"
): CalculatorModule[] {
  const byChip =
    chip === "todas" ? modules : modules.filter((m) => getCalculatorChip(m.categorySlug) === chip);

  const trimmed = query.trim();
  if (trimmed.length === 0) return byChip;

  const scored = byChip
    .map((m) => ({ m, score: scoreMatch(trimmed, m.name, m.description) }))
    .filter((s): s is { m: CalculatorModule; score: number } => s.score !== null);

  scored.sort((a, b) => a.score - b.score || a.m.name.localeCompare(b.m.name, "es"));
  return scored.map((s) => s.m);
}

// Reexportado solo para que un test pueda verificar normalize() sin
// importar directamente de search.ts (mantiene la superficie de este
// módulo autocontenida).
export { normalize };
