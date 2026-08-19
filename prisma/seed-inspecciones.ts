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
    // Fase 11AB (docs/FASE11AB_INFORME_COCINA_LOTE_B.md) — derivados de
    // terminación, keys GENÉRICAS sin sufijo de recinto (reutilizables
    // por Baño u otro recinto futuro). 100% Nivel 2, igual que Puerta:
    // sin vínculo InspectionElementTemplateSpace (ver spaceElementLinks
    // más abajo, donde deliberadamente NO aparecen).
    { key: "revestimiento-ceramico-piso", label: "Revestimiento cerámico de piso", order: 13, appliesTo: ["CASA", "DEPARTAMENTO", "AMPLIACION"], materialVariantOf: "piso" },
    { key: "pintura-muro", label: "Pintura de muro", order: 14, appliesTo: ["CASA", "DEPARTAMENTO", "AMPLIACION"], materialVariantOf: "muros" },
    { key: "revestimiento-ceramico-muro", label: "Revestimiento cerámico de muro", order: 15, appliesTo: ["CASA", "DEPARTAMENTO", "AMPLIACION"], materialVariantOf: "muros" },
    // Fase 11AD (docs/FASE11AD_INFORME_COCINA_LOTE_C.md) — Muebles de
    // cocina + Cubierta/Mesón, cerrados técnicamente en Fase 11AC. 100%
    // Nivel 2, sin vínculo InspectionElementTemplateSpace (mismo patrón
    // que Puerta y Lote B). Independientes entre sí — ninguno deriva del
    // otro (ver informe 11AC sección K).
    { key: "muebles-cocina", label: "Muebles de cocina", order: 16, appliesTo: ["CASA", "DEPARTAMENTO", "AMPLIACION"] },
    { key: "cubierta-meson", label: "Cubierta / Mesón", order: 17, appliesTo: ["CASA", "DEPARTAMENTO", "AMPLIACION"] },
    // Fase 11AF (docs/FASE11AF_INFORME_COCINA_LOTE_D.md) — Lavaplatos,
    // cerrado técnicamente en Fase 11AE. 100% Nivel 2, sin vínculo
    // InspectionElementTemplateSpace. Grifería/Fugas/Fijación/Sello no
    // son componentes propios — viven como checklist dentro de este
    // único elemento.
    { key: "lavaplatos", label: "Lavaplatos", order: 18, appliesTo: ["CASA", "DEPARTAMENTO", "AMPLIACION"] },
    // Fase 11AH (docs/FASE11AH_INFORME_COCINA_LOTE_E.md) — Campana /
    // Extractor, cerrado técnicamente en Fase 11AG. 100% Nivel 2, sin
    // vínculo InspectionElementTemplateSpace. Último componente funcional
    // del catálogo original de Fase 11Z — con esto, Cocina V1 queda
    // funcionalmente cerrada.
    { key: "campana-extractor", label: "Campana / Extractor", order: 19, appliesTo: ["CASA", "DEPARTAMENTO", "AMPLIACION"] },
  ] as const;

  const elementByKey = new Map<string, { id: string }>();
  for (const e of elementTemplates) {
    const materialVariantOf = "materialVariantOf" in e ? e.materialVariantOf : undefined;
    const row = await prisma.inspectionElementTemplate.upsert({
      where: { key: e.key },
      update: { label: e.label, order: e.order, appliesTo: [...e.appliesTo], materialVariantOf, active: true },
      create: { key: e.key, label: e.label, order: e.order, appliesTo: [...e.appliesTo], materialVariantOf },
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
  const checklistItems: {
    elementKey: string;
    question: string;
    order: number;
    technicalArticleSlug?: string;
    defaultSeverity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  }[] = [
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

    // Fase 11AB — derivados de terminación (Cocina, 100% Nivel 2, sin
    // vínculo de catálogo — ver spaceElementLinks, deliberadamente
    // ausentes ahí). Igual que Cielo/Iluminación, nace completo en el
    // seed con su `technicalArticleSlug` para que una instalación nueva
    // quede igual a la BD compartida ya parchada por
    // `prisma/db-fixes/fase11ab-cocina-lote-b.ts`.
    { elementKey: "revestimiento-ceramico-piso", question: "¿Hay palmetas quebradas, trisadas o despuntadas?", order: 0, technicalArticleSlug: "revestimiento-ceramico-piso-palmetas-quebradas" },
    { elementKey: "revestimiento-ceramico-piso", question: "¿Se observan defectos visibles en el esmalte o superficie de las palmetas?", order: 1, technicalArticleSlug: "revestimiento-ceramico-piso-defectos-esmalte" },
    { elementKey: "pintura-muro", question: "¿Se observan manchas, marcas o defectos visibles en la pintura?", order: 0, technicalArticleSlug: "pintura-muro-manchas-defectos" },
    { elementKey: "revestimiento-ceramico-muro", question: "¿Hay palmetas quebradas, trisadas o despuntadas?", order: 0, technicalArticleSlug: "revestimiento-ceramico-muro-palmetas-quebradas" },
    { elementKey: "revestimiento-ceramico-muro", question: "¿Se observan defectos visibles en el esmalte o superficie de las palmetas?", order: 1, technicalArticleSlug: "revestimiento-ceramico-muro-defectos-esmalte" },

    // Fase 11AD — Muebles de cocina + Cubierta/Mesón (Cocina, 100% Nivel
    // 2, sin vínculo de catálogo). `defaultSeverity` exacto según la
    // matriz final de Fase 11AC (sección P) — ninguna se homogeniza.
    { elementKey: "muebles-cocina", question: "¿Las puertas y cajones abren, cierran o deslizan correctamente (cuando existan)?", order: 0, technicalArticleSlug: "muebles-cocina-funcionamiento", defaultSeverity: "MEDIUM" },
    { elementKey: "muebles-cocina", question: "¿Los muebles se sienten firmes y bien sujetos, sin moverse al tocarlos?", order: 1, technicalArticleSlug: "muebles-cocina-fijacion", defaultSeverity: "HIGH" },
    { elementKey: "muebles-cocina", question: "¿Los muebles presentan golpes, quiebres, rayas profundas u otros daños visibles?", order: 2, technicalArticleSlug: "muebles-cocina-danos-visibles", defaultSeverity: "LOW" },
    { elementKey: "cubierta-meson", question: "¿La cubierta o mesón se ve firme y bien fijada, sin moverse al tocarla?", order: 0, technicalArticleSlug: "cubierta-meson-fijacion", defaultSeverity: "MEDIUM" },
    { elementKey: "cubierta-meson", question: "¿La cubierta presenta daños visibles o separaciones/grietas en el encuentro con el muro?", order: 1, technicalArticleSlug: "cubierta-meson-danos-sellos", defaultSeverity: "LOW" },

    // Fase 11AF — Lavaplatos (Cocina, 100% Nivel 2, sin vínculo de
    // catálogo). Grifería/Fugas/Fijación/Sello viven dentro de este único
    // elemento. `defaultSeverity` exacto según Fase 11AE (sección P):
    // ninguna se homogeniza. La revisión de Fugas consolida las 2
    // candidatas originales de Fase 11Z (filtración bajo mueble + goteo
    // de sifón) en una sola pregunta — ver informe 11AE sección F/J.
    { elementKey: "lavaplatos", question: "¿La grifería abre y cierra correctamente, sin quedar goteando?", order: 0, technicalArticleSlug: "lavaplatos-griferia-funcionamiento", defaultSeverity: "LOW" },
    { elementKey: "lavaplatos", question: "¿Funcionan correctamente el agua fría y caliente de la grifería, cuando la instalación dispone de ambas?", order: 1, technicalArticleSlug: "lavaplatos-agua-fria-caliente", defaultSeverity: "LOW" },
    { elementKey: "lavaplatos", question: "Al dejar correr agua, ¿se observa alguna fuga o goteo bajo el lavaplatos?", order: 2, technicalArticleSlug: "lavaplatos-fugas", defaultSeverity: "HIGH" },
    { elementKey: "lavaplatos", question: "¿El lavaplatos se ve firme y bien instalado, sin moverse al tocarlo?", order: 3, technicalArticleSlug: "lavaplatos-fijacion", defaultSeverity: "MEDIUM" },
    { elementKey: "lavaplatos", question: "¿El sello alrededor del lavaplatos se ve continuo, sin separaciones ni grietas?", order: 4, technicalArticleSlug: "lavaplatos-sello-perimetral", defaultSeverity: "MEDIUM" },

    // Fase 11AH — Campana / Extractor (Cocina, 100% Nivel 2, sin vínculo
    // de catálogo). `defaultSeverity` exacto según Fase 11AG (sección P):
    // ninguna se homogeniza. Sin check separado para velocidades,
    // extracción, filtros ni ductos — ver informe 11AG secciones G/J/K/L.
    { elementKey: "campana-extractor", question: "¿La campana o extractor enciende y responde normalmente a sus controles (velocidades, si tiene más de una)?", order: 0, technicalArticleSlug: "campana-extractor-funcionamiento", defaultSeverity: "MEDIUM" },
    { elementKey: "campana-extractor", question: "Si la campana tiene iluminación incorporada, ¿enciende correctamente?", order: 1, technicalArticleSlug: "campana-extractor-iluminacion", defaultSeverity: "LOW" },
    { elementKey: "campana-extractor", question: "Al funcionar, ¿presenta vibraciones, golpes o ruidos claramente irregulares (más allá del ruido normal del motor)?", order: 2, technicalArticleSlug: "campana-extractor-ruido-vibracion", defaultSeverity: "MEDIUM" },
  ];

  for (const item of checklistItems) {
    const elementTemplateId = elementByKey.get(item.elementKey)!.id;
    const existing = await prisma.inspectionChecklistItem.findFirst({
      where: { elementTemplateId, question: item.question },
    });
    if (existing) {
      await prisma.inspectionChecklistItem.update({
        where: { id: existing.id },
        data: {
          order: item.order,
          ...(item.technicalArticleSlug ? { technicalArticleSlug: item.technicalArticleSlug } : {}),
          ...(item.defaultSeverity ? { defaultSeverity: item.defaultSeverity } : {}),
        },
      });
    } else {
      await prisma.inspectionChecklistItem.create({
        data: {
          elementTemplateId,
          question: item.question,
          order: item.order,
          technicalArticleSlug: item.technicalArticleSlug,
          defaultSeverity: item.defaultSeverity,
        },
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
    // Fase 11AB — mismos 5 artículos ya aplicados a la BD compartida vía
    // `prisma/db-fixes/fase11ab-cocina-lote-b.ts`, reproducidos acá
    // verbatim para que una instalación nueva quede idéntica.
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
    // Fase 11AD — mismos 5 artículos ya aplicados a la BD compartida vía
    // `prisma/db-fixes/fase11ad-cocina-lote-c.ts`, reproducidos acá
    // verbatim (contenido final de Fase 11AC, no las 7 candidatas de
    // Fase 11Z) para que una instalación nueva quede idéntica.
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
    // Fase 11AF — Lavaplatos, cerrado técnicamente en Fase 11AE
    // (docs/FASE11AE_CIERRE_TECNICO_LAVAPLATOS_COCINA.md). Ninguna
    // revisión se presenta respaldada por el Manual de Tolerancias — no
    // tiene capítulo sobre lavaplatos/grifería/desagüe (confirmado en
    // 11AE sección C). Grifería/Fugas reutilizan honestamente el criterio
    // interno adaptado del catálogo educativo ITO ya usado en Baño.
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

- Criterio interno adaptado: catálogo educativo ITO (265 puntos), sección Grifería — mismo criterio ya usado para revisar goteras y filtraciones en llaves de Baño, aplicado aquí a la grifería del lavaplatos.`,
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

- Criterio interno del proyecto, comprobación funcional directa, sin fuente normativa aplicable.`,
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

- Criterio interno adaptado: catálogo educativo ITO (265 puntos), sección Artefactos sanitarios — mismo patrón ya usado para revisar fugas visibles en la base de artefactos de Baño, aplicado aquí de forma consolidada al conjunto sifón/conexiones/base del lavaplatos.`,
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

- Criterio interno del proyecto, mismo estándar ya usado para revisar fijación de muebles de cocina — sin fuente normativa aplicable (el Manual de Tolerancias no trata lavaplatos).`,
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

- Criterio interno del proyecto (analogía con el sello marco-muro ya usado en Ventana) — sin fuente normativa aplicable.`,
    },
    // Fase 11AH — Campana / Extractor, cerrado técnicamente en Fase 11AG
    // (docs/FASE11AG_CIERRE_TECNICO_CAMPANA_COCINA.md). Ninguna revisión
    // se presenta respaldada por el Manual de Tolerancias ni por ningún
    // catálogo técnico ya usado en el proyecto — las 3 quedan 🟡 criterio
    // interno del proyecto, sin analogía disponible (a diferencia de
    // Lavaplatos, que sí pudo reutilizar el criterio ITO).
    {
      slug: "campana-extractor-funcionamiento",
      title: "Cómo revisar el funcionamiento de la campana o extractor",
      content: `# Qué revisar

Si la campana o extractor de la cocina enciende y responde normalmente a sus controles, incluidas las distintas velocidades si el modelo tiene más de una.

# Cómo revisarlo

Enciende la campana o extractor usando sus controles normales (botones, perilla o panel). Si tiene más de una velocidad, prueba cada una por turno. Apágala al terminar.

# Qué debería verse

El equipo enciende al accionar el control, y cada velocidad disponible responde de forma perceptible y distinta a las demás.

# Qué señales pueden indicar un problema

- El equipo no enciende al accionar el control.
- Alguna velocidad no responde o no se nota diferencia entre velocidades.
- Los controles (botones/perilla) no responden o cuesta mucho accionarlos.

# Por qué importa

Un equipo de extracción que no enciende o cuyos controles no funcionan no cumple su función básica de ventilar la cocina durante el uso diario.

# Recomendación

Si detectas que no enciende o algún control no responde, regístralo como observación indicando qué control específico falla. No es necesario abrir el equipo ni revisar su instalación eléctrica interna — con operar los controles normales alcanza para dejar constancia.

# Fuente

- Criterio interno del proyecto, comprobación funcional directa — sin fuente normativa aplicable (el Manual de Tolerancias no trata equipamiento de extracción de cocina).`,
    },
    {
      slug: "campana-extractor-iluminacion",
      title: "Cómo revisar la iluminación de la campana",
      content: `# Qué revisar

Si la campana tiene iluminación incorporada, si esta enciende correctamente.

# Cómo revisarlo

Acciona el control de la luz de la campana (si existe, suele ser un botón o interruptor separado del control de velocidad).

# Qué debería verse

La luz enciende al accionar su control, en los modelos que la incluyen.

# Qué señales pueden indicar un problema

- La luz no enciende al accionar su control, en un modelo que sí la incluye.

Si el modelo de campana no tiene iluminación incorporada por diseño, marca esta revisión como "No corresponde" — no es un defecto.

# Por qué importa

La iluminación de la campana suele ser la principal fuente de luz directa sobre la zona de cocción — su ausencia de funcionamiento afecta el uso diario de la cocina.

# Recomendación

Si la luz no enciende, regístralo como observación. No es necesario abrir el equipo para revisar la ampolleta ni el cableado interno.

# Fuente

- Criterio interno del proyecto, comprobación funcional directa — sin fuente normativa aplicable.`,
    },
    {
      slug: "campana-extractor-ruido-vibracion",
      title: "Cómo revisar ruido y vibración anormal en la campana o extractor",
      content: `# Qué revisar

Si, al funcionar, la campana o extractor presenta vibraciones, golpes o ruidos claramente irregulares, más allá del ruido normal de un motor en funcionamiento.

# Cómo revisarlo

Enciende la campana y escucha/observa mientras funciona por unos segundos, en al menos una velocidad.

# Qué debería verse

Un sonido de motor en funcionamiento, sin golpeteo, vibración de piezas sueltas ni roces irregulares.

# Qué señales pueden indicar un problema

- Golpeteo o traqueteo audible.
- Vibración notoria que hace vibrar la carcasa o piezas cercanas.
- Un roce o chirrido irregular distinto al sonido normal del motor.

Ten en cuenta que **todo motor produce sonido al funcionar** — eso por sí solo no es un defecto. Solo registra lo que se sienta claramente irregular, no simplemente "suena fuerte".

# Por qué importa

Un ruido o vibración irregular puede indicar una pieza mal fijada o un problema mecánico que conviene documentar antes de que empeore con el uso.

# Recomendación

Si detectas algo claramente irregular, regístralo como observación describiendo el tipo de ruido (golpeteo, vibración, roce). No intentes abrir el equipo para identificar la causa.

# Fuente

- Criterio interno del proyecto, comprobación funcional directa, redactada con precaución para no convertir el sonido normal de operación en un defecto — sin fuente normativa aplicable.`,
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
