import type { PrismaClient } from "../src/generated/prisma/client";

// Inspecciones — Fase 1 (14-ago-2026): catálogo mínimo (solo CASA).
// Fase 6B (14-ago-2026): catálogo V2 aprobado en Fase 6A
// (docs/FASE6A_DISENO_CATALOGO_V2_INSPECCIONES.md) — extiende a
// DEPARTAMENTO y AMPLIACION sin romper lo existente: los 4 espacios y
// las 5 preguntas de Casa se mantienen con su `key`/id intactos, solo se
// amplía su `appliesTo` y se agrega catálogo nuevo al lado.
//
// Idempotente vía upsert por `key`/`slug` únicos, mismo patrón que
// seedRadierModule.
export async function seedInspeccionesModule(prisma: PrismaClient) {
  // --- Espacios ---
  // cocina/living/dormitorio/bano: mismos 4 de Fase 1, ahora también
  // aplicables a Departamento (diseño Fase 6A, sección C: "Departamento
  // reutiliza íntegramente los 4 espacios y elementos de Casa").
  // bodega/estacionamiento: exclusivos de Departamento (Fase 6A, sección
  // C/E) — únicos con respaldo real en ITO para ese tipo de inmueble.
  // recinto-ampliado: espacio genérico y repetible para Ampliación
  // (Fase 6A, sección D) — reutiliza los elementos ya validados de Casa
  // en vez de inventar espacios sin fuente.
  // Fase 11B (docs/FASE11A_DISENO_INSPECCION_TECNICA_GUIADA.md) — ficha
  // de características de Casa/Departamento/Ampliación. `cocina`/
  // `dormitorio`/`bano` amplían su `appliesTo` a AMPLIACION (tipos
  // Cocina/Dormitorio/Dormitorio+baño/Segundo piso reutilizan estos
  // mismos espacios, sin inventar partidas nuevas — sección 5/7 del
  // diseño). `bodega` ahora también aplica a Casa (la ficha de Casa
  // pregunta por bodega igual que la de Departamento). Nuevos:
  // `antejardin`/`acceso-vehicular` (Casa), `comedor`/`living-comedor`
  // (modo separado/integrado, Casa+Departamento, +AMPLIACION para
  // "Living-comedor"), `terraza-logia` (Departamento, 🟡 fuente ITO
  // delgada — reutiliza el set genérico Piso/Muros/Ventana, sin
  // inventar partidas propias), `terraza-cerrada` (Ampliación, mismo
  // fallback genérico que "Otro"/`recinto-ampliado`, sin fuente propia
  // todavía). "Patio trasero" del diseño de Fase 11A queda EXPLÍCITAMENTE
  // fuera de esta etapa (marcado 🔴 en el diseño, sin fuente) — no se
  // agrega ninguna fila de catálogo para él.
  // Fase 11X-P (docs/FASE11XP_INFORME_PUBLICACION_FICHA_ESTRUCTURAL.md) —
  // agrega `patio-trasero`/`terraza`/`logia-lavanderia` (CASA, y
  // `terraza`/`logia-lavanderia` también DEPARTAMENTO) para que un
  // entorno nuevo (migrate + seed) quede con el mismo catálogo estructural
  // aprobado en Fase 11X, sin depender de recordar ejecutar
  // `prisma/db-fixes/fase11x-ficha-estructural-recintos.ts` a mano.
  // `terraza-logia` (Departamento) queda con `active: false` a propósito:
  // es el ESTADO FINAL deseado post-publicación (el wizard ya no lo
  // ofrece, ver casa/departamento-ficha-step.tsx) — su key/relaciones
  // NUNCA se tocan, solo deja de aplicarse a generación futura. Cada
  // template ahora declara su propio `active` explícito (antes este seed
  // forzaba `active: true` para todos en el `update`, lo que habría
  // revertido silenciosamente la desactivación de `terraza-logia` cada
  // vez que se re-ejecutara `prisma db seed` contra la BD compartida).
  const spaceTemplates = [
    { key: "cocina", label: "Cocina", repeatable: false, order: 0, appliesTo: ["CASA", "DEPARTAMENTO", "AMPLIACION"], active: true },
    { key: "living", label: "Living", repeatable: false, order: 1, appliesTo: ["CASA", "DEPARTAMENTO"], active: true },
    { key: "dormitorio", label: "Dormitorio", repeatable: true, order: 2, appliesTo: ["CASA", "DEPARTAMENTO", "AMPLIACION"], active: true },
    { key: "bano", label: "Baño", repeatable: true, order: 3, appliesTo: ["CASA", "DEPARTAMENTO", "AMPLIACION"], active: true },
    { key: "bodega", label: "Bodega", repeatable: false, order: 4, appliesTo: ["CASA", "DEPARTAMENTO"], active: true },
    { key: "estacionamiento", label: "Estacionamiento", repeatable: false, order: 5, appliesTo: ["DEPARTAMENTO"], active: true },
    { key: "recinto-ampliado", label: "Recinto ampliado", repeatable: true, order: 6, appliesTo: ["AMPLIACION"], active: true },
    { key: "antejardin", label: "Antejardín", repeatable: false, order: 7, appliesTo: ["CASA"], active: true },
    { key: "acceso-vehicular", label: "Acceso vehicular", repeatable: false, order: 8, appliesTo: ["CASA"], active: true },
    { key: "comedor", label: "Comedor", repeatable: false, order: 9, appliesTo: ["CASA", "DEPARTAMENTO"], active: true },
    { key: "living-comedor", label: "Living-comedor", repeatable: false, order: 10, appliesTo: ["CASA", "DEPARTAMENTO", "AMPLIACION"], active: true },
    // Histórico — deja de ofrecerse para generación NUEVA (Fase 11X-P),
    // pero su key y relaciones se preservan intactas para casos ya
    // existentes que lo referencian (ver InspectionSpace.spaceTemplateId).
    { key: "terraza-logia", label: "Terraza/Logia", repeatable: false, order: 11, appliesTo: ["DEPARTAMENTO"], active: false },
    { key: "terraza-cerrada", label: "Terraza cerrada", repeatable: false, order: 12, appliesTo: ["AMPLIACION"], active: true },
    // Fase 11X — recintos nuevos aprobados en
    // docs/FASE11W_CIERRE_ARQUITECTURA_FICHA_INSPECCION.md.
    { key: "patio-trasero", label: "Patio trasero", repeatable: false, order: 13, appliesTo: ["CASA"], active: true },
    { key: "terraza", label: "Terraza", repeatable: false, order: 14, appliesTo: ["CASA", "DEPARTAMENTO"], active: true },
    { key: "logia-lavanderia", label: "Logia / Lavandería", repeatable: false, order: 15, appliesTo: ["CASA", "DEPARTAMENTO"], active: true },
  ] as const;

  const spaceByKey = new Map<string, { id: string }>();
  for (const s of spaceTemplates) {
    const row = await prisma.inspectionSpaceTemplate.upsert({
      where: { key: s.key },
      update: { label: s.label, repeatable: s.repeatable, order: s.order, appliesTo: [...s.appliesTo], active: s.active },
      create: { key: s.key, label: s.label, repeatable: s.repeatable, order: s.order, appliesTo: [...s.appliesTo], active: s.active },
    });
    spaceByKey.set(s.key, row);
  }

  // --- Elementos ---
  // piso/muros/ventana/puerta: ahora también aplicables a Departamento Y
  // Ampliación (Fase 6A, sección D/F: son los únicos elementos con
  // fundamento suficiente para reutilizarse en "Recinto ampliado").
  // artefactos-sanitarios: ahora también Departamento (vía Baño); NO
  // Ampliación (no hay baño genérico en un recinto ampliado por diseño).
  // enchufes-interruptores: nuevo, transversal (Cocina/Living/Dormitorio),
  // Casa y Departamento (Fase 6A, sección F).
  // bodega / estacionamiento: nuevos, un elemento por espacio exclusivo
  // de Departamento — no se comparte el mismo elemento entre ambos
  // espacios porque sus preguntas no son intercambiables (ver informe
  // Fase 6B, sección T).
  // fachada/reja/porton: nuevos (Fase 11B), Casa únicamente — preguntas
  // funcionales/visuales que reutilizan LITERALMENTE el mismo patrón ya
  // validado en Muros ("¿Presenta fisuras o daños visibles?") y
  // Puerta/Ventana ("¿Abre y cierra correctamente?") — no se inventa
  // ningún criterio técnico nuevo, solo se extiende el mismo tipo de
  // pregunta funcional a un elemento exterior distinto.
  const elementTemplates = [
    { key: "piso", label: "Piso", order: 0, appliesTo: ["CASA", "DEPARTAMENTO", "AMPLIACION"] },
    { key: "muros", label: "Muros", order: 1, appliesTo: ["CASA", "DEPARTAMENTO", "AMPLIACION"] },
    { key: "ventana", label: "Ventana", order: 2, appliesTo: ["CASA", "DEPARTAMENTO", "AMPLIACION"] },
    { key: "puerta", label: "Puerta", order: 3, appliesTo: ["CASA", "DEPARTAMENTO", "AMPLIACION"] },
    { key: "artefactos-sanitarios", label: "Artefactos sanitarios", order: 4, appliesTo: ["CASA", "DEPARTAMENTO", "AMPLIACION"] },
    { key: "enchufes-interruptores", label: "Enchufes e interruptores", order: 5, appliesTo: ["CASA", "DEPARTAMENTO", "AMPLIACION"] },
    { key: "bodega", label: "Bodega", order: 6, appliesTo: ["CASA", "DEPARTAMENTO"] },
    { key: "estacionamiento", label: "Estacionamiento", order: 7, appliesTo: ["DEPARTAMENTO"] },
    { key: "fachada", label: "Fachada", order: 8, appliesTo: ["CASA"] },
    { key: "reja", label: "Reja", order: 9, appliesTo: ["CASA"] },
    { key: "porton", label: "Portón", order: 10, appliesTo: ["CASA"] },
    // Fase 11AA (docs/FASE11AA_INFORME_COCINA_LOTE_A.md) — transversales,
    // hoy vinculados solo a Cocina (siempre-presente, sin pregunta Nivel
    // 2), reutilizables por otros recintos en fases futuras.
    { key: "cielo", label: "Cielo", order: 11, appliesTo: ["CASA", "DEPARTAMENTO", "AMPLIACION"] },
    { key: "iluminacion", label: "Iluminación", order: 12, appliesTo: ["CASA", "DEPARTAMENTO", "AMPLIACION"] },
  ] as const;

  const elementByKey = new Map<string, { id: string }>();
  for (const e of elementTemplates) {
    const row = await prisma.inspectionElementTemplate.upsert({
      where: { key: e.key },
      update: { label: e.label, order: e.order, appliesTo: [...e.appliesTo], active: true },
      create: { key: e.key, label: e.label, order: e.order, appliesTo: [...e.appliesTo] },
    });
    elementByKey.set(e.key, row);
  }

  // --- Tabla puente espacio <-> elemento (qué se sugiere revisar en cada
  // espacio) — ver Parte 12/13 del diseño: Cocina/Dormitorio/Baño/Living
  // reutilizan las MISMAS filas de "piso"/"muros"/"ventana". ---
  const spaceElementLinks: { spaceKey: string; elementKey: string; order: number }[] = [
    { spaceKey: "cocina", elementKey: "piso", order: 0 },
    { spaceKey: "cocina", elementKey: "muros", order: 1 },
    { spaceKey: "cocina", elementKey: "ventana", order: 2 },
    { spaceKey: "cocina", elementKey: "enchufes-interruptores", order: 3 },
    // Fase 11AA — Cielo/Iluminación, siempre-presente en Cocina (sin
    // pregunta Nivel 2). El vínculo a "ventana" de arriba NO se toca: en
    // casos NUEVOS su generación automática queda bloqueada por código
    // (LEVEL2_GATED_LINKS en actions.ts), no por remover este vínculo de
    // catálogo — casos existentes que ya lo usan no se ven afectados.
    { spaceKey: "cocina", elementKey: "cielo", order: 4 },
    { spaceKey: "cocina", elementKey: "iluminacion", order: 5 },

    { spaceKey: "dormitorio", elementKey: "piso", order: 0 },
    { spaceKey: "dormitorio", elementKey: "muros", order: 1 },
    { spaceKey: "dormitorio", elementKey: "puerta", order: 2 },
    { spaceKey: "dormitorio", elementKey: "ventana", order: 3 },
    { spaceKey: "dormitorio", elementKey: "enchufes-interruptores", order: 4 },

    { spaceKey: "bano", elementKey: "piso", order: 0 },
    { spaceKey: "bano", elementKey: "muros", order: 1 },
    { spaceKey: "bano", elementKey: "artefactos-sanitarios", order: 2 },

    { spaceKey: "living", elementKey: "piso", order: 0 },
    { spaceKey: "living", elementKey: "muros", order: 1 },
    { spaceKey: "living", elementKey: "ventana", order: 2 },
    { spaceKey: "living", elementKey: "enchufes-interruptores", order: 3 },

    // Departamento — espacios exclusivos (Fase 6A, sección C/E).
    { spaceKey: "bodega", elementKey: "bodega", order: 0 },
    { spaceKey: "estacionamiento", elementKey: "estacionamiento", order: 0 },

    // Ampliación — reutiliza los 4 elementos ya validados, sin
    // "Estructura" (Fase 6A, sección D/L: fuente insuficiente, exclusión
    // deliberada, no revertir).
    { spaceKey: "recinto-ampliado", elementKey: "piso", order: 0 },
    { spaceKey: "recinto-ampliado", elementKey: "muros", order: 1 },
    { spaceKey: "recinto-ampliado", elementKey: "ventana", order: 2 },
    { spaceKey: "recinto-ampliado", elementKey: "puerta", order: 3 },

    // Fase 11B — Casa: exterior (Fase 11A, sección 3/7).
    { spaceKey: "antejardin", elementKey: "fachada", order: 0 },
    { spaceKey: "antejardin", elementKey: "reja", order: 1 },
    { spaceKey: "acceso-vehicular", elementKey: "porton", order: 0 },

    // Fase 11B — Comedor/Living-comedor comparten el mismo set que
    // Living (Fase 11A, sección 7: "mismo set de partidas") — no se
    // duplica contenido, se reutiliza vía el mismo mecanismo N:N.
    { spaceKey: "comedor", elementKey: "piso", order: 0 },
    { spaceKey: "comedor", elementKey: "muros", order: 1 },
    { spaceKey: "comedor", elementKey: "ventana", order: 2 },
    { spaceKey: "comedor", elementKey: "enchufes-interruptores", order: 3 },

    { spaceKey: "living-comedor", elementKey: "piso", order: 0 },
    { spaceKey: "living-comedor", elementKey: "muros", order: 1 },
    { spaceKey: "living-comedor", elementKey: "ventana", order: 2 },
    { spaceKey: "living-comedor", elementKey: "enchufes-interruptores", order: 3 },

    // Fase 11B — Terraza/Logia (Departamento) y Terraza cerrada
    // (Ampliación): 🟡/🔴 sin fuente propia todavía (Fase 11A, sección
    // 7) — reutilizan el set genérico ya validado en vez de inventar
    // partidas específicas.
    { spaceKey: "terraza-logia", elementKey: "piso", order: 0 },
    { spaceKey: "terraza-logia", elementKey: "muros", order: 1 },
    { spaceKey: "terraza-logia", elementKey: "ventana", order: 2 },

    { spaceKey: "terraza-cerrada", elementKey: "piso", order: 0 },
    { spaceKey: "terraza-cerrada", elementKey: "muros", order: 1 },
    { spaceKey: "terraza-cerrada", elementKey: "ventana", order: 2 },
    { spaceKey: "terraza-cerrada", elementKey: "puerta", order: 3 },

    // Fase 11X — Patio trasero (Casa): reutiliza Piso, ya auditado como
    // válido para contexto exterior (ver informe de Fase 11X, sección I).
    { spaceKey: "patio-trasero", elementKey: "piso", order: 0 },

    // Fase 11X — Terraza (Casa/Departamento): reutiliza los mismos 3
    // componentes ya validados en `terraza-logia` (ver informe de Fase
    // 11X, sección J). `logia-lavanderia` queda sin componentes en esta
    // fase a propósito (sección K del mismo informe).
    { spaceKey: "terraza", elementKey: "piso", order: 0 },
    { spaceKey: "terraza", elementKey: "muros", order: 1 },
    { spaceKey: "terraza", elementKey: "ventana", order: 2 },
  ];

  for (const link of spaceElementLinks) {
    const spaceTemplateId = spaceByKey.get(link.spaceKey)!.id;
    const elementTemplateId = elementByKey.get(link.elementKey)!.id;
    await prisma.inspectionElementTemplateSpace.upsert({
      where: { spaceTemplateId_elementTemplateId: { spaceTemplateId, elementTemplateId } },
      update: { order: link.order },
      create: { spaceTemplateId, elementTemplateId, order: link.order },
    });
  }

  // --- Checklist (catálogo de preguntas) ---
  // Los 5 items de Fase 1 se mantienen sin cambios (texto, elemento,
  // orden) — Fase 5B ya vinculó `technicalArticleSlug`/`defaultSeverity`
  // a estos 5 vía script aparte (prisma/db-fixes/fase5b-...), y este seed
  // nunca toca esos dos campos en el `update`, así que ese vínculo no se
  // pierde al re-ejecutar.
  //
  // Los 6 nuevos (Fase 6A, secciones G/K) cierran el gap de Artefactos
  // sanitarios (incluye la pregunta de Grifería, plegada en este mismo
  // elemento en vez de un ElementTemplate aparte — ver informe Fase 6B,
  // sección T, para la reconciliación con el conteo aprobado de 8
  // elementos) y agregan Enchufes/interruptores, Bodega y Estacionamiento.
  // Ninguno trae `technicalArticleSlug` (regla Fase 6B punto 10: no crear
  // artículos nuevos en esta fase).
  const checklistItems: { elementKey: string; question: string; order: number; technicalArticleSlug?: string }[] = [
    { elementKey: "piso", question: "¿Presenta daños visibles?", order: 0 },
    { elementKey: "piso", question: "¿Presenta desniveles?", order: 1 },
    { elementKey: "muros", question: "¿Presenta fisuras visibles?", order: 0 },
    { elementKey: "ventana", question: "¿Opera correctamente?", order: 0 },
    { elementKey: "puerta", question: "¿Cierra correctamente?", order: 0 },

    { elementKey: "artefactos-sanitarios", question: "¿Después de descargar el inodoro, el agua deja de correr con normalidad?", order: 0 },
    { elementKey: "artefactos-sanitarios", question: "¿No hay fugas visibles en la base de los artefactos?", order: 1 },
    { elementKey: "artefactos-sanitarios", question: "¿No hay goteras ni filtraciones en las llaves?", order: 2 },
    { elementKey: "enchufes-interruptores", question: "¿Cada enchufe probado funciona con un artefacto real?", order: 0 },
    { elementKey: "bodega", question: "¿La puerta cierra y el candado/cerradura funciona?", order: 0 },
    { elementKey: "estacionamiento", question: "¿La demarcación del espacio es clara y el pavimento está en buen estado?", order: 0 },

    // Fase 11B — mismo patrón de pregunta funcional ya usado en
    // Muros/Puerta/Ventana, extendido a elementos exteriores nuevos.
    { elementKey: "fachada", question: "¿Presenta fisuras o daños visibles?", order: 0 },
    { elementKey: "reja", question: "¿Abre y cierra correctamente, sin forzar?", order: 0 },
    { elementKey: "porton", question: "¿Abre y cierra correctamente?", order: 0 },

    // Fase 11AA — Cielo/Iluminación (Cocina, siempre-presente). A
    // diferencia de Ventana (deuda conocida, no se corrige acá — sección
    // 21 del informe), este catálogo SÍ nace completo en el seed,
    // incluido su `technicalArticleSlug`, para que una instalación nueva
    // (migrate + seed) quede igual a la BD compartida ya parchada por
    // `prisma/db-fixes/fase11aa-cocina-lote-a.ts`.
    { elementKey: "cielo", question: "¿El cielo presenta manchas, grietas u otros daños visibles?", order: 0, technicalArticleSlug: "cielo-como-revisar-manchas-grietas" },
    { elementKey: "cielo", question: "¿Se observan manchas de humedad en el cielo?", order: 1, technicalArticleSlug: "cielo-como-revisar-manchas-humedad" },
    { elementKey: "iluminacion", question: "¿La iluminación de la cocina enciende correctamente y el elemento visible se encuentra firme?", order: 0, technicalArticleSlug: "iluminacion-como-revisar-encendido-fijacion" },
  ];

  for (const item of checklistItems) {
    const elementTemplateId = elementByKey.get(item.elementKey)!.id;
    const existing = await prisma.inspectionChecklistItem.findFirst({
      where: { elementTemplateId, question: item.question },
    });
    if (existing) {
      await prisma.inspectionChecklistItem.update({
        where: { id: existing.id },
        data: { order: item.order, ...(item.technicalArticleSlug ? { technicalArticleSlug: item.technicalArticleSlug } : {}) },
      });
    } else {
      await prisma.inspectionChecklistItem.create({
        data: { elementTemplateId, question: item.question, order: item.order, technicalArticleSlug: item.technicalArticleSlug },
      });
    }
  }

  // --- Biblioteca técnica — un artículo de prueba, solo para validar la
  // relación conceptual (technicalArticleSlug), sin UI ni contenido real. ---
  await prisma.technicalArticle.upsert({
    where: { slug: "como-revisar-nivelacion-de-pavimentos" },
    update: {
      title: "Cómo revisar nivelación de pavimentos",
      content: "Artículo de prueba (Fase 1) — contenido real pendiente para una fase futura con UI de biblioteca.",
    },
    create: {
      slug: "como-revisar-nivelacion-de-pavimentos",
      title: "Cómo revisar nivelación de pavimentos",
      content: "Artículo de prueba (Fase 1) — contenido real pendiente para una fase futura con UI de biblioteca.",
    },
  });

  // Fase 11AA — mismos 3 artículos ya aplicados a la BD compartida vía
  // `prisma/db-fixes/fase11aa-cocina-lote-a.ts`, reproducidos acá
  // verbatim para que una instalación nueva quede idéntica.
  const level2Articles = [
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

  for (const a of level2Articles) {
    await prisma.technicalArticle.upsert({
      where: { slug: a.slug },
      update: { title: a.title, content: a.content },
      create: { slug: a.slug, title: a.title, content: a.content },
    });
  }

  console.log(
    `Seed de Inspecciones completado: ${spaceTemplates.length} espacios, ${elementTemplates.length} elementos, ${spaceElementLinks.length} vínculos espacio-elemento, ${checklistItems.length} preguntas, ${1 + level2Articles.length} artículos técnicos.`
  );
}
