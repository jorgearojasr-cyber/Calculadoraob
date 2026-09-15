import type { Metadata } from "next";
import { Manrope, Source_Sans_3, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

// Design Spec v1.0 (OBRABIEN.CL, fase "Implementación Design Spec v1.0",
// 2026-09-15) — sección C del PDF exige Manrope para Display/H1/H2/H3 y
// Source Sans 3 para Body/Small/Label/Eyebrow. Reemplaza a Figtree (que a
// su vez había reemplazado a Archivo el 2026-07-28) usando la MISMA
// infraestructura ya existente: next/font/google + las 2 variables CSS
// --font-display/--font-body que ya consume todo el sitio (`font-display`/
// `font-body` en Tailwind) — no hace falta tocar un solo componente para
// que el cambio de tipografía se propague, ni incluir archivos de fuente a
// mano (punto 3 del pedido: "no incluir archivos de fuentes manualmente si
// no corresponde" — no corresponde, next/font/google sirve Manrope y
// Source Sans 3 igual que servía Figtree).
const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-display",
});

const sourceSans3 = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-body",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "ObraBien Calcula",
  description:
    "Calcula, aprende y construye gratis. Calcula materiales, cantidades y costos de cualquier proyecto de construcción, sin necesitar experiencia técnica.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${manrope.variable} ${sourceSans3.variable} ${ibmPlexMono.variable} font-body antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
