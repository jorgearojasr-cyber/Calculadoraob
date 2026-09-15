import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    // group-colors.ts arma nombres de clase (bg-clay/[0.1], text-clay, etc.)
    // fuera de components/app — sin este glob, Tailwind nunca las escanea
    // y no genera esas utilidades (bug real detectado: los colores nuevos
    // de la paleta por grupo no se pintaban en el navegador).
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Sistema de marca definitivo "ObraBien Calcula" (2026-07-28,
        // reemplaza la paleta azul-obra/Huincha de la sesión anterior,
        // que quedó descartada). Regla que ordena el sistema: `action`
        // (naranjo) = únicamente CTAs/botones/elementos interactivos;
        // `safety` (marino) = marca/chrome/acentos no accionables; los
        // estados de advertencia (`caution`/`danger`) usan ámbar/carmín
        // para no confundirse nunca con el naranjo de acción.
        concrete: "#F9F9F9", // fondo app
        peach: "#FDF2E9", // fondo secundario cálido (durazno)
        ink: "#1A1917", // texto principal
        blueprint: "#2451B0",
        safety: "#002152", // marino (marca, primario — chrome, acentos, resultado numérico)
        // Sin valor exacto en el brief — hover/pressed derivado oscureciendo el marino.
        "safety-hover": "#00112E",
        // Tint claro derivado del marino (sin valor exacto en el brief),
        // mismo rol que antes: fondo de dato/resultado destacado.
        "safety-tint": "#E7E9EF",
        "safety-border": "#C6CBD6",
        action: "#FF4E00", // naranjo de marca — SOLO CTAs/botones primarios/elementos interactivos
        "action-hover": "#E04500", // derivado, oscurecido para pressed/hover
        caution: "#D9A21B", // "no verificado contra norma" (ámbar)
        "caution-tint": "#FBF1DC", // derivado
        "caution-border": "#EFD9A0", // derivado
        danger: "#C4122F", // aviso reforzado (reinforcedWarning) — carmín
        "danger-tint": "#FBE4E8", // derivado
        "danger-border": "#EFB3BE", // derivado
        success: "#185C3D", // chip de estado positivo — texto
        "success-tint": "#B9D4C7", // chip de estado positivo — fondo
        "success-border": "#9CC0AE", // derivado
        "ink-muted": "#5E5850", // texto de ayuda
        "ink-faint": "#8C8579",
        "info-tint": "#F1EEE8", // información general (se mantiene neutro, sin cambios)
        border: "#E4DED4", // borde de tarjeta
        // Chrome oscuro del sidebar/bottom-nav: reutiliza el marino de marca.
        navy: "#002152",
        "navy-light": "#00112E",
        "navy-lighter": "#00112E",
        "navy-border": "#0A2A5E",
        // Paleta de íconos por grupo (2026-07-28) — 6 tonos nuevos, derivados
        // y desaturados, para diferenciar los 11 grupos de "Todas las
        // categorías" sin invadir naranjo/ámbar/carmín (reservados para
        // CTA/normas/avisos). Nombres elegidos para no chocar con la paleta
        // por defecto de Tailwind (evita "slate"/"cyan"/"teal"/etc., que ya
        // existen como escalas propias). Ver src/lib/group-colors.ts.
        clay: "#9C5A3C", // Pisos y Revestimientos
        plum: "#5B3A70", // Pintar
        lagoon: "#0E7C7B", // Agua y Gas
        graphite: "#4A5568", // Baño
        ochre: "#8A6238", // Techumbre
        poolblue: "#0891B2", // Piscinas

        // Design Spec v1.0 (OBRABIEN.CL, fase "Implementación Design Spec
        // v1.0", 2026-09-15) — tokens exactos de la sección B del PDF
        // aprobado, prefijados `ds-` a propósito: el sistema de marca de
        // arriba (`safety`/`action`/`border`/etc.) se sigue usando en TODO
        // el resto del sitio (wizard, admin, resultados — fuera de alcance
        // de esta fase, que es solo Home + navegación). Sobreescribir esas
        // claves habría cambiado bordes/colores en páginas no tocadas acá.
        // `ds-*` es la MISMA solución de tokens (este archivo), solo con
        // nombres que no chocan, para que Home/navegación migren al Design
        // Spec sin arrastrar el resto del sitio todavía.
        "ds-navy-900": "oklch(22% .045 255)",
        "ds-navy-700": "oklch(30% .05 255)",
        "ds-navy-100": "oklch(94% .015 255)",
        "ds-orange-600": "oklch(64% .19 42)",
        "ds-orange-700": "oklch(58% .19 40)",
        "ds-orange-100": "oklch(93% .04 45)",
        "ds-bg": "oklch(98% .004 255)",
        "ds-muted": "oklch(96% .006 255)",
        "ds-border": "oklch(90% .008 255)",
        "ds-text-secondary": "oklch(48% .02 255)",
        "ds-text-tertiary": "oklch(65% .015 255)",
        "ds-success-600": "oklch(62% .13 150)",
      },
      // Radios del Design Spec — `rounded-full` de Tailwind ya cubre
      // pill/FAB (999px), no hace falta declararlo acá.
      borderRadius: {
        "ds-input": "10px",
        "ds-card": "14px",
        "ds-card-lg": "20px",
      },
      boxShadow: {
        "ds-card-rest": "0 1px 2px oklch(22% .045 255 / 0.06)",
        "ds-card-elevated": "0 8px 20px oklch(22% .045 255 / 0.10)",
        "ds-modal": "0 24px 48px oklch(22% .045 255 / 0.20)",
        "ds-fab": "0 10px 22px oklch(64% .19 42 / 0.40)",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
        // Design Spec v1.0 — Manrope (display) / Source Sans 3 (body),
        // cargadas vía next/font/google en layout.tsx dentro de las MISMAS
        // 2 variables CSS que ya existían (--font-display/--font-body) —
        // por eso no hace falta declarar nuevas claves acá, `font-display`
        // y `font-body` ya apuntan a las tipografías correctas del Spec en
        // todo el sitio (infra existente reutilizada, punto 3 del pedido).
      },
    },
  },
  plugins: [],
};
export default config;
