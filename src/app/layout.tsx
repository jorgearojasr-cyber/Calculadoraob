import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

// Dirección visual 2026-07-28: Archivo es la única familia para todo el
// texto de UI (antes Space Grotesk para títulos + IBM Plex Sans para
// cuerpo) — se mantienen las 2 variables CSS (--font-display/--font-body)
// para no tocar cada uso de font-display/font-body en los componentes,
// pero ambas apuntan a Archivo ahora.
const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
});

const archivoBody = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "ObraBien Calcula",
  description:
    "Calcula materiales, cantidades y costos de cualquier proyecto de construcción, sin necesitar experiencia técnica.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${archivo.variable} ${archivoBody.variable} ${ibmPlexMono.variable} font-body antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
