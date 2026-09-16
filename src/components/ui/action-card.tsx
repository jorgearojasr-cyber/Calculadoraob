import Link from "next/link";
import { Lock, type LucideIcon } from "lucide-react";

// Design Spec v1.0 (OBRABIEN.CL, fase "Implementación Design Spec v1.0",
// 2026-09-15) — sección 12 del pedido. Componente base reutilizable para
// las 6 acciones del Home (`QuickActionsGrid`) — antes estaba inline
// dentro de ese componente; se extrae acá porque el pedido pide
// explícitamente "usar ActionCard reutilizable".
//
// Medidas exactas del Spec: min-height 92px, padding 14px, radius 14px
// (ds-card), icon container 36px, icon 18px, sombra ds-card-rest por
// defecto → ds-card-elevated en hover, active: scale .98.

// Mejora UX/Auth flow (2026-09-16) — `tone` diferencia el fondo del
// contenedor del ícono por categoría (antes las 6 tarjetas compartían el
// mismo `bg-ds-navy-100`, lo que las hacía verse casi idénticas). Se usa
// la paleta suave estándar de Tailwind (no se extiende tailwind.config —
// esto es exclusivo de estas tarjetas del Home) en vez de tokens ds-*
// nuevos, para no ampliar el sistema de diseño por un solo componente.
// "navy" queda como default — mismo aspecto que antes de este cambio,
// para no romper ningún otro consumidor futuro que no pase `tone`.
// Auditoría de accesibilidad (2026-09-16, fase auth-design-system-v1,
// punto 10 del pedido) — se midió el contraste real ícono-sobre-chip de
// cada tono (fórmula WCAG, relación mínima 3:1 para elementos gráficos/
// no-texto, SC 1.4.11). "orange" (Mis proyectos) media 2.64:1 con
// orange-500 — no pasaba ni el umbral no-texto. Se sube a orange-600
// (3.35:1, ahora sí cumple) — un solo paso en la escala de Tailwind, no
// se cambia el tono en sí (sigue siendo "naranja muy suave" de fondo).
// El resto (blue 4.75, teal 3.59, amber 4.84, violet 5.20, sky 3.84) ya
// cumplía sin cambios.
const TONE_STYLES: Record<string, { bg: string; icon: string }> = {
  navy: { bg: "bg-ds-navy-100", icon: "text-ds-navy-900" },
  blue: { bg: "bg-blue-50", icon: "text-blue-600" },
  teal: { bg: "bg-teal-50", icon: "text-teal-600" },
  amber: { bg: "bg-amber-50", icon: "text-amber-700" },
  violet: { bg: "bg-violet-50", icon: "text-violet-600" },
  sky: { bg: "bg-sky-50", icon: "text-sky-600" },
  orange: { bg: "bg-orange-50", icon: "text-orange-600" },
};

export type ActionCardTone = keyof typeof TONE_STYLES;

export function ActionCard({
  href,
  label,
  description,
  icon: Icon,
  tone = "navy",
  requiresAuth = false,
}: {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  tone?: ActionCardTone;
  requiresAuth?: boolean;
}) {
  const toneStyle = TONE_STYLES[tone] ?? TONE_STYLES.navy;

  return (
    <Link
      href={href}
      className="relative flex flex-col gap-2.5 rounded-ds-card p-[14px] bg-white border border-ds-border shadow-ds-card-rest hover:shadow-ds-card-elevated active:scale-[0.98] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-orange-600 focus-visible:ring-offset-2"
      style={{ minHeight: 92 }}
    >
      {/* Candado discreto (punto 2 del pedido) — solo una señal informativa,
          no un estado deshabilitado: la tarjeta sigue siendo 100% clickeable,
          el guard real ocurre al navegar (middleware.ts / protected-routes.ts).
          Auditoría de accesibilidad (2026-09-16) — dos ajustes:
          (1) contraste: text-ds-text-tertiary daba 3.23:1 sobre blanco, al
          límite del mínimo no-texto (3:1) y por debajo del texto normal
          (4.5:1); se sube a text-ds-text-secondary (6.56:1), un token ya
          existente en el sistema, sin inventar uno nuevo.
          (2) el ícono solo (aria-hidden) no comunicaba nada a lectores de
          pantalla — "requiere cuenta" se agrega como texto visualmente
          oculto (sr-only) dentro del propio Link, para que el nombre
          accesible de la tarjeta lo incluya igual que un usuario vidente
          lo ve. */}
      {requiresAuth && (
        <Lock
          aria-hidden="true"
          className="absolute top-2 right-2 w-3 h-3 text-ds-text-secondary"
          strokeWidth={2}
        />
      )}
      <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0 ${toneStyle.bg}`}>
        <Icon className={`w-[18px] h-[18px] ${toneStyle.icon}`} strokeWidth={1.8} />
      </div>
      <div className="min-w-0">
        <h3 className="font-display font-extrabold text-[15px] text-ds-navy-900 leading-tight">{label}</h3>
        {/* Última pasada de ajustes (2026-09-16, punto 1) — la descripción
            reserva altura para 2 líneas SIEMPRE (min-h, no line-clamp),
            aunque el texto real ocupe solo 1. Antes, en 360-412px, la fila
            de "Calcular"/"Planificar" quedaba ~18px más alta que las otras
            2 filas porque solo "Planificar" haces wrap a 2 líneas y CSS
            grid estira esa fila entera para acomodarlo — ninguna otra fila
            tenía ese mismo estirón. Reservando el espacio de 2 líneas en
            las 6 tarjetas por igual, las 3 filas quedan con la misma
            altura sin depender de qué texto entra en 1 o 2 líneas, sin
            acortar ningún copy. min-h-[36px] ≈ 2 líneas de 13px/leading-snug
            (17.875px cada una). */}
        <p className="font-body text-[13px] text-ds-text-secondary mt-0.5 leading-snug min-h-[36px]">{description}</p>
      </div>
      {requiresAuth && <span className="sr-only">(requiere cuenta)</span>}
    </Link>
  );
}
