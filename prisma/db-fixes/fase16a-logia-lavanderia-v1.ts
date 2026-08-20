import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

// Fase 16A (docs/FASE16A_IMPLEMENTACION_QA_LOGIA_LAVANDERIA_V1.md) — cierra
// `logia-lavanderia`, el único recinto clasificado COMPLEJO en el barrido de
// Fase 15A (template activo, 0 elementos vinculados, 0 checks generados).
//
// Arquitectura decidida:
// - BASE (5 vínculos nuevos, 100% catálogo existente reutilizado):
//   piso, muros, enchufes-interruptores, cielo, iluminacion — mismo patrón
//   ya usado en Cocina/Baño/Dormitorio/Living-comedor/Living/Comedor para
//   cualquier recinto interior cerrado.
// - LEVEL 2 (7 decisiones, agregadas en space-config.ts, NO en este script):
//   3 terminaciones reutilizadas + Ventana/Puerta reutilizadas (sin base
//   link, igual que Puerta en Cocina) + 2 componentes NUEVOS de agua/desagüe
//   (`conexion-lavadora`, `lavadero`) — los únicos 2 templates de catálogo
//   nuevo de esta fase, evaluados contra Lavaplatos/Lavamanos y descartados
//   como reutilización directa por tener semántica propia (conexión de
//   electrodoméstico vs. artefacto sanitario instalado).
//
// Este script crea: 2 InspectionElementTemplate, 8 InspectionChecklistItem,
// 8 TechnicalArticle, y 5 vínculos InspectionElementTemplateSpace de base.
// NO modifica ningún caso/espacio existente.
//
// Ejecutar: npx tsx prisma/db-fixes/fase16a-logia-lavanderia-v1.ts

type ChecklistItemSeed = {
  question: string;
  order: number;
  defaultSeverity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  slug: string;
  title: string;
  content: string;
};

const CONEXION_LAVADORA_CHECKS: ChecklistItemSeed[] = [
  {
    question: "¿La llave de agua para la lavadora abre y cierra correctamente?",
    order: 0,
    defaultSeverity: "MEDIUM",
    slug: "conexion-lavadora-llave",
    title: "Cómo revisar la llave de agua para la lavadora",
    content: `# Qué revisar

Si la llave (o llaves) de agua destinada a conectar la lavadora abre y cierra con normalidad.

# Cómo revisarlo

Acciona la llave con la mano, sin forzarla. Si tiene manilla o perilla, gírala en ambos sentidos.

# Qué debería verse

La llave gira o se acciona sin resistencia excesiva ni holgura, y cierra completamente (no queda goteando al cerrar).

# Qué señales pueden indicar un problema

- La llave no gira, está trabada o muy dura de accionar.
- Gotea agua después de cerrarla completamente.
- La manilla o perilla está rota, floja o ausente.

# Por qué importa

Una llave que no cierra bien o está dañada puede generar una fuga sostenida una vez conectada la lavadora, además de dificultar o impedir la conexión del electrodoméstico.

# Recomendación

Si detectas algún problema, regístralo como observación con foto. No es necesario conectar una lavadora para esta revisión — basta con accionar la llave existente.

# Fuente

- **Criterio interno**: no existe una partida específica para conexiones de lavadora en el Manual de Tolerancias ni en el catálogo educativo ITO consultados — revisión basada en criterio de funcionamiento básico de llaves de agua, sin atribuir normativa que no la respalda.`,
  },
  {
    question: "Al abrir la llave brevemente, ¿se observa alguna fuga visible en la conexión?",
    order: 1,
    defaultSeverity: "HIGH",
    slug: "conexion-lavadora-fugas",
    title: "Cómo revisar fugas en la conexión de agua de la lavadora",
    content: `# Qué revisar

Si al abrir brevemente la llave de agua se observa alguna fuga o goteo en la conexión, la manguera o sus uniones.

# Cómo revisarlo

Abre la llave por unos segundos (con una manguera o tapón puesto si existe, o solo observando la salida si no hay nada conectado) y observa las uniones visibles. Cierra después de la prueba.

# Qué debería verse

Ninguna fuga ni goteo visible en la llave, sus uniones o la conexión durante la prueba.

# Qué señales pueden indicar un problema

- Goteo o chorro visible en cualquier unión mientras corre el agua.
- Humedad ya presente en la pared o el piso alrededor de la conexión, aunque no veas el goteo en el momento.

No es necesario identificar si la falla es la llave, una unión o una manguera específica — con reportar que hay fuga y su ubicación aproximada alcanza.

# Por qué importa

Una fuga sostenida en la conexión de la lavadora puede dañar el piso, los muros o generar humedad oculta, especialmente si el electrodoméstico permanece conectado de forma permanente.

# Recomendación

Si detectas cualquier fuga, regístrala como observación con foto. No desarmes ninguna conexión ni fuerces la llave — la observación visual, con la llave abierta brevemente, es suficiente.

# Fuente

- **Criterio interno**: no existe una partida específica para conexiones de lavadora en las fuentes consultadas — revisión basada en el mismo criterio de fugas visibles ya usado para artefactos sanitarios (Lavaplatos/Lavamanos), adaptado a una conexión de electrodoméstico.`,
  },
  {
    question: "¿El desagüe visible para la lavadora está presente y sin fuga?",
    order: 2,
    defaultSeverity: "MEDIUM",
    slug: "conexion-lavadora-desague",
    title: "Cómo revisar el desagüe de la lavadora",
    content: `# Qué revisar

Si existe un desagüe (punto de descarga) visible destinado a la lavadora, y si se ve sin fugas ni obstrucciones evidentes.

# Cómo revisarlo

Observa el punto de desagüe (tubo, rejilla o conexión visible). Si es posible, vierte un poco de agua para confirmar que escurre con normalidad, sin desbordarse ni filtrar por fuera del ducto.

# Qué debería verse

El desagüe está presente, fijo en su lugar, y el agua vertida escurre sin desbordarse ni filtrar por fuera del punto de descarga.

# Qué señales pueden indicar un problema

- No existe ningún punto de desagüe visible destinado a la lavadora.
- El agua se desborda, escurre lentamente o filtra por fuera del ducto.
- El tubo o conexión de desagüe está suelto, roto o desconectado.

# Por qué importa

Un desagüe ausente, mal instalado u obstruido provoca desbordes de agua durante el uso normal de la lavadora, con riesgo de daño al piso y muros del recinto.

# Recomendación

Si detectas algún problema, regístralo como observación con foto. No intentes destapar ni intervenir el ducto de desagüe — la observación visual es suficiente para dejar constancia.

# Fuente

- **Criterio interno**: no existe una partida específica para desagües de lavadora en las fuentes consultadas — revisión basada en criterio general de funcionamiento visible de un punto de desagüe.`,
  },
  {
    question: "¿Los componentes visibles (llave, mangueras, conexiones) se ven firmes y sin daños?",
    order: 3,
    defaultSeverity: "LOW",
    slug: "conexion-lavadora-firmeza",
    title: "Cómo revisar la firmeza de la conexión de la lavadora",
    content: `# Qué revisar

Si la llave, las mangueras (si existen) y las conexiones visibles para la lavadora se ven firmes, bien fijadas y sin daños.

# Cómo revisarlo

Observa el conjunto y toca suavemente la llave y las conexiones visibles, sin forzarlas.

# Qué debería verse

La llave está firme en el muro, sin moverse al tocarla. Las mangueras o conexiones (si existen) están bien conectadas, sin dobleces forzados, cortes ni desgaste visible.

# Qué señales pueden indicar un problema

- La llave se mueve o está suelta en el muro.
- Mangueras con cortes, grietas o desgaste visible.
- Conexiones que se ven mal ajustadas o a punto de soltarse.

# Por qué importa

Una conexión floja o dañada puede soltarse durante el uso normal de la lavadora, provocando una fuga repentina de mayor volumen que un goteo simple.

# Recomendación

Si detectas algún problema, regístralo como observación con foto. No manipules ni ajustes las conexiones — la observación visual es suficiente.

# Fuente

- **Criterio interno**: no existe una partida específica para conexiones de lavadora en las fuentes consultadas — revisión basada en el mismo criterio de firmeza ya usado para artefactos sanitarios, adaptado a esta conexión.`,
  },
];

const LAVADERO_CHECKS: ChecklistItemSeed[] = [
  {
    question: "¿La grifería del lavadero abre y cierra correctamente, sin quedar goteando?",
    order: 0,
    defaultSeverity: "MEDIUM",
    slug: "lavadero-griferia",
    title: "Cómo revisar la grifería del lavadero",
    content: `# Qué revisar

Si la grifería (llave o mezclador) del lavadero abre y cierra con normalidad, y si queda goteando después de cerrarla.

# Cómo revisarlo

Abre y cierra la grifería con la mano, sin forzarla, probando el recorrido completo.

# Qué debería verse

La grifería abre y cierra sin resistencia excesiva ni holgura, y no gotea una vez cerrada completamente.

# Qué señales pueden indicar un problema

- La grifería está dura, trabada o floja al accionarla.
- Gotea agua después de cerrarla completamente.
- La manilla está rota o ausente.

# Por qué importa

Una grifería que no cierra bien genera goteo constante, con desperdicio de agua y humedad sostenida en el lavadero.

# Recomendación

Si detectas algún problema, regístralo como observación con foto.

# Fuente

- **Criterio interno adaptado**: mismo patrón ya usado para revisar grifería de Lavaplatos/Lavamanos, aplicado al lavadero de logia — no existe una partida específica para lavaderos en el Manual de Tolerancias ni en el catálogo educativo ITO consultados.`,
  },
  {
    question: "Al dejar correr agua, ¿se observa alguna fuga o goteo bajo el lavadero?",
    order: 1,
    defaultSeverity: "HIGH",
    slug: "lavadero-fugas",
    title: "Cómo revisar fugas bajo el lavadero",
    content: `# Qué revisar

Si al dejar correr agua por el lavadero se observa alguna fuga o goteo bajo la pileta o en sus conexiones.

# Cómo revisarlo

Deja correr agua por un momento y observa el sifón, las uniones visibles y la zona bajo el lavadero, buscando agua, goteo o humedad.

# Qué debería verse

Todo seco durante y después de dejar correr el agua — sin goteo, humedad ni agua acumulada bajo el lavadero.

# Qué señales pueden indicar un problema

- Goteo visible en cualquier punto mientras corre el agua.
- Humedad o agua acumulada bajo el lavadero, aunque no veas el goteo en el momento.
- Manchas de humedad ya secas, que indican una fuga anterior.

No es necesario identificar si la falla es el sifón, una unión o una conexión específica — con reportar que hay fuga y su ubicación aproximada alcanza.

# Por qué importa

Una fuga bajo el lavadero puede dañar el piso o generar humedad sostenida si no se corrige a tiempo, especialmente porque suele quedar oculta bajo la pileta.

# Recomendación

Si detectas cualquier señal de fuga o humedad, regístrala como observación con foto. No desarmes el sifón ni intervengas ninguna conexión — la observación visual es suficiente.

# Fuente

- **Criterio interno adaptado**: mismo patrón ya usado para revisar fugas bajo Lavaplatos/Lavamanos, aplicado al lavadero de logia.`,
  },
  {
    question: "¿El lavadero se ve firme y bien instalado, sin moverse al tocarlo?",
    order: 2,
    defaultSeverity: "LOW",
    slug: "lavadero-firmeza",
    title: "Cómo revisar la firmeza del lavadero",
    content: `# Qué revisar

Si el lavadero (pileta) se ve firme, bien fijado a su soporte o mueble, sin moverse.

# Cómo revisarlo

Toca suavemente el borde del lavadero con la mano, sin forzarlo ni apoyar todo el peso del cuerpo.

# Qué debería verse

El lavadero no se mueve ni cede al tocarlo suavemente.

# Qué señales pueden indicar un problema

- El lavadero se mueve, bascula o cede al tocarlo.
- Se ven separaciones entre el lavadero y su soporte o mueble.

# Por qué importa

Un lavadero mal fijado puede soltarse con el uso normal (apoyar peso, lavar ropa pesada), además de forzar sus conexiones de agua y desagüe.

# Recomendación

Si detectas movimiento o inestabilidad, regístralo como observación con foto. No fuerces el lavadero para probar su resistencia máxima — un toque suave es suficiente.

# Fuente

- **Criterio interno adaptado**: mismo patrón ya usado para revisar firmeza de Lavaplatos/Lavamanos, aplicado al lavadero de logia.`,
  },
  {
    question: "¿El sello alrededor del lavadero se ve continuo, sin separaciones ni grietas?",
    order: 3,
    defaultSeverity: "LOW",
    slug: "lavadero-sello",
    title: "Cómo revisar el sello del lavadero",
    content: `# Qué revisar

Si el sello (silicona o masilla) entre el lavadero y la superficie donde está instalado (cubierta, muro o mueble) se ve continuo, sin separaciones ni grietas.

# Cómo revisarlo

Observa visualmente todo el perímetro de contacto entre el lavadero y la superficie donde se apoya o encaja.

# Qué debería verse

Un sello continuo en todo el perímetro visible, sin cortes, separaciones ni grietas.

# Qué señales pueden indicar un problema

- Separaciones o espacios visibles entre el lavadero y la superficie.
- Sello agrietado, despegado o con partes faltantes.
- Manchas de humedad junto al sello, que sugieren filtración.

# Por qué importa

Un sello discontinuo permite que el agua se filtre hacia zonas ocultas (muro, mueble o piso), generando humedad y daño con el tiempo.

# Recomendación

Si detectas separaciones o grietas, regístralas como observación con foto, indicando el tramo afectado.

# Fuente

- **Criterio interno adaptado**: mismo patrón ya usado para revisar el sello de Lavaplatos/Lavamanos, aplicado al lavadero de logia.`,
  },
];

async function upsertElement(
  prisma: PrismaClient,
  key: string,
  label: string,
  checks: ChecklistItemSeed[]
) {
  const element = await prisma.inspectionElementTemplate.upsert({
    where: { key },
    update: { label, appliesTo: ["CASA", "DEPARTAMENTO"] },
    create: { key, label, appliesTo: ["CASA", "DEPARTAMENTO"], order: 0 },
  });
  console.log(`OK: template ${key} (${element.id})`);

  for (const c of checks) {
    const article = await prisma.technicalArticle.upsert({
      where: { slug: c.slug },
      update: { title: c.title, content: c.content },
      create: { slug: c.slug, title: c.title, content: c.content, order: c.order },
    });
    console.log(`  OK: artículo ${c.slug}`);

    const existingItem = await prisma.inspectionChecklistItem.findFirst({
      where: { elementTemplateId: element.id, question: c.question },
    });
    if (existingItem) {
      await prisma.inspectionChecklistItem.update({
        where: { id: existingItem.id },
        data: { order: c.order, defaultSeverity: c.defaultSeverity, technicalArticleSlug: article.slug },
      });
      console.log(`  OK: check actualizado "${c.question}"`);
    } else {
      await prisma.inspectionChecklistItem.create({
        data: {
          elementTemplateId: element.id,
          question: c.question,
          order: c.order,
          defaultSeverity: c.defaultSeverity,
          technicalArticleSlug: article.slug,
        },
      });
      console.log(`  OK: check creado "${c.question}"`);
    }
  }

  return element;
}

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  await upsertElement(prisma, "conexion-lavadora", "Conexión de lavadora", CONEXION_LAVADORA_CHECKS);
  await upsertElement(prisma, "lavadero", "Lavadero / Pileta", LAVADERO_CHECKS);

  const logia = await prisma.inspectionSpaceTemplate.findUniqueOrThrow({ where: { key: "logia-lavanderia" } });

  const baseLinks = [
    { key: "piso", order: 0 },
    { key: "muros", order: 1 },
    { key: "enchufes-interruptores", order: 2 },
    { key: "cielo", order: 3 },
    { key: "iluminacion", order: 4 },
  ];
  for (const link of baseLinks) {
    const element = await prisma.inspectionElementTemplate.findUniqueOrThrow({ where: { key: link.key } });
    const existingLink = await prisma.inspectionElementTemplateSpace.findFirst({
      where: { spaceTemplateId: logia.id, elementTemplateId: element.id },
    });
    if (existingLink) {
      await prisma.inspectionElementTemplateSpace.update({ where: { id: existingLink.id }, data: { order: link.order } });
      console.log(`OK: vínculo base actualizado logia-lavanderia <-> ${link.key} (order=${link.order})`);
    } else {
      await prisma.inspectionElementTemplateSpace.create({
        data: { spaceTemplateId: logia.id, elementTemplateId: element.id, order: link.order },
      });
      console.log(`OK: vínculo base creado logia-lavanderia <-> ${link.key} (order=${link.order})`);
    }
  }

  const finalLinks = await prisma.inspectionElementTemplateSpace.findMany({
    where: { spaceTemplateId: logia.id },
    include: { elementTemplate: true },
    orderBy: { order: "asc" },
  });
  console.log("\nVínculos finales de logia-lavanderia:");
  for (const l of finalLinks) console.log(`  order=${l.order} key=${l.elementTemplate.key}`);

  console.log("\nFase 16A: logia-lavanderia — base (piso/muros/enchufes/cielo/iluminacion) + catálogo nuevo (conexion-lavadora, lavadero) creado/confirmado.");
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
