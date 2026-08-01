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
