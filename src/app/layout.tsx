import type { Metadata } from "next";
import { Figtree, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

// Sistema de marca definitivo 2026-07-28: Figtree reemplaza a Archivo
// (Archivo competía visualmente con el wordmark redondeado del logo real).
// Se mantienen las 2 variables CSS (--font-display/--font-body) para no
// tocar cada uso de font-display/font-body en los componentes, pero
// ambas apuntan a Figtree ahora.
const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-display",
});

const figtreeBody = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
        className={`${figtree.variable} ${figtreeBody.variable} ${ibmPlexMono.variable} font-body antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
