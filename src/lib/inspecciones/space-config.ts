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
  // Fase 11AA — Cocina Lote A. Solo Ventana y Puerta en este lote;
  // Piso cerámico/Pintura/Revestimiento cerámico/Muebles/Lavaplatos/
  // Campana quedan para lotes futuros (docs/FASE11Z_..., sección AA) y
  // NO se agregan acá todavía, a propósito.
  cocina: [
    { componentKey: "ventana", label: "Ventana", question: "¿La cocina tiene ventana?", section: "EQUIPAMIENTO DEL RECINTO" },
    { componentKey: "puerta", label: "Puerta", question: "¿La cocina tiene puerta?", section: "EQUIPAMIENTO DEL RECINTO" },
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
