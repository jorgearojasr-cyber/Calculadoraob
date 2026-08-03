import type { WizardAnswers } from "./types";

// BUG-007 (auditoría funcional 02-ago-2026): recarga o "atrás" del
// navegador durante un asistente en progreso perdía todo, sin aviso.
// Decisión de arquitectura del usuario (Grupo 4B, 03-ago-2026): localStorage
// únicamente (sin sessionStorage ni persistencia server-side), resuelve solo
// pérdida accidental en el mismo dispositivo — no sincronización entre
// dispositivos ni borradores compartidos.
//
// Unifica en una sola clave/estructura por módulo el guardado automático
// (autosave, en cada respuesta) y el guardado explícito ya existente
// ("Guardar y seguir después") — antes este último usaba su propia clave
// (`obrabien:wizard-progress:${moduleSlug}`) con una forma distinta (solo
// `answers`, sin `stepIndex` ni expiración). `savedVia` distingue el
// origen: un borrador "explicit" se retoma sin preguntar (comportamiento
// ya aprobado de "Guardar y seguir después", sin cambios); uno "autosave"
// SIEMPRE pide confirmación antes de restaurar (ver WizardResumeGate) —
// nunca se restaura solo por estar presente.
export type WizardDraft = {
  schemaVersion: number;
  moduleId: string;
  stepIndex: number;
  answers: WizardAnswers;
  savedAt: number;
  expiresAt: number;
  savedVia: "explicit" | "autosave";
};

// Versión del FORMATO del borrador (no del módulo/preguntas) — si esta
// estructura cambia en el futuro, sube este número para que un borrador
// viejo en el navegador de un usuario se descarte en vez de romper al
// leerlo, sin necesitar una migración.
const SCHEMA_VERSION = 1;

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function draftKey(moduleSlug: string): string {
  return `obrabien:wizard-draft:${moduleSlug}`;
}

// Lee el borrador vigente de este módulo, si existe. Descarta (y borra)
// silenciosamente cualquier borrador corrupto, de otro módulo (moduleId no
// coincide), de un schemaVersion viejo, o ya expirado — en todos esos
// casos se comporta igual que si no hubiera borrador.
export function readWizardDraft(moduleSlug: string, moduleId: string): WizardDraft | null {
  const raw = window.localStorage.getItem(draftKey(moduleSlug));
  if (!raw) return null;
  try {
    const draft = JSON.parse(raw) as WizardDraft;
    if (
      draft.schemaVersion !== SCHEMA_VERSION ||
      draft.moduleId !== moduleId ||
      Date.now() > draft.expiresAt
    ) {
      clearWizardDraft(moduleSlug);
      return null;
    }
    return draft;
  } catch {
    clearWizardDraft(moduleSlug);
    return null;
  }
}

export function writeWizardDraft(
  moduleSlug: string,
  draft: Pick<WizardDraft, "moduleId" | "stepIndex" | "answers" | "savedVia">
): void {
  const savedAt = Date.now();
  const full: WizardDraft = {
    ...draft,
    schemaVersion: SCHEMA_VERSION,
    savedAt,
    expiresAt: savedAt + THIRTY_DAYS_MS,
  };
  window.localStorage.setItem(draftKey(moduleSlug), JSON.stringify(full));
}

export function clearWizardDraft(moduleSlug: string): void {
  window.localStorage.removeItem(draftKey(moduleSlug));
}
