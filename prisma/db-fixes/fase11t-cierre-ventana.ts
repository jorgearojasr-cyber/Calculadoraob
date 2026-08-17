import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

// Fase 11T (17-ago-2026) — cierre técnico de Ventana
// (docs/FASE11S_CIERRE_TECNICO_VENTANA.md, sección L). Agrega las 4
// revisiones aprobadas en Fase 11S sobre las 3 ya publicadas
// (Fase 11Q/11R): Vidrio (daños visibles), Vidrio (condensación
// interna en termopanel), Sello marco-muro, Marco. Ventana queda con
// 7 revisiones activas.
//
// Mismo patrón idempotente que fase11q-piloto-ventana.ts:
// InspectionChecklistItem no tiene un campo único natural, así que se
// usa findFirst por (elementTemplateId, question) en vez de un upsert
// real. NO toca las 3 preguntas ya activas ni la pregunta antigua
// inactiva ("¿Opera correctamente?", que permanece igual — nunca se
// reactiva). NO crea InspectionReferenceImage — eso queda para una
// fase posterior con imágenes reales/aprobadas.
async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const elementTemplate = await prisma.inspectionElementTemplate.findUniqueOrThrow({
    where: { key: "ventana" },
  });

  const articles = [
    {
      slug: "ventana-vidrio-danos-visibles",
      title: "Cómo revisar daños visibles en el vidrio de la ventana",
      content: `# Qué revisar

Si el vidrio presenta rayas, trizaduras, picaduras o manchas permanentes visibles.

# Cómo revisarlo

Observa el vidrio con buena luz natural, de frente y también desde un costado, buscando marcas en la superficie o daños en los bordes.

# Qué debería verse

Sin rayas profundas, trizaduras, picaduras ni manchas permanentes visibles.

# Qué señales pueden indicar un problema

- Rayas profundas en la superficie.
- Trizaduras (grietas).
- Picaduras o despostilladuras, especialmente en los bordes.
- Manchas que no se quitan al limpiar.

Ninguna de estas señales determina por sí sola la causa — conviene registrarla igual y, si hay dudas, revisarla con más detalle.

# Por qué importa

Puede afectar la resistencia o la apariencia del vidrio.

# Recomendación

Registra el sector exacto y el tipo de daño, con foto si es posible.

# Fuente

- **Manual técnico de referencia**: Manual de Tolerancias Cristalería Reina (normas EN-12543, EN-1279, EN-1096) — defectos puntuales, lineales y de borde en vidrio.

Sin referencia normativa chilena verificada en esta fuente.`,
    },
    {
      slug: "ventana-vidrio-condensacion-interna",
      title: "Cómo revisar condensación interna en vidrio termopanel",
      content: `# Qué revisar

Si la ventana es de termopanel (doble vidrio), si hay condensación o vaho visible ENTRE los 2 vidrios — distinto a la humedad normal en la superficie.

# Cómo revisarlo

Observa el vidrio con buena luz. Si ves empañamiento, comprueba si está en la superficie (se puede limpiar con un paño) o si está atrapado entre los 2 vidrios (no se puede limpiar, permanece igual).

# Qué debería verse

No se observa condensación ni vaho atrapado entre los vidrios — la cámara de aire se ve transparente.

# Qué señales pueden indicar un problema

- Condensación o vaho que permanece entre los vidrios y no desaparece al limpiar la superficie.
- Una zona nublada o borrosa dentro del termopanel que no cambia con la limpieza.

Esto no determina por sí solo la causa — conviene registrarlo igual y, si hay dudas, revisarlo con más detalle.

# Por qué importa

Puede ser señal de que el sello hermético del termopanel se degradó.

# Recomendación

Registra con foto. Si la ventana no es de termopanel (vidrio simple), marca "No corresponde".

# Fuente

- **Fabricante de referencia**: Vidrios Lirquén — condensación en termopaneles.

Sin referencia normativa chilena verificada en esta fuente.`,
    },
    {
      slug: "ventana-sello-marco-muro",
      title: "Cómo revisar el sello entre el marco de la ventana y el muro",
      content: `# Qué revisar

Si el sello (silicona o masilla) entre el marco de la ventana y el muro se ve continuo en todo el perímetro visible, sin cortes.

# Cómo revisarlo

Observa el contorno donde el marco de la ventana se une al muro, buscando separaciones, grietas o sectores sin sello.

# Qué debería verse

El sello se ve continuo, sin cortes ni separaciones visibles en el perímetro.

# Qué señales pueden indicar un problema

- Sello cortado o con separaciones.
- Grietas en el sello.
- Sectores sin sello visible.
- Desprendimiento del material sellante.

Ninguna de estas señales determina por sí sola la causa — conviene registrarla igual y, si hay dudas, revisarla con más detalle.

# Por qué importa

Un sello discontinuo puede permitir el paso de agua o aire entre el marco y el muro.

# Recomendación

Registra el sector específico con foto.

# Fuente

- **Normativa oficial**: NCh 2496 Of.2000 — Instalación de Ventanas en Obra (continuidad del sello perimetral).
- **Fabricante/instalador de referencia**: Corporación Limatambo — procedimiento de instalación de ventanas de aluminio.`,
    },
    {
      slug: "ventana-marco-danos-visibles",
      title: "Cómo revisar daños visibles en el marco de la ventana",
      content: `# Qué revisar

Si el marco de la ventana presenta golpes, rayas profundas o deformaciones visibles.

# Cómo revisarlo

Observa el marco completo con buena luz, buscando golpes, rayas profundas o zonas que se vean deformadas o fuera de escuadra.

# Qué debería verse

Sin golpes, rayas profundas ni deformaciones visibles.

# Qué señales pueden indicar un problema

- Abolladuras o golpes visibles.
- Rayas profundas.
- El marco se ve visiblemente torcido o deformado.

Ninguna de estas señales determina por sí sola la causa — conviene registrarla igual.

# Por qué importa

Puede afectar el funcionamiento o la apariencia de la ventana.

# Recomendación

Registra el sector específico con foto.

# Fuente

- **Criterio interno**: comprobación visual básica del marco — no requiere conocimiento técnico especializado.
- **Referencia de fabricante/instalador**: guías de instalación de ventanas de aluminio (Corporación Limatambo y guías genéricas del rubro).

No existe fuente ITO ni Manual de Tolerancias CDT específica para daño post-ocupación del marco — criterio construido con guías de fabricante/instalador como respaldo adicional.`,
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
      question: "¿El vidrio presenta rayas, trizaduras u otros daños visibles?",
      order: 4,
      technicalArticleSlug: "ventana-vidrio-danos-visibles",
    },
    {
      question: "Si la ventana es de termopanel (doble vidrio), ¿se ve condensación o empañamiento ENTRE los vidrios?",
      order: 5,
      technicalArticleSlug: "ventana-vidrio-condensacion-interna",
    },
    {
      question: "¿El sello entre el marco de la ventana y el muro se ve continuo, sin separaciones ni grietas?",
      order: 6,
      technicalArticleSlug: "ventana-sello-marco-muro",
    },
    {
      question: "¿El marco de la ventana presenta golpes, rayas profundas o deformaciones visibles?",
      order: 7,
      technicalArticleSlug: "ventana-marco-danos-visibles",
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

  console.log("\nFase 11T: cierre técnico de Ventana — 4 revisiones nuevas creadas/actualizadas (7 activas en total).");
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
