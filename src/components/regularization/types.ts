import type { RegularizationConstructionType, RegularizationMaterial } from "@/generated/prisma/client";

// Respuestas del wizard inicial (5 pasos) — tipado específico, a
// propósito NO reutiliza WizardAnswers (Record<string, string|number>)
// de components/module/types.ts: esos campos son fijos y conocidos de
// antemano (no preguntas dinámicas de una tabla Question), así que un
// tipo concreto da chequeo real en cada paso. Ver diseño de
// RegularizationWizard aprobado 2026-08-01.
export type RegularizationWizardAnswers = {
  tipoConstruccion?: RegularizationConstructionType;
  // undefined = paso todavía no respondido: null = "No lo sé" elegido
  // explícitamente (ver diseño del Paso 2, aprobado 2026-08-01).
  anioConstruccion?: number | null;
  recepcionMunicipal?: boolean | null;
  m2Estimados?: number;
  material?: RegularizationMaterial;
};

export const REGULARIZATION_WIZARD_STEP_COUNT = 5;

// Identifica la regla "Ya cuenta con recepción municipal" para darle
// tratamiento visual destacado en las pantallas de resultado
// (RegularizationRulesList, usado por regularization-entry.tsx y
// RegularizationRulesView) — las reglas no tienen código estable en
// RegularizationRule (solo label/message), así que esta constante es el
// único punto de verdad para el match. Vive acá (no en
// lib/regularization-rules.ts) a propósito: ese módulo importa `prisma`
// (server-only), y RegularizationRulesList es un componente de cliente —
// importar la constante desde ahí arrastraría `pg` al bundle del
// navegador (bug real encontrado en la verificación de build de esta
// ronda).
export const RECEPCION_YA_TIENE_LABEL = "Ya cuenta con recepción municipal";
