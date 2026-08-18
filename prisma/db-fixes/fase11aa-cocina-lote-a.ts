import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

// Fase 11AA (docs/FASE11AA_INFORME_COCINA_LOTE_A.md) — Cocina Lote A:
// base transversal (Cielo, Iluminación) + primer Nivel 2 con más de un
// componente (Ventana, Puerta). Este script SOLO agrega catálogo nuevo,
// aditivo e idempotente:
//   - InspectionElementTemplate "cielo" e "iluminacion" (TRANSVERSALES,
//     no "cielo-cocina" — key genérica, reutilizable por otros recintos
//     en fases futuras, aunque en esta fase solo se vinculan a Cocina).
//   - Sus TechnicalArticle (formato de 7 secciones ya estándar).
//   - Vínculos InspectionElementTemplateSpace Cocina->Cielo,
//     Cocina->Iluminación (siempre-presente, sin pregunta Nivel 2).
//
// CRÍTICO — el vínculo Cocina->Ventana YA EXISTE en catálogo y este
// script NO LO TOCA. El desacople para generación de casos nuevos se
// logra 100% en código (LEVEL2_GATED_LINKS en
// src/app/(app)/inspecciones/actions.ts, par "cocina:ventana"), exactamente
// el mismo patrón ya usado con terraza-logia (Fase 11X-P) y Reja/Portón
// (Fase 11Y): mientras el código de producción no conozca Nivel 2 de
// Cocina, sigue generando Ventana automáticamente vía ese mismo vínculo
// de catálogo intacto — ninguna regresión posible en producción con
// solo ejecutar este script.
//
// Tampoco se crea ningún vínculo Cocina->Puerta: `saveSpaceLevel2ConfigAction`
// (Fase 11Y) crea el InspectionElement directamente por `elementTemplate.key`
// cuando el usuario responde "Sí", sin necesitar que exista un vínculo
// InspectionElementTemplateSpace previo — mismo mecanismo ya usado para
// Reja/Portón, que tampoco lo necesitan.
async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const cocina = await prisma.inspectionSpaceTemplate.findUniqueOrThrow({ where: { key: "cocina" } });

  // 1) Confirmar que el vínculo histórico Cocina->Ventana sigue intacto
  // — solo lectura, nunca se modifica en este script.
  const ventana = await prisma.inspectionElementTemplate.findUniqueOrThrow({ where: { key: "ventana" } });
  const ventanaLink = await prisma.inspectionElementTemplateSpace.findFirst({
    where: { spaceTemplateId: cocina.id, elementTemplateId: ventana.id },
  });
  console.log(`OK: vínculo Cocina->Ventana ${ventanaLink ? `intacto (id ${ventanaLink.id})` : "NO ENCONTRADO"} — sin modificar en esta ejecución.`);

  // 2) Crear/actualizar los 2 elementTemplate nuevos, transversales.
  const newElements = [
    { key: "cielo", label: "Cielo", order: 11, appliesTo: ["CASA", "DEPARTAMENTO", "AMPLIACION"] as const },
    { key: "iluminacion", label: "Iluminación", order: 12, appliesTo: ["CASA", "DEPARTAMENTO", "AMPLIACION"] as const },
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

  // 3) TechnicalArticle — Cielo (2) e Iluminación (1). Formato de 7
  // secciones ya estándar en el proyecto (ver fase11q-piloto-ventana.ts).
  const articles = [
    {
      slug: "cielo-como-revisar-manchas-grietas",
      title: "Cómo revisar manchas o grietas en el cielo",
      content: `# Qué revisar

Si el cielo presenta manchas, grietas u otros daños visibles.

# Cómo revisarlo

Desde una posición segura (de pie, sin subirte a sillas, escalas ni ningún elemento inestable), recorre con la vista todo el cielo del recinto, prestando atención a las esquinas y a los encuentros con los muros, que es donde suelen notarse primero los defectos.

# Qué debería verse

Una superficie pareja, sin grietas visibles, sin manchas de color distinto al resto del cielo y sin zonas descascaradas o con pintura levantada.

# Qué señales pueden indicar un problema

- Grietas o fisuras visibles, de cualquier tamaño.
- Manchas de un color distinto al resto del cielo (amarillentas, oscuras o con un tono diferente).
- Pintura descascarada, levantada o con burbujas.
- Zonas hundidas o con una textura distinta al resto de la superficie.

Ninguna de estas señales determina por sí sola la causa — conviene registrarla igual y, si hay dudas, revisarla con más detalle.

# Por qué importa

Una grieta o mancha en el cielo puede ser solo estética, pero también puede ser señal de humedad, filtración o un problema estructural menor — conviene registrarlo para que quede documentado y se pueda revisar con más detalle si corresponde.

# Recomendación

No subas a escaleras ni a ningún elemento inestable para mirar de cerca. Si la zona es difícil de ver bien desde el suelo, toma la foto con el mejor ángulo posible desde una posición segura y describe lo que alcanzas a observar.

# Fuente

- **Manual técnico de referencia**: Manual de Tolerancias CDT (Ficha 7, Cielos Rasos) — el Manual respalda que el cielo es una partida constructiva diferenciada de los muros, con su propio criterio de terminación; no entrega una tabla de manchas/grietas evaluable a simple vista (su contenido es dimensional, en milímetros).
- **Criterio interno**: la pregunta de manchas/grietas visibles es criterio interno del proyecto, no una tolerancia del Manual.

Sin referencia normativa verificada para esta revisión específica.`,
    },
    {
      slug: "cielo-como-revisar-manchas-humedad",
      title: "Cómo revisar manchas de humedad en el cielo",
      content: `# Qué revisar

Si se observan manchas de humedad en el cielo — un tipo de mancha distinto a una mancha de pintura o suciedad común.

# Cómo revisarlo

Desde una posición segura, observa el cielo completo con buena luz. Una mancha de humedad suele verse como un cerco o halo de un color amarillento, café claro o grisáceo, a veces con los bordes más marcados que el centro.

# Qué debería verse

Un cielo sin manchas de este tipo, de color uniforme en toda su superficie.

# Qué señales pueden indicar un problema

- Un cerco o halo de color distinto al resto del cielo, con bordes visibles.
- Una zona que se ve más oscura u opaca que el resto, especialmente cerca de esquinas o de instalaciones (ventanas, tuberías visibles).
- Pintura hinchada, con burbujas o que se desprende justo en la zona de la mancha.

Ninguna de estas señales confirma por sí sola que exista una filtración activa — puede ser señal de humedad o filtración y conviene registrarlo para revisarlo con más detalle, incluso si hoy se ve seco.

# Por qué importa

Una mancha de humedad, aunque se vea seca en el momento de la inspección, puede ser señal de una filtración pasada o activa que conviene investigar antes de que empeore o quede oculta detrás de una nueva capa de pintura.

# Recomendación

No perfores ni intentes confirmar si la zona está húmeda tocándola o con ningún instrumento. Registra la ubicación exacta de la mancha con una foto y descríbela — el diagnóstico de la causa (techumbre, cañería, condensación) requiere una revisión aparte.

# Fuente

- **Manual técnico de referencia**: ninguno — el Manual de Tolerancias no cubre manchas de humedad, solo terminación dimensional del cielo.
- **Criterio interno**: revisión de alto valor práctico basada en criterio interno del proyecto, sin respaldo normativo directo.

Sin referencia normativa verificada para esta revisión específica.`,
    },
    {
      slug: "iluminacion-como-revisar-encendido-fijacion",
      title: "Cómo revisar que la iluminación encienda y esté firme",
      content: `# Qué revisar

Si el o los artefactos de iluminación del recinto (ampolleta con portalámparas, plafón, u otro artefacto entregado con la vivienda) encienden correctamente y se ven firmemente instalados.

# Cómo revisarlo

Acciona el interruptor correspondiente y confirma que la luz enciende y apaga con normalidad. Observa el artefacto desde el suelo: revisa que no se vea suelto, colgando, ni con cables a la vista.

# Qué debería verse

La luz enciende y apaga correctamente al usar el interruptor, y el artefacto se ve firme, sin piezas sueltas ni cables expuestos.

# Qué señales pueden indicar un problema

- No enciende al accionar el interruptor.
- Enciende de forma intermitente o parpadea.
- El artefacto se ve suelto, inclinado o colgando.
- Hay cables visibles fuera de la caja o el portalámparas.

Ninguna de estas señales determina por sí sola la causa — conviene registrarla igual.

# Por qué importa

Un artefacto de iluminación mal fijado o que no enciende correctamente afecta el uso normal del recinto y, si está suelto, puede representar un riesgo — conviene registrarlo para que se revise.

# Recomendación

No toques el cableado, no abras el artefacto ni el tablero eléctrico, y no intentes reparar nada tú mismo. Si el artefacto se ve suelto, evita manipularlo — solo regístralo con una foto tomada desde una posición segura.

# Fuente

- **Manual técnico de referencia**: ninguno — el capítulo de Artefactos Eléctricos del Manual de Tolerancias (Ficha 26) trata exclusivamente la alineación milimétrica de cajas de enchufes/interruptores, no la calidad ni instalación de artefactos de iluminación.
- **Criterio interno**: revisión funcional y visual básica, mismo estándar ya usado en Enchufes e interruptores.

Sin referencia normativa verificada para esta revisión específica.`,
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

  // 4) InspectionChecklistItem — 2 para Cielo, 1 para Iluminación.
  const newItems = [
    { elementKey: "cielo", question: "¿El cielo presenta manchas, grietas u otros daños visibles?", order: 0, technicalArticleSlug: "cielo-como-revisar-manchas-grietas" },
    { elementKey: "cielo", question: "¿Se observan manchas de humedad en el cielo?", order: 1, technicalArticleSlug: "cielo-como-revisar-manchas-humedad" },
    { elementKey: "iluminacion", question: "¿La iluminación de la cocina enciende correctamente y el elemento visible se encuentra firme?", order: 0, technicalArticleSlug: "iluminacion-como-revisar-encendido-fijacion" },
  ];

  for (const item of newItems) {
    const elementTemplateId = elementByKey.get(item.elementKey)!.id;
    const existing = await prisma.inspectionChecklistItem.findFirst({
      where: { elementTemplateId, question: item.question },
    });
    if (existing) {
      await prisma.inspectionChecklistItem.update({
        where: { id: existing.id },
        data: { order: item.order, technicalArticleSlug: item.technicalArticleSlug, active: true },
      });
      console.log(`OK: pregunta actualizada (id ${existing.id}): "${item.question}"`);
    } else {
      const created = await prisma.inspectionChecklistItem.create({
        data: { elementTemplateId, question: item.question, order: item.order, technicalArticleSlug: item.technicalArticleSlug, active: true },
      });
      console.log(`OK: pregunta creada (id ${created.id}): "${item.question}"`);
    }
  }

  // 5) Vínculos Cocina->Cielo, Cocina->Iluminación (siempre-presente,
  // orden continuando después de Enchufes e interruptores, order=3).
  const newLinks = [
    { elementKey: "cielo", order: 4 },
    { elementKey: "iluminacion", order: 5 },
  ];
  for (const link of newLinks) {
    const elementTemplateId = elementByKey.get(link.elementKey)!.id;
    const existing = await prisma.inspectionElementTemplateSpace.findFirst({
      where: { spaceTemplateId: cocina.id, elementTemplateId },
    });
    if (existing) {
      await prisma.inspectionElementTemplateSpace.update({ where: { id: existing.id }, data: { order: link.order } });
      console.log(`OK: vínculo actualizado cocina <-> ${link.elementKey}`);
    } else {
      await prisma.inspectionElementTemplateSpace.create({
        data: { spaceTemplateId: cocina.id, elementTemplateId, order: link.order },
      });
      console.log(`OK: vínculo creado cocina <-> ${link.elementKey}`);
    }
  }

  console.log(
    "\nFase 11AA: Cocina Lote A — Cielo e Iluminación creados y vinculados (siempre-presente). Vínculo Cocina->Ventana intacto, sin desacoplar en catálogo (desacople es solo de código, ver LEVEL2_GATED_LINKS)."
  );
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
