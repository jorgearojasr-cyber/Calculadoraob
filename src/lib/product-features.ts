import type { LucideIcon } from "lucide-react";
import { ClipboardCheck, ShieldCheck, BookOpen, Images } from "lucide-react";

// Registro central de FEATURES DE PRODUCTO standalone — Fase "Cimientos de
// la nueva arquitectura ObraBien" (2026-09-14). Mismo criterio arquitectónico
// que ya usa module-visual-config.ts para los módulos de cálculo: UN solo
// archivo, tipado, indexado de forma estable, consumido por varias
// superficies en vez de que cada una mantenga su propia lista — pero para
// un problema distinto y deliberadamente más chico.
//
// QUÉ ES: la fuente de verdad para las secciones del producto que NO son un
// `Module` de cálculo (Inspecciones, Regularización, Guías, Biblioteca) —
// hoy viven cada una en su propia tabla de BD (InspectionCase,
// RegularizationCase, ModuleGuide, ProjectShowcase) sin fila equivalente en
// Module/Category/ProjectGroup/ProjectTask, así que antes de esta fase cada
// superficie (buscador, TopNav, drawer mobile) las declaraba a mano por
// separado — la saneamiento anterior (rama saneamiento-navegacion-guias)
// ya había hecho esto una vez para el buscador con un array FEATURES local;
// esta fase lo saca de ahí y lo centraliza acá para que el buscador, el
// menú y (más adelante) el Home lean la MISMA fuente.
//
// QUÉ NO ES:
//   - No es un CMS. No hay UI de administración para editarlo — se edita
//     a mano en este archivo, igual que module-visual-config.ts.
//   - No reemplaza ni duplica `Module` — los 61 módulos de cálculo siguen
//     100% en Prisma, con su propio sistema (module-visual-config.ts,
//     ModuleWizard, formula-engine). Nada de esto se toca acá.
//   - No reemplaza la protección real de rutas — `requiresAuth` es
//     metadata descriptiva para que la UI (ej. un futuro badge "requiere
//     cuenta") sepa qué mostrar; la protección real sigue siendo
//     `middleware.ts` o el `getServerSession`+`redirect` de cada página
//     (ver advertencia en `FeatureEntry.requiresAuth` más abajo).

// --- Áreas conceptuales del producto -----------------------------------
//
// La estrategia de producto aprobada (auditoría 2026-09-14) define 7 áreas
// futuras. Esta fase las declara TODAS (para que el tipado exista y una
// feature nueva tenga dónde clasificarse), pero distingue explícitamente
// cuáles ya tienen funcionalidad real (`status: "operational"`) de cuáles
// son intención de producto sin nada implementado todavía
// (`status: "future"`) — un área "future" nunca debe traducirse en un botón
// o página pública (ver PLANNED_FEATURES más abajo).
export type ProductAreaId =
  | "calcula"
  | "planifica"
  | "profesionales"
  | "documentos"
  | "revisa"
  | "regulariza"
  | "aprende";

export type ProductAreaStatus = "operational" | "future";

export type ProductAreaConfig = {
  id: ProductAreaId;
  label: string;
  description: string;
  status: ProductAreaStatus;
};

export const PRODUCT_AREAS: Record<ProductAreaId, ProductAreaConfig> = {
  // CALCULA no tiene entradas en PRODUCT_FEATURES — está representada por
  // el sistema `Module` existente (61 calculadoras), que sigue siendo su
  // propia fuente de verdad (Category/ProjectGroup/ProjectTask). Se
  // declara acá solo para que el tipo `ProductAreaId` la incluya y una
  // futura pantalla que agrupe "por área" pueda etiquetar esos módulos
  // como CALCULA sin inventar un área nueva.
  calcula: {
    id: "calcula",
    label: "Calcula",
    description: "Calculadoras de materiales y cantidades para construir, reparar o remodelar.",
    status: "operational",
  },
  // PLANIFICA: representada hoy por `ProjectPlan` (piloto: "Construir una
  // piscina", ver /plan/[slug]) — tampoco tiene entrada en PRODUCT_FEATURES
  // por el mismo motivo que CALCULA (tiene su propio modelo Prisma real).
  // Ver el comentario extenso sobre Piscina más abajo.
  planifica: {
    id: "planifica",
    label: "Planifica",
    description: "Planes de construcción por etapas para proyectos compuestos de varias fases.",
    status: "operational",
  },
  // FUTURO — sin funcionalidad implementada. Sin ruta real, sin página, sin
  // entrada pública en PRODUCT_FEATURES. Ver PLANNED_FEATURES.
  profesionales: {
    id: "profesionales",
    label: "Profesionales",
    description: "Encontrar y contratar maestros o profesionales para tu proyecto.",
    status: "future",
  },
  // FUTURO — ídem.
  documentos: {
    id: "documentos",
    label: "Documentos",
    description: "Contratos y documentación para formalizar un proyecto de construcción.",
    status: "future",
  },
  revisa: {
    id: "revisa",
    label: "Revisa tu obra",
    description: "Inspección guiada de una obra antes de recibirla o entregarla.",
    status: "operational",
  },
  regulariza: {
    id: "regulariza",
    label: "Regulariza",
    description: "Regularización de una vivienda o ampliación construida sin permiso.",
    status: "operational",
  },
  aprende: {
    id: "aprende",
    label: "Aprende",
    description: "Guías, consejos y proyectos de ejemplo para aprender antes de construir.",
    status: "operational",
  },
};

// --- Piscina: cómo clasifica en esta arquitectura (documentación, sin
//     tocar código de Piscina — ver punto 8 del pedido) -----------------
//
// Existen HOY DOS caminos distintos y deliberadamente separados para
// "construir una piscina", y esta fase los deja exactamente como están:
//   - `piscina-integral` (Module, published:false, en revisión) → área
//     CALCULA. Es el configurador de una sola pasada: todas las
//     dimensiones, estructura, excavación, borde y equipamiento en un
//     mismo wizard, resultado inmediato.
//   - `/plan/construir-una-piscina` (ProjectPlan, 3 fases, todos sus
//     módulos publicados, huérfano de navegación — ver auditoría) → área
//     PLANIFICA. Es la construcción por etapas: Excavación → Construir la
//     piscina (con los módulos ya publicados piscina-rectangular/circular)
//     → Terminar el entorno.
// Decisión de producto ya tomada: PUEDEN COEXISTIR — no se fusionan, no se
// elimina ninguno, no se redirige uno al otro. Esta fase no cambia rutas,
// `published`, flujo ni tarjetas de ninguno de los dos. Cuando el Home se
// rediseñe (fase futura, fuera de alcance acá), CALCULA debería ofrecer el
// configurador integral y PLANIFICA debería ofrecer (y por fin enlazar) el
// plan de fases — hoy ninguna superficie enlaza a `/plan/construir-una-piscina`.

// --- Features standalone ------------------------------------------------

export type FeatureStatus = "available" | "planned";

export type FeatureEntry = {
  // Slug estable — no es un cuid de BD (estas features no tienen fila en
  // Module), es una clave elegida a mano, como los slugs de Category.
  id: string;
  name: string;
  // Solo si el nombre completo no entra en un espacio chico (chip, tab) —
  // hoy ninguna de las 4 lo necesita, se deja tipado para cuando haga
  // falta en vez de agregarlo recién cuando se necesite.
  shortName?: string;
  description: string;
  // Requerido solo cuando status:"available" — ver validación más abajo y
  // el comentario de PLANNED_FEATURES. TypeScript no puede expresar
  // "requerido condicionalmente al valor de otro campo" de forma limpia
  // acá, así que queda opcional con esa regla como contrato documentado +
  // verificado en runtime por `assertRegistryIntegrity` (ver tests).
  href?: string;
  area: ProductAreaId;
  icon: LucideIcon;
  // Mismo formato que ya usaba el FEATURES local de search.ts (palabras en
  // minúscula separadas por espacio, sin tildes obligatorias — normalize()
  // en search.ts ya quita acentos de ambos lados) — se preservan
  // literalmente las keywords aprobadas en la fase de saneamiento.
  keywords: string;
  status: FeatureStatus;
  // Metadata descriptiva — ver advertencia grande al final del archivo.
  // NO reemplaza middleware.ts ni getServerSession+redirect.
  requiresAuth: boolean;
  showInSearch: boolean;
  showInMenu: boolean;
  // Todavía sin consumidor (el Home no se rediseña en esta fase) — se
  // declara para que la fase visual futura no tenga que volver a decidir
  // "cuáles de estas 4 van en Home", ya quedó registrado acá.
  showInHome: boolean;
  order: number;
};

// Las 4 features migradas en esta fase — mínimo pedido explícitamente.
// Keywords copiadas literales desde search.ts (rama saneamiento-navegacion-
// guias) — mismo contrato de búsqueda en lenguaje natural ya aprobado, no
// se reinventan acá.
// `order` refleja el orden visual QUE YA EXISTÍA en TopNav/MobileTopBar
// antes de esta fase (Guías, Inspecciones, Biblioteca — Regularización no
// estaba en ninguno de los 2) — no es un orden nuevo, es el que había que
// preservar (ver punto 5 del pedido: "conservar la apariencia actual").
export const PRODUCT_FEATURES: FeatureEntry[] = [
  {
    id: "guias",
    name: "Guías y consejos",
    shortName: "Guías",
    description: "Consejos prácticos, errores comunes y experiencia de obra para proyectos que ya tienen guía completa.",
    href: "/guias",
    area: "aprende",
    icon: BookOpen,
    keywords: "guia guias aprender consejos como construir tips recomendaciones",
    status: "available",
    requiresAuth: false,
    showInSearch: true,
    showInMenu: true,
    // Home ObraBien V2 (2026-09-14): Guías pasa a tener tarjeta propia en la
    // grilla "¿Qué quieres hacer?" (tarjeta "Aprender") — ver
    // getHomeFeatures() en quick-actions-grid.tsx.
    showInHome: true,
    order: 10,
  },
  {
    id: "inspecciones",
    name: "Inspecciones",
    description:
      "Revisa tu obra o la casa que vas a recibir con una checklist guiada, antes de la recepción o entrega.",
    href: "/inspecciones",
    area: "revisa",
    icon: ClipboardCheck,
    keywords:
      "inspeccion inspecciones inspeccionar revisar revision obra recibir casa recepcion vivienda revisar ampliacion checklist",
    status: "available",
    requiresAuth: true,
    showInSearch: true,
    showInMenu: true,
    // Home ObraBien V2 (2026-09-14): tarjeta "Revisar tu obra" en la grilla
    // principal del Home — ver quick-actions-grid.tsx.
    showInHome: true,
    order: 20,
  },
  {
    id: "regularizacion",
    name: "Regularización",
    description: "Regulariza tu vivienda o ampliación construida sin permiso, según la Ley N.º 20.898 (Ley del Mono).",
    href: "/regularizacion",
    area: "regulariza",
    icon: ShieldCheck,
    keywords:
      "regularizar regularizacion ley del mono ampliar sin permiso permiso de edificacion vivienda dgoc municipalidad",
    status: "available",
    requiresAuth: true,
    showInSearch: true,
    // Decisión ya tomada en la auditoría/saneamiento anterior: Regularización
    // no está en TopNav ni en el drawer hoy (solo tiene su tarjeta
    // destacada en Home) — se preserva ese comportamiento exacto acá, no
    // se agrega al menú como efecto colateral de migrar al registry.
    showInMenu: false,
    // Home ObraBien V2 (2026-09-14, punto 4 del pedido): Regularización
    // pasa a tener tarjeta propia en la grilla principal del Home
    // ("Regularizar") — se activa showInHome (la solución coherente que
    // pedía el punto 4), SIN forzar showInMenu:true (se mantiene la
    // decisión de producto previa de no ponerla en TopNav/drawer).
    showInHome: true,
    order: 30,
  },
  {
    id: "biblioteca",
    name: "Biblioteca",
    description: "Proyectos terminados por otros usuarios, como ejemplo e inspiración para el tuyo.",
    href: "/galeria",
    area: "aprende",
    icon: Images,
    keywords: "biblioteca proyectos ejemplos fotos terminados inspiracion",
    status: "available",
    requiresAuth: false,
    showInSearch: true,
    showInMenu: true,
    showInHome: false,
    order: 40,
  },
];

// Features declaradas para planificación interna — NUNCA tienen `href` real
// (no existe la ruta) y NUNCA se exponen en ninguna superficie pública. No
// se agregan a PRODUCT_FEATURES a propósito: mezclarlas ahí obligaría a
// cada consumidor (buscador, menú) a acordarse de filtrar `status` — con un
// array separado, un consumidor que solo conoce PRODUCT_FEATURES ni se
// entera de que esto existe, que es exactamente la garantía que pide el
// punto 10 del pedido ("no debe aparecer... salvo que ya exista una ruta
// real"). Si en el futuro una de estas pasa a tener ruta real, se MUEVE
// (no se copia) a PRODUCT_FEATURES con `status:"available"` y su `href`
// real.
export const PLANNED_FEATURES: Omit<FeatureEntry, "href" | "showInSearch" | "showInMenu" | "showInHome" | "order">[] = [
  {
    id: "profesionales",
    name: "Profesionales",
    description: "Encontrar y contratar maestros o profesionales verificados para tu proyecto.",
    area: "profesionales",
    icon: ShieldCheck,
    keywords: "profesionales maestros contratar cotizar",
    status: "planned",
    requiresAuth: true,
  },
  {
    id: "documentos",
    name: "Contratos y documentos",
    description: "Contratos y documentación para formalizar un proyecto de construcción.",
    area: "documentos",
    icon: BookOpen,
    keywords: "contratos documentos formalizar",
    status: "planned",
    requiresAuth: true,
  },
];

// --- Helpers de lectura ---------------------------------------------------
//
// Cada superficie consume UNO de estos, nunca itera PRODUCT_FEATURES a
// mano — así un flag nuevo (o una feature "planned" que algún día se
// active) se respeta en un solo lugar. El parámetro `features` es
// inyectable (default: PRODUCT_FEATURES real) SOLO para poder testear el
// contrato de filtrado (status/showInX) con datos de prueba en
// product-features.test.ts sin mutar el registro real — ningún consumidor
// de producción pasa ese argumento.

export function getSearchableFeatures(features: FeatureEntry[] = PRODUCT_FEATURES): FeatureEntry[] {
  return features.filter((f) => f.status === "available" && f.showInSearch);
}

export function getMenuFeatures(features: FeatureEntry[] = PRODUCT_FEATURES): FeatureEntry[] {
  return features.filter((f) => f.status === "available" && f.showInMenu).sort((a, b) => a.order - b.order);
}

// Sin consumidor todavía (ver punto 7 del pedido: el Home no se rediseña en
// esta fase) — se deja lista para cuando exista, en vez de que la fase
// visual futura tenga que inventar el mismo filtro otra vez.
export function getHomeFeatures(features: FeatureEntry[] = PRODUCT_FEATURES): FeatureEntry[] {
  return features.filter((f) => f.status === "available" && f.showInHome).sort((a, b) => a.order - b.order);
}

// ADVERTENCIA (repetida a propósito, ver también docs/product-feature-registry.md):
// `requiresAuth` es SOLO metadata descriptiva para la UI (ej. un futuro
// badge "requiere cuenta" en una tarjeta). Cambiar este valor NO protege ni
// desprotege ninguna ruta — la protección real sigue siendo `middleware.ts`
// (matcher explícito) o el `getServerSession` + `redirect` que cada página
// de Inspecciones/Regularización ya tenía ANTES de que existiera este
// archivo. Si se agrega una feature nueva acá, su ruta real necesita su
// propia protección — este registro nunca la reemplaza.
