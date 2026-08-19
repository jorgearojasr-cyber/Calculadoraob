import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

// Fase 11AD (docs/FASE11AD_INFORME_COCINA_LOTE_C.md) — Cocina Lote C:
// Muebles de cocina + Cubierta/Mesón, cerrados técnica y editorialmente
// en Fase 11AC (docs/FASE11AC_CIERRE_TECNICO_MUEBLES_COCINA.md), que
// CORRIGE a Fase 11Z. Las 5 revisiones, sus `defaultSeverity` y sus 5
// guías son las FINALES de 11AC — no las 7 candidatas originales de 11Z.
//
// Este script SOLO agrega catálogo nuevo, aditivo e idempotente:
//   - 2 InspectionElementTemplate (`muebles-cocina`, `cubierta-meson`).
//   - 5 InspectionChecklistItem (3 + 2), con `defaultSeverity` real.
//   - 5 TechnicalArticle (formato de 7 secciones estándar, contenido
//     verbatim de las guías Q1-Q5 de Fase 11AC).
//
// CRÍTICO — igual que Puerta (Fase 11AA) y los 3 componentes derivados de
// Lote B (Fase 11AB): estos 2 componentes son 100% Nivel 2. Este script
// NO crea ningún vínculo `InspectionElementTemplateSpace`.
// `saveSpaceLevel2ConfigAction` crea el `InspectionElement` directamente
// por `elementTemplate.key` cuando el usuario responde "Sí" — sin
// necesitar ningún vínculo de catálogo. Confirmado por Fase 11AB-P
// (sección D/AA de ese informe): el código de producción actualmente
// desplegado solo genera automáticamente elementos que tienen fila en
// `InspectionElementTemplateSpace`; sin ese vínculo, `muebles-cocina` y
// `cubierta-meson` quedan 100% inertes para el código desplegado — sin
// ninguna ventana insegura, seguro de ejecutar contra la BD compartida
// ahora mismo.
async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  // 1) Crear/actualizar los 2 elementTemplate, transversales (sin
  // sufijo de recinto, aunque hoy solo se vinculan a Cocina — mismo
  // criterio ya usado en Lote B, ver informe 11AC sección U).
  const newElements = [
    { key: "muebles-cocina", label: "Muebles de cocina", order: 16, appliesTo: ["CASA", "DEPARTAMENTO", "AMPLIACION"] as const },
    { key: "cubierta-meson", label: "Cubierta / Mesón", order: 17, appliesTo: ["CASA", "DEPARTAMENTO", "AMPLIACION"] as const },
  ];
  const elementByKey = new Map<string, { id: string }>();
  for (const e of newElements) {
    const row = await prisma.inspectionElementTemplate.upsert({
      where: { key: e.key },
      update: { label: e.label, order: e.order, appliesTo: [...e.appliesTo], active: true },
      create: { key: e.key, label: e.label, order: e.order, appliesTo: [...e.appliesTo] },
    });
    elementByKey.set(e.key, row);
    console.log(`OK: elemento "${e.label}" (key=${e.key}, id=${row.id})`);
  }

  // 2) TechnicalArticle — 5, contenido verbatim de las guías Q1-Q5 del
  // informe 11AC. Ninguna revisión cita el Manual de Tolerancias (cap.
  // 22) como respaldo directo — el capítulo es 100% dimensional
  // (verificable solo con instrumento graduado), sin ningún criterio de
  // funcionamiento, fijación o daños visibles. Declarado honestamente
  // como criterio interno en las 5 fuentes, sin inflar el respaldo.
  const articles = [
    {
      slug: "muebles-cocina-funcionamiento",
      title: "Cómo revisar el funcionamiento de puertas y cajones de los muebles de cocina",
      content: `# Qué revisar

Si las puertas y cajones de los muebles de cocina abren, cierran o deslizan correctamente.

# Cómo revisarlo

Abre y cierra cada puerta, y saca y guarda cada cajón que exista. Revisa solo los elementos que existan — no todas las cocinas tienen cajones o puertas en todos sus muebles.

# Qué debería verse

Puertas que abren y cierran sin forzar ni rozar. Cajones que corren de forma pareja, sin trabarse a mitad de camino.

# Qué señales pueden indicar un problema

- Una puerta que roza el mueble vecino o el piso al abrir.
- Una puerta que no cierra del todo o que se abre sola.
- Un cajón que se traba, se sale de su riel o cuesta mucho abrir/cerrar.

# Por qué importa

Un mecanismo que no opera bien puede empeorar con el uso diario y suele ser más fácil de ajustar cuanto antes se detecta.

# Recomendación

Registra qué puerta o cajón específico falla, con una foto si es posible. No es necesario ajustar ni desarmar nada tú mismo.

# Fuente

- Criterio interno del proyecto, mismo estándar ya usado en Puerta ("¿Cierra correctamente?") y Ventana. El Manual de Tolerancias (cap. 22, Muebles Incorporados) no mide funcionamiento — solo alineación dimensional con instrumento.`,
    },
    {
      slug: "muebles-cocina-fijacion",
      title: "Cómo revisar la fijación y estabilidad de los muebles de cocina",
      content: `# Qué revisar

Si los muebles de cocina se sienten firmes y bien sujetos a la pared o al piso, sin moverse.

# Cómo revisarlo

Observa el mueble y tócalo suavemente con la mano (un empujón leve, sin forzar). Presta especial atención a los muebles aéreos (los que están sobre la altura de la cabeza), donde un mal anclaje es más riesgoso.

# Qué debería verse

El mueble no se mueve ni se balancea al tocarlo levemente. No hay separación visible entre el mueble y la pared donde debería estar fijo.

# Qué señales pueden indicar un problema

- El mueble se mueve o balancea al tocarlo con suavidad.
- Se ve una separación entre el mueble y el muro donde debería estar anclado.
- Un mueble aéreo que se ve inclinado o más bajo de un lado.

# Por qué importa

Un mueble mal fijado — sobre todo uno aéreo, sobre la cabeza — es un riesgo real de caída, no solo un defecto estético.

# Recomendación

No te cuelgues del mueble, no apliques fuerza excesiva y no intentes desarmarlo ni retirar sus fijaciones. Si notas movimiento, regístralo con foto y descríbelo — no te acerques con la cabeza debajo de un mueble aéreo que sospechas suelto.

# Fuente

- Criterio interno del proyecto. El Manual de Tolerancias (cap. 22) no incluye ningún criterio de fijación o estabilidad estructural.`,
    },
    {
      slug: "muebles-cocina-danos-visibles",
      title: "Cómo revisar daños visibles en los muebles de cocina",
      content: `# Qué revisar

Si los muebles de cocina presentan golpes, quiebres, rayas profundas u otros daños visibles.

# Cómo revisarlo

Recorre visualmente los muebles con buena luz, observando puertas, cajones y costados.

# Qué debería verse

Superficies sin golpes que expongan el material base, sin piezas quebradas o faltantes, sin rayas profundas que se sientan al pasar la uña.

# Qué señales pueden indicar un problema

- Un golpe que dejó una marca visible o expuso el material base.
- Una pieza quebrada, astillada o faltante.
- Una raya profunda (se siente al pasar la uña, no solo se ve).

Las vetas naturales de la madera, pequeñas diferencias de brillo según el ángulo de luz o leves diferencias de tono entre piezas NO son un defecto — son variación normal del material.

# Por qué importa

Un daño visible ya presente en la entrega no va a mejorar con el tiempo, y conviene dejarlo documentado.

# Recomendación

Registra el mueble y la zona específica con una foto clara. No es necesario que evalúes si el daño se puede reparar.

# Fuente

- Criterio interno del proyecto. El Manual de Tolerancias (cap. 22) no incluye ningún criterio sobre daños visibles.`,
    },
    {
      slug: "cubierta-meson-fijacion",
      title: "Cómo revisar la fijación y estabilidad de la cubierta o mesón",
      content: `# Qué revisar

Si la cubierta o mesón de la cocina se ve firme y bien fijada, sin moverse.

# Cómo revisarlo

Observa la cubierta y tócala suavemente con la mano en distintos puntos, especialmente cerca de los bordes y las uniones con los muebles.

# Qué debería verse

La cubierta no se mueve ni se balancea al tocarla levemente, y no hay separación visible entre la cubierta y los muebles o el muro donde debería apoyarse.

# Qué señales pueden indicar un problema

- La cubierta se mueve o cede al presionarla suavemente.
- Se ve una separación entre la cubierta y los muebles o el muro de apoyo.

# Por qué importa

Una cubierta mal fijada puede indicar un problema en su soporte y empeorar con el uso normal (apoyar objetos, cocinar).

# Recomendación

No apliques fuerza excesiva ni te apoyes con todo tu peso para probarla. Si notas movimiento, regístralo con foto.

# Fuente

- Criterio interno del proyecto. El Manual de Tolerancias (cap. 22) da solo la horizontalidad dimensional de la superficie (1 mm por metro lineal, verificable con nivel), no un criterio de fijación.`,
    },
    {
      slug: "cubierta-meson-danos-sellos",
      title: "Cómo revisar daños y sellos de la cubierta o mesón",
      content: `# Qué revisar

Si la cubierta o mesón presenta daños visibles, o si el sello (silicona o masilla) en su encuentro con el muro se ve continuo, sin separaciones ni grietas.

# Cómo revisarlo

Recorre visualmente la cubierta con buena luz, observando la superficie y el borde donde se encuentra con el muro.

# Qué debería verse

Superficie sin golpes, rayas profundas ni quiebres. El sello con el muro se ve continuo en todo su largo visible, sin cortes ni separaciones.

# Qué señales pueden indicar un problema

- Un golpe, quiebre o raya profunda en la superficie de la cubierta.
- Una separación o grieta visible en el sello entre la cubierta y el muro.

# Por qué importa

Un daño en la cubierta es un defecto visible y de uso diario. Una separación en el sello con el muro puede dejar pasar agua hacia zonas que no deberían mojarse — conviene documentarlo aunque hoy se vea seco.

# Recomendación

Registra el sector específico con una foto. No intentes resellar ni reparar nada tú mismo.

# Fuente

- Criterio interno del proyecto. El Manual de Tolerancias (cap. 22) no menciona sellos ni encuentros cubierta-muro — el criterio del sello es una analogía con el ya usado en Ventana (sello marco-muro), declarada explícitamente como criterio interno, no como respaldo del Manual de Cocina.`,
    },
  ];

  for (const a of articles) {
    await prisma.technicalArticle.upsert({
      where: { slug: a.slug },
      update: { title: a.title, content: a.content },
      create: { slug: a.slug, title: a.title, content: a.content },
    });
  }
  console.log(`OK: ${articles.length} artículos técnicos creados/actualizados.`);

  // 3) InspectionChecklistItem — 3 para Muebles, 2 para Cubierta.
  // `defaultSeverity` EXACTO según la matriz final de Fase 11AC (sección
  // P): ninguna se homogeniza a MEDIUM ni se eleva automáticamente a
  // HIGH salvo la fijación de Muebles (único riesgo real de caída,
  // muebles aéreos).
  const newItems = [
    {
      elementKey: "muebles-cocina",
      question: "¿Las puertas y cajones abren, cierran o deslizan correctamente (cuando existan)?",
      order: 0,
      technicalArticleSlug: "muebles-cocina-funcionamiento",
      defaultSeverity: "MEDIUM" as const,
    },
    {
      elementKey: "muebles-cocina",
      question: "¿Los muebles se sienten firmes y bien sujetos, sin moverse al tocarlos?",
      order: 1,
      technicalArticleSlug: "muebles-cocina-fijacion",
      defaultSeverity: "HIGH" as const,
    },
    {
      elementKey: "muebles-cocina",
      question: "¿Los muebles presentan golpes, quiebres, rayas profundas u otros daños visibles?",
      order: 2,
      technicalArticleSlug: "muebles-cocina-danos-visibles",
      defaultSeverity: "LOW" as const,
    },
    {
      elementKey: "cubierta-meson",
      question: "¿La cubierta o mesón se ve firme y bien fijada, sin moverse al tocarla?",
      order: 0,
      technicalArticleSlug: "cubierta-meson-fijacion",
      defaultSeverity: "MEDIUM" as const,
    },
    {
      elementKey: "cubierta-meson",
      question: "¿La cubierta presenta daños visibles o separaciones/grietas en el encuentro con el muro?",
      order: 1,
      technicalArticleSlug: "cubierta-meson-danos-sellos",
      defaultSeverity: "LOW" as const,
    },
  ];

  for (const item of newItems) {
    const elementTemplateId = elementByKey.get(item.elementKey)!.id;
    const existing = await prisma.inspectionChecklistItem.findFirst({
      where: { elementTemplateId, question: item.question },
    });
    if (existing) {
      await prisma.inspectionChecklistItem.update({
        where: { id: existing.id },
        data: { order: item.order, technicalArticleSlug: item.technicalArticleSlug, defaultSeverity: item.defaultSeverity, active: true },
      });
      console.log(`OK: pregunta actualizada (id ${existing.id}, severity=${item.defaultSeverity}): "${item.question}" [${item.elementKey}]`);
    } else {
      const created = await prisma.inspectionChecklistItem.create({
        data: {
          elementTemplateId,
          question: item.question,
          order: item.order,
          technicalArticleSlug: item.technicalArticleSlug,
          defaultSeverity: item.defaultSeverity,
          active: true,
        },
      });
      console.log(`OK: pregunta creada (id ${created.id}, severity=${item.defaultSeverity}): "${item.question}" [${item.elementKey}]`);
    }
  }

  // 4) Confirmación de solo lectura: ningún vínculo InspectionElementTemplateSpace
  // se crea para estos 2 componentes — se resuelven 100% vía Nivel 2,
  // igual que Puerta y los 3 derivados de Lote B.
  console.log(
    "\nOK: NO se crearon vínculos InspectionElementTemplateSpace para muebles-cocina/cubierta-meson (mismo patrón que Puerta y Lote B) — el código de producción actual no puede generarlos automáticamente."
  );

  console.log(
    "\nFase 11AD: Cocina Lote C — Muebles de cocina + Cubierta/Mesón creados en catálogo (inertes hasta que el código Nivel 2 correspondiente se publique)."
  );
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
