// Fase 11Y — configuración Nivel 2 del recinto
// (docs/FASE11Y_INFORME_PILOTO_CONFIGURACION_NIVEL2.md). Piloto real:
// Antejardín -> ¿Tiene reja?, Acceso vehicular -> ¿Tiene portón?.
//
// Arquitectura deliberadamente genérica (NO una columna hasReja/hasPorton
// por componente, que no escalaría a Cocina/Baño más adelante): un mismo
// registro `SpaceConfigurableComponent[]` por `spaceTemplate.key`,
// resuelto contra el JSON `InspectionSpace.config` con esta forma:
//   { components?: Record<elementTemplateKey, boolean>,
//     componentMeta?: Record<elementTemplateKey, Record<string, string>> }
// Agregar Cocina/Baño en el futuro es solo agregar una entrada más acá —
// ningún otro archivo necesita cambiar de forma.

export type SpaceConfigurableComponent = {
  // Key de InspectionElementTemplate — el mismo componente de catálogo
  // que ya existe hoy (Reja, Portón), reutilizado sin duplicar catálogo.
  componentKey: string;
  label: string;
  question: string;
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
// el InspectionElement (Reja/Portón) creado por la generación automática
// vieja. En ese caso el componente se considera implícitamente
// configurado en `true` — sin escribir nada en BD, solo en lectura — para
// que la UI NO vuelva a preguntar "¿Tiene reja?" sobre un caso real que
// ya tiene Reja generada y posiblemente respondida.
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

// El espacio necesita el bloque "Antes de revisar este espacio" si tiene
// componentes configurables Y al menos uno todavía no tiene estado
// resuelto (ni explícito en `config` ni implícito por elemento existente).
export function needsLevel2Onboarding(
  components: SpaceConfigurableComponent[],
  config: SpaceConfigJson,
  existingElementKeys: Set<string>
): boolean {
  return components.some(
    (c) => resolveComponentState(config, c.componentKey, existingElementKeys.has(c.componentKey)) === undefined
  );
}
