import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

// Fase 11Q (16-ago-2026) — piloto de revisiones específicas para Ventana
// (docs/FASE11P_DISENO_PILOTO_VENTANA.md, docs/FASE11M_DISENO_MOTOR_...).
// Reemplaza la pregunta genérica "¿Opera correctamente?" por 3 preguntas
// independientes. NO borra la pregunta antigua (bloqueado además por
// onDelete: Restrict en InspectionChecklistCheck.checklistItem) — la
// desactiva (active: false) para que quede fuera de la generación de
// casos NUEVOS, mientras los 11 checks existentes que ya la referencian
// siguen resolviendo su FK y su questionSnapshot exactamente igual.
//
// InspectionChecklistItem no tiene un campo único natural (solo id
// cuid), así que la idempotencia se logra con findFirst por
// (elementTemplateId, question) en vez de un upsert real.
//
// NO crea InspectionReferenceImage — eso queda para una fase posterior,
// una vez que existan imágenes BIEN/MAL reales que insertar.
async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const elementTemplate = await prisma.inspectionElementTemplate.findUniqueOrThrow({
    where: { key: "ventana" },
  });

  const oldItem = await prisma.inspectionChecklistItem.findFirst({
    where: { elementTemplateId: elementTemplate.id, question: "¿Opera correctamente?" },
  });
  if (oldItem) {
    await prisma.inspectionChecklistItem.update({
      where: { id: oldItem.id },
      data: { active: false },
    });
    console.log(`OK: pregunta antigua desactivada (id ${oldItem.id}) — conservada para casos históricos.`);
  } else {
    console.log("Pregunta antigua no encontrada (ya desactivada o catálogo cambió) — se continúa igual.");
  }

  const articles = [
    {
      slug: "ventana-apertura-cierre",
      title: "Cómo revisar la apertura y cierre de la ventana",
      content: `# Qué revisar

Si la ventana puede abrirse y cerrarse con normalidad, sin necesidad de forzarla, en todo su recorrido de movimiento.

# Cómo revisarlo

Abre y cierra la ventana completa varias veces, recorriendo todo su movimiento, incluyendo la traba si tiene.

# Qué debería verse

Se mueve con normalidad y puede cerrarse completamente, sin dificultad ni resistencia excesiva.

# Qué señales pueden indicar un problema

- Se traba en algún punto del recorrido.
- Requiere fuerza excesiva para abrir o cerrar.
- No alcanza a cerrar completamente.

Ninguna de estas señales determina por sí sola la causa — conviene registrarla igual y, si hay dudas, revisarla con más detalle.

# Por qué importa

Puede dificultar el uso normal de la ventana. Conviene registrarlo para revisión.

# Recomendación

No fuerces el mecanismo. Registra en qué punto del recorrido se produce la dificultad, para que quede claro dónde revisar después.

# Fuente

- **Manual técnico de referencia**: Manual de Tolerancias CDT (Ficha 13, Ventanas).
- **Criterio interno adaptado**: catálogo educativo ITO (265 puntos), elemento Ventanas.

Sin referencia normativa verificada en esta fuente.`,
    },
    {
      slug: "ventana-manilla-herrajes",
      title: "Cómo revisar la manilla y los herrajes de la ventana",
      content: `# Qué revisar

Si la manilla y los mecanismos visibles de la ventana funcionan con normalidad, sin resistencia excesiva ni holgura.

# Cómo revisarlo

Acciona la manilla varias veces y comprueba que permita cerrar y trabar la ventana sin necesidad de forzarla.

# Qué debería verse

La manilla está firme y se mueve con normalidad, sin resistencia excesiva ni holgura, y acciona el cierre correctamente.

# Qué señales pueden indicar un problema

- La manilla está floja o con holgura.
- Presenta resistencia excesiva al moverla.
- No acciona correctamente el cierre.
- Hay algún herraje visiblemente suelto.

Ninguna de estas señales determina por sí sola la causa — conviene registrarla igual.

# Por qué importa

Puede dificultar el uso o el cierre normal de la ventana.

# Recomendación

Registra qué parte presenta la dificultad (la manilla, el pestillo, un herraje específico), para que quede claro qué revisar después.

# Fuente

- **Manual técnico de referencia**: Manual de Tolerancias CDT (Ficha 13, Ventanas).
- **Criterio interno adaptado**: catálogo educativo ITO (265 puntos), elemento Ventanas.

Sin referencia normativa verificada en esta fuente.`,
    },
    {
      slug: "ventana-sello-hoja-marco",
      title: "Cómo revisar el sello entre la hoja y el marco de la ventana",
      content: `# Qué revisar

Si se observa alguna separación entre la hoja y el marco de la ventana cuando está completamente cerrada.

# Cómo revisarlo

Cierra la ventana por completo y observa todo el contorno con buena luz (natural o una linterna), buscando si se ve luz pasando entre la hoja y el marco.

# Qué debería verse

No se observa una separación evidente ni paso visible de luz entre la hoja y el marco con la ventana cerrada.

# Qué señales pueden indicar un problema

- Se observa una abertura entre la hoja y el marco.
- Se ve luz pasando por algún tramo del contorno con la ventana cerrada.

Esto no determina por sí solo la causa — conviene registrarlo igual y, si hay dudas, revisarlo con más detalle.

# Por qué importa

Una separación puede permitir el paso de aire o agua.

# Recomendación

Registra el sector donde se observa la separación y toma una foto si es posible.

# Fuente

- **Manual técnico de referencia**: Manual de Tolerancias CDT (Ficha 13, Ventanas).
- **Biblioteca técnica**: contenido ITO sobre silicona perimetral.

Sin referencia normativa verificada en esta fuente.`,
    },
  ];

  for (const a of articles) {
    await prisma.technicalArticle.upsert({
      where: { slug: a.slug },
      update: { title: a.title, content: a.content },
      create: { slug: a.slug, title: a.title, content: a.content },
    });
  }
  console.log(`OK: ${articles.length} artículos creados/actualizados.`);

  const newItems = [
    {
      question: "¿La ventana abre y cierra correctamente?",
      order: 1,
      technicalArticleSlug: "ventana-apertura-cierre",
    },
    {
      question: "¿La manilla y los herrajes funcionan correctamente?",
      order: 2,
      technicalArticleSlug: "ventana-manilla-herrajes",
    },
    {
      question: "Con la ventana cerrada, ¿se ve alguna separación entre la hoja y el marco?",
      order: 3,
      technicalArticleSlug: "ventana-sello-hoja-marco",
    },
  ];

  for (const item of newItems) {
    const existing = await prisma.inspectionChecklistItem.findFirst({
      where: { elementTemplateId: elementTemplate.id, question: item.question },
    });
    if (existing) {
      await prisma.inspectionChecklistItem.update({
        where: { id: existing.id },
        data: { order: item.order, technicalArticleSlug: item.technicalArticleSlug, active: true },
      });
      console.log(`OK: pregunta actualizada (id ${existing.id}): "${item.question}"`);
    } else {
      const created = await prisma.inspectionChecklistItem.create({
        data: {
          elementTemplateId: elementTemplate.id,
          question: item.question,
          order: item.order,
          technicalArticleSlug: item.technicalArticleSlug,
          active: true,
        },
      });
      console.log(`OK: pregunta creada (id ${created.id}): "${item.question}"`);
    }
  }

  console.log("\nFase 11Q: piloto Ventana (3 revisiones específicas) creado/actualizado.");
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
