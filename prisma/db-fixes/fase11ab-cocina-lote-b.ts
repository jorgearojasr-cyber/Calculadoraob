import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

// Fase 11AB (docs/FASE11AB_INFORME_COCINA_LOTE_B.md) — Cocina Lote B:
// 3 componentes derivados de terminación (Revestimiento cerámico de
// piso, Pintura de muro, Revestimiento cerámico de muro), cada uno
// activado por una pregunta Nivel 2 booleana independiente.
//
// Este script SOLO agrega catálogo nuevo, aditivo e idempotente:
//   - 3 InspectionElementTemplate (keys GENÉRICAS, sin sufijo de recinto
//     — ver informe sección C: el criterio depende del material, no del
//     recinto, así que quedan reutilizables para Baño u otro recinto
//     futuro sin duplicar catálogo).
//   - 5 InspectionChecklistItem (2 + 1 + 2).
//   - 5 TechnicalArticle (formato de 7 secciones estándar).
//
// CRÍTICO — a diferencia de Cielo/Iluminación (Fase 11AA, siempre-
// presentes), estos 3 componentes son 100% Nivel 2 (como Puerta): este
// script NO crea ningún vínculo `InspectionElementTemplateSpace` hacia
// Cocina. `saveSpaceLevel2ConfigAction` ya crea el `InspectionElement`
// directamente por `elementTemplate.key` cuando el usuario responde
// "Sí" — el mismo mecanismo que Puerta usa desde Fase 11AA, que tampoco
// tiene vínculo de catálogo. Esto es INTENCIONAL y es la razón por la
// que este script es seguro de ejecutar contra la BD compartida ahora
// mismo, con el código de producción todavía sin publicar: el código
// viejo de producción solo genera automáticamente los elementos que
// están vinculados vía esa tabla puente, así que templates/checklists/
// artículos "sueltos" sin vínculo son 100% inertes para el código
// desplegado hoy — no hay ningún catálogo que desacoplar después, ni
// ninguna ventana insegura que gestionar (ver sección L del informe).
async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  // 1) Crear/actualizar los 3 elementTemplate derivados, transversales.
  // `materialVariantOf` (campo libre existente, 0 filas lo usaban antes
  // de esta fase — ver informe sección D) se usa aquí solo como
  // documentación semántica de qué componente "base" complementa cada
  // derivado; no cambia ninguna consulta ni comportamiento del motor.
  const newElements = [
    {
      key: "revestimiento-ceramico-piso",
      label: "Revestimiento cerámico de piso",
      order: 13,
      appliesTo: ["CASA", "DEPARTAMENTO", "AMPLIACION"] as const,
      materialVariantOf: "piso",
    },
    {
      key: "pintura-muro",
      label: "Pintura de muro",
      order: 14,
      appliesTo: ["CASA", "DEPARTAMENTO", "AMPLIACION"] as const,
      materialVariantOf: "muros",
    },
    {
      key: "revestimiento-ceramico-muro",
      label: "Revestimiento cerámico de muro",
      order: 15,
      appliesTo: ["CASA", "DEPARTAMENTO", "AMPLIACION"] as const,
      materialVariantOf: "muros",
    },
  ];
  const elementByKey = new Map<string, { id: string }>();
  for (const e of newElements) {
    const row = await prisma.inspectionElementTemplate.upsert({
      where: { key: e.key },
      update: { label: e.label, order: e.order, appliesTo: [...e.appliesTo], materialVariantOf: e.materialVariantOf, active: true },
      create: { key: e.key, label: e.label, order: e.order, appliesTo: [...e.appliesTo], materialVariantOf: e.materialVariantOf },
    });
    elementByKey.set(e.key, row);
    console.log(`OK: elemento "${e.label}" (key=${e.key}, id=${row.id})`);
  }

  // 2) TechnicalArticle — 5 nuevos, formato de 7 secciones estándar.
  // Fuente: Manual de Tolerancias para Edificaciones (CDT/CChC, 3ª
  // edición 2018), capítulo 10 (Revestimientos Cerámicos) y capítulo 23
  // (Pinturas) — releídos directamente para esta fase, no solo por
  // resumen de fases anteriores (informe sección B). Ninguna tolerancia
  // en mm se presenta como cumplimiento normativo; se traduce siempre a
  // observación binaria en lenguaje cotidiano.
  //
  // Nota de no-duplicación (informe sección I): el criterio de "sonido
  // hueco al golpear" YA está cubierto en el artículo publicado
  // `piso-como-revisar-danos-visibles` — deliberadamente no se repite
  // acá como una tercera pregunta. Las 2 revisiones cerámicas de piso se
  // enfocan en lo que ese artículo NO cubre: palmetas quebradas
  // específicamente y defectos de esmalte/superficie.
  const articles = [
    {
      slug: "revestimiento-ceramico-piso-palmetas-quebradas",
      title: "Cómo revisar palmetas quebradas en el piso cerámico",
      content: `# Qué revisar

Si las palmetas (piezas) del piso de cerámica o porcelanato están quebradas, trisadas o con bordes despuntados.

# Cómo revisarlo

Recorre el piso caminando lentamente, con buena luz (natural o artificial normal), observando cada palmeta. Presta especial atención a los bordes, esquinas y zonas de paso frecuente, que es donde más comúnmente se despuntan o quiebran.

# Qué debería verse

Palmetas enteras, sin grietas visibles y con los bordes y esquinas completos, sin faltantes.

# Qué señales pueden indicar un problema

- Una grieta que cruza parte o toda la palmeta.
- Un borde o esquina despuntada (con un trozo faltante).
- Una palmeta partida en dos o más pedazos.

# Por qué importa

Una palmeta quebrada no mejora con el tiempo — al contrario, suele agrandarse o desprenderse con el uso normal del piso, y además es un riesgo de corte si el borde queda filoso.

# Recomendación

Registra cada palmeta dañada con una foto clara del sector. No es necesario que intentes repararla o reemplazarla tú mismo.

# Fuente

- **Manual técnico de referencia**: Manual de Tolerancias para Edificaciones (CDT/CChC, 3ª edición 2018), capítulo 10, Revestimientos Cerámicos — no se aceptan piezas quebradas, despuntadas o con grietas.

Sin referencia normativa verificada más allá del Manual de Tolerancias.`,
    },
    {
      slug: "revestimiento-ceramico-piso-defectos-esmalte",
      title: "Cómo revisar defectos de esmalte en el piso cerámico",
      content: `# Qué revisar

Si se observan defectos visibles en el esmalte o la superficie de las palmetas del piso cerámico o porcelanato.

# Cómo revisarlo

Con luz normal, recorre visualmente el piso observando la superficie de las palmetas — no solo los bordes, sino el centro de cada pieza.

# Qué debería verse

Una superficie lisa y uniforme en todas las palmetas, sin marcas, hundimientos ni irregularidades evidentes.

# Qué señales pueden indicar un problema

- Esmalte saltado, descascarado o con burbujas.
- Raspaduras o rayas profundas visibles.
- Cráteres o pequeños hundimientos en la superficie.
- Manchas permanentes que no corresponden a suciedad superficial.

Ninguna de estas señales determina por sí sola la causa — conviene registrarla igual.

# Por qué importa

Un defecto de esmalte es un problema de terminación visible, ya presente en la pieza — no es algo que "se limpie" ni que mejore con el tiempo.

# Recomendación

Registra con foto el sector específico afectado, indicando qué palmeta o zona presenta el defecto.

# Fuente

- **Manual técnico de referencia**: Manual de Tolerancias para Edificaciones (CDT/CChC, 3ª edición 2018), capítulo 10, Revestimientos Cerámicos.

Sin referencia normativa verificada más allá del Manual de Tolerancias.`,
    },
    {
      slug: "pintura-muro-manchas-defectos",
      title: "Cómo revisar manchas o defectos en la pintura del muro",
      content: `# Qué revisar

Si se observan manchas, marcas o defectos visibles en la pintura del muro.

# Cómo revisarlo

Párate a una distancia razonable del muro (aproximadamente 1 metro), con buena iluminación, y recorre visualmente todo el paño de arriba a abajo.

# Qué debería verse

Un color uniforme en toda la superficie, sin manchas, sin marcas y sin diferencias de tono evidentes entre distintas zonas del mismo muro.

# Qué señales pueden indicar un problema

- Manchas de un color distinto al resto del muro.
- Marcas, rayones o golpes visibles.
- Zonas donde se alcanza a ver la base (yeso o material bajo la pintura).
- Diferencias de tono notorias entre secciones del mismo muro (por ejemplo, un parche mal igualado).

# Por qué importa

Una mancha o defecto de pintura suele ser económico y rápido de corregir si se detecta a tiempo, y en algunos casos puede ser señal de un problema debajo (un golpe, una filtración previa) que conviene documentar.

# Recomendación

Registra el sector concreto con una foto. Ten en cuenta que la luz y las sombras pueden exagerar diferencias de tono que no son un defecto real — si tienes dudas, mira el muro desde más de un ángulo antes de registrar una observación.

# Fuente

- **Manual técnico de referencia**: Manual de Tolerancias para Edificaciones (CDT/CChC, 3ª edición 2018), capítulo 23, Pinturas — observación visual a distancia normal de uso.

Sin referencia normativa verificada más allá del Manual de Tolerancias.`,
    },
    {
      slug: "revestimiento-ceramico-muro-palmetas-quebradas",
      title: "Cómo revisar palmetas quebradas en el revestimiento cerámico de muro",
      content: `# Qué revisar

Si las palmetas (piezas) del revestimiento cerámico o porcelanato del muro están quebradas, trisadas o con bordes despuntados.

# Cómo revisarlo

Recorre el muro con la vista, con buena luz, revisando la superficie completa del revestimiento. Presta especial atención a esquinas, encuentros con otros materiales y zonas bajas más expuestas a golpes.

# Qué debería verse

Palmetas enteras, sin grietas visibles y con los bordes y esquinas completos, sin faltantes.

# Qué señales pueden indicar un problema

- Una grieta que cruza parte o toda la palmeta.
- Un borde o esquina despuntada (con un trozo faltante).
- Una palmeta partida en dos o más pedazos.

# Por qué importa

Una palmeta quebrada en un muro no mejora con el tiempo, y en zonas bajas o de paso puede empeorar con roces o golpes adicionales.

# Recomendación

Registra cada palmeta dañada con una foto clara del sector. No es necesario que intentes repararla tú mismo.

# Fuente

- **Manual técnico de referencia**: Manual de Tolerancias para Edificaciones (CDT/CChC, 3ª edición 2018), capítulo 10, Revestimientos Cerámicos — mismo criterio aplicado a superficie vertical.

Sin referencia normativa verificada más allá del Manual de Tolerancias.`,
    },
    {
      slug: "revestimiento-ceramico-muro-defectos-esmalte",
      title: "Cómo revisar defectos de esmalte en el revestimiento cerámico de muro",
      content: `# Qué revisar

Si se observan defectos visibles en el esmalte o la superficie de las palmetas del revestimiento cerámico o porcelanato del muro.

# Cómo revisarlo

Con luz normal, recorre visualmente el muro observando la superficie de las palmetas — no solo los bordes, sino el centro de cada pieza.

# Qué debería verse

Una superficie lisa y uniforme en todas las palmetas, sin marcas, hundimientos ni irregularidades evidentes.

# Qué señales pueden indicar un problema

- Esmalte saltado, descascarado o con burbujas.
- Raspaduras o rayas profundas visibles.
- Cráteres o pequeños hundimientos en la superficie.
- Manchas permanentes que no corresponden a suciedad superficial.

Ninguna de estas señales determina por sí sola la causa — conviene registrarla igual.

# Por qué importa

Un defecto de esmalte es un problema de terminación visible, ya presente en la pieza — no es algo que mejore con el tiempo ni con la limpieza.

# Recomendación

Registra con foto el sector específico afectado, indicando qué palmeta o zona del muro presenta el defecto.

# Fuente

- **Manual técnico de referencia**: Manual de Tolerancias para Edificaciones (CDT/CChC, 3ª edición 2018), capítulo 10, Revestimientos Cerámicos — mismo criterio aplicado a superficie vertical.

Sin referencia normativa verificada más allá del Manual de Tolerancias.`,
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

  // 3) InspectionChecklistItem — 2 para Revestimiento cerámico de piso,
  // 1 para Pintura de muro, 2 para Revestimiento cerámico de muro.
  const newItems = [
    { elementKey: "revestimiento-ceramico-piso", question: "¿Hay palmetas quebradas, trisadas o despuntadas?", order: 0, technicalArticleSlug: "revestimiento-ceramico-piso-palmetas-quebradas" },
    { elementKey: "revestimiento-ceramico-piso", question: "¿Se observan defectos visibles en el esmalte o superficie de las palmetas?", order: 1, technicalArticleSlug: "revestimiento-ceramico-piso-defectos-esmalte" },
    { elementKey: "pintura-muro", question: "¿Se observan manchas, marcas o defectos visibles en la pintura?", order: 0, technicalArticleSlug: "pintura-muro-manchas-defectos" },
    { elementKey: "revestimiento-ceramico-muro", question: "¿Hay palmetas quebradas, trisadas o despuntadas?", order: 0, technicalArticleSlug: "revestimiento-ceramico-muro-palmetas-quebradas" },
    { elementKey: "revestimiento-ceramico-muro", question: "¿Se observan defectos visibles en el esmalte o superficie de las palmetas?", order: 1, technicalArticleSlug: "revestimiento-ceramico-muro-defectos-esmalte" },
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
      console.log(`OK: pregunta actualizada (id ${existing.id}): "${item.question}" [${item.elementKey}]`);
    } else {
      const created = await prisma.inspectionChecklistItem.create({
        data: { elementTemplateId, question: item.question, order: item.order, technicalArticleSlug: item.technicalArticleSlug, active: true },
      });
      console.log(`OK: pregunta creada (id ${created.id}): "${item.question}" [${item.elementKey}]`);
    }
  }

  // 4) Confirmación de solo lectura: ningún vínculo InspectionElementTemplateSpace
  // se crea para estos 3 componentes — se resuelven 100% vía Nivel 2,
  // igual que Puerta. Se deja constancia explícita en el log.
  console.log(
    "\nOK: NO se crearon vínculos InspectionElementTemplateSpace para revestimiento-ceramico-piso/pintura-muro/revestimiento-ceramico-muro (mismo patrón que Puerta) — el código de producción actual no puede generarlos automáticamente."
  );

  console.log(
    "\nFase 11AB: Cocina Lote B — 3 componentes derivados de terminación creados en catálogo (inertes hasta que el código Nivel 2 correspondiente se publique)."
  );
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
