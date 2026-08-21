import type { PrismaClient } from "../src/generated/prisma/client";

// Inspecciones — Fase 18A (docs/FASE18A_CIERRE_DEUDAS_TRANSVERSALES_DT01_DT02_DT03.md,
// DT-03) — este seed se REGENERÓ completo desde el catálogo real de
// producción (16 espacios / 32 elementos / 77 vínculos / 93 preguntas /
// 91 artículos técnicos), para que una instalación nueva (migrate + seed)
// quede idéntica a la BD compartida, sin depender de recordar re-ejecutar
// a mano cada script de `prisma/db-fixes/` acumulado desde Fase 1. Se
// mantiene 100% idempotente vía upsert por `key`/`slug` únicos (mismo
// patrón ya usado desde el seed original) — nunca borra ni toca datos de
// caso/espacio/observación de usuarios reales (ninguna tabla transaccional
// se toca acá, solo las 5 tablas de catálogo).
//
// `terraza-logia` queda con `active: false` a propósito: es el ESTADO
// FINAL deseado post-publicación (Fase 11X-P) — su key/relaciones NUNCA
// se tocan, solo deja de ofrecerse para generación futura.
export async function seedInspeccionesModule(prisma: PrismaClient) {
  // --- Espacios ---
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
    { key: "terraza-logia", label: "Terraza/Logia", repeatable: false, order: 11, appliesTo: ["DEPARTAMENTO"], active: false },
    { key: "terraza-cerrada", label: "Terraza cerrada", repeatable: false, order: 12, appliesTo: ["AMPLIACION"], active: true },
    { key: "patio-trasero", label: "Patio trasero", repeatable: false, order: 13, appliesTo: ["CASA"], active: true },
    { key: "terraza", label: "Terraza", repeatable: false, order: 14, appliesTo: ["CASA", "DEPARTAMENTO"], active: true },
    { key: "logia-lavanderia", label: "Logia / Lavandería", repeatable: false, order: 15, appliesTo: ["CASA", "DEPARTAMENTO"], active: true },
  ] as const;

  const spaceByKey = new Map<string, { id: string }>();
  for (const sp of spaceTemplates) {
    const row = await prisma.inspectionSpaceTemplate.upsert({
      where: { key: sp.key },
      update: { label: sp.label, repeatable: sp.repeatable, order: sp.order, appliesTo: [...sp.appliesTo], active: sp.active },
      create: { key: sp.key, label: sp.label, repeatable: sp.repeatable, order: sp.order, appliesTo: [...sp.appliesTo], active: sp.active },
    });
    spaceByKey.set(sp.key, row);
  }

  // --- Elementos ---
  const elementTemplates = [
    { key: "piso", label: "Piso", order: 0, appliesTo: ["CASA", "DEPARTAMENTO", "AMPLIACION"] },
    { key: "baranda", label: "Baranda", order: 0, appliesTo: ["CASA", "DEPARTAMENTO", "AMPLIACION"] },
    { key: "lavadero", label: "Lavadero / Pileta", order: 0, appliesTo: ["CASA", "DEPARTAMENTO"] },
    { key: "closet", label: "Clóset / Armario empotrado", order: 0, appliesTo: ["CASA", "DEPARTAMENTO", "AMPLIACION"] },
    { key: "conexion-lavadora", label: "Conexión de lavadora", order: 0, appliesTo: ["CASA", "DEPARTAMENTO"] },
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
    { key: "cielo", label: "Cielo", order: 11, appliesTo: ["CASA", "DEPARTAMENTO", "AMPLIACION"] },
    { key: "iluminacion", label: "Iluminación", order: 12, appliesTo: ["CASA", "DEPARTAMENTO", "AMPLIACION"] },
    { key: "revestimiento-ceramico-piso", label: "Revestimiento cerámico de piso", order: 13, appliesTo: ["CASA", "DEPARTAMENTO", "AMPLIACION"], materialVariantOf: "piso" },
    { key: "pintura-muro", label: "Pintura de muro", order: 14, appliesTo: ["CASA", "DEPARTAMENTO", "AMPLIACION"], materialVariantOf: "muros" },
    { key: "revestimiento-ceramico-muro", label: "Revestimiento cerámico de muro", order: 15, appliesTo: ["CASA", "DEPARTAMENTO", "AMPLIACION"], materialVariantOf: "muros" },
    { key: "muebles-cocina", label: "Muebles de cocina", order: 16, appliesTo: ["CASA", "DEPARTAMENTO", "AMPLIACION"] },
    { key: "cubierta-meson", label: "Cubierta / Mesón", order: 17, appliesTo: ["CASA", "DEPARTAMENTO", "AMPLIACION"] },
    { key: "lavaplatos", label: "Lavaplatos", order: 18, appliesTo: ["CASA", "DEPARTAMENTO", "AMPLIACION"] },
    { key: "campana-extractor", label: "Campana / Extractor", order: 19, appliesTo: ["CASA", "DEPARTAMENTO", "AMPLIACION"] },
    { key: "extractor-aire", label: "Extractor de aire", order: 20, appliesTo: ["CASA", "DEPARTAMENTO", "AMPLIACION"] },
    { key: "wc", label: "WC / Inodoro", order: 21, appliesTo: ["CASA", "DEPARTAMENTO", "AMPLIACION"] },
    { key: "lavamanos", label: "Lavamanos", order: 22, appliesTo: ["CASA", "DEPARTAMENTO", "AMPLIACION"] },
    { key: "ducha", label: "Ducha", order: 23, appliesTo: ["CASA", "DEPARTAMENTO", "AMPLIACION"] },
    { key: "mampara", label: "Mampara", order: 24, appliesTo: ["CASA", "DEPARTAMENTO", "AMPLIACION"] },
    { key: "tina", label: "Tina / Bañera", order: 25, appliesTo: ["CASA", "DEPARTAMENTO", "AMPLIACION"] },
    { key: "mueble-bano", label: "Mueble de baño / Vanitorio", order: 26, appliesTo: ["CASA", "DEPARTAMENTO", "AMPLIACION"] },
    { key: "cubierta-bano", label: "Cubierta de baño", order: 27, appliesTo: ["CASA", "DEPARTAMENTO", "AMPLIACION"] },
  ] as const;

  const elementByKey = new Map<string, { id: string }>();
  for (const el of elementTemplates) {
    const materialVariantOf = "materialVariantOf" in el ? el.materialVariantOf : undefined;
    const row = await prisma.inspectionElementTemplate.upsert({
      where: { key: el.key },
      update: { label: el.label, order: el.order, appliesTo: [...el.appliesTo], materialVariantOf, active: true },
      create: { key: el.key, label: el.label, order: el.order, appliesTo: [...el.appliesTo], materialVariantOf },
    });
    elementByKey.set(el.key, row);
  }

  // --- Tabla puente espacio <-> elemento ---
  const spaceElementLinks: { spaceKey: string; elementKey: string; order: number }[] = [
    { spaceKey: "cocina", elementKey: "piso", order: 0 },
    { spaceKey: "cocina", elementKey: "muros", order: 1 },
    { spaceKey: "cocina", elementKey: "ventana", order: 2 },
    { spaceKey: "cocina", elementKey: "enchufes-interruptores", order: 3 },
    { spaceKey: "cocina", elementKey: "cielo", order: 4 },
    { spaceKey: "cocina", elementKey: "iluminacion", order: 5 },
    { spaceKey: "living", elementKey: "piso", order: 0 },
    { spaceKey: "living", elementKey: "muros", order: 1 },
    { spaceKey: "living", elementKey: "ventana", order: 2 },
    { spaceKey: "living", elementKey: "enchufes-interruptores", order: 3 },
    { spaceKey: "living", elementKey: "cielo", order: 4 },
    { spaceKey: "living", elementKey: "iluminacion", order: 5 },
    { spaceKey: "dormitorio", elementKey: "piso", order: 0 },
    { spaceKey: "dormitorio", elementKey: "muros", order: 1 },
    { spaceKey: "dormitorio", elementKey: "puerta", order: 2 },
    { spaceKey: "dormitorio", elementKey: "ventana", order: 3 },
    { spaceKey: "dormitorio", elementKey: "enchufes-interruptores", order: 4 },
    { spaceKey: "dormitorio", elementKey: "cielo", order: 5 },
    { spaceKey: "dormitorio", elementKey: "iluminacion", order: 6 },
    { spaceKey: "bano", elementKey: "piso", order: 0 },
    { spaceKey: "bano", elementKey: "muros", order: 1 },
    { spaceKey: "bano", elementKey: "artefactos-sanitarios", order: 2 },
    { spaceKey: "bano", elementKey: "cielo", order: 3 },
    { spaceKey: "bano", elementKey: "enchufes-interruptores", order: 4 },
    { spaceKey: "bano", elementKey: "iluminacion", order: 5 },
    { spaceKey: "bano", elementKey: "puerta", order: 6 },
    { spaceKey: "bodega", elementKey: "bodega", order: 0 },
    { spaceKey: "bodega", elementKey: "piso", order: 1 },
    { spaceKey: "bodega", elementKey: "muros", order: 2 },
    { spaceKey: "bodega", elementKey: "cielo", order: 3 },
    { spaceKey: "bodega", elementKey: "enchufes-interruptores", order: 4 },
    { spaceKey: "bodega", elementKey: "iluminacion", order: 5 },
    { spaceKey: "estacionamiento", elementKey: "estacionamiento", order: 0 },
    { spaceKey: "estacionamiento", elementKey: "piso", order: 1 },
    { spaceKey: "recinto-ampliado", elementKey: "piso", order: 0 },
    { spaceKey: "recinto-ampliado", elementKey: "muros", order: 1 },
    { spaceKey: "recinto-ampliado", elementKey: "ventana", order: 2 },
    { spaceKey: "recinto-ampliado", elementKey: "puerta", order: 3 },
    { spaceKey: "recinto-ampliado", elementKey: "enchufes-interruptores", order: 4 },
    { spaceKey: "recinto-ampliado", elementKey: "cielo", order: 5 },
    { spaceKey: "recinto-ampliado", elementKey: "iluminacion", order: 6 },
    { spaceKey: "antejardin", elementKey: "fachada", order: 0 },
    { spaceKey: "antejardin", elementKey: "reja", order: 1 },
    { spaceKey: "antejardin", elementKey: "piso", order: 2 },
    { spaceKey: "acceso-vehicular", elementKey: "porton", order: 0 },
    { spaceKey: "acceso-vehicular", elementKey: "piso", order: 1 },
    { spaceKey: "comedor", elementKey: "piso", order: 0 },
    { spaceKey: "comedor", elementKey: "muros", order: 1 },
    { spaceKey: "comedor", elementKey: "ventana", order: 2 },
    { spaceKey: "comedor", elementKey: "enchufes-interruptores", order: 3 },
    { spaceKey: "comedor", elementKey: "cielo", order: 4 },
    { spaceKey: "comedor", elementKey: "iluminacion", order: 5 },
    { spaceKey: "living-comedor", elementKey: "piso", order: 0 },
    { spaceKey: "living-comedor", elementKey: "muros", order: 1 },
    { spaceKey: "living-comedor", elementKey: "ventana", order: 2 },
    { spaceKey: "living-comedor", elementKey: "enchufes-interruptores", order: 3 },
    { spaceKey: "living-comedor", elementKey: "cielo", order: 4 },
    { spaceKey: "living-comedor", elementKey: "iluminacion", order: 5 },
    { spaceKey: "terraza-logia", elementKey: "piso", order: 0 },
    { spaceKey: "terraza-logia", elementKey: "muros", order: 1 },
    { spaceKey: "terraza-logia", elementKey: "ventana", order: 2 },
    { spaceKey: "terraza-cerrada", elementKey: "piso", order: 0 },
    { spaceKey: "terraza-cerrada", elementKey: "muros", order: 1 },
    { spaceKey: "terraza-cerrada", elementKey: "ventana", order: 2 },
    { spaceKey: "terraza-cerrada", elementKey: "puerta", order: 3 },
    { spaceKey: "terraza-cerrada", elementKey: "enchufes-interruptores", order: 4 },
    { spaceKey: "terraza-cerrada", elementKey: "cielo", order: 5 },
    { spaceKey: "terraza-cerrada", elementKey: "iluminacion", order: 6 },
    { spaceKey: "patio-trasero", elementKey: "piso", order: 0 },
    { spaceKey: "terraza", elementKey: "piso", order: 0 },
    { spaceKey: "terraza", elementKey: "muros", order: 1 },
    { spaceKey: "terraza", elementKey: "ventana", order: 2 },
    { spaceKey: "logia-lavanderia", elementKey: "piso", order: 0 },
    { spaceKey: "logia-lavanderia", elementKey: "muros", order: 1 },
    { spaceKey: "logia-lavanderia", elementKey: "enchufes-interruptores", order: 2 },
    { spaceKey: "logia-lavanderia", elementKey: "cielo", order: 3 },
    { spaceKey: "logia-lavanderia", elementKey: "iluminacion", order: 4 },
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
  const checklistItems: {
    elementKey: string;
    question: string;
    order: number;
    technicalArticleSlug?: string;
    defaultSeverity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    active?: boolean;
  }[] = [
    { elementKey: "baranda", question: "¿La baranda se ve firme, sin bamboleo al empujarla suavemente?", order: 0, technicalArticleSlug: "baranda-firmeza", defaultSeverity: "HIGH" },
    { elementKey: "lavadero", question: "¿La grifería del lavadero abre y cierra correctamente, sin quedar goteando?", order: 0, technicalArticleSlug: "lavadero-griferia", defaultSeverity: "MEDIUM" },
    { elementKey: "piso", question: "¿Presenta daños visibles?", order: 0, technicalArticleSlug: "piso-como-revisar-danos-visibles" },
    { elementKey: "conexion-lavadora", question: "¿La llave de agua para la lavadora abre y cierra correctamente?", order: 0, technicalArticleSlug: "conexion-lavadora-llave", defaultSeverity: "MEDIUM" },
    { elementKey: "closet", question: "¿Las puertas y/o cajones del clóset abren y cierran correctamente, sin atascarse ni forzar?", order: 0, technicalArticleSlug: "closet-funcionamiento", defaultSeverity: "MEDIUM" },
    { elementKey: "closet", question: "¿El clóset se siente firme y bien sujeto a la pared, sin bamboleo evidente al empujarlo suavemente?", order: 1, technicalArticleSlug: "closet-fijacion", defaultSeverity: "HIGH" },
    { elementKey: "piso", question: "¿Presenta desniveles?", order: 1, technicalArticleSlug: "piso-como-revisar-desniveles" },
    { elementKey: "baranda", question: "¿Presenta daños visibles: barrotes sueltos, quebrados, oxidados u otros deterioros?", order: 1, technicalArticleSlug: "baranda-danos", defaultSeverity: "MEDIUM" },
    { elementKey: "lavadero", question: "Al dejar correr agua, ¿se observa alguna fuga o goteo bajo el lavadero?", order: 1, technicalArticleSlug: "lavadero-fugas", defaultSeverity: "HIGH" },
    { elementKey: "conexion-lavadora", question: "Al abrir la llave brevemente, ¿se observa alguna fuga visible en la conexión?", order: 1, technicalArticleSlug: "conexion-lavadora-fugas", defaultSeverity: "HIGH" },
    { elementKey: "closet", question: "¿Presenta daños visibles: golpes, rayas profundas, paneles despegados o quebrados?", order: 2, technicalArticleSlug: "closet-danos-visibles", defaultSeverity: "LOW" },
    { elementKey: "conexion-lavadora", question: "¿El desagüe visible para la lavadora está presente y sin fuga?", order: 2, technicalArticleSlug: "conexion-lavadora-desague", defaultSeverity: "MEDIUM" },
    { elementKey: "baranda", question: "¿La baranda está firmemente fijada a la estructura, sin separaciones visibles en sus anclajes?", order: 2, technicalArticleSlug: "baranda-anclaje", defaultSeverity: "HIGH" },
    { elementKey: "lavadero", question: "¿El lavadero se ve firme y bien instalado, sin moverse al tocarlo?", order: 2, technicalArticleSlug: "lavadero-firmeza", defaultSeverity: "LOW" },
    { elementKey: "closet", question: "¿Se observan manchas de humedad o deformación (hinchazón) en el interior o en las puertas del clóset?", order: 3, technicalArticleSlug: "closet-humedad-deformacion", defaultSeverity: "MEDIUM" },
    { elementKey: "lavadero", question: "¿El sello alrededor del lavadero se ve continuo, sin separaciones ni grietas?", order: 3, technicalArticleSlug: "lavadero-sello", defaultSeverity: "LOW" },
    { elementKey: "conexion-lavadora", question: "¿Los componentes visibles (llave, mangueras, conexiones) se ven firmes y sin daños?", order: 3, technicalArticleSlug: "conexion-lavadora-firmeza", defaultSeverity: "LOW" },
    { elementKey: "muros", question: "¿Presenta fisuras visibles?", order: 0, technicalArticleSlug: "muros-como-revisar-fisuras", defaultSeverity: "MEDIUM" },
    { elementKey: "ventana", question: "¿Opera correctamente?", order: 0, technicalArticleSlug: "ventana-como-revisar-funcionamiento", active: false },
    { elementKey: "ventana", question: "¿La ventana abre y cierra correctamente?", order: 1, technicalArticleSlug: "ventana-apertura-cierre" },
    { elementKey: "ventana", question: "¿La manilla y los herrajes funcionan correctamente?", order: 2, technicalArticleSlug: "ventana-manilla-herrajes" },
    { elementKey: "ventana", question: "Con la ventana cerrada, ¿se ve alguna separación entre la hoja y el marco?", order: 3, technicalArticleSlug: "ventana-sello-hoja-marco" },
    { elementKey: "ventana", question: "¿El vidrio presenta rayas, trizaduras u otros daños visibles?", order: 4, technicalArticleSlug: "ventana-vidrio-danos-visibles" },
    { elementKey: "ventana", question: "Si la ventana es de termopanel (doble vidrio), ¿se ve condensación o empañamiento ENTRE los vidrios?", order: 5, technicalArticleSlug: "ventana-vidrio-condensacion-interna" },
    { elementKey: "ventana", question: "¿El sello entre el marco de la ventana y el muro se ve continuo, sin separaciones ni grietas?", order: 6, technicalArticleSlug: "ventana-sello-marco-muro" },
    { elementKey: "ventana", question: "¿El marco de la ventana presenta golpes, rayas profundas o deformaciones visibles?", order: 7, technicalArticleSlug: "ventana-marco-danos-visibles" },
    { elementKey: "puerta", question: "¿Cierra correctamente?", order: 0, technicalArticleSlug: "puerta-como-revisar-cierre" },
    { elementKey: "artefactos-sanitarios", question: "¿Después de descargar el inodoro, el agua deja de correr con normalidad?", order: 0, technicalArticleSlug: "artefactos-sanitarios-como-revisar-descarga-inodoro" },
    { elementKey: "artefactos-sanitarios", question: "¿No hay fugas visibles en la base de los artefactos?", order: 1, technicalArticleSlug: "artefactos-sanitarios-como-revisar-fugas-base" },
    { elementKey: "artefactos-sanitarios", question: "¿No hay goteras ni filtraciones en las llaves?", order: 2, technicalArticleSlug: "artefactos-sanitarios-como-revisar-goteras-llaves" },
    { elementKey: "enchufes-interruptores", question: "¿Cada enchufe probado funciona con un artefacto real?", order: 0, technicalArticleSlug: "enchufes-interruptores-como-revisar-funcionamiento" },
    { elementKey: "bodega", question: "¿La puerta cierra y el candado/cerradura funciona?", order: 0, technicalArticleSlug: "bodega-como-revisar-cierre" },
    { elementKey: "estacionamiento", question: "¿La demarcación del espacio es clara y el pavimento está en buen estado?", order: 0, technicalArticleSlug: "estacionamiento-como-revisar-demarcacion-pavimento" },
    { elementKey: "fachada", question: "¿Presenta fisuras o daños visibles?", order: 0 },
    { elementKey: "reja", question: "¿Abre y cierra correctamente, sin forzar?", order: 0 },
    { elementKey: "porton", question: "¿Abre y cierra correctamente?", order: 0 },
    { elementKey: "cielo", question: "¿El cielo presenta manchas, grietas u otros daños visibles?", order: 0, technicalArticleSlug: "cielo-como-revisar-manchas-grietas" },
    { elementKey: "cielo", question: "¿Se observan manchas de humedad en el cielo?", order: 1, technicalArticleSlug: "cielo-como-revisar-manchas-humedad" },
    { elementKey: "iluminacion", question: "¿La iluminación del recinto enciende correctamente y el elemento visible se encuentra firme?", order: 0, technicalArticleSlug: "iluminacion-como-revisar-encendido-fijacion" },
    { elementKey: "revestimiento-ceramico-piso", question: "¿Hay palmetas quebradas, trisadas o despuntadas?", order: 0, technicalArticleSlug: "revestimiento-ceramico-piso-palmetas-quebradas" },
    { elementKey: "revestimiento-ceramico-piso", question: "¿Se observan defectos visibles en el esmalte o superficie de las palmetas?", order: 1, technicalArticleSlug: "revestimiento-ceramico-piso-defectos-esmalte" },
    { elementKey: "pintura-muro", question: "¿Se observan manchas, marcas o defectos visibles en la pintura?", order: 0, technicalArticleSlug: "pintura-muro-manchas-defectos" },
    { elementKey: "revestimiento-ceramico-muro", question: "¿Hay palmetas quebradas, trisadas o despuntadas?", order: 0, technicalArticleSlug: "revestimiento-ceramico-muro-palmetas-quebradas" },
    { elementKey: "revestimiento-ceramico-muro", question: "¿Se observan defectos visibles en el esmalte o superficie de las palmetas?", order: 1, technicalArticleSlug: "revestimiento-ceramico-muro-defectos-esmalte" },
    { elementKey: "muebles-cocina", question: "¿Las puertas y cajones abren, cierran o deslizan correctamente (cuando existan)?", order: 0, technicalArticleSlug: "muebles-cocina-funcionamiento", defaultSeverity: "MEDIUM" },
    { elementKey: "muebles-cocina", question: "¿Los muebles se sienten firmes y bien sujetos, sin moverse al tocarlos?", order: 1, technicalArticleSlug: "muebles-cocina-fijacion", defaultSeverity: "HIGH" },
    { elementKey: "muebles-cocina", question: "¿Los muebles presentan golpes, quiebres, rayas profundas u otros daños visibles?", order: 2, technicalArticleSlug: "muebles-cocina-danos-visibles", defaultSeverity: "LOW" },
    { elementKey: "cubierta-meson", question: "¿La cubierta o mesón se ve firme y bien fijada, sin moverse al tocarla?", order: 0, technicalArticleSlug: "cubierta-meson-fijacion", defaultSeverity: "MEDIUM" },
    { elementKey: "cubierta-meson", question: "¿La cubierta presenta daños visibles o separaciones/grietas en el encuentro con el muro?", order: 1, technicalArticleSlug: "cubierta-meson-danos-sellos", defaultSeverity: "LOW" },
    { elementKey: "lavaplatos", question: "¿La grifería abre y cierra correctamente, sin quedar goteando?", order: 0, technicalArticleSlug: "lavaplatos-griferia-funcionamiento", defaultSeverity: "LOW" },
    { elementKey: "lavaplatos", question: "¿Funcionan correctamente el agua fría y caliente de la grifería, cuando la instalación dispone de ambas?", order: 1, technicalArticleSlug: "lavaplatos-agua-fria-caliente", defaultSeverity: "LOW" },
    { elementKey: "lavaplatos", question: "Al dejar correr agua, ¿se observa alguna fuga o goteo bajo el lavaplatos?", order: 2, technicalArticleSlug: "lavaplatos-fugas", defaultSeverity: "HIGH" },
    { elementKey: "lavaplatos", question: "¿El lavaplatos se ve firme y bien instalado, sin moverse al tocarlo?", order: 3, technicalArticleSlug: "lavaplatos-fijacion", defaultSeverity: "MEDIUM" },
    { elementKey: "lavaplatos", question: "¿El sello alrededor del lavaplatos se ve continuo, sin separaciones ni grietas?", order: 4, technicalArticleSlug: "lavaplatos-sello-perimetral", defaultSeverity: "MEDIUM" },
    { elementKey: "campana-extractor", question: "¿La campana o extractor enciende y responde normalmente a sus controles (velocidades, si tiene más de una)?", order: 0, technicalArticleSlug: "campana-extractor-funcionamiento", defaultSeverity: "MEDIUM" },
    { elementKey: "campana-extractor", question: "Si la campana tiene iluminación incorporada, ¿enciende correctamente?", order: 1, technicalArticleSlug: "campana-extractor-iluminacion", defaultSeverity: "LOW" },
    { elementKey: "campana-extractor", question: "Al funcionar, ¿presenta vibraciones, golpes o ruidos claramente irregulares (más allá del ruido normal del motor)?", order: 2, technicalArticleSlug: "campana-extractor-ruido-vibracion", defaultSeverity: "MEDIUM" },
    { elementKey: "extractor-aire", question: "¿El extractor enciende y funciona al accionar su control normal?", order: 0, technicalArticleSlug: "extractor-aire-funcionamiento", defaultSeverity: "MEDIUM" },
    { elementKey: "extractor-aire", question: "Al funcionar, ¿presenta vibraciones, golpes o ruidos claramente irregulares (más allá del ruido normal del motor)?", order: 1, technicalArticleSlug: "extractor-aire-ruido-vibracion", defaultSeverity: "MEDIUM" },
    { elementKey: "wc", question: "¿El inodoro descarga correctamente al accionar el mecanismo, y el agua deja de correr con normalidad después?", order: 0, technicalArticleSlug: "wc-descarga", defaultSeverity: "MEDIUM" },
    { elementKey: "wc", question: "¿Se observan fugas o humedad alrededor de la base del inodoro después de una descarga normal?", order: 1, technicalArticleSlug: "wc-fugas", defaultSeverity: "HIGH" },
    { elementKey: "wc", question: "¿El inodoro se ve firme y estable, sin movimiento evidente al tocarlo suavemente?", order: 2, technicalArticleSlug: "wc-fijacion", defaultSeverity: "MEDIUM" },
    { elementKey: "wc", question: "¿El inodoro presenta trizaduras, quiebres, golpes u otros daños visibles en la loza?", order: 3, technicalArticleSlug: "wc-danos-visibles", defaultSeverity: "LOW" },
    { elementKey: "lavamanos", question: "¿La grifería abre y cierra correctamente, sin quedar goteando?", order: 0, technicalArticleSlug: "lavamanos-griferia", defaultSeverity: "LOW" },
    { elementKey: "lavamanos", question: "¿Funcionan correctamente el agua fría y caliente de la grifería, cuando la instalación dispone de ambas?", order: 1, technicalArticleSlug: "lavamanos-agua-fria-caliente", defaultSeverity: "LOW" },
    { elementKey: "lavamanos", question: "Al dejar correr agua, ¿se observa alguna fuga o goteo bajo el lavamanos?", order: 2, technicalArticleSlug: "lavamanos-fugas", defaultSeverity: "HIGH" },
    { elementKey: "lavamanos", question: "¿El lavamanos se ve firme y bien instalado, sin moverse al tocarlo suavemente?", order: 3, technicalArticleSlug: "lavamanos-fijacion", defaultSeverity: "MEDIUM" },
    { elementKey: "lavamanos", question: "Si el lavamanos tiene un encuentro visible con la cubierta o el muro (por ejemplo, sobre o bajo una cubierta), ¿ese sello se ve continuo, sin separaciones ni grietas?", order: 4, technicalArticleSlug: "lavamanos-sello-perimetral", defaultSeverity: "MEDIUM" },
    { elementKey: "ducha", question: "¿La grifería de la ducha abre, cierra y responde correctamente al accionar sus controles?", order: 0, technicalArticleSlug: "ducha-griferia", defaultSeverity: "LOW" },
    { elementKey: "ducha", question: "¿Funcionan correctamente el agua fría y caliente de la ducha, cuando la instalación dispone de ambas?", order: 1, technicalArticleSlug: "ducha-agua-fria-caliente", defaultSeverity: "LOW" },
    { elementKey: "ducha", question: "Al usar la ducha, ¿se observan fugas o goteos en conexiones visibles, fuera de las salidas normales de agua (rociador, llave)?", order: 2, technicalArticleSlug: "ducha-fugas", defaultSeverity: "HIGH" },
    { elementKey: "ducha", question: "Después de dejar correr agua durante el uso normal de la ducha, ¿el agua evacúa sin quedar acumulada en el piso o el receptáculo?", order: 3, technicalArticleSlug: "ducha-evacuacion", defaultSeverity: "MEDIUM" },
    { elementKey: "ducha", question: "Si la ducha tiene receptáculo o plato (prefabricado, no cerámico continuo), ¿se ve firme y sin trizaduras, quiebres u otros daños visibles?", order: 4, technicalArticleSlug: "ducha-receptaculo", defaultSeverity: "MEDIUM" },
    { elementKey: "ducha", question: "El sello entre el receptáculo/plato de la ducha (o el piso de la zona de ducha) y el muro, ¿se ve continuo, sin separaciones ni grietas?", order: 5, technicalArticleSlug: "ducha-sello-perimetral", defaultSeverity: "MEDIUM" },
    { elementKey: "mampara", question: "Si la mampara tiene alguna hoja móvil (corredera, abatible o plegable), ¿abre, cierra o desliza correctamente, sin atascarse ni forzar?", order: 0, technicalArticleSlug: "mampara-funcionamiento", defaultSeverity: "MEDIUM" },
    { elementKey: "mampara", question: "¿La mampara se ve firme y estable, sin movimientos o piezas sueltas al tocarla suavemente?", order: 1, technicalArticleSlug: "mampara-fijacion", defaultSeverity: "MEDIUM" },
    { elementKey: "mampara", question: "¿Los vidrios o perfiles de la mampara presentan trizaduras, quiebres, rayas profundas u otros daños visibles?", order: 2, technicalArticleSlug: "mampara-danos-visibles", defaultSeverity: "HIGH" },
    { elementKey: "mampara", question: "¿Los sellos visibles de la mampara (perfiles contra el muro o el receptáculo, uniones entre paneles) se ven continuos, sin separaciones ni grietas?", order: 3, technicalArticleSlug: "mampara-sellos", defaultSeverity: "MEDIUM" },
    { elementKey: "mampara", question: "Durante el uso normal de la ducha, ¿se observa agua saliendo fuera de la mampara (más allá de salpicaduras normales)?", order: 4, technicalArticleSlug: "mampara-filtracion", defaultSeverity: "MEDIUM" },
    { elementKey: "tina", question: "¿La tina presenta trizaduras, quiebres, golpes, esmalte saltado u otros daños visibles?", order: 0, technicalArticleSlug: "tina-danos-visibles", defaultSeverity: "LOW" },
    { elementKey: "tina", question: "¿La tina se ve firme y estable, sin movimiento evidente, crujidos anormales ni separaciones visibles en sus apoyos o encuentros?", order: 1, technicalArticleSlug: "tina-fijacion", defaultSeverity: "MEDIUM" },
    { elementKey: "tina", question: "¿El tapón o válvula de la tina retiene el agua sin pérdida evidente durante unos momentos al cerrarlo?", order: 2, technicalArticleSlug: "tina-tapon-valvula", defaultSeverity: "LOW" },
    { elementKey: "tina", question: "Al usar la tina, ¿se observa alguna fuga o humedad visible en sus conexiones o desagüe visibles y accesibles?", order: 3, technicalArticleSlug: "tina-fugas", defaultSeverity: "HIGH" },
    { elementKey: "tina", question: "Después de dejar correr una cantidad moderada de agua y destapar el desagüe, ¿el agua evacúa con normalidad, sin quedar acumulada?", order: 4, technicalArticleSlug: "tina-evacuacion", defaultSeverity: "MEDIUM" },
    { elementKey: "tina", question: "El sello visible entre la tina y el muro (y el piso, si existe ese encuentro), ¿se ve continuo, sin separaciones ni grietas?", order: 5, technicalArticleSlug: "tina-sellos", defaultSeverity: "MEDIUM" },
    { elementKey: "tina", question: "Si la tina tiene un sistema de llenado propio, distinto al de la ducha, ¿el agua sale con normalidad al abrir esa llave, incluyendo fría y caliente si la instalación dispone de ambas?", order: 6, technicalArticleSlug: "tina-llenado", defaultSeverity: "MEDIUM" },
    { elementKey: "mueble-bano", question: "¿Las puertas y cajones del mueble abren, cierran o deslizan correctamente, cuando existan?", order: 0, technicalArticleSlug: "mueble-bano-funcionamiento", defaultSeverity: "MEDIUM" },
    { elementKey: "mueble-bano", question: "¿El mueble se siente firme y bien sujeto, sin movimiento evidente al tocarlo suavemente?", order: 1, technicalArticleSlug: "mueble-bano-fijacion", defaultSeverity: "HIGH" },
    { elementKey: "mueble-bano", question: "¿El mueble presenta golpes, quiebres, rayas profundas, cantos despegados u otros daños visibles?", order: 2, technicalArticleSlug: "mueble-bano-danos-visibles", defaultSeverity: "LOW" },
    { elementKey: "mueble-bano", question: "¿Se observan señales de humedad en el mueble (tablero hinchado, melamina levantada, cantos despegados por humedad, manchas, o moho visible)?", order: 3, technicalArticleSlug: "mueble-bano-humedad", defaultSeverity: "MEDIUM" },
    { elementKey: "cubierta-bano", question: "¿La cubierta o mesón se ve firme y bien instalada, sin movimiento evidente al tocarla suavemente?", order: 0, technicalArticleSlug: "cubierta-bano-fijacion", defaultSeverity: "MEDIUM" },
    { elementKey: "cubierta-bano", question: "¿La cubierta presenta golpes, quiebres, trizaduras, rayas profundas, manchas, hinchamiento u otro deterioro o daño visible?", order: 1, technicalArticleSlug: "cubierta-bano-danos-visibles", defaultSeverity: "LOW" },
    { elementKey: "cubierta-bano", question: "El sello entre la cubierta y el muro (en el tramo que no corresponde al Lavamanos), ¿se ve continuo, sin separaciones ni grietas?", order: 2, technicalArticleSlug: "cubierta-bano-sello", defaultSeverity: "MEDIUM" },
  ];

  for (const item of checklistItems) {
    const elementTemplateId = elementByKey.get(item.elementKey)!.id;
    const existing = await prisma.inspectionChecklistItem.findFirst({
      where: { elementTemplateId, question: item.question },
    });
    const active = item.active ?? true;
    if (existing) {
      await prisma.inspectionChecklistItem.update({
        where: { id: existing.id },
        data: {
          order: item.order,
          active,
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
          active,
          technicalArticleSlug: item.technicalArticleSlug,
          defaultSeverity: item.defaultSeverity,
        },
      });
    }
  }

  // --- Biblioteca técnica ---
  const technicalArticles: { slug: string; title: string; content: string }[] = [
    { slug: "artefactos-sanitarios-como-revisar-descarga-inodoro", title: "Cómo revisar la descarga del inodoro", content: `# Qué revisar

Si después de accionar la descarga del inodoro, el agua deja de correr con normalidad.

# Cómo revisarlo

Acciona la descarga del inodoro y observa el estanque y la taza durante unos segundos después de que termine el ciclo. Confirma que el agua deja de correr y no queda un hilo de agua constante ni un ruido de agua corriendo de fondo.

# Qué debería observarse

Después de la descarga, el agua se detiene por completo en un tiempo razonable, sin quedar corriendo de forma continua ni goteando dentro del estanque.

# Qué señales pueden indicar un problema

- El agua sigue corriendo varios segundos después de terminado el ciclo normal.
- Se escucha un ruido de agua corriendo de forma intermitente sin que nadie haya accionado la descarga.

Conviene registrar la observación aunque no sea necesariamente grave.

# Por qué importa

Un mecanismo de descarga que no se detiene bien puede representar un gasto de agua sostenido en el tiempo — vale la pena dejarlo registrado antes de dar por recibido el baño.

# Recomendación

Si notas que el agua no se detiene con normalidad, regístralo como observación con foto o video corto, indicando cuánto tiempo sigue corriendo. No es necesario abrir el estanque ni manipular el mecanismo interno — con la observación visual/auditiva alcanza para dejar constancia.

# Fuente

- **Criterio interno adaptado**: catálogo educativo ITO (265 puntos), sección Artefactos sanitarios — verificación de firmeza y funcionamiento básico de artefactos.

Sin referencia normativa verificada en esta fuente.` },
    { slug: "artefactos-sanitarios-como-revisar-fugas-base", title: "Cómo revisar fugas en la base de los artefactos sanitarios", content: `# Qué revisar

Si hay fugas visibles de agua en la base de los artefactos sanitarios (inodoro, lavamanos, tina/receptáculo de ducha si corresponde).

# Cómo revisarlo

Observa la base de cada artefacto sanitario con buena luz, buscando manchas de humedad, agua acumulada o goteo activo. Puedes pasar la mano (seca) cerca de la base, sin tocar directamente conexiones de agua, para sentir si hay humedad.

# Qué debería observarse

La base de cada artefacto seca, sin manchas de humedad ni agua acumulada alrededor, y sin goteo visible mientras se usa normalmente.

# Qué señales pueden indicar un problema

- Manchas de humedad o agua acumulada en el piso junto a la base del artefacto.
- Goteo visible mientras se usa el artefacto.
- El artefacto se ve o se siente inestable al apoyarse levemente sobre él.

Cualquiera de estas señales conviene documentarla, aunque el origen exacto no se pueda determinar solo con la observación visual.

# Por qué importa

Una fuga en la base, aunque parezca menor, puede afectar el piso o generar humedad sostenida si no se corrige a tiempo — por eso conviene dejarla registrada apenas se detecta.

# Recomendación

Si ves humedad o goteo, regístralo como observación con foto, indicando el artefacto exacto (inodoro, lavamanos, tina/ducha). No es necesario desmontar el artefacto ni abrir sus conexiones de agua — la observación visual es suficiente para dejar constancia.

# Fuente

- **Criterio interno adaptado**: catálogo educativo ITO (265 puntos), sección Artefactos sanitarios — verificación de fugas visibles en la base de artefactos.

Sin referencia normativa verificada en esta fuente.` },
    { slug: "artefactos-sanitarios-como-revisar-goteras-llaves", title: "Cómo revisar goteras y filtraciones en llaves", content: `# Qué revisar

Si hay goteras o filtraciones visibles en las llaves (grifería) de lavamanos, cocina, ducha/tina.

# Cómo revisarlo

Abre y cierra cada llave por separado, observando si queda goteando después de cerrarla completamente. Revisa también la base de la llave (donde se conecta a la superficie) buscando humedad o filtración mientras está en uso.

# Qué debería observarse

La llave cierra por completo sin goteo posterior, y no hay humedad ni filtración visible en la base mientras está en uso.

# Qué señales pueden indicar un problema

- La llave sigue goteando después de cerrada por completo.
- Hay humedad o filtración visible en la base de la llave mientras corre el agua.

Conviene registrar la observación con foto, indicando en qué llave específica se detectó.

# Por qué importa

Una llave que gotea, aunque sea poco, representa un gasto de agua sostenido en el tiempo y suele ser más fácil de resolver mientras la vivienda todavía está en garantía o en proceso de entrega.

# Recomendación

Si detectas goteo o filtración, regístralo como observación con foto. No es necesario desarmar la llave ni intervenir sus conexiones internas — con probar abrir/cerrar y observar alcanza para dejar constancia.

# Fuente

- **Criterio interno adaptado**: catálogo educativo ITO (265 puntos), sección Grifería — verificación de ausencia de goteras y filtraciones visibles.

Sin referencia normativa verificada en esta fuente.` },
    { slug: "baranda-anclaje", title: "Cómo revisar el anclaje de la baranda", content: `# Qué revisar

Si los anclajes (puntos donde la baranda se fija al piso, muro o estructura de la terraza) se ven firmes, sin separaciones ni holguras visibles.

# Cómo revisarlo

Observa cada punto de anclaje visible (base de los postes, encuentros con el muro) y verifica si hay separación entre el anclaje y la superficie donde se fija.

# Qué debería verse

Los anclajes están firmemente unidos a la superficie, sin espacios, grietas ni óxido que sugiera que el anclaje se ha debilitado con el tiempo.

# Qué señales pueden indicar un problema

- Separación visible entre el anclaje y el piso o muro.
- Grietas en el material alrededor del anclaje.
- Tornillos o pernos faltantes, sueltos o muy oxidados.

# Por qué importa

Un anclaje comprometido es la causa más común de falla de barandas — puede no notarse a simple vista si solo se prueba la firmeza general, por lo que revisar cada punto de anclaje por separado es importante.

# Recomendación

Si detectas separaciones o anclajes deteriorados, regístralos como observación con foto, indicando el punto exacto. No intentes reforzar ni ajustar el anclaje tú mismo — solo deja constancia visual.

# Fuente

- **Criterio interno**: revisión basada en criterio de seguridad básica sobre anclajes visibles — sin normativa estructural específica consultada que respalde tolerancias de fijación.` },
    { slug: "baranda-danos", title: "Cómo revisar daños visibles en la baranda", content: `# Qué revisar

Si la baranda presenta barrotes sueltos, quebrados, oxidados u otro tipo de deterioro visible en sus materiales.

# Cómo revisarlo

Recorre visualmente toda la baranda, observando cada barrote o panel y los puntos de unión entre ellos.

# Qué debería verse

Barrotes y paneles completos, sin quiebres, sin óxido avanzado (picaduras profundas o pérdida de material) ni piezas visiblemente sueltas.

# Qué señales pueden indicar un problema

- Barrotes quebrados, doblados o faltantes.
- Óxido avanzado que compromete visiblemente el material (no una simple mancha superficial).
- Piezas que se ven sueltas o mal ensambladas.

# Por qué importa

El deterioro de los materiales de la baranda puede derivar con el tiempo en una falla de seguridad, además de ser un defecto estético relevante en un elemento tan visible.

# Recomendación

Si detectas daños, regístralos como observación con foto, indicando el tramo afectado.

# Fuente

- **Criterio interno**: revisión basada en inspección visual básica de daños en elementos metálicos o de otro material — sin normativa específica de barandas consultada que respalde tolerancias exactas de óxido o deformación.` },
    { slug: "baranda-firmeza", title: "Cómo revisar la firmeza de la baranda", content: `# Qué revisar

Si la baranda de la terraza se ve firme y estable, sin bamboleo ni movimiento al empujarla.

# Cómo revisarlo

Empuja la baranda suavemente con la mano, en varios puntos de su recorrido (no solo un extremo), sin forzarla ni apoyar todo el peso del cuerpo.

# Qué debería verse

La baranda no se mueve, bascula ni cede al empujarla suavemente, en ningún punto de su recorrido.

# Qué señales pueden indicar un problema

- La baranda se mueve, bascula o cede al empujarla.
- Algún tramo se siente más suelto que el resto.
- Vibración o ruido anormal al tocarla.

# Por qué importa

Una baranda inestable es un riesgo de seguridad real — su función principal es evitar caídas, y una fijación deficiente puede fallar bajo el peso de una persona apoyándose en un momento de descuido.

# Recomendación

Si detectas cualquier inestabilidad, regístrala como observación con foto y severidad alta — no te apoyes con fuerza para confirmar el hallazgo, un empuje suave ya es suficiente evidencia.

# Fuente

- **Criterio interno**: no existe una partida específica para barandas de terraza en el Manual de Tolerancias ni en el catálogo educativo ITO consultados — revisión basada en criterio de seguridad básica (estabilidad ante uso normal), sin atribuir normativa estructural que no la respalda.` },
    { slug: "bodega-como-revisar-cierre", title: "Cómo revisar el cierre de la bodega", content: `# Qué revisar

Si la puerta de la bodega cierra correctamente y si el candado o la cerradura funciona con normalidad.

# Cómo revisarlo

Abre y cierra la puerta normalmente. Comprueba si roza, si cuesta cerrarla, o si el mecanismo funciona con normalidad. Si tiene candado, prueba colocarlo, cerrarlo y abrirlo sin forzar. Si tiene cerradura, pruébala normalmente con su llave. No es necesario desmontar, ajustar, lubricar ni forzar nada — solo probar el uso normal.

# Qué debería observarse

La puerta abre y cierra normalmente. El candado o la cerradura puede utilizarse sin necesidad de forzar.

# Qué señales pueden indicar un problema

- La puerta roza.
- Cuesta abrirla o cerrarla.
- No logra cerrar correctamente.
- El candado o la cerradura no abre o no cierra con normalidad.
- El mecanismo requiere fuerza excesiva.

Estas observaciones no determinan automáticamente la causa.

# Por qué importa

Que la bodega cierre con normalidad es lo que le permite cumplir su función práctica de resguardo.

# Recomendación

Registra con fotografía y comentario qué parte presenta el problema. No fuerces ni desmontes el mecanismo. Si el problema impide utilizar normalmente el cierre, considera solicitar revisión.

# Fuente

- **Criterio interno**: comprobación funcional básica de puerta y mecanismo de cierre — no requiere conocimiento técnico especializado.

No existe fuente ITO ni Manual de Tolerancias CDT específica para bodega (confirmado en Fase 6A y reconfirmado en Fase 11G) — no se aplica ningún criterio normativo.` },
    { slug: "campana-extractor-funcionamiento", title: "Cómo revisar el funcionamiento de la campana o extractor", content: `# Qué revisar

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

- Criterio interno del proyecto, comprobación funcional directa — sin fuente normativa aplicable (el Manual de Tolerancias no trata equipamiento de extracción de cocina).` },
    { slug: "campana-extractor-iluminacion", title: "Cómo revisar la iluminación de la campana", content: `# Qué revisar

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

- Criterio interno del proyecto, comprobación funcional directa — sin fuente normativa aplicable.` },
    { slug: "campana-extractor-ruido-vibracion", title: "Cómo revisar ruido y vibración anormal en la campana o extractor", content: `# Qué revisar

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

- Criterio interno del proyecto, comprobación funcional directa, redactada con precaución para no convertir el sonido normal de operación en un defecto — sin fuente normativa aplicable.` },
    { slug: "cielo-como-revisar-manchas-grietas", title: "Cómo revisar manchas o grietas en el cielo", content: `# Qué revisar

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

Sin referencia normativa verificada para esta revisión específica.` },
    { slug: "cielo-como-revisar-manchas-humedad", title: "Cómo revisar manchas de humedad en el cielo", content: `# Qué revisar

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

Sin referencia normativa verificada para esta revisión específica.` },
    { slug: "closet-danos-visibles", title: "Cómo revisar daños visibles en el clóset", content: `# Qué revisar

Si el clóset presenta daños visibles: golpes, rayas profundas, paneles despegados, quebrados o con bordes astillados.

# Cómo revisarlo

Observa las superficies exteriores e interiores del clóset (puertas, costados, cajones) con buena luz.

# Qué debería verse

Superficies sin golpes, rayas profundas, quiebres ni paneles despegados.

# Qué señales pueden indicar un problema

- Golpes o abolladuras visibles.
- Rayas profundas que atraviesan el acabado.
- Paneles despegados, levantados o quebrados.

Ninguna de estas señales determina por sí sola la causa — conviene registrarla igual.

# Por qué importa

Un daño visible en el mueble empotrado afecta su apariencia y, si es profundo, puede indicar un problema estructural del panel que conviene registrar a tiempo.

# Recomendación

No intentes reparar ni ocultar el daño. Solo regístralo con una foto clara.

# Fuente

- **Manual técnico de referencia**: ninguno específico.
- **Criterio interno**: mismo estándar de "daños visibles" ya usado transversalmente en Piso, Mueble de baño, Tina, Mampara, entre otros.

Sin referencia normativa verificada para esta revisión específica.` },
    { slug: "closet-fijacion", title: "Cómo revisar la fijación del clóset", content: `# Qué revisar

Si el clóset o armario empotrado se siente firme y bien sujeto a la pared o estructura, sin moverse ni bambolear al empujarlo suavemente.

# Cómo revisarlo

Con el clóset vacío o sin forzar peso adicional, empuja suavemente su parte superior con la mano abierta, sin golpear. Observa si se mueve, se separa de la pared o cruje de forma anormal.

# Qué debería verse

El clóset permanece firme, sin desplazarse ni separarse de la pared al empujarlo suavemente.

# Qué señales pueden indicar un problema

- Movimiento o bamboleo notorio al empujar suavemente.
- Separación visible entre el clóset y la pared.
- Crujidos o ruidos anormales al tocarlo.

Ninguna de estas señales determina por sí sola la causa — conviene registrarla igual.

# Por qué importa

Un mueble empotrado alto y pesado mal anclado tiene riesgo real de volcamiento, especialmente relevante en un dormitorio. Conviene registrarlo para que se revise y refuerce su fijación.

# Recomendación

No empujes con fuerza ni te cuelgues del mueble para probarlo — un empujón suave basta. No intentes reforzar la fijación tú mismo.

# Fuente

- **Manual técnico de referencia**: ninguno específico.
- **Criterio interno**: mismo estándar de fijación/riesgo de volcamiento ya usado en Mueble de baño/Vanitorio (Fase 11AQ, severidad HIGH por el mismo motivo).

Sin referencia normativa verificada para esta revisión específica.` },
    { slug: "closet-funcionamiento", title: "Cómo revisar el funcionamiento del clóset", content: `# Qué revisar

Si las puertas y/o cajones del clóset o armario empotrado abren y cierran correctamente, sin atascarse ni requerir forzar.

# Cómo revisarlo

Revisa únicamente las puertas y/o cajones que realmente existan en este clóset — no todos tienen ambos. Ábrelos y ciérralos con normalidad, sin forzar. Si el clóset no tiene ninguna parte móvil (por ejemplo, un espacio completamente abierto sin puertas ni cajones), puede marcarse "No corresponde".

# Qué debería verse

Cada puerta y cajón existente desliza o gira con normalidad, cierra sin dejar espacio forzado ni roce excesivo contra el marco o los rieles.

# Qué señales pueden indicar un problema

- Una puerta o cajón se atasca, no cierra completamente o requiere forzar.
- Un cajón se sale del riel o no desliza parejo.
- Bisagras o tiradores sueltos o rotos.

Ninguna de estas señales determina por sí sola la causa — conviene registrarla igual.

# Por qué importa

Un clóset que no funciona correctamente limita el uso normal del dormitorio y puede empeorar con el uso (desgaste de rieles, bisagras forzadas) si no se corrige a tiempo.

# Recomendación

No fuerces puertas ni cajones atascados. No desarmes bisagras ni rieles. Si algo no funciona, regístralo con una foto y deja que se revise con las herramientas adecuadas.

# Fuente

- **Manual técnico de referencia**: ninguno específico para mobiliario empotrado de dormitorio.
- **Criterio interno**: revisión funcional básica, mismo estándar ya usado en Mueble de baño/Vanitorio (Fase 11AQ) y Muebles de cocina (Fase 11AC).

Sin referencia normativa verificada para esta revisión específica.` },
    { slug: "closet-humedad-deformacion", title: "Cómo revisar humedad y deformación en el clóset", content: `# Qué revisar

Si se observan manchas de humedad o deformación (hinchazón, ondulación) en el interior del clóset o en sus puertas.

# Cómo revisarlo

Abre el clóset y observa el interior (fondo, laterales) y la cara interior de las puertas, con buena luz. Presta atención especial si el clóset está contra un muro exterior o una zona con antecedentes de humedad.

# Qué debería verse

Superficies interiores secas, sin manchas oscuras, hinchazón ni ondulación del panel.

# Qué señales pueden indicar un problema

- Manchas oscuras o de aspecto húmedo en el interior.
- Paneles hinchados, ondulados o que se sienten blandos al tacto suave.
- Olor a humedad al abrir el clóset.

Ninguna de estas señales determina por sí sola la causa — conviene registrarla igual.

# Por qué importa

La humedad atrapada en un mueble empotrado contra un muro puede indicar un problema de humedad del muro mismo, además de dañar el mueble y la ropa guardada — conviene registrarlo para que se revise el origen.

# Recomendación

No apliques fuerza sobre paneles hinchados ni intentes secar la zona tú mismo de forma agresiva. Solo regístralo con una foto y ventila el espacio si es posible.

# Fuente

- **Manual técnico de referencia**: ninguno específico.
- **Criterio interno**: mismo estándar de "manchas de humedad" ya usado en Cielo, y de "hinchazón/deformación" ya usado en Mueble de baño (Fase 11AQ).

Sin referencia normativa verificada para esta revisión específica.` },
    { slug: "como-revisar-nivelacion-de-pavimentos", title: "Cómo revisar nivelación de pavimentos", content: `Artículo de prueba (Fase 1) — contenido real pendiente para una fase futura con UI de biblioteca.` },
    { slug: "conexion-lavadora-desague", title: "Cómo revisar el desagüe de la lavadora", content: `# Qué revisar

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

- **Criterio interno**: no existe una partida específica para desagües de lavadora en las fuentes consultadas — revisión basada en criterio general de funcionamiento visible de un punto de desagüe.` },
    { slug: "conexion-lavadora-firmeza", title: "Cómo revisar la firmeza de la conexión de la lavadora", content: `# Qué revisar

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

- **Criterio interno**: no existe una partida específica para conexiones de lavadora en las fuentes consultadas — revisión basada en el mismo criterio de firmeza ya usado para artefactos sanitarios, adaptado a esta conexión.` },
    { slug: "conexion-lavadora-fugas", title: "Cómo revisar fugas en la conexión de agua de la lavadora", content: `# Qué revisar

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

- **Criterio interno**: no existe una partida específica para conexiones de lavadora en las fuentes consultadas — revisión basada en el mismo criterio de fugas visibles ya usado para artefactos sanitarios (Lavaplatos/Lavamanos), adaptado a una conexión de electrodoméstico.` },
    { slug: "conexion-lavadora-llave", title: "Cómo revisar la llave de agua para la lavadora", content: `# Qué revisar

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

- **Criterio interno**: no existe una partida específica para conexiones de lavadora en el Manual de Tolerancias ni en el catálogo educativo ITO consultados — revisión basada en criterio de funcionamiento básico de llaves de agua, sin atribuir normativa que no la respalda.` },
    { slug: "cubierta-bano-danos-visibles", title: "Cómo revisar daños visibles en la cubierta de baño", content: `# Qué revisar

Si la cubierta presenta golpes, quiebres, trizaduras, rayas profundas, manchas, hinchamiento u otro deterioro o daño visible.

# Cómo revisarlo

Recorre visualmente toda la superficie de la cubierta con buena luz, incluidos sus bordes y, si tiene más de una pieza, las juntas entre ellas.

# Qué debería verse

La superficie sin golpes, quiebres, trizaduras, rayas profundas, manchas ni ningún otro deterioro visible — sin importar el material (piedra, cuarzo, cerámica, madera u otro).

# Qué señales pueden indicar un problema

- Golpes, quiebres o trizaduras.
- Rayas profundas.
- Manchas que no corresponden a suciedad removible con limpieza normal.
- Hinchamiento o deformación visible (más frecuente en materiales tipo MDF revestido).
- Separación o desalineamiento visible en las juntas entre piezas, si tiene más de una.

# Por qué importa

Un daño en la cubierta, aunque no genere una falla funcional inmediata, es un defecto de calidad de uso diario que conviene documentar.

# Recomendación

Si detectas cualquier daño, regístralo como observación con foto, indicando su ubicación exacta.

# Fuente

- Criterio interno del proyecto, comprobación visual directa — sin fuente normativa aplicable ni tolerancia estética definida.` },
    { slug: "cubierta-bano-fijacion", title: "Cómo revisar la fijación de la cubierta de baño", content: `# Qué revisar

Si la cubierta o mesón se ve firme y bien instalada, sin movimiento evidente al tocarla suavemente.

# Cómo revisarlo

Toca la cubierta suavemente con la mano en distintos puntos, especialmente cerca de los bordes y las uniones con el mueble o el muro. No te apoyes con tu peso ni apliques fuerza.

# Qué debería verse

La cubierta no se mueve ni se balancea al tocarla levemente, y no hay separación visible entre la cubierta y su soporte (mueble, muro u obra).

# Qué señales pueden indicar un problema

- La cubierta se mueve o cede al presionarla suavemente.
- Se ve una separación entre la cubierta y su soporte.

# Por qué importa

Una cubierta mal fijada puede indicar un problema en su soporte y empeorar con el uso normal.

# Recomendación

No apliques fuerza excesiva ni te apoyes con todo tu peso para probarla. Si notas movimiento, regístralo con foto.

# Fuente

- Criterio interno del proyecto. El Manual de Tolerancias (cap. 22) da solo la horizontalidad dimensional de la superficie (1 mm por metro lineal, verificable con nivel), no un criterio de fijación.` },
    { slug: "cubierta-bano-sello", title: "Cómo revisar el sello de la cubierta de baño con el muro", content: `# Qué revisar

Si el sello entre la cubierta y el muro (en el tramo que no corresponde al lavamanos, que se revisa por separado) se ve continuo, sin separaciones ni grietas.

# Cómo revisarlo

Observa el borde donde la cubierta se une al muro, en las zonas que no están directamente bajo el lavamanos.

# Qué debería verse

Un sello continuo, sin separaciones, grietas ni huecos visibles, sin importar el material de sellado usado.

# Qué señales pueden indicar un problema

- Separaciones o grietas visibles en el sello.
- Falta de sello donde debería haberlo.

# Por qué importa

Un sello en mal estado puede permitir el paso de agua hacia el muro, generando humedad sostenida si no se corrige — aunque hoy se vea seco.

# Recomendación

Si detectas separaciones o falta de sello, regístralo como observación con foto. No intentes resellar tú mismo.

# Fuente

- Criterio interno del proyecto, por analogía con el criterio ya usado para sellos perimetrales de otros componentes (ventana, lavamanos, ducha, tina, mampara) — sin fuente normativa aplicable.` },
    { slug: "cubierta-meson-danos-sellos", title: "Cómo revisar daños y sellos de la cubierta o mesón", content: `# Qué revisar

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

- Criterio interno del proyecto. El Manual de Tolerancias (cap. 22) no menciona sellos ni encuentros cubierta-muro — el criterio del sello es una analogía con el ya usado en Ventana (sello marco-muro), declarada explícitamente como criterio interno, no como respaldo del Manual de Cocina.` },
    { slug: "cubierta-meson-fijacion", title: "Cómo revisar la fijación y estabilidad de la cubierta o mesón", content: `# Qué revisar

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

- Criterio interno del proyecto. El Manual de Tolerancias (cap. 22) da solo la horizontalidad dimensional de la superficie (1 mm por metro lineal, verificable con nivel), no un criterio de fijación.` },
    { slug: "ducha-agua-fria-caliente", title: "Cómo revisar el agua fría y caliente de la ducha", content: `# Qué revisar

Si funcionan correctamente el agua fría y caliente de la ducha, cuando la instalación dispone de ambas.

# Cómo revisarlo

Abre la ducha hacia el lado del agua fría y confirma que sale agua. Repite hacia el lado del agua caliente. Si la instalación solo dispone de agua fría por diseño, marca esta revisión como "No corresponde".

# Qué debería verse

Sale agua de ambas redes al accionar los controles hacia cada lado, cuando la instalación dispone de ambas.

# Qué señales pueden indicar un problema

- No sale agua de uno de los dos lados (fría o caliente), en una instalación que sí dispone de ambas redes.

# Por qué importa

Confirmar que ambas redes de agua funcionan antes de recibir la vivienda evita sorpresas en el uso diario.

# Recomendación

Si uno de los dos lados no entrega agua, regístralo como observación. No es necesario evaluar temperatura exacta, tiempo de calentamiento ni presión — solo que el agua efectivamente sale de cada red disponible. No es necesario exponerte a agua excesivamente caliente para esta revisión — usa el mismo cuidado que tendrías al ducharte normalmente.

# Fuente

- Criterio interno del proyecto, comprobación funcional directa — sin fuente normativa aplicable.` },
    { slug: "ducha-evacuacion", title: "Cómo revisar la evacuación de agua de la ducha", content: `# Qué revisar

Si, después de dejar correr agua durante el uso normal de la ducha, el agua evacúa sin quedar acumulada en el piso o el receptáculo.

# Cómo revisarlo

Deja correr agua durante el uso normal de la ducha (sin tapar el desagüe ni forzar acumulación artificial) y observa cómo evacúa.

# Qué debería observarse

El agua evacúa con normalidad, sin quedar acumulada de forma prolongada en el piso o el receptáculo.

# Qué señales pueden indicar un problema

- El agua queda acumulada o forma pozas visibles después de un uso normal.
- El agua tarda visiblemente mucho más de lo esperable en desaparecer.

No es necesario ni recomendable determinar la causa exacta (desagüe, pendiente u otra) — solo registra si el agua evacúa con normalidad o no.

# Por qué importa

Agua que no evacúa bien puede generar riesgo de resbalón y humedad sostenida en el piso de la ducha.

# Recomendación

Si notas acumulación, regístralo como observación con foto o video corto. No introduzcas objetos en el desagüe ni intentes destaparlo — con la observación durante el uso normal alcanza para dejar constancia. Esta revisión no certifica la impermeabilización oculta bajo el piso — solo detecta si el agua evacúa con normalidad durante el uso.

# Fuente

- Criterio interno del proyecto, comprobación funcional directa — sin fuente normativa aplicable (el Manual de Tolerancias no define una tolerancia de pendiente para receptáculos o pisos de ducha).` },
    { slug: "ducha-fugas", title: "Cómo revisar fugas en conexiones de la ducha", content: `# Qué revisar

Si, al usar la ducha, se observan fugas o goteos en conexiones visibles, fuera de las salidas normales de agua (rociador, llave).

# Cómo revisarlo

Usa la ducha con normalidad durante unos momentos y observa las conexiones visibles (base de la grifería, uniones de flexibles, conexión del rociador), buscando agua escapando de un punto que no sea la salida normal.

# Qué debería observarse

El agua sale únicamente por el rociador o la llave, sin escapar por ninguna conexión o unión visible.

# Qué señales pueden indicar un problema

- Goteo o chorro de agua visible en una conexión o unión, distinto del agua normal saliendo del rociador.
- Humedad que aparece en una zona donde no debería haber agua durante el uso normal.

# Por qué importa

Una fuga en una conexión, aunque parezca menor, puede empeorar con el uso y generar humedad sostenida en el muro o el piso.

# Recomendación

Si detectas una fuga, regístrala como observación con foto o video corto. No es necesario desarmar la grifería ni intervenir las conexiones — la observación durante el uso normal es suficiente. Esta revisión no certifica la impermeabilización oculta bajo el piso o los muros — solo detecta fugas visibles durante el uso.

# Fuente

- Criterio interno adaptado: catálogo educativo ITO (265 puntos), sección Artefactos sanitarios — verificación de fugas visibles, extendido al contexto de ducha.` },
    { slug: "ducha-griferia", title: "Cómo revisar la grifería de la ducha", content: `# Qué revisar

Si la grifería de la ducha abre, cierra y responde correctamente al accionar sus controles.

# Cómo revisarlo

Acciona los controles de la ducha (llave o mezclador) tal como los usarías normalmente — abrir, cerrar, y cambiar entre las salidas disponibles si tiene más de una (rociador fijo, ducha teléfono).

# Qué debería verse

Los controles responden con normalidad al accionarlos, el agua sale por la salida seleccionada, y cierra por completo al cerrar la llave.

# Qué señales pueden indicar un problema

- El control no responde o cuesta mucho accionarlo.
- El agua no sale al abrir, o no cambia entre salidas si el modelo tiene más de una.

# Por qué importa

Una grifería que no responde bien afecta el uso diario de la ducha.

# Recomendación

Si detectas que un control no responde con normalidad, regístralo como observación indicando cuál. No es necesario desarmar la grifería.

# Fuente

- Criterio interno adaptado: catálogo educativo ITO (265 puntos), sección Grifería — verificación de ausencia de goteras y filtraciones visibles, extendido a funcionamiento de controles de ducha.` },
    { slug: "ducha-receptaculo", title: "Cómo revisar el receptáculo o plato de la ducha", content: `# Qué revisar

Si la ducha tiene receptáculo o plato (prefabricado, no cerámico continuo), si este se ve firme y sin trizaduras, quiebres u otros daños visibles.

# Cómo revisarlo

Si la ducha tiene un receptáculo o plato prefabricado, tócalo suavemente para sentir si cede o se mueve, y recorre su superficie visualmente buscando daños. Si la ducha es "a ras" con el mismo piso cerámico del resto del baño (sin una pieza de receptáculo distinta), marca esta revisión como "No corresponde" — el estado de ese piso ya se revisa en la partida de revestimiento cerámico.

# Qué debería verse

El receptáculo firme, sin movimiento al tocarlo suavemente, y sin trizaduras, quiebres ni otros daños visibles.

# Qué señales pueden indicar un problema

- El receptáculo se mueve o cede al tocarlo con suavidad.
- Trizaduras, quiebres o desportilladuras visibles en su superficie.

# Por qué importa

Un receptáculo mal fijado o dañado puede comprometer su sello con el desagüe o el muro, generando humedad sostenida si no se corrige.

# Recomendación

Si detectas movimiento o daño, regístralo como observación con foto. No intentes ajustar ni reparar nada tú mismo.

# Fuente

- Criterio interno del proyecto, comprobación funcional directa — sin fuente normativa aplicable.` },
    { slug: "ducha-sello-perimetral", title: "Cómo revisar el sello perimetral de la ducha", content: `# Qué revisar

Si el sello entre el receptáculo/plato de la ducha (o el piso de la zona de ducha) y el muro se ve continuo, sin separaciones ni grietas.

# Cómo revisarlo

Observa el borde donde el receptáculo o el piso de la zona de ducha se une al muro.

# Qué debería verse

Un sello continuo, sin separaciones, grietas ni huecos visibles.

# Qué señales pueden indicar un problema

- Separaciones o grietas visibles en el sello.
- Falta de sello donde debería haberlo.

Esta revisión es sobre el encuentro del receptáculo o piso con el muro — si la ducha tiene mampara, el sello propio de la mampara se revisa por separado, dentro de esa partida.

# Por qué importa

Un sello en mal estado puede permitir el paso de agua hacia el muro o la estructura, generando humedad sostenida si no se corrige.

# Recomendación

Si detectas separaciones o falta de sello, regístralo como observación con foto. No intentes resellar tú mismo.

# Fuente

- Criterio interno del proyecto, por analogía con el criterio ya usado para sellos perimetrales de otros artefactos (ventana, lavaplatos, lavamanos) — sin fuente normativa aplicable.` },
    { slug: "enchufes-interruptores-como-revisar-funcionamiento", title: "Cómo revisar enchufes e interruptores", content: `# Qué revisar

Si cada enchufe del recinto funciona correctamente al probarlo con un artefacto real (por ejemplo, un cargador de celular o una lámpara portátil), y si los interruptores encienden y apagan correctamente su luz.

# Cómo revisarlo

Prueba cada enchufe conectando un artefacto simple que sepas que funciona (cargador, lámpara, secador de pelo). Enciende también los interruptores del recinto y confirma que la luz correspondiente enciende y apaga sin problema. Esta revisión es solo funcional y visual — no requiere abrir ni tocar ningún componente eléctrico.

# Qué debería observarse

Cada enchufe entrega corriente al artefacto de prueba, y cada interruptor enciende y apaga la luz que le corresponde, sin chispas, ruido ni olor extraño.

# Qué señales pueden indicar un problema

- El enchufe no entrega corriente al artefacto de prueba.
- El interruptor no enciende o no apaga la luz correspondiente.
- Se nota calor, chispa, olor a quemado o ruido inusual al usar un enchufe o interruptor.

Cualquiera de estas señales conviene registrarla como observación, indicando la ubicación exacta.

# Por qué importa

Confirmar que cada enchufe e interruptor funciona antes de recibir la vivienda evita sorpresas al usarlos en el día a día, y deja constancia temprana de cualquier punto que necesite revisión.

# Recomendación

Si un enchufe o interruptor no funciona como se espera, regístralo como observación indicando su ubicación exacta (por ejemplo, "enchufe junto a la ventana del dormitorio 1"). Si observas daño, calor, olor extraño, chispa o partes expuestas, no manipules el elemento y solicita revisión de un profesional competente.

# Fuente

- **Manual técnico de referencia**: Manual de Tolerancias CDT (ficha 26) — verificación funcional de enchufes.
- **Criterio interno adaptado**: catálogo educativo ITO (265 puntos), sección Artefactos eléctricos/Iluminación — prueba de enchufes con artefacto real.

Sin referencia normativa verificada en esta fuente (no se citó normativa eléctrica SEC ni NCh).` },
    { slug: "estacionamiento-como-revisar-demarcacion-pavimento", title: "Cómo revisar la demarcación y el pavimento del estacionamiento", content: `# Qué revisar

Si la demarcación del estacionamiento se distingue con claridad y si el pavimento presenta daños visibles.

# Cómo revisarlo

Observa el estacionamiento con buena luz. Revisa visualmente las líneas o marcas de demarcación, y busca grietas visibles, hoyos, sectores deteriorados o zonas hundidas/desniveladas claramente perceptibles. No es necesario medir dimensiones reglamentarias, evaluar radios de giro ni afirmar accesibilidad normativa — solo una observación visual del estado aparente.

# Qué debería observarse

La demarcación puede identificarse visualmente, y el pavimento permite observar el espacio sin daños evidentes como hoyos o sectores deteriorados.

# Qué señales pueden indicar un problema

- Demarcación muy desgastada o no visible.
- Grietas visibles.
- Hoyos.
- Sectores deteriorados.
- Hundimientos o desniveles perceptibles.

Estas observaciones no establecen una causa.

# Por qué importa

Estas condiciones pueden dificultar el uso cotidiano del espacio o ser importantes de registrar al momento de recibir o revisar la propiedad.

# Recomendación

Registra mediante fotografía la zona específica y describe qué se observa. Si presenta alguna de estas condiciones, déjala registrada para solicitar revisión.

# Fuente

- **Criterio interno**: comprobación visual básica de demarcación y estado aparente del pavimento — no requiere conocimiento técnico especializado.

No existe fuente ITO ni Manual de Tolerancias CDT específica para esta pregunta (confirmado en Fase 6A y reconfirmado en Fase 11G) — no se aplica ningún criterio normativo.` },
    { slug: "extractor-aire-funcionamiento", title: "Cómo revisar el funcionamiento del extractor de aire", content: `# Qué revisar

Si el extractor de aire del baño enciende y funciona al accionar su control normal (interruptor propio, compartido con la luz, o automático si el equipo tiene sensor).

# Cómo revisarlo

Acciona el control normal del extractor — el mismo que usarías en el uso diario del baño (interruptor dedicado, el interruptor de la luz si están combinados, o simplemente usa la ducha con normalidad si el equipo se activa por sensor). Escucha y observa unos segundos.

# Qué debería verse

El extractor enciende al accionar su control y se percibe funcionando con normalidad (se escucha o se siente que está extrayendo aire). Si el equipo sigue funcionando un rato después de apagar la luz, eso es normal en modelos con temporizador — no es un defecto.

# Qué señales pueden indicar un problema

- El extractor no enciende al accionar su control.
- El extractor enciende pero no da ninguna señal perceptible de estar funcionando (sin sonido ni sensación de movimiento de aire).
- El control (interruptor, botón) no responde o cuesta mucho accionarlo.

# Por qué importa

Un extractor que no enciende no cumple su función básica de ayudar a controlar la humedad y los olores del baño durante el uso diario.

# Recomendación

Si detectas que no enciende o el control no responde, regístralo como observación indicando cómo lo probaste. No es necesario abrir el equipo ni revisar su instalación eléctrica interna — con accionar el control normal alcanza para dejar constancia.

# Fuente

- Criterio interno del proyecto, comprobación funcional directa — sin fuente normativa aplicable (el Manual de Tolerancias no trata equipos de extracción de baño, y no existe un punto equivalente en el catálogo educativo ITO).` },
    { slug: "extractor-aire-ruido-vibracion", title: "Cómo revisar ruido y vibración anormal en el extractor de aire", content: `# Qué revisar

Si, al funcionar, el extractor de aire presenta vibraciones, golpes o ruidos claramente irregulares, más allá del ruido normal de un motor en funcionamiento.

# Cómo revisarlo

Enciende el extractor y escucha/observa mientras funciona por unos segundos.

# Qué debería verse

Un sonido de motor en funcionamiento, sin golpeteo, vibración de piezas sueltas ni roces irregulares.

# Qué señales pueden indicar un problema

- Golpeteo o traqueteo audible.
- Vibración notoria que hace vibrar la carcasa, la rejilla o piezas cercanas.
- Un roce o chirrido irregular distinto al sonido normal del motor.

Ten en cuenta que **todo motor produce sonido al funcionar** — eso por sí solo no es un defecto. Solo registra lo que se sienta claramente irregular, no simplemente "hace ruido".

# Por qué importa

Un ruido o vibración irregular puede indicar una pieza mal fijada o un problema mecánico que conviene documentar antes de que empeore con el uso.

# Recomendación

Si detectas algo claramente irregular, regístralo como observación describiendo el tipo de ruido (golpeteo, vibración, roce). No intentes abrir el equipo para identificar la causa.

# Fuente

- Criterio interno del proyecto, comprobación funcional directa, redactada con precaución para no convertir el sonido normal de operación en un defecto — sin fuente normativa aplicable.` },
    { slug: "iluminacion-como-revisar-encendido-fijacion", title: "Cómo revisar que la iluminación encienda y esté firme", content: `# Qué revisar

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

Sin referencia normativa verificada para esta revisión específica.` },
    { slug: "lavadero-firmeza", title: "Cómo revisar la firmeza del lavadero", content: `# Qué revisar

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

- **Criterio interno adaptado**: mismo patrón ya usado para revisar firmeza de Lavaplatos/Lavamanos, aplicado al lavadero de logia.` },
    { slug: "lavadero-fugas", title: "Cómo revisar fugas bajo el lavadero", content: `# Qué revisar

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

- **Criterio interno adaptado**: mismo patrón ya usado para revisar fugas bajo Lavaplatos/Lavamanos, aplicado al lavadero de logia.` },
    { slug: "lavadero-griferia", title: "Cómo revisar la grifería del lavadero", content: `# Qué revisar

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

- **Criterio interno adaptado**: mismo patrón ya usado para revisar grifería de Lavaplatos/Lavamanos, aplicado al lavadero de logia — no existe una partida específica para lavaderos en el Manual de Tolerancias ni en el catálogo educativo ITO consultados.` },
    { slug: "lavadero-sello", title: "Cómo revisar el sello del lavadero", content: `# Qué revisar

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

- **Criterio interno adaptado**: mismo patrón ya usado para revisar el sello de Lavaplatos/Lavamanos, aplicado al lavadero de logia.` },
    { slug: "lavamanos-agua-fria-caliente", title: "Cómo revisar el agua fría y caliente del lavamanos", content: `# Qué revisar

Si funcionan correctamente el agua fría y caliente de la grifería del lavamanos, cuando la instalación dispone de ambas.

# Cómo revisarlo

Abre la llave hacia el lado del agua fría y confirma que sale agua. Repite hacia el lado del agua caliente. Si la instalación solo dispone de agua fría por diseño, marca esta revisión como "No corresponde".

# Qué debería verse

Sale agua de ambas redes al accionar la llave hacia cada lado, cuando la instalación dispone de ambas.

# Qué señales pueden indicar un problema

- No sale agua de uno de los dos lados (fría o caliente), en una instalación que sí dispone de ambas redes.

# Por qué importa

Confirmar que ambas redes de agua funcionan antes de recibir la vivienda evita sorpresas al usar el lavamanos en el día a día.

# Recomendación

Si uno de los dos lados no entrega agua, regístralo como observación indicando cuál. No es necesario evaluar temperatura, tiempo de calentamiento ni presión — solo que el agua efectivamente sale de cada red disponible.

# Fuente

- Criterio interno del proyecto, comprobación funcional directa — sin fuente normativa aplicable ni analogía específica del catálogo educativo ITO para este punto.` },
    { slug: "lavamanos-fijacion", title: "Cómo revisar la fijación del lavamanos", content: `# Qué revisar

Si el lavamanos se ve firme y bien instalado, sin moverse al tocarlo suavemente.

# Cómo revisarlo

Toca el lavamanos suavemente en su borde, sin aplicar fuerza. Observa si se mueve o cede.

# Qué debería verse

El lavamanos firme, sin ningún movimiento perceptible al tocarlo con suavidad.

# Qué señales pueden indicar un problema

- El lavamanos se mueve o cede levemente al tocarlo con suavidad.
- El artefacto no se ve firmemente anclado a la pared, el pedestal o la cubierta que lo sostiene.

# Por qué importa

Un lavamanos mal fijado puede comprometer sus conexiones de agua o desagüe con el tiempo, y representa un riesgo si se apoya peso sobre él.

# Recomendación

Si notas movimiento, regístralo como observación. No intentes ajustar ni apretar nada tú mismo.

# Fuente

- Criterio interno del proyecto, comprobación funcional directa — sin fuente normativa aplicable ni analogía específica del catálogo educativo ITO para este punto.` },
    { slug: "lavamanos-fugas", title: "Cómo revisar fugas bajo el lavamanos", content: `# Qué revisar

Si, al dejar correr agua, se observa alguna fuga o goteo bajo el lavamanos.

# Cómo revisarlo

Abre la llave y deja correr agua unos momentos. Observa la parte inferior del lavamanos (conexiones, sifón, uniones visibles) con buena luz, buscando humedad o goteo activo.

# Qué debería observarse

Toda la parte inferior del lavamanos seca, sin manchas de humedad, agua acumulada ni goteo mientras corre el agua.

# Qué señales pueden indicar un problema

- Goteo visible en cualquier conexión o unión bajo el lavamanos mientras corre el agua.
- Manchas de humedad o agua acumulada bajo el mueble o en el piso cercano.

Cualquiera de estas señales conviene documentarla, aunque el origen exacto (sifón, unión, conexión) no se pueda determinar solo con observación visual.

# Por qué importa

Una fuga bajo el lavamanos, aunque parezca menor, puede afectar el mueble o el piso, o generar humedad sostenida si no se corrige a tiempo.

# Recomendación

Si detectas humedad o goteo, regístralo como observación con foto. No es necesario desmontar el sifón ni intervenir las conexiones — la observación visual mientras corre el agua es suficiente para dejar constancia.

# Fuente

- Criterio interno adaptado: catálogo educativo ITO (265 puntos), sección Artefactos sanitarios — verificación de fugas visibles en la base de artefactos.` },
    { slug: "lavamanos-griferia", title: "Cómo revisar la grifería del lavamanos", content: `# Qué revisar

Si la grifería del lavamanos abre y cierra correctamente, sin quedar goteando.

# Cómo revisarlo

Abre y cierra la llave del lavamanos, probando el mecanismo por completo. Observa la salida de la llave unos segundos después de cerrarla.

# Qué debería verse

La llave abre y cierra sin dificultad, y no queda goteando después de cerrada por completo.

# Qué señales pueden indicar un problema

- La llave sigue goteando después de cerrada por completo.
- El mecanismo cuesta mucho accionar o no responde con normalidad.

# Por qué importa

Una llave que gotea, aunque sea poco, representa un gasto de agua sostenido en el tiempo y suele ser más fácil de resolver mientras la vivienda todavía está en garantía o en proceso de entrega.

# Recomendación

Si detectas goteo o dificultad para accionar la llave, regístralo como observación con foto. No es necesario desarmar la llave ni intervenir sus conexiones internas.

# Fuente

- Criterio interno adaptado: catálogo educativo ITO (265 puntos), sección Grifería — verificación de ausencia de goteras y filtraciones visibles.` },
    { slug: "lavamanos-sello-perimetral", title: "Cómo revisar el sello perimetral del lavamanos", content: `# Qué revisar

Si el lavamanos tiene un encuentro visible con la cubierta o el muro (por ejemplo, sobre o bajo una cubierta), y si ese sello se ve continuo, sin separaciones ni grietas.

# Cómo revisarlo

Observa el borde donde el lavamanos se une a la cubierta o al muro, si ese encuentro existe físicamente en tu caso (algunos lavamanos, como los de pedestal o suspendidos sin encimera, no tienen este tipo de encuentro — en ese caso marca esta revisión como "No corresponde").

# Qué debería verse

Un sello continuo, sin separaciones, grietas ni huecos visibles en el encuentro.

# Qué señales pueden indicar un problema

- Separaciones o grietas visibles en el sello.
- Falta de sello donde debería haberlo, dejando un hueco visible.

# Por qué importa

Un sello en mal estado puede permitir el paso de agua hacia el mueble o la estructura de apoyo, generando humedad sostenida si no se corrige.

# Recomendación

Si detectas separaciones o falta de sello, regístralo como observación con foto. No es necesario retirar ni resellar tú mismo.

# Fuente

- Criterio interno del proyecto, por analogía con el criterio ya usado para sellos perimetrales de otros artefactos (ventana, lavaplatos) — sin fuente normativa aplicable.` },
    { slug: "lavaplatos-agua-fria-caliente", title: "Cómo revisar el agua fría y caliente del lavaplatos", content: `# Qué revisar

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

- **Criterio interno del proyecto**, comprobación funcional directa, sin fuente normativa aplicable.` },
    { slug: "lavaplatos-fijacion", title: "Cómo revisar la fijación del lavaplatos", content: `# Qué revisar

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

- **Criterio interno del proyecto**, mismo estándar ya usado para revisar fijación de muebles de cocina — sin fuente normativa aplicable (el Manual de Tolerancias no trata lavaplatos).` },
    { slug: "lavaplatos-fugas", title: "Cómo revisar fugas bajo el lavaplatos", content: `# Qué revisar

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

- **Criterio interno adaptado**: catálogo educativo ITO (265 puntos), sección Artefactos sanitarios — mismo patrón ya usado para revisar fugas visibles en la base de artefactos de Baño, aplicado aquí de forma consolidada al conjunto sifón/conexiones/base del lavaplatos.` },
    { slug: "lavaplatos-griferia-funcionamiento", title: "Cómo revisar el funcionamiento de la grifería del lavaplatos", content: `# Qué revisar

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

- **Criterio interno adaptado**: catálogo educativo ITO (265 puntos), sección Grifería — mismo criterio ya usado para revisar goteras y filtraciones en llaves de Baño, aplicado aquí a la grifería del lavaplatos.` },
    { slug: "lavaplatos-sello-perimetral", title: "Cómo revisar el sello perimetral del lavaplatos", content: `# Qué revisar

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

- **Criterio interno del proyecto** (analogía con el sello marco-muro ya usado en Ventana) — sin fuente normativa aplicable.` },
    { slug: "mampara-danos-visibles", title: "Cómo revisar daños visibles en la mampara", content: `# Qué revisar

Si los vidrios o perfiles de la mampara presentan trizaduras, quiebres, rayas profundas u otros daños visibles.

# Cómo revisarlo

Recorre visualmente toda la mampara (vidrios y perfiles) con buena luz, buscando daños. No golpees ni apliques presión sobre el vidrio para "probarlo" — solo obsérvalo.

# Qué debería verse

Los vidrios y perfiles sin trizaduras, quiebres, rayas profundas ni otros daños visibles.

# Qué señales pueden indicar un problema

- Trizaduras o quiebres visibles en el vidrio.
- Rayas profundas (perceptibles al tacto, no solo marcas superficiales de limpieza).
- Perfiles deformados, con golpes visibles, o con oxidación notoria.

# Por qué importa

Un vidrio dañado representa un riesgo real de seguridad — puede astillarse o quebrarse por completo con el uso normal. Conviene documentarlo y evitar el uso de esa mampara hasta que se revise.

# Recomendación

Si detectas cualquier daño en el vidrio, regístralo como observación con foto, indicando su ubicación exacta. No intentes evaluar si el vidrio es templado o qué tan resistente es — eso no es parte de esta revisión.

# Fuente

- Criterio interno del proyecto, comprobación visual directa — sin fuente normativa aplicable ni tolerancia estética definida.` },
    { slug: "mampara-fijacion", title: "Cómo revisar la fijación de la mampara", content: `# Qué revisar

Si la mampara se ve firme y estable, sin movimientos o piezas sueltas al tocarla suavemente.

# Cómo revisarlo

Toca la mampara suavemente (el panel fijo y, si corresponde, la hoja móvil), sin empujar fuerte, colgarte, sacudirla ni aplicar peso corporal. Observa si se mueve o cede.

# Qué debería verse

La mampara firme, sin movimiento perceptible al tocarla con suavidad.

# Qué señales pueden indicar un problema

- La mampara se mueve o cede al tocarla con suavidad.
- Se percibe que algún perfil o soporte no está firmemente anclado.

# Por qué importa

Una mampara mal fijada puede empeorar con el uso y representa un riesgo si llegara a soltarse, especialmente por tratarse de una pieza de vidrio en una zona de piso mojado.

# Recomendación

Si notas movimiento, regístralo como observación. No intentes ajustar ni apretar nada tú mismo.

# Fuente

- Criterio interno del proyecto, comprobación funcional directa — sin fuente normativa aplicable.` },
    { slug: "mampara-filtracion", title: "Cómo revisar filtración de agua por la mampara", content: `# Qué revisar

Si, durante el uso normal de la ducha, se observa agua saliendo fuera de la mampara, más allá de salpicaduras normales.

# Cómo revisarlo

Usa la ducha con normalidad durante unos momentos, sin dirigir el chorro deliberadamente contra las juntas de la mampara, y observa si sale agua de forma clara hacia fuera de la zona de ducha.

# Qué debería verse

El agua se mantiene dentro de la zona de ducha durante el uso normal, más allá de alguna salpicadura menor esperable en el perfil inferior.

# Qué señales pueden indicar un problema

- Agua saliendo de forma clara y sostenida por debajo o por los costados de la mampara durante el uso normal.

# Por qué importa

Agua saliendo de la zona de ducha de forma sostenida puede generar humedad en el resto del baño si no se corrige.

# Recomendación

Si detectas filtración, regístrala como observación con foto o video corto. No dirijas el chorro deliberadamente contra las juntas para "forzar" la prueba — la observación durante el uso normal es suficiente.

# Fuente

- Criterio interno del proyecto, comprobación funcional directa — sin fuente normativa aplicable.` },
    { slug: "mampara-funcionamiento", title: "Cómo revisar el funcionamiento de la mampara", content: `# Qué revisar

Si la mampara, cuando tiene alguna hoja móvil (corredera, abatible o plegable), abre, cierra o desliza correctamente, sin atascarse ni forzar.

# Cómo revisarlo

Si la mampara tiene una hoja móvil, ábrela y ciérrala completamente un par de veces, probando también la manilla si tiene una. Si la mampara es completamente fija, sin ninguna hoja móvil, marca esta revisión como "No corresponde".

# Qué debería verse

La hoja móvil abre y cierra con normalidad, sin atascarse, forzar ni descarrilarse de su guía.

# Qué señales pueden indicar un problema

- La hoja se atasca, cuesta mucho mover, o se sale de su carril/guía.
- La manilla no responde con normalidad.
- Las hojas se ven notoriamente desalineadas entre sí al cerrar.

# Por qué importa

Una mampara que no abre/cierra bien es una molestia de uso diario y puede empeorar con el tiempo si no se corrige.

# Recomendación

Si detectas alguna de estas señales, regístralo como observación con foto o video corto. No es necesario desmontar ni forzar el mecanismo para diagnosticarlo.

# Fuente

- Criterio interno del proyecto, comprobación funcional directa — sin fuente normativa aplicable (el Manual de Tolerancias no trata mamparas ni cerramientos de ducha).` },
    { slug: "mampara-sellos", title: "Cómo revisar los sellos de la mampara", content: `# Qué revisar

Si los sellos visibles de la mampara (perfiles contra el muro o el receptáculo, uniones entre paneles) se ven continuos, sin separaciones ni grietas.

# Cómo revisarlo

Observa los bordes donde la mampara se une al muro, al receptáculo/piso, y las uniones entre paneles si tiene más de uno.

# Qué debería verse

Sellos continuos, sin separaciones, grietas ni huecos visibles, sin importar el sistema usado (silicona, burletes, perfiles u otro).

# Qué señales pueden indicar un problema

- Separaciones o grietas visibles en cualquiera de los sellos.
- Falta de sello donde debería haberlo.

# Por qué importa

Un sello en mal estado puede permitir el paso de agua fuera de la zona de ducha, generando humedad sostenida si no se corrige.

# Recomendación

Si detectas separaciones o falta de sello, regístralo como observación con foto. No intentes resellar tú mismo.

# Fuente

- Criterio interno del proyecto, por analogía con el criterio ya usado para sellos perimetrales de otros artefactos — sin fuente normativa aplicable.` },
    { slug: "mueble-bano-danos-visibles", title: "Cómo revisar daños visibles en el mueble de baño", content: `# Qué revisar

Si el mueble presenta golpes, quiebres, rayas profundas, cantos despegados u otros daños visibles.

# Cómo revisarlo

Recorre visualmente todo el mueble (cuerpo, puertas, cajones, costados, frentes) con buena luz, buscando daños.

# Qué debería verse

El mueble sin golpes, quiebres, rayas profundas ni cantos despegados.

# Qué señales pueden indicar un problema

- Golpes o quiebres visibles.
- Rayas profundas.
- Cantos o bordes despegados.

# Por qué importa

Un daño visible, aunque no genere una falla funcional inmediata, es un defecto de calidad que conviene documentar antes de dar por recibido el baño.

# Recomendación

Si detectas cualquier daño, regístralo como observación con foto, indicando su ubicación exacta.

# Fuente

- Criterio interno del proyecto, comprobación visual directa — sin fuente normativa aplicable ni tolerancia estética definida.` },
    { slug: "mueble-bano-fijacion", title: "Cómo revisar la fijación del mueble de baño", content: `# Qué revisar

Si el mueble se siente firme y bien sujeto, sin movimiento evidente al tocarlo suavemente.

# Cómo revisarlo

Toca el mueble suavemente, sin colgarte de él, aplicar peso ni sacudirlo. Observa si se mueve o cede.

# Qué debería verse

El mueble firme, sin movimiento perceptible al tocarlo con suavidad.

# Qué señales pueden indicar un problema

- El mueble se mueve o cede al tocarlo con suavidad.
- El mueble no se ve firmemente anclado al muro o al piso.

# Por qué importa

Un mueble mal fijado, especialmente si está suspendido (anclado solo al muro), representa un riesgo real de caída.

# Recomendación

Si notas movimiento, regístralo como observación. No intentes ajustar ni apretar nada tú mismo.

# Fuente

- Criterio interno del proyecto, comprobación funcional directa — sin fuente normativa aplicable.` },
    { slug: "mueble-bano-funcionamiento", title: "Cómo revisar el funcionamiento del mueble de baño", content: `# Qué revisar

Si las puertas y cajones del mueble abren, cierran o deslizan correctamente, cuando existan.

# Cómo revisarlo

Abre y cierra cada puerta y cajón del mueble, probando también tiradores y sistemas de cierre si los tiene. Si el mueble no tiene ninguna puerta ni cajón (solo repisas abiertas), marca esta revisión como "No corresponde".

# Qué debería verse

Cada puerta y cajón abre, cierra o desliza con normalidad, sin atascarse ni forzar.

# Qué señales pueden indicar un problema

- Una puerta o cajón se atasca, cuesta mucho mover, o no cierra bien.
- Un tirador o sistema de cierre no responde con normalidad.
- Bisagras o correderas con ruido anormal o que se sienten flojas.

# Por qué importa

Un mueble que no abre/cierra bien es una molestia de uso diario y puede empeorar con el tiempo si no se corrige.

# Recomendación

Si detectas alguna de estas señales, regístralo como observación con foto, indicando cuál puerta o cajón específico presenta el problema.

# Fuente

- Criterio interno del proyecto, comprobación funcional directa — sin fuente normativa aplicable (el Manual de Tolerancias, cap. 22, cubre solo tolerancias dimensionales que requieren instrumento, no funcionamiento).` },
    { slug: "mueble-bano-humedad", title: "Cómo revisar señales de humedad en el mueble de baño", content: `# Qué revisar

Si se observan señales de humedad en el mueble: tablero hinchado, melamina levantada, cantos despegados por humedad, manchas, o moho visible.

# Cómo revisarlo

Recorre visualmente el mueble (incluido su interior accesible, sin desmontar nada) buscando señales de humedad.

# Qué debería verse

El mueble sin tableros hinchados, melamina levantada por humedad, manchas ni moho visible.

# Qué señales pueden indicar un problema

- Tablero visiblemente hinchado o deformado.
- Melamina o cantos despegados por humedad (distinto de un canto despegado por golpe).
- Manchas de humedad.
- Moho visible.

No es necesario ni recomendable determinar la causa (fuga, condensación, uso u otra) — solo registra lo que observes.

# Por qué importa

La humedad en un mueble de material aglomerado tiende a empeorar con el tiempo si no se identifica y corrige su causa — conviene documentarla apenas se detecta.

# Recomendación

Si detectas cualquiera de estas señales, regístralo como observación con foto. Esta revisión puede coexistir con una observación de fuga registrada en la partida de Lavamanos — no es necesario elegir una sola, ambas pueden ser hallazgos reales y complementarios.

# Fuente

- Criterio interno del proyecto, comprobación visual directa — sin fuente normativa aplicable.` },
    { slug: "muebles-cocina-danos-visibles", title: "Cómo revisar daños visibles en los muebles de cocina", content: `# Qué revisar

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

- Criterio interno del proyecto. El Manual de Tolerancias (cap. 22) no incluye ningún criterio sobre daños visibles.` },
    { slug: "muebles-cocina-fijacion", title: "Cómo revisar la fijación y estabilidad de los muebles de cocina", content: `# Qué revisar

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

- Criterio interno del proyecto. El Manual de Tolerancias (cap. 22) no incluye ningún criterio de fijación o estabilidad estructural.` },
    { slug: "muebles-cocina-funcionamiento", title: "Cómo revisar el funcionamiento de puertas y cajones de los muebles de cocina", content: `# Qué revisar

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

- Criterio interno del proyecto, mismo estándar ya usado en Puerta ("¿Cierra correctamente?") y Ventana. El Manual de Tolerancias (cap. 22, Muebles Incorporados) no mide funcionamiento — solo alineación dimensional con instrumento.` },
    { slug: "muros-como-revisar-fisuras", title: "Cómo revisar fisuras en muros", content: `# Qué revisar

Si el muro presenta fisuras (grietas) visibles, y de qué tipo: superficiales/cosméticas o con indicios de ser más profundas.

# Cómo revisarlo

Recorre el muro completo con buena luz, mirando en ángulo — la luz rasante ayuda a notar fisuras finas que a simple vista pasan desapercibidas. Presta especial atención a las esquinas, el encuentro entre muro y cielo, y los bordes de puertas y ventanas, que es donde suelen aparecer primero. Si encuentras una fisura, apoya una tarjeta o una moneda al lado para tener una referencia de tamaño en la foto.

# Qué debería observarse

Distinguir entre:
- **Fisura de retracción**: fina, superficial, típica de las primeras semanas de secado del estuco — generalmente sin riesgo.
- **Fisura capilar**: superficial, delgada, sin espesor perceptible — bajo riesgo.
- **Fisura con indicios estructurales**: tiene espesor perceptible al tacto, cruza una esquina o un vano (puerta/ventana), o supera aproximadamente 0,3 mm de ancho.

# Qué señales pueden indicar un problema

- Una fisura de más de 0,3 mm de ancho.
- Una fisura que cruza una esquina o el borde de una puerta o ventana.
- Una fisura con espesor perceptible al pasar el dedo (no solo visual).

Ninguna de estas señales determina por sí sola la causa — conviene documentarlas igual y, si tienes dudas, consultarlas con un profesional.

# Por qué importa

El tamaño y la ubicación de la fisura son justamente el criterio que hace que esta partida sugiera severidad media por defecto, siempre ajustable según lo que realmente observes. Documentarla bien ahora facilita compararla más adelante (si crece o no) y le da a un profesional información concreta si decides consultarlo.

# Recomendación

Mide o estima el ancho de la fisura (una tarjeta o moneda como referencia visual sirve para la foto). Si es delgada y no cruza esquinas/vanos, regístrala igual como observación menor. Si tiene espesor visible o cruza una esquina, márcala como observación de mayor severidad y considera evaluación por un profesional — ObraBien no realiza diagnóstico estructural.

# Fuente

- **Manual técnico de referencia**: Manual de Tolerancias CDT — tolerancia de unidades con fisuras en albañilería (2% máx. por paño).
- **Criterio interno adaptado**: catálogo educativo ITO (265 puntos), elemento Muros — distinción fisura capilar/estructural, umbral de 0,3 mm, criterio "cruza esquina = riesgo mayor".
- **Biblioteca técnica**: contenido ITO sobre pintura de muros — grietas finas cerca de esquinas, criterio de documentar igual ante duda.

Sin referencia normativa verificada en esta fuente (no se citó OGUC/LGUC/NCh).` },
    { slug: "pintura-muro-manchas-defectos", title: "Cómo revisar manchas o defectos en la pintura del muro", content: `# Qué revisar

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

Sin referencia normativa verificada más allá del Manual de Tolerancias.` },
    { slug: "piso-como-revisar-danos-visibles", title: "Cómo revisar daños visibles en el piso", content: `# Qué se revisa

Si la superficie del piso presenta daños físicos visibles: piezas trisadas, picadas, astilladas o quebradas (cerámica/porcelanato), o —en radier/hormigón a la vista— fisuras y desprendimiento superficial.

# Qué debería observarse

- Piezas sin trizaduras, picaduras ni bordes astillados, bien adheridas — un sonido hueco al golpear suavemente indica que la pieza no quedó bien pegada.
- En piso de hormigón/radier a la vista: sin fisuras mayores a 0,3 mm y sin fisuras que crucen de un extremo a otro.
- Sin desprendimiento superficial (polvo suelto o descascarado al pasar la mano — indica mal curado).

# Cuando existe una observación

Una pieza suelta, trisada o con sonido hueco es un defecto que empeora con el tiempo si no se corrige. Una fisura de más de 0,3 mm en hormigón, o que cruce toda la superficie, es más relevante que una fisura fina superficial.

# Recomendación

Si detectas piezas sueltas, trisadas o fisuras mayores a 0,3 mm, regístralo como observación con foto — no es necesariamente urgente, pero conviene documentarlo antes de que empeore. Ante dudas sobre si una fisura es solo superficial, es preferible marcarla como observación para evaluarla con más detalle.

# Fuente

- Manual de Tolerancias CDT (Ficha 10, Revestimientos Cerámicos): tolerancia "No se aceptan" piezas quebradas/despuntadas/con grietas.
- Biblioteca técnica ITO (contenido sobre terminaciones cerámicas y porcelanato — resumido y adaptado, no copiado literal).
- Catálogo educativo ITO (265 puntos), elemento Pisos de hormigón: umbral de 0,3 mm.

Sin referencia normativa verificada en esta fuente (no se citó OGUC/LGUC/NCh para este punto).

# Cómo revisarlo

Recorre todo el piso del recinto caminando lentamente, con buena luz (natural o una linterna en ángulo rasante, que resalta imperfecciones). En cerámica o porcelanato, golpea suavemente algunas piezas con los nudillos. En radier u hormigón a la vista, pasa la mano por la superficie.

# Qué señales pueden indicar un problema

- Piezas trisadas, picadas o con bordes astillados.
- Sonido hueco al golpear una pieza (indica mala adherencia).
- Fisuras en hormigón mayores a 0,3 mm, o que crucen toda la superficie.
- Polvo suelto o descascarado al pasar la mano (indica mal curado).` },
    { slug: "piso-como-revisar-desniveles", title: "Cómo revisar desniveles en el piso", content: `# Qué se revisa

Si existen diferencias de altura entre piezas del piso, tablas, o zonas hundidas/levantadas respecto al resto de la superficie.

# Qué debería observarse

- Entre piezas de piso (cerámica/porcelanato): desnivel de referencia de hasta 1 mm entre piezas contiguas.
- Piso de madera: tablas niveladas entre sí, sin "escalón" perceptible al pasar la mano o el pie.
- Radier/hormigón a la vista o pavimento exterior: superficie pareja, sin zonas hundidas ni levantadas.

# Cuando existe una observación

Un desnivel perceptible al tacto (por sobre 1-2 mm entre piezas) puede ser motivo de tropiezo y suele indicar un problema de instalación (base mal preparada, pegado irregular). Zonas hundidas en hormigón pueden acumular agua.

# Recomendación

Verifica pasando la mano o una regla apoyada sobre varias piezas/tablas — si sientes un "escalón" o la regla no queda pareja, regístralo como observación. Si el desnivel es amplio (varios metros cuadrados hundidos), puede requerir revisión de la base antes de continuar con la terminación.

# Fuente

- Manual de Tolerancias CDT (Ficha 10): desnivel entre palmetas — referencia de 1 mm (pisos) / 2 mm (otras superficies).
- Catálogo educativo ITO (265 puntos): pavimentos exteriores, pisos de hormigón, pisos de madera — criterios de nivelación (adaptado y resumido).

Sin referencia normativa verificada en esta fuente.

# Cómo revisarlo

Pasa la mano o el pie por las uniones entre piezas o tablas, buscando un "escalón" perceptible. Apoya una regla larga sobre varias piezas contiguas para ver si queda pareja. En radier/hormigón o pavimento exterior, camina por toda la superficie prestando atención a zonas hundidas o levantadas.

# Qué señales pueden indicar un problema

- Un escalón perceptible al tacto entre piezas o tablas.
- La regla no queda pareja al apoyarla sobre varias piezas.
- Zonas hundidas que podrían acumular agua.
- Tablas de madera que se mueven o suenan al pisarlas.` },
    { slug: "puerta-como-revisar-cierre", title: "Cómo revisar el cierre de una puerta", content: `# Qué revisar

Si la puerta cierra correctamente: sin rozar el marco ni el piso, con la cerradura/pestillo funcionando sin forzar, y con bisagras firmes.

# Cómo revisarlo

Cierra la puerta varias veces desde distintas posiciones (medio abierta, casi cerrada), prestando atención a si roza en algún punto del contorno. Revisa el pestillo por separado, viendo si entra al cerradero sin forzar. Observa también las bisagras: si hacen ruido o se ven con holgura.

# Qué debería observarse

- La puerta cierra con un solo movimiento suave, sin rozar el marco ni el piso.
- El pestillo entra en el cerradero sin necesidad de forzar.
- La separación (holgura) entre la hoja y el marco es pareja en todo el contorno.
- Las bisagras están firmes, sin ruido ni holgura excesiva.
- Referencia dimensional: paralelismo entre hoja y marco dentro de aproximadamente 3 mm.

# Qué señales pueden indicar un problema

- La puerta roza el marco o el piso en algún punto.
- El pestillo hay que forzarlo para que entre al cerradero.
- Las bisagras hacen ruido o se sienten con holgura.
- La holgura entre la hoja y el marco es despareja en el contorno.

Puede convenir revisarlo con más detalle, especialmente si varias de estas señales aparecen juntas — esto no determina por sí solo la causa.

# Por qué importa

Una puerta que no cierra bien es, además de una molestia diaria, una señal que conviene documentar temprano — suele ser más fácil de resolver mientras la vivienda todavía está en garantía o en proceso de entrega.

# Recomendación

Cierra la puerta varias veces desde distintas posiciones (medio abierta, casi cerrada) y observa si roza en algún punto del contorno. Revisa el pestillo por separado. Si notas roce, ruido en las bisagras, o que hay que forzar el pestillo, regístralo como observación.

# Fuente

- **Manual técnico de referencia**: Manual de Tolerancias CDT (Ficha 12, Puertas) — paralelismo hoja/marco ~3 mm, planeidad de hoja ±3 mm.
- **Biblioteca técnica**: contenido ITO sobre alineación y cierre de puertas — criterio de cierre en un solo movimiento.
- **Criterio interno adaptado**: catálogo educativo ITO (265 puntos), elemento Puertas — cierre sin roce, cerradura/pestillo, holguras, bisagras.

Sin referencia normativa verificada en esta fuente.` },
    { slug: "revestimiento-ceramico-muro-defectos-esmalte", title: "Cómo revisar defectos de esmalte en el revestimiento cerámico de muro", content: `# Qué revisar

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

Sin referencia normativa verificada más allá del Manual de Tolerancias.` },
    { slug: "revestimiento-ceramico-muro-palmetas-quebradas", title: "Cómo revisar palmetas quebradas en el revestimiento cerámico de muro", content: `# Qué revisar

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

Sin referencia normativa verificada más allá del Manual de Tolerancias.` },
    { slug: "revestimiento-ceramico-piso-defectos-esmalte", title: "Cómo revisar defectos de esmalte en el piso cerámico", content: `# Qué revisar

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

Sin referencia normativa verificada más allá del Manual de Tolerancias.` },
    { slug: "revestimiento-ceramico-piso-palmetas-quebradas", title: "Cómo revisar palmetas quebradas en el piso cerámico", content: `# Qué revisar

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

Sin referencia normativa verificada más allá del Manual de Tolerancias.` },
    { slug: "tina-danos-visibles", title: "Cómo revisar daños visibles en la tina", content: `# Qué revisar

Si la tina presenta trizaduras, quiebres, golpes, esmalte saltado u otros daños visibles.

# Cómo revisarlo

Recorre visualmente toda la superficie de la tina con buena luz, buscando daños. No es necesario identificar el material (acero esmaltado, acrílico, fibra u otro) — solo observa si hay daño visible.

# Qué debería verse

La superficie de la tina sin trizaduras, quiebres, golpes ni esmalte saltado.

# Qué señales pueden indicar un problema

- Trizaduras o grietas visibles.
- Quiebres o desportilladuras.
- Esmalte saltado dejando ver el material base.
- Golpes con marca visible.

# Por qué importa

Un daño en la superficie, aunque no genere una fuga inmediata, es un defecto de calidad y puede empeorar con el uso si no se corrige.

# Recomendación

Si detectas cualquier daño, regístralo como observación con foto, indicando su ubicación exacta.

# Fuente

- Criterio interno del proyecto, comprobación visual directa — sin fuente normativa aplicable ni tolerancia estética definida.` },
    { slug: "tina-evacuacion", title: "Cómo revisar la evacuación de agua de la tina", content: `# Qué revisar

Si, después de dejar correr una cantidad moderada de agua y destapar el desagüe, el agua evacúa con normalidad, sin quedar acumulada.

# Cómo revisarlo

Deja correr una cantidad moderada de agua en la tina (sin llenarla por completo), luego destapa el desagüe y observa cómo evacúa.

# Qué debería verse

El agua evacúa con normalidad, sin quedar acumulada de forma prolongada.

# Qué señales pueden indicar un problema

- El agua tarda visiblemente mucho más de lo esperable en evacuar, o queda acumulada.

No es necesario ni recomendable determinar la causa exacta — solo registra si evacúa con normalidad o no. Pequeñas gotas residuales por la forma del fondo son normales y no cuentan como acumulación.

# Por qué importa

Una evacuación deficiente puede indicar un problema en el desagüe que conviene documentar.

# Recomendación

Si notas acumulación, regístralo como observación con foto o video corto. No introduzcas objetos en el desagüe. Esta revisión no certifica la impermeabilización oculta — solo detecta si el agua evacúa con normalidad.

# Fuente

- Criterio interno del proyecto, comprobación funcional directa — sin fuente normativa aplicable (el Manual de Tolerancias no define una tolerancia de pendiente para receptáculos o pisos de ducha).` },
    { slug: "tina-fijacion", title: "Cómo revisar la fijación de la tina", content: `# Qué revisar

Si la tina se ve firme y estable, sin movimiento evidente, crujidos anormales ni separaciones visibles en sus apoyos o encuentros.

# Cómo revisarlo

Observa la tina y, si es accesible, toca suavemente su borde. No te pares dentro, no saltes ni apliques peso deliberadamente — muchas tinas van embutidas y no es necesario ni seguro intentar moverlas con fuerza.

# Qué debería verse

La tina firme, sin movimiento perceptible, sin crujidos anormales al tocarla suavemente, y sin separaciones visibles en el encuentro con el muro o el piso.

# Qué señales pueden indicar un problema

- Movimiento perceptible al tocar suavemente el borde.
- Crujidos anormales.
- Separaciones visibles en los apoyos o encuentros de la tina.

# Por qué importa

Una tina mal fijada puede comprometer sus sellos o conexiones con el tiempo.

# Recomendación

Si notas alguna de estas señales, regístralo como observación. No intentes ajustar ni forzar la tina tú mismo.

# Fuente

- Criterio interno del proyecto, comprobación funcional directa — sin fuente normativa aplicable.` },
    { slug: "tina-fugas", title: "Cómo revisar fugas en la tina", content: `# Qué revisar

Si, al usar la tina, se observa alguna fuga o humedad visible en sus conexiones o desagüe visibles y accesibles.

# Cómo revisarlo

Usa la tina con normalidad (dejar correr agua, luego destaparla) y observa las conexiones y el desagüe que sean visibles y accesibles, sin desmontar registros ni acceder a cañerías ocultas.

# Qué debería verse

Sin humedad ni goteo visible en las conexiones o el desagüe accesibles.

# Qué señales pueden indicar un problema

- Goteo o humedad visible en una conexión o unión accesible.
- Manchas de humedad cerca de la base de la tina asociadas directamente a su uso.

# Por qué importa

Una fuga, aunque parezca menor, puede empeorar con el uso y generar humedad sostenida si no se corrige. Esta revisión no certifica la impermeabilización oculta bajo o alrededor de la tina — solo detecta fugas visibles y accesibles.

# Recomendación

Si detectas una fuga, regístrala como observación con foto. No intentes desmontar registros ni conexiones ocultas para investigar más allá de lo visible.

# Fuente

- Criterio interno adaptado: catálogo educativo ITO (265 puntos), sección Artefactos sanitarios — verificación de fugas visibles en la base de artefactos.` },
    { slug: "tina-llenado", title: "Cómo revisar el llenado propio de la tina", content: `# Qué revisar

Si la tina tiene un sistema de llenado propio, distinto al de la ducha, si el agua sale con normalidad al abrir esa llave, incluyendo fría y caliente si la instalación dispone de ambas.

# Cómo revisarlo

Si el baño no tiene ducha instalada, o la tina tiene su propia grifería de llenado (por ejemplo, en el borde de la tina, distinta a la de la ducha), abre esa llave hacia cada lado (fría y caliente) y confirma que sale agua. Si el llenado de la tina se hace con la misma grifería ya revisada en la partida de Ducha, marca esta revisión como "No corresponde".

# Qué debería verse

Sale agua de la llave de llenado propia de la tina al accionarla, de ambas redes si dispone de ambas.

# Qué señales pueden indicar un problema

- No sale agua al accionar la llave de llenado propia de la tina.
- No sale agua de uno de los dos lados (fría o caliente), en una instalación que dispone de ambas.

# Por qué importa

Sin un sistema de llenado funcional, la tina no puede cumplir su función básica de uso.

# Recomendación

Si detectas que no sale agua, regístralo como observación. No es necesario evaluar temperatura exacta, tiempo de calentamiento ni presión.

# Fuente

- Criterio interno del proyecto, comprobación funcional directa — sin fuente normativa aplicable.` },
    { slug: "tina-sellos", title: "Cómo revisar los sellos de la tina", content: `# Qué revisar

Si el sello visible entre la tina y el muro (y el piso, si existe ese encuentro) se ve continuo, sin separaciones ni grietas.

# Cómo revisarlo

Observa el borde donde la tina se une al muro, y al piso si ese encuentro existe visiblemente en tu caso.

# Qué debería verse

Un sello continuo, sin separaciones, grietas ni huecos visibles.

# Qué señales pueden indicar un problema

- Separaciones o grietas visibles en el sello.
- Falta de sello donde debería haberlo.

# Por qué importa

Un sello en mal estado puede permitir el paso de agua hacia el muro o la estructura, generando humedad sostenida si no se corrige.

# Recomendación

Si detectas separaciones o falta de sello, regístralo como observación con foto. No intentes resellar tú mismo.

# Fuente

- Criterio interno del proyecto, por analogía con el criterio ya usado para sellos perimetrales de otros artefactos (ventana, lavaplatos, lavamanos) — sin fuente normativa aplicable.` },
    { slug: "tina-tapon-valvula", title: "Cómo revisar el tapón o válvula de la tina", content: `# Qué revisar

Si el tapón o válvula de la tina retiene el agua sin pérdida evidente durante unos momentos al cerrarlo.

# Cómo revisarlo

Cierra el tapón o válvula de la tina y deja correr una cantidad pequeña de agua brevemente — no llenes la tina por completo. Observa si el nivel se mantiene sin perderse de forma evidente.

# Qué debería verse

El tapón o válvula retiene el agua sin que se vea perderse de forma evidente durante unos momentos.

# Qué señales pueden indicar un problema

- El agua se pierde rápidamente pese a que el tapón/válvula está cerrado.
- El mecanismo no cierra completamente o no responde con normalidad.

# Por qué importa

Sin un tapón que retenga agua, la tina no puede cumplir su función básica de uso.

# Recomendación

Si detectas pérdida de agua con el tapón cerrado, regístralo como observación. No es necesario desmontar el mecanismo para diagnosticarlo — no llenes la tina completamente solo para esta prueba.

# Fuente

- Criterio interno del proyecto, comprobación funcional directa — sin fuente normativa aplicable.` },
    { slug: "ventana-apertura-cierre", title: "Cómo revisar la apertura y cierre de la ventana", content: `# Qué revisar

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

Sin referencia normativa verificada en esta fuente.` },
    { slug: "ventana-como-revisar-funcionamiento", title: "Cómo revisar el funcionamiento de una ventana", content: `# Qué revisar

Si la ventana abre, cierra y traba correctamente, y si sus manillas/mecanismos funcionan sin forzar.

# Cómo revisarlo

Abre y cierra la ventana completa varias veces, probando también la traba. Prueba la manilla por separado, sintiendo si se mueve suave o con resistencia. Con la ventana cerrada, mira los bordes con buena luz buscando si se ve luz del día pasando entre el marco y la hoja.

# Qué debería observarse

- La ventana abre, cierra y traba sin dificultad, sin necesidad de forzarla.
- La manilla se mueve suave, sin resistencia excesiva.
- Con la ventana cerrada, no debería verse luz del día pasando entre el marco y la hoja.
- Referencia dimensional: paralelismo entre hoja y marco dentro de aproximadamente ±2 mm.

# Qué señales pueden indicar un problema

- La ventana se traba o cuesta abrir/cerrar.
- La manilla está dura o con resistencia excesiva.
- Se ve luz del día con la ventana cerrada.
- El paralelismo entre hoja y marco se ve claramente disparejo.

Ninguna de estas señales indica por sí sola la causa exacta — conviene registrarla con foto y, si hay dudas, revisarla con más detalle.

# Por qué importa

Una ventana que no cierra bien o deja pasar luz puede representar filtraciones de agua o aire más adelante — detectarlo ahora, durante la inspección, suele ser más simple que después de estar viviendo en el lugar.

# Recomendación

Prueba abrir y cerrar la ventana completa varias veces, y revisa la manilla por separado. Con la ventana cerrada, mira los bordes buscando luz o corrientes de aire. Si detectas cualquiera de estos problemas, regístralo como observación — no es necesariamente grave, pero conviene resolverlo antes de dar por terminada esa partida.

# Fuente

- **Manual técnico de referencia**: Manual de Tolerancias CDT (Ficha 13, Ventanas) — paralelismo ±2 mm, sin luz visible con ventana cerrada.
- **Criterio interno adaptado**: catálogo educativo ITO (265 puntos), elemento Ventanas — criterios de apertura/cierre/manilla.
- **Biblioteca técnica**: contenido ITO sobre silicona perimetral — prueba visual de luz con ventana cerrada.

Sin referencia normativa verificada en esta fuente.` },
    { slug: "ventana-manilla-herrajes", title: "Cómo revisar la manilla y los herrajes de la ventana", content: `# Qué revisar

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

Sin referencia normativa verificada en esta fuente.` },
    { slug: "ventana-marco-danos-visibles", title: "Cómo revisar daños visibles en el marco de la ventana", content: `# Qué revisar

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

No existe fuente ITO ni Manual de Tolerancias CDT específica para daño post-ocupación del marco — criterio construido con guías de fabricante/instalador como respaldo adicional.` },
    { slug: "ventana-sello-hoja-marco", title: "Cómo revisar el sello entre la hoja y el marco de la ventana", content: `# Qué revisar

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

Sin referencia normativa verificada en esta fuente.` },
    { slug: "ventana-sello-marco-muro", title: "Cómo revisar el sello entre el marco de la ventana y el muro", content: `# Qué revisar

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
- **Fabricante/instalador de referencia**: Corporación Limatambo — procedimiento de instalación de ventanas de aluminio.` },
    { slug: "ventana-vidrio-condensacion-interna", title: "Cómo revisar condensación interna en vidrio termopanel", content: `# Qué revisar

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

Sin referencia normativa chilena verificada en esta fuente.` },
    { slug: "ventana-vidrio-danos-visibles", title: "Cómo revisar daños visibles en el vidrio de la ventana", content: `# Qué revisar

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

Sin referencia normativa chilena verificada en esta fuente.` },
    { slug: "wc-danos-visibles", title: "Cómo revisar daños visibles en el inodoro", content: `# Qué revisar

Si el inodoro presenta trizaduras, quiebres, golpes u otros daños visibles en la loza.

# Cómo revisarlo

Recorre visualmente toda la superficie del inodoro (taza, estanque visible, tapa del estanque) con buena luz, buscando daños.

# Qué debería verse

La loza del inodoro sin trizaduras, quiebres, golpes ni otros daños visibles.

# Qué señales pueden indicar un problema

- Trizaduras o grietas visibles en la loza.
- Quiebres o desportilladuras.
- Golpes con marca visible.

# Por qué importa

Un daño en la loza, aunque no genere una fuga inmediata, es un defecto de calidad que conviene documentar antes de dar por recibido el baño — y puede empeorar con el uso si no se corrige.

# Recomendación

Si detectas cualquier daño, regístralo como observación con foto, indicando su ubicación exacta en la pieza.

# Fuente

- Criterio interno del proyecto, comprobación visual directa — sin fuente normativa aplicable ni tolerancia estética definida (no se establece un umbral de tamaño; se registra cualquier daño visible detectado).` },
    { slug: "wc-descarga", title: "Cómo revisar la descarga del inodoro", content: `# Qué revisar

Si el inodoro descarga correctamente al accionar el mecanismo, y si el agua deja de correr con normalidad después de terminado el ciclo.

# Cómo revisarlo

Acciona el mecanismo de descarga del inodoro (botón o palanca) y observa el estanque y la taza durante unos segundos después de que termine el ciclo normal.

# Qué debería verse

El inodoro descarga con normalidad al accionar el mecanismo, y el agua se detiene por completo en un tiempo razonable, sin quedar corriendo de forma continua ni goteando dentro del estanque.

# Qué señales pueden indicar un problema

- El mecanismo no responde al accionarlo.
- La descarga es visiblemente débil o incompleta.
- El agua sigue corriendo varios segundos después de terminado el ciclo normal, o se escucha un ruido de agua corriendo de forma intermitente sin que nadie haya accionado la descarga.

Conviene registrar la observación aunque no sea necesariamente grave.

# Por qué importa

Un mecanismo de descarga que no funciona bien, o que no se detiene, puede representar un gasto de agua sostenido en el tiempo — vale la pena dejarlo registrado antes de dar por recibido el baño.

# Recomendación

Si notas que no descarga bien o que el agua no se detiene con normalidad, regístralo como observación con foto o video corto. No es necesario abrir el estanque ni manipular el mecanismo interno — con la observación visual/auditiva alcanza para dejar constancia.

# Fuente

- Criterio interno adaptado: catálogo educativo ITO (265 puntos), sección Artefactos sanitarios — verificación de funcionamiento básico de artefactos.` },
    { slug: "wc-fijacion", title: "Cómo revisar la fijación del inodoro", content: `# Qué revisar

Si el inodoro se ve firme y estable, sin movimiento evidente al tocarlo suavemente.

# Cómo revisarlo

Toca el inodoro suavemente en la parte superior de la taza, sin sentarte bruscamente, sacudirlo ni aplicar fuerza. Observa si se mueve o cede.

# Qué debería verse

El inodoro se siente firme y estable, sin ningún movimiento perceptible al tocarlo suavemente.

# Qué señales pueden indicar un problema

- El inodoro se mueve o cede levemente al tocarlo con suavidad.
- Se percibe que la base no está firmemente asentada en el piso.

# Por qué importa

Un inodoro mal fijado puede comprometer el sello con el desagüe del piso con el tiempo, aumentando el riesgo de una fuga posterior.

# Recomendación

Si notas movimiento, regístralo como observación. No intentes ajustar ni apretar nada tú mismo — no es necesario para dejar constancia del hallazgo.

# Fuente

- Criterio interno del proyecto, comprobación funcional directa — sin fuente normativa aplicable ni analogía específica del catálogo educativo ITO para este punto.` },
    { slug: "wc-fugas", title: "Cómo revisar fugas en la base del inodoro", content: `# Qué revisar

Si hay fugas o humedad visibles alrededor de la base del inodoro, después de una descarga normal.

# Cómo revisarlo

Descarga el inodoro con normalidad y observa la base con buena luz unos momentos después, buscando manchas de humedad, agua acumulada o goteo activo. Puedes pasar la mano (seca) cerca de la base, sin tocar directamente conexiones de agua, para sentir si hay humedad.

# Qué debería verse

La base del inodoro seca, sin manchas de humedad ni agua acumulada alrededor, y sin goteo visible después de la descarga.

# Qué señales pueden indicar un problema

- Manchas de humedad o agua acumulada en el piso junto a la base del inodoro.
- Goteo visible después de usar la descarga.

Si la humedad podría deberse a limpieza reciente o salpicaduras de una ducha cercana, espera un momento y vuelve a observar antes de registrar la observación.

# Por qué importa

Una fuga en la base, aunque parezca menor, puede afectar el piso o generar humedad sostenida si no se corrige a tiempo.

# Recomendación

Si ves humedad o goteo, regístralo como observación con foto. No es necesario desmontar el inodoro ni intervenir sus conexiones de agua — la observación visual es suficiente para dejar constancia.

# Fuente

- Criterio interno adaptado: catálogo educativo ITO (265 puntos), sección Artefactos sanitarios — verificación de fugas visibles en la base de artefactos.` },
  ];

  for (const a of technicalArticles) {
    await prisma.technicalArticle.upsert({
      where: { slug: a.slug },
      update: { title: a.title, content: a.content },
      create: { slug: a.slug, title: a.title, content: a.content },
    });
  }

  console.log(
    `Seed de Inspecciones completado: ${spaceTemplates.length} espacios, ${elementTemplates.length} elementos, ${spaceElementLinks.length} vínculos espacio-elemento, ${checklistItems.length} preguntas, ${technicalArticles.length} artículos técnicos.`
  );
}
