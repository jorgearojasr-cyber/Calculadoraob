const formatter = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 2 });

export function formatQuantity(value: number): string {
  return formatter.format(value);
}

// Fase C6 (2026-09-02) — Costos del configurador integral de Piscina:
// mismo patrón que ya usa priced-results.tsx (`currencyFormatter`) para
// "Subtotal"/"Total aproximado" — sin decimales, separador de miles con
// punto (es-CL). Se centraliza acá para reutilizarlo en el nuevo bloque
// de Costos de ResultScreen sin declarar un segundo formateador inline.
// No reemplaza el de priced-results.tsx (mismo criterio ahí, sin tocar
// ese archivo) — evita el riesgo de un cambio compartido innecesario por
// un simple alias, ver sección 20 del pedido C6: "INSPECCIONAR primero.
// No crear un segundo sistema si ya existe uno" — es el MISMO sistema
// (Intl.NumberFormat es-CL, 0 decimales), solo expuesto para reutilizar.
const clpFormatter = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 });

export function formatClp(value: number): string {
  return `$${clpFormatter.format(Math.round(value))}`;
}
