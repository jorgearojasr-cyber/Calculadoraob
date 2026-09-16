import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";

// Preparación para dominio propio (calcula.obrabien.cl) — no existía
// ningún robots.ts antes de esta fase. Bloquea exactamente las superficies
// ya identificadas como privadas/técnicas/de bajo valor SEO en la
// auditoría previa (ver docs de la fase "Auditoría de dominio"):
// - /admin: panel administrativo, ya protegido por middleware (rol admin).
// - /proyectos, /lista-compras: datos privados del usuario (SavedProject),
//   ya protegidos por middleware — acá además ver noindex explícito en
//   esas mismas páginas (defensa en profundidad, sección 20 del pedido).
// - /login, /registro: sin valor de indexación propio.
// - /buscar: resultados de búsqueda interna, no landing pages (sección 12).
// - /inspecciones, /regularizacion: contienen información específica del
//   usuario/obra, aunque su protección real es a nivel de página (no
//   middleware) — se listan igual acá por privacidad, sin tocar esa
//   lógica de auth.
// - /galeria/nueva: formulario de carga, no contenido a indexar.
// - /zzdiagramv2test: página de diagnóstico técnico, nunca enlazada
//   públicamente (confirmado en la auditoría integral) — no se elimina
//   (fuera de alcance), solo se excluye de indexación.
// - /api: rutas de API, nunca HTML indexable.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/admin/",
        "/proyectos",
        "/proyectos/",
        "/lista-compras",
        "/login",
        "/registro",
        "/buscar",
        "/inspecciones",
        "/inspecciones/",
        "/regularizacion",
        "/regularizacion/",
        "/galeria/nueva",
        "/zzdiagramv2test",
        "/api/",
      ],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
