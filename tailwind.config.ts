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
        concrete: "#F5F4F1",
        ink: "#1C1B19",
        blueprint: "#2451B0",
        safety: "#E8622C",
        "safety-tint": "#FDEDE6",
        "ink-muted": "#6B6862",
        "ink-faint": "#9A968C",
        border: "#E4E1D8",
        navy: "#0F1E3D",
        "navy-light": "#1B2D54",
        "navy-lighter": "#2C4370",
        "navy-border": "#24365E",
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
