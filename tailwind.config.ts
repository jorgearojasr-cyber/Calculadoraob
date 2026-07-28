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
        // Dirección visual "ObraBien Calcula" (paleta 2026-07-28). `safety`
        // es ahora el color de marca (antes naranjo, usado para disclaimers
        // Y para acentos de marca a la vez) — se separó: `caution` es el
        // naranjo original, dedicado exclusivamente al estado "no
        // verificado contra norma" del NormsDisclaimer, para no chocar con
        // el nuevo azul de marca que ahora vive en `safety`.
        concrete: "#F7F4EF", // fondo app
        ink: "#1A1917", // texto principal
        blueprint: "#2451B0",
        safety: "#0E4C5A", // azul obra (marca, primario)
        "safety-hover": "#093A45", // azul profundo (presionado/hover)
        "safety-tint": "#E2EFF1", // azul claro (fondo de dato/resultado destacado)
        // Sin valor exacto en el brief — borde derivado a partir del azul
        // claro para que la tarjeta con `safety-tint` tenga un borde sutil
        // pero visible (mismo criterio ya usado para safety-border/danger-border).
        "safety-border": "#BFD9DC",
        caution: "#E8622C", // "no verificado contra norma" (naranjo original)
        "caution-tint": "#FDEDE6",
        "caution-border": "#F3C7B1",
        danger: "#B33C1C", // aviso reforzado (reinforcedWarning)
        "danger-tint": "#FBE9E4",
        // Derivado del mismo modo que safety-border — el brief no da un
        // tono de borde explícito para este estado.
        "danger-border": "#E8B6A6",
        success: "#2F7A55", // verde listo (confirmaciones)
        "success-tint": "#E7F3EC",
        "success-border": "#B9DCC6",
        "ink-muted": "#5E5850", // texto de ayuda
        "ink-faint": "#8C8579",
        "info-tint": "#F1EEE8", // información general (disclaimer "norma citada")
        border: "#E4DED4", // borde de tarjeta
        // Chrome oscuro del sidebar/bottom-nav: reutiliza el azul de marca
        // en vez de un tercer color — el brief solo define 2 azules.
        navy: "#0E4C5A",
        "navy-light": "#093A45",
        "navy-lighter": "#093A45",
        "navy-border": "#1C5F70",
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
