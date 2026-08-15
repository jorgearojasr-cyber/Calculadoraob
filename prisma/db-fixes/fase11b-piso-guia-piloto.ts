import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

// Fase 11B — piloto de "guía primero" para Piso
// (docs/FASE11A_DISENO_INSPECCION_TECNICA_GUIADA.md, sección 7).
//
// Agrega 2 encabezados nuevos ("# Cómo revisarlo" y "# Qué señales pueden
// indicar un problema") al FINAL del contenido de los 2 TechnicalArticle
// de Piso ya creados en Fase 5B (piso-como-revisar-danos-visibles,
// piso-como-revisar-desniveles) — los encabezados existentes (# Qué se
// revisa / # Qué debería observarse / # Cuando existe una observación /
// # Recomendación / # Fuente) se mantienen intactos y en el mismo orden,
// para no romper el motor de redacción de Fase 10B
// (src/lib/inspecciones-redaccion.ts), que solo lee
// condicionesIncorrectas.
//
// Contenido: mismo procedimiento ya descrito en los encabezados existentes
// (Recomendación / Cuando existe una observación) de estos 2 artículos,
// reorganizado en formato de guía paso a paso — no se agrega ninguna
// fuente ni criterio numérico nuevo, todo ya estaba citado en el artículo
// original de Fase 5B.
//
// Idempotente: upsert por slug, mismo patrón que fase5b.
async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const updates = [
    {
      slug: "piso-como-revisar-danos-visibles",
      appendix: `

# Cómo revisarlo

Recorre todo el piso del recinto caminando lentamente, con buena luz (natural o una linterna en ángulo rasante, que resalta imperfecciones). En cerámica o porcelanato, golpea suavemente algunas piezas con los nudillos. En radier u hormigón a la vista, pasa la mano por la superficie.

# Qué señales pueden indicar un problema

- Piezas trisadas, picadas o con bordes astillados.
- Sonido hueco al golpear una pieza (indica mala adherencia).
- Fisuras en hormigón mayores a 0,3 mm, o que crucen toda la superficie.
- Polvo suelto o descascarado al pasar la mano (indica mal curado).`,
    },
    {
      slug: "piso-como-revisar-desniveles",
      appendix: `

# Cómo revisarlo

Pasa la mano o el pie por las uniones entre piezas o tablas, buscando un "escalón" perceptible. Apoya una regla larga sobre varias piezas contiguas para ver si queda pareja. En radier/hormigón o pavimento exterior, camina por toda la superficie prestando atención a zonas hundidas o levantadas.

# Qué señales pueden indicar un problema

- Un escalón perceptible al tacto entre piezas o tablas.
- La regla no queda pareja al apoyarla sobre varias piezas.
- Zonas hundidas que podrían acumular agua.
- Tablas de madera que se mueven o suenan al pisarlas.`,
    },
  ];

  for (const { slug, appendix } of updates) {
    const existing = await prisma.technicalArticle.findUnique({ where: { slug } });
    if (!existing) {
      console.log(`OMITIDO: ${slug} no existe (esperado por Fase 5B).`);
      continue;
    }
    // Idempotencia: si el encabezado ya está presente (ej. segunda
    // corrida), no se duplica.
    if (existing.content.includes("# Cómo revisarlo")) {
      console.log(`YA APLICADO: ${slug}`);
      continue;
    }
    await prisma.technicalArticle.update({
      where: { slug },
      data: { content: existing.content + appendix },
    });
    console.log(`OK: ${slug} <- guía agregada`);
  }

  console.log("Fase 11B: guía piloto de Piso aplicada.");
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
