// Fase 11Y — configuración Nivel 2 del recinto
// (docs/FASE11Y_INFORME_PILOTO_CONFIGURACION_NIVEL2.md). Piloto real:
// Antejardín -> ¿Tiene reja?, Acceso vehicular -> ¿Tiene portón?.
// Fase 11AA — primer recinto con MÁS DE UN componente configurable
// (docs/FASE11AA_INFORME_COCINA_LOTE_A.md): Cocina -> ¿Tiene ventana?,
// ¿Tiene puerta?. Agrega 2 capacidades genéricas nuevas al motor,
// ninguna de las 2 es específica de Cocina:
//   1) `section` opcional — agrupación visual (ver SpaceLevel2Panel);
//   2) ancla histórica por recinto (ver SPACE_LEVEL2_HISTORICAL_ANCHOR
//      más abajo) — necesaria porque con 1 solo componente (Fase 11Y)
//      la inferencia por-componente ya alcanzaba para no romper
//      compatibilidad histórica, pero con Cocina un componente nuevo
//      (Puerta) JAMÁS existió en ningún caso histórico mientras que otro
//      (Ventana) SIEMPRE existió — evaluados componente por componente,
//      una Cocina histórica se vería con Ventana implícitamente
//      resuelta pero Puerta sin resolver, y dispararía el onboarding
//      igual. Ver sección C del informe de Fase 11AA para la
//      justificación completa de por qué se eligió esta señal y no otra.
//
// Arquitectura deliberadamente genérica (NO una columna hasReja/hasPorton
// por componente, que no escalaría a Cocina/Baño más adelante): un mismo
// registro `SpaceConfigurableComponent[]` por `spaceTemplate.key`,
// resuelto contra el JSON `InspectionSpace.config` con esta forma:
//   { components?: Record<elementTemplateKey, boolean>,
//     componentMeta?: Record<elementTemplateKey, Record<string, string>> }
// Agregar Baño en el futuro es solo agregar una entrada más acá —
// ningún otro archivo necesita cambiar de forma.

export type SpaceConfigurableComponent = {
  // Key de InspectionElementTemplate — el mismo componente de catálogo
  // que ya existe hoy (Reja, Portón, Ventana, Puerta), reutilizado sin
  // duplicar catálogo.
  componentKey: string;
  label: string;
  question: string;
  // Fase 11AA — agrupación visual opcional ("EQUIPAMIENTO DEL RECINTO",
  // futuro "TERMINACIONES"/"AGUA Y DESAGÜE" en Lote B/D de Cocina).
  // Genérico: cualquier recinto con 2+ componentes puede usarlo; un
  // recinto con 1 solo componente (Antejardín, Acceso vehicular) no lo
  // necesita y puede omitirlo — sin section, el componente se agrupa
  // solo (comportamiento idéntico al de Fase 11Y, sin cambios visuales
  // para Reja/Portón).
  section?: string;
  // Preguntas secundarias opcionales, solo visibles cuando el componente
  // = true (ej. "Tipo de portón"). Dato informativo (Fase 11W): NO
  // cambia qué revisiones se generan.
  metaOptions?: { key: string; label: string; options: { value: string; label: string }[] }[];
  // Fase 11AB — orden explícito del InspectionElement generado por Nivel 2
  // (ver saveSpaceLevel2ConfigAction, que hoy crea el elemento sin `order`
  // explícito, por lo que cae al default de schema = 0). Necesario porque
  // Lote B introduce el primer caso donde el orden visual deseado de los
  // componentes Nivel 2 importa (Piso cerámico junto a Piso, Pintura/
  // Revestimiento junto a Muros, ver informe 11AB sección T) — sin este
  // campo, los 5 componentes configurables de Cocina (los 3 derivados +
  // Ventana/Puerta) empatarían todos en order=0 y su orden relativo
  // quedaría a criterio del desempate implícito de Postgres/Prisma, no
  // determinista. Opcional: Reja/Portón (Fase 11Y) y Ventana/Puerta
  // (Fase 11AA) no lo necesitan, mantienen su comportamiento sin cambios
  // (order=0, sin conflicto porque son los únicos componentes Nivel 2 de
  // su recinto o porque su posición relativa entre sí no importaba hasta
  // ahora). Los componentes SIEMPRE-presentes (Piso/Muros/Enchufes/Cielo/
  // Iluminación) siguen ordenándose por el `order` del vínculo de
  // catálogo `InspectionElementTemplateSpace`, sin cambios — este campo
  // solo afecta a elementos creados por `saveSpaceLevel2ConfigAction`.
  order?: number;
};

export const SPACE_LEVEL2_CONFIG: Record<string, SpaceConfigurableComponent[]> = {
  antejardin: [{ componentKey: "reja", label: "Reja", question: "¿Tiene reja?" }],
  "acceso-vehicular": [
    {
      componentKey: "porton",
      label: "Portón",
      question: "¿Tiene portón?",
      metaOptions: [
        {
          key: "tipo",
          label: "Tipo de portón",
          options: [
            { value: "MANUAL", label: "Manual" },
            { value: "AUTOMATICO", label: "Automático" },
            { value: "NO_SE", label: "No sé" },
          ],
        },
      ],
    },
  ],
  // Fase 11AA — Cocina Lote A: Ventana y Puerta.
  // Fase 11AB — Cocina Lote B: 3 componentes derivados de terminación
  // (docs/FASE11AB_INFORME_COCINA_LOTE_B.md). Keys GENÉRICAS, sin sufijo
  // de recinto (`revestimiento-ceramico-piso`, no `piso-ceramico-cocina`)
  // — decisión de la sección AB de Fase 11Z, resuelta en esta fase:
  // el criterio técnico (palmetas quebradas, esmalte, manchas de pintura)
  // depende del MATERIAL, no del recinto, así que el mismo componente
  // podrá reutilizarse en Baño u otro recinto más adelante sin duplicar
  // catálogo, vinculándolo simplemente a un `spaceTemplateKey` más acá.
  // Cada uno es un componente derivado más para el motor de Fase 11Y: la
  // pregunta ("¿el piso es de cerámica...?") tiene texto distinto al
  // nombre del componente, pero el motor ya soporta eso sin cambios
  // (label/question independientes, Fase 11AA sección E).
  // Muebles de cocina/Lavaplatos/Campana quedan para lotes futuros
  // (Fase 11Z, sección AA) y NO se agregan acá todavía, a propósito.
  // Orden visual (campo `order`, ver tipo arriba): el diseño de Fase 11Z/
  // 11AB proponía intercalar cada derivado justo después de su base
  // (Piso, Revest. piso, Muros, Pintura, Revest. muro, Cielo, Enchufes,
  // Iluminación, Ventana, Puerta) — deliberadamente NO implementado así:
  // intercalar habría exigido reescribir el `order` de catálogo
  // (InspectionElementTemplateSpace) de Muros/Enchufes/Cielo/Iluminación
  // en Cocina, y esos vínculos son leídos HOY MISMO por el código ya
  // desplegado en producción para generar cualquier Cocina nueva — un
  // cambio puramente de catálogo habría alterado el orden visual de
  // Cocinas creadas en producción ANTES de que este código se publique
  // (mismo tipo de "ventana insegura" ya evitado en Fase 11AA). En vez de
  // eso: los 5 componentes Nivel 2 se ordenan 10-14, después de todos los
  // siempre-presentes (que llegan hasta order=5) — agrupados por sección
  // (TERMINACIONES antes que EQUIPAMIENTO) pero sin intercalar con la
  // base. Determinista y sin tocar ningún `order` de catálogo existente.
  cocina: [
    {
      componentKey: "revestimiento-ceramico-piso",
      label: "Revestimiento cerámico de piso",
      question: "¿El piso es de cerámica o porcelanato?",
      section: "TERMINACIONES",
      order: 10,
    },
    {
      componentKey: "pintura-muro",
      label: "Pintura de muro",
      question: "¿Los muros tienen pintura?",
      section: "TERMINACIONES",
      order: 11,
    },
    {
      componentKey: "revestimiento-ceramico-muro",
      label: "Revestimiento cerámico de muro",
      question: "¿Los muros tienen revestimiento cerámico o porcelanato?",
      section: "TERMINACIONES",
      order: 12,
    },
    {
      componentKey: "ventana",
      label: "Ventana",
      question: "¿La cocina tiene ventana?",
      section: "EQUIPAMIENTO DEL RECINTO",
      order: 13,
    },
    {
      componentKey: "puerta",
      label: "Puerta",
      question: "¿La cocina tiene puerta?",
      section: "EQUIPAMIENTO DEL RECINTO",
      order: 14,
    },
    // Fase 11AD — Cocina Lote C (docs/FASE11AD_INFORME_COCINA_LOTE_C.md),
    // cerrado técnicamente en Fase 11AC
    // (docs/FASE11AC_CIERRE_TECNICO_MUEBLES_COCINA.md). Nota de
    // desviación deliberada: 11AC proponía una sección visual nueva
    // "MOBILIARIO" para estos 2 componentes — el enunciado de 11AD
    // (secciones 5/10/15) pidió explícitamente agregarlos bajo
    // "EQUIPAMIENTO DEL RECINTO", junto a Ventana/Puerta, en su lugar.
    // Se siguió la instrucción explícita y más reciente de 11AD.
    // Muebles y Cubierta son componentes 100% independientes (ninguno
    // deriva del otro) — ver informe 11AC sección K: existen casos reales
    // en ambas direcciones (muebles aéreos sin cubierta; cubierta de obra
    // sin muebles bajos), así que anidarlos habría sido incorrecto.
    {
      componentKey: "muebles-cocina",
      label: "Muebles de cocina",
      question: "¿La cocina tiene muebles instalados (bajos, aéreos u otros fijos)?",
      section: "EQUIPAMIENTO DEL RECINTO",
      order: 15,
    },
    {
      componentKey: "cubierta-meson",
      label: "Cubierta / Mesón",
      question: "¿La cocina tiene cubierta o mesón?",
      section: "EQUIPAMIENTO DEL RECINTO",
      order: 16,
    },
    // Fase 11AF — Cocina Lote D (docs/FASE11AF_INFORME_COCINA_LOTE_D.md),
    // cerrado técnicamente en Fase 11AE
    // (docs/FASE11AE_CIERRE_TECNICO_LAVAPLATOS_COCINA.md). Primer
    // componente de la sección "AGUA Y DESAGÜE" — aparece por primera vez
    // porque, por primera vez, tiene una decisión real que agrupar.
    // Grifería/Fugas/Fijación/Sello NO son componentes propios — viven
    // como checklist dentro del único InspectionElement "lavaplatos",
    // mismo patrón ya usado para Cubierta dentro de Muebles (11AC/11AD):
    // no requiere ningún cambio al motor de protección de datos, porque
    // esos checks quedan protegidos automáticamente al vivir en el mismo
    // InspectionElement que su padre.
    {
      componentKey: "lavaplatos",
      label: "Lavaplatos",
      question: "¿La cocina tiene lavaplatos instalado?",
      section: "AGUA Y DESAGÜE",
      order: 17,
    },
    // Fase 11AH — Cocina Lote E (docs/FASE11AH_INFORME_COCINA_LOTE_E.md),
    // cerrado técnicamente en Fase 11AG
    // (docs/FASE11AG_CIERRE_TECNICO_CAMPANA_COCINA.md). Último componente
    // funcional pendiente del diseño original de Fase 11Z — con esto,
    // el catálogo funcional de Cocina queda V1 cerrado (ver informe 11AG,
    // sección AA). `section: "EQUIPAMIENTO DEL RECINTO"` aunque su `order`
    // numérico (18) sea mayor que el de Lavaplatos (17, sección "AGUA Y
    // DESAGÜE") — el agrupamiento visual lo determina `section`, no
    // `order` (ver informe 11AG, sección W). Sin subcomponentes: velocidades
    // viven dentro de Funcionamiento, extracción/filtros/ductos descartados
    // explícitamente por falta de fuente/método seguro (informe 11AG,
    // secciones G/J/K/L).
    {
      componentKey: "campana-extractor",
      label: "Campana / Extractor",
      question: "¿La cocina tiene campana o extractor instalado?",
      section: "EQUIPAMIENTO DEL RECINTO",
      order: 18,
    },
  ],
  // Fase 11AT — Baño Lote A (docs/FASE11AT_IMPLEMENTACION_LOCAL_BANO_LOTE_A.md),
  // arquitectura consolidada en docs/FASE11AS_CONSOLIDACION_CANONICA_BANO_V1.md.
  // Fase 11AU (docs/FASE11AU_IMPLEMENTACION_LOCAL_BANO_V1_RESTANTE.md) agrega
  // las 8 decisiones restantes (Extractor + 7 Artefactos sanitarios),
  // cerradas técnicamente en 11AK-11AR — Baño V1 queda con sus 12
  // decisiones Nivel 2 completas. Ninguna tiene `metaOptions`.
  bano: [
    {
      componentKey: "revestimiento-ceramico-piso",
      label: "Revestimiento cerámico de piso",
      question: "¿El piso es de cerámica o porcelanato?",
      section: "TERMINACIONES",
      order: 10,
    },
    {
      componentKey: "pintura-muro",
      label: "Pintura de muro",
      question: "¿Los muros tienen pintura?",
      section: "TERMINACIONES",
      order: 11,
    },
    {
      componentKey: "revestimiento-ceramico-muro",
      label: "Revestimiento cerámico de muro",
      question: "¿Los muros tienen revestimiento cerámico o porcelanato?",
      section: "TERMINACIONES",
      order: 12,
    },
    {
      componentKey: "ventana",
      label: "Ventana",
      question: "¿El baño tiene ventana?",
      section: "EQUIPAMIENTO DEL RECINTO",
      order: 13,
    },
    // Fase 11AU — Extractor de aire (docs/FASE11AK_CIERRE_TECNICO_EXTRACTOR_AIRE_BANO.md).
    // Sin reutilizar `campana-extractor` de Cocina — contexto y checks
    // distintos, confirmado explícitamente en el cierre técnico.
    {
      componentKey: "extractor-aire",
      label: "Extractor de aire",
      question: "¿El baño tiene extractor de aire instalado?",
      section: "EQUIPAMIENTO DEL RECINTO",
      order: 14,
    },
    // Fase 11AU — 7 componentes sanitarios (docs/FASE11AL a FASE11AR),
    // sección ARTEFACTOS SANITARIOS. El componente agregado histórico
    // `artefactos-sanitarios` queda gateado (LEVEL2_GATED_LINKS,
    // "bano:artefactos-sanitarios") desde Fase 11AT — nunca coexiste con
    // estos 7 en un Baño V1 nuevo.
    {
      componentKey: "wc",
      label: "WC / Inodoro",
      question: "¿El baño tiene inodoro instalado?",
      section: "ARTEFACTOS SANITARIOS",
      order: 15,
    },
    {
      componentKey: "lavamanos",
      label: "Lavamanos",
      question: "¿El baño tiene lavamanos instalado?",
      section: "ARTEFACTOS SANITARIOS",
      order: 16,
    },
    {
      componentKey: "ducha",
      label: "Ducha",
      question: "¿El baño tiene ducha instalada?",
      section: "ARTEFACTOS SANITARIOS",
      order: 17,
    },
    // `tina` order=18 antes que `mampara` order=19 — secuencia ya fijada
    // en 11AJ/11AN, sin relación con el orden en que se cerraron
    // técnicamente (Mampara se cerró en 11AO, antes que Tina en 11AP).
    {
      componentKey: "tina",
      label: "Tina / Bañera",
      question: "¿El baño tiene tina instalada?",
      section: "ARTEFACTOS SANITARIOS",
      order: 18,
    },
    {
      componentKey: "mampara",
      label: "Mampara",
      question: "¿El baño tiene mampara instalada?",
      section: "ARTEFACTOS SANITARIOS",
      order: 19,
    },
    // Fase 11AQ corrigió la conclusión preliminar de 11AJ: Cubierta de
    // baño requiere componente propio (independiente de Mueble), cerrado
    // en 11AR. Mueble/Cubierta sin dependencia automática entre sí ni con
    // Lavamanos.
    {
      componentKey: "mueble-bano",
      label: "Mueble de baño / Vanitorio",
      question: "¿El baño tiene mueble de baño o vanitorio instalado?",
      section: "ARTEFACTOS SANITARIOS",
      order: 20,
    },
    {
      componentKey: "cubierta-bano",
      label: "Cubierta de baño",
      question: "¿El baño tiene cubierta o mesón instalado?",
      section: "ARTEFACTOS SANITARIOS",
      order: 21,
    },
  ],
  // Fase 12B (docs/FASE12B_IMPLEMENTACION_LOCAL_DORMITORIO_V1.md),
  // diseño canónico en docs/FASE12A_DISENO_INTEGRAL_DORMITORIO_V1.md.
  // Ventana y Puerta permanecen BASE (sin cambios, ver sección G/H de
  // 12A) — Dormitorio ya las genera automáticamente desde antes de esta
  // fase, y no hay evidencia de que deban ser opcionales. Cielo e
  // Iluminación se agregan como BASE nueva (vínculo de catálogo, ver
  // fase12b-dormitorio-v1.ts), NO acá — no son Nivel 2, cierran una
  // brecha de paridad con Cocina/Baño que sí las tenían desde su
  // respectivo Lote A.
  dormitorio: [
    {
      componentKey: "revestimiento-ceramico-piso",
      label: "Revestimiento cerámico de piso",
      question: "¿El piso es de cerámica o porcelanato?",
      section: "TERMINACIONES",
      order: 10,
    },
    {
      componentKey: "pintura-muro",
      label: "Pintura de muro",
      question: "¿Los muros tienen pintura?",
      section: "TERMINACIONES",
      order: 11,
    },
    {
      componentKey: "revestimiento-ceramico-muro",
      label: "Revestimiento cerámico de muro",
      question: "¿Los muros tienen revestimiento cerámico o porcelanato?",
      section: "TERMINACIONES",
      order: 12,
    },
    // Único componente nuevo de Dormitorio V1 (sección K de 12A) — 4
    // checks, sin metadata, sin dependencia de ningún otro componente.
    {
      componentKey: "closet",
      label: "Clóset / Armario empotrado",
      question: "¿El dormitorio tiene clóset o armario empotrado instalado?",
      section: "EQUIPAMIENTO DEL RECINTO",
      order: 13,
    },
  ],
  // Fase 13A (docs/FASE13A_IMPLEMENTACION_QA_LIVING_COMEDOR_V1.md) — mismo
  // patrón de Dormitorio (12B): solo cierra la brecha de paridad de
  // Cielo/Iluminación (vínculo nuevo, ver fase13a-living-comedor-v1.ts) y
  // habilita las 3 terminaciones ya usadas por Cocina/Baño/Dormitorio, sin
  // ningún componente nuevo. No se agrega Puerta — Living-comedor no la
  // tenía como base y no hay evidencia de que deba tenerla (sección 5 del
  // enunciado de 13A).
  "living-comedor": [
    {
      componentKey: "revestimiento-ceramico-piso",
      label: "Revestimiento cerámico de piso",
      question: "¿El piso es de cerámica o porcelanato?",
      section: "TERMINACIONES",
      order: 10,
    },
    {
      componentKey: "pintura-muro",
      label: "Pintura de muro",
      question: "¿Los muros tienen pintura?",
      section: "TERMINACIONES",
      order: 11,
    },
    {
      componentKey: "revestimiento-ceramico-muro",
      label: "Revestimiento cerámico de muro",
      question: "¿Los muros tienen revestimiento cerámico o porcelanato?",
      section: "TERMINACIONES",
      order: 12,
    },
  ],
};

// Fase 11AA — señal de compatibilidad histórica a nivel de RECINTO
// (distinta de `resolveComponentState`, que es por componente). Mapea
// `spaceTemplate.key -> elementTemplateKey` de un componente que:
//   (a) es SIEMPRE PRESENTE (se genera automáticamente, sin pregunta)
//       en cualquier espacio creado por el código nuevo, y
//   (b) NUNCA pudo existir en un espacio generado por el código viejo
//       (es 100% nuevo en este lote).
// Si ese elemento NO existe en un espacio dado, el espacio es anterior a
// este catálogo y se trata como completamente configurado (sin importar
// el estado individual de cada componente Nivel 2) — nunca se le exige
// resolver retroactivamente preguntas que no existían cuando se generó.
// No requiere cambio de schema: se infiere 100% de datos ya existentes
// (presencia/ausencia de un InspectionElement con ese elementTemplate.key).
export const SPACE_LEVEL2_HISTORICAL_ANCHOR: Record<string, string> = {
  cocina: "cielo",
  // Fase 11AT — mismo criterio y mismo elemento ancla que Cocina: "cielo"
  // es (a) siempre-presente en cualquier Baño generado por el código
  // nuevo (Lote A lo vincula como base), y (b) nunca existió en un Baño
  // generado por el código viejo (100% nuevo en este lote) — los 5
  // espacios de Baño reales existentes hoy no tienen `cielo`, por lo que
  // quedan correctamente clasificados como históricos.
  bano: "cielo",
  // Fase 12B — mismo criterio: "cielo" pasa a ser BASE nueva de
  // Dormitorio en este mismo lote (fase12b-dormitorio-v1.ts), y los 6
  // Dormitorios reales existentes hoy no lo tienen, por lo que quedan
  // correctamente clasificados como históricos sin ningún backfill.
  dormitorio: "cielo",
  // Fase 13A — mismo criterio: el único Living-comedor real existente hoy
  // no tiene "cielo" (confirmado por auditoría read-only antes de
  // implementar), y todo Living-comedor V1 nuevo lo tendrá como base.
  "living-comedor": "cielo",
};

export function getConfigurableComponents(spaceTemplateKey: string | null | undefined): SpaceConfigurableComponent[] {
  if (!spaceTemplateKey) return [];
  return SPACE_LEVEL2_CONFIG[spaceTemplateKey] ?? [];
}

export type SpaceConfigJson = {
  components?: Record<string, boolean>;
  componentMeta?: Record<string, Record<string, string>>;
};

export function parseSpaceConfig(raw: unknown): SpaceConfigJson {
  if (!raw || typeof raw !== "object") return {};
  const obj = raw as Record<string, unknown>;
  const components =
    obj.components && typeof obj.components === "object" ? (obj.components as Record<string, boolean>) : undefined;
  const componentMeta =
    obj.componentMeta && typeof obj.componentMeta === "object"
      ? (obj.componentMeta as Record<string, Record<string, string>>)
      : undefined;
  return { components, componentMeta };
}

// Compatibilidad histórica (informe Fase 11Y, sección N): un espacio
// generado ANTES de esta fase nunca tiene `config`, pero puede ya tener
// el InspectionElement (Reja/Portón/Ventana) creado por la generación
// automática vieja. En ese caso el componente se considera implícitamente
// configurado en `true` — sin escribir nada en BD, solo en lectura — para
// que la UI NO vuelva a preguntar sobre un caso real que ya tiene el
// componente generado y posiblemente respondido.
export function resolveComponentState(
  config: SpaceConfigJson,
  componentKey: string,
  hasExistingElement: boolean
): boolean | undefined {
  const explicit = config.components?.[componentKey];
  if (explicit !== undefined) return explicit;
  if (hasExistingElement) return true;
  return undefined;
}

// El espacio necesita el bloque "Antes de revisar este espacio" si:
//   1) no es un espacio histórico (ver `SPACE_LEVEL2_HISTORICAL_ANCHOR`
//      arriba — si el ancla del recinto no existe, se considera
//      histórico y NUNCA se bloquea, sin importar el resto), Y
//   2) tiene componentes configurables Y al menos uno todavía no tiene
//      estado resuelto (ni explícito en `config` ni implícito por
//      elemento existente).
export function needsLevel2Onboarding(
  spaceTemplateKey: string | null | undefined,
  components: SpaceConfigurableComponent[],
  config: SpaceConfigJson,
  existingElementKeys: Set<string>
): boolean {
  const anchor = spaceTemplateKey ? SPACE_LEVEL2_HISTORICAL_ANCHOR[spaceTemplateKey] : undefined;
  if (anchor && !existingElementKeys.has(anchor)) return false;

  return components.some(
    (c) => resolveComponentState(config, c.componentKey, existingElementKeys.has(c.componentKey)) === undefined
  );
}
