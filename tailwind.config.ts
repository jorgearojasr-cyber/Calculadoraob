import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
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
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
    },
  },
  plugins: [],
};
export default config;
