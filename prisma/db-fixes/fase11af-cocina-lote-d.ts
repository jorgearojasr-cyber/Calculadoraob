// Fase 11AF — Cocina Lote D: Lavaplatos / Agua y Desagüe
// (docs/FASE11AF_INFORME_COCINA_LOTE_D.md), diseño cerrado técnicamente
// en Fase 11AE (docs/FASE11AE_CIERRE_TECNICO_LAVAPLATOS_COCINA.md).
//
// Crea 1 InspectionElementTemplate ("lavaplatos"), 5 InspectionChecklistItem
// y 5 TechnicalArticle. Idempotente (upsert). Deliberadamente NO crea
// ningún InspectionElementTemplateSpace — mismo patrón 100% Nivel 2 ya
// usado para Puerta (11AA), las 3 terminaciones de Lote B (11AB) y
// Muebles/Cubierta (11AD): el componente solo puede crearse vía
// saveSpaceLevel2ConfigAction, nunca vía generación automática de
// createInspectionAndGenerateAction. Grifería/Fugas/Fijación/Sello NO son
// componentes propios (sin key propia) — viven como checklist dentro del
// único elemento "lavaplatos".
//
// Ejecutar: npx tsx prisma/db-fixes/fase11af-cocina-lote-d.ts

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const lavaplatos = await prisma.inspectionElementTemplate.upsert({
    where: { key: "lavaplatos" },
    update: {},
    create: {
      key: "lavaplatos",
      label: "Lavaplatos",
      order: 18,
      appliesTo: ["CASA", "DEPARTAMENTO", "AMPLIACION"],
    },
  });
  console.log(`OK: elemento "${lavaplatos.label}" (key=${lavaplatos.key}, id=${lavaplatos.id})`);

  const articles: { slug: string; title: string; content: string }[] = [
    {
      slug: "lavaplatos-griferia-funcionamiento",
      title: "Cómo revisar el funcionamiento de la grifería del lavaplatos",
      content: `# Qué revisar

Si la grifería del lavaplatos abre y cierra correctamente, sin quedar goteando después de cerrarla.

# Cómo revisarlo

Abre la llave del lavaplatos y luego ciérrala por completo. Observa la salida del grifo durante unos segundos después de cerrada.

# Qué debería verse

La llave cierra por completo sin resistencia excesiva, y no queda goteando desde la salida después de cerrada.

# Qué señales pueden indicar un problema

- La llave sigue goteando desde la salida después de cerrada por completo.
- La llave cuesta mucho cerrar o queda con holgura evidente.

# Por qué importa

Una llave que gotea, aunque sea poco, representa un gasto de agua sostenido en el tiempo y suele ser más fácil de resolver mientras la vivienda todavía está en garantía o en proceso de entrega.

# Recomendación

Si detectas goteo, regístralo como observación con foto o video corto. No es necesario desarmar la llave ni intervenir sus conexiones internas — con abrir/cerrar y observar alcanza para dejar constancia.

# Fuente

- **Criterio interno adaptado**: catálogo educativo ITO (265 puntos), sección Grifería — mismo criterio ya usado para revisar goteras y filtraciones en llaves de Baño, aplicado aquí a la grifería del lavaplatos.`,
    },
    {
      slug: "lavaplatos-agua-fria-caliente",
      title: "Cómo revisar el agua fría y caliente del lavaplatos",
      content: `# Qué revisar

Si funcionan correctamente el agua fría y caliente de la grifería del lavaplatos, cuando la instalación dispone de ambas.

# Cómo revisarlo

Mueve la llave a la posición de agua fría y confirma que sale agua. Muévela a la posición de agua caliente y confirma que también sale agua (no es necesario medir cuánto demora en calentarse ni la temperatura exacta).

# Qué debería verse

Sale agua en ambas posiciones de la llave, cuando la cocina tiene ambas redes conectadas.

# Qué señales pueden indicar un problema

- No sale agua en una de las dos posiciones, estando la instalación diseñada para tener ambas.

Si la cocina solo tiene agua fría por diseño de la vivienda, marca esta revisión como "No corresponde" — no es un defecto.

# Por qué importa

La ausencia de una de las dos redes de agua, cuando debería estar disponible, es una falla de instalación que conviene detectar antes de dar por recibida la vivienda.

# Recomendación

Si falta una de las dos redes y debería estar disponible, regístralo como observación. No es necesario diagnosticar la causa (calefón, llave de paso, cañería) — basta con reportar qué red no entrega agua.

# Fuente

- **Criterio interno del proyecto**, comprobación funcional directa, sin fuente normativa aplicable.`,
    },
    {
      slug: "lavaplatos-fugas",
      title: "Cómo revisar fugas bajo el lavaplatos",
      content: `# Qué revisar

Si al dejar correr agua por el lavaplatos se observa alguna fuga o goteo bajo el mueble.

# Cómo revisarlo

Abre el mueble bajo el lavaplatos (si es un mueble cerrado) y deja correr agua por un momento. Observa el sifón, las uniones y conexiones visibles, y la parte inferior de la cubeta, buscando agua, goteo o humedad.

# Qué debería verse

Todo seco durante y después de dejar correr el agua — sin goteo, humedad ni agua acumulada en el fondo del mueble.

# Qué señales pueden indicar un problema

- Goteo visible en cualquier punto mientras corre el agua.
- Humedad o agua acumulada en el fondo del mueble, aunque no veas el goteo en el momento.
- Manchas de humedad ya secas, que indican una fuga anterior.

No es necesario identificar si la falla es el sifón, una unión o una conexión específica — con reportar que hay fuga y su ubicación aproximada alcanza.

# Por qué importa

Una fuga bajo el lavaplatos puede dañar el mueble, el piso o generar humedad sostenida si no se corrige a tiempo — es la revisión de mayor importancia de este componente porque el agua queda oculta dentro de un mueble cerrado y puede pasar desapercibida por mucho tiempo.

# Recomendación

Si detectas cualquier señal de fuga o humedad, regístrala como observación con foto, indicando el punto donde la observaste. No desarmes el sifón ni intervengas ninguna conexión — la observación visual, con el mueble abierto, es suficiente para dejar constancia.

# Fuente

- **Criterio interno adaptado**: catálogo educativo ITO (265 puntos), sección Artefactos sanitarios — mismo patrón ya usado para revisar fugas visibles en la base de artefactos de Baño, aplicado aquí de forma consolidada al conjunto sifón/conexiones/base del lavaplatos.`,
    },
    {
      slug: "lavaplatos-fijacion",
      title: "Cómo revisar la fijación del lavaplatos",
      content: `# Qué revisar

Si el lavaplatos se ve firme y bien instalado, sin moverse al tocarlo.

# Cómo revisarlo

Observa el lavaplatos y tócalo suavemente con la mano (un contacto leve, sin forzar ni presionar con todo el peso).

# Qué debería verse

El lavaplatos no se mueve ni se balancea al tocarlo levemente, y no hay separación visible entre el lavaplatos y la cubierta o mueble donde está instalado.

# Qué señales pueden indicar un problema

- El lavaplatos se mueve o cede al tocarlo con suavidad.
- Se ve una separación entre el lavaplatos y la cubierta o mueble donde debería estar apoyado o embutido.

# Por qué importa

Un lavaplatos mal instalado puede indicar un defecto de montaje que empeore con el uso diario (llenar, apoyar peso, lavar loza).

# Recomendación

No apliques fuerza excesiva ni te apoyes con todo tu peso para probarlo. Si notas movimiento, regístralo con foto.

# Fuente

- **Criterio interno del proyecto**, mismo estándar ya usado para revisar fijación de muebles de cocina — sin fuente normativa aplicable (el Manual de Tolerancias no trata lavaplatos).`,
    },
    {
      slug: "lavaplatos-sello-perimetral",
      title: "Cómo revisar el sello perimetral del lavaplatos",
      content: `# Qué revisar

Si el sello alrededor del lavaplatos se ve continuo, sin separaciones ni grietas.

# Cómo revisarlo

Recorre visualmente todo el borde donde el lavaplatos se encuentra con la cubierta o el mueble, con buena luz.

# Qué debería verse

El sello (silicona o masilla) continuo en todo el borde visible, sin cortes, separaciones ni grietas.

# Qué señales pueden indicar un problema

- Una separación o corte visible en el sello en cualquier punto del borde.
- Una grieta o zona donde el sello se ve despegado del lavaplatos o de la cubierta.

# Por qué importa

Un sello abierto puede dejar pasar agua de uso normal hacia el interior del mueble, incluso si el lavaplatos está firme y sin fugas en sus conexiones — conviene documentarlo aunque hoy no haya humedad visible.

# Recomendación

Registra el sector específico del borde con una foto clara. No intentes resellar ni reparar nada tú mismo.

# Fuente

- **Criterio interno del proyecto** (analogía con el sello marco-muro ya usado en Ventana) — sin fuente normativa aplicable.`,
    },
  ];

  for (const a of articles) {
    await prisma.technicalArticle.upsert({
      where: { slug: a.slug },
      update: { title: a.title, content: a.content },
      create: a,
    });
    console.log(`OK: artículo "${a.slug}"`);
  }

  const checklistItems: {
    question: string;
    order: number;
    technicalArticleSlug: string;
    defaultSeverity: "LOW" | "MEDIUM" | "HIGH";
  }[] = [
    {
      question: "¿La grifería abre y cierra correctamente, sin quedar goteando?",
      order: 0,
      technicalArticleSlug: "lavaplatos-griferia-funcionamiento",
      defaultSeverity: "LOW",
    },
    {
      question:
        "¿Funcionan correctamente el agua fría y caliente de la grifería, cuando la instalación dispone de ambas?",
      order: 1,
      technicalArticleSlug: "lavaplatos-agua-fria-caliente",
      defaultSeverity: "LOW",
    },
    {
      question: "Al dejar correr agua, ¿se observa alguna fuga o goteo bajo el lavaplatos?",
      order: 2,
      technicalArticleSlug: "lavaplatos-fugas",
      defaultSeverity: "HIGH",
    },
    {
      question: "¿El lavaplatos se ve firme y bien instalado, sin moverse al tocarlo?",
      order: 3,
      technicalArticleSlug: "lavaplatos-fijacion",
      defaultSeverity: "MEDIUM",
    },
    {
      question: "¿El sello alrededor del lavaplatos se ve continuo, sin separaciones ni grietas?",
      order: 4,
      technicalArticleSlug: "lavaplatos-sello-perimetral",
      defaultSeverity: "MEDIUM",
    },
  ];

  for (const item of checklistItems) {
    const existing = await prisma.inspectionChecklistItem.findFirst({
      where: { elementTemplateId: lavaplatos.id, question: item.question },
    });
    if (existing) {
      await prisma.inspectionChecklistItem.update({
        where: { id: existing.id },
        data: { order: item.order, technicalArticleSlug: item.technicalArticleSlug, defaultSeverity: item.defaultSeverity },
      });
    } else {
      await prisma.inspectionChecklistItem.create({
        data: {
          elementTemplateId: lavaplatos.id,
          question: item.question,
          order: item.order,
          technicalArticleSlug: item.technicalArticleSlug,
          defaultSeverity: item.defaultSeverity,
        },
      });
    }
    console.log(`OK: pregunta "${item.question}" (severity=${item.defaultSeverity})`);
  }

  const links = await prisma.inspectionElementTemplateSpace.findMany({ where: { elementTemplateId: lavaplatos.id } });
  console.log(`\nInspectionElementTemplateSpace vinculados a "lavaplatos": ${links.length} (esperado: 0 — componente 100% Nivel 2, sin generación automática).`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
