// Fase 20A (docs/FASE20A_INVESTIGACION_FORENSE_INCIDENTE_NEON.md) —
// guardrails reutilizables para scripts temporales de limpieza QA
// (`prisma/db-fixes/_tmp_*_qa_cleanup.ts`, uno nuevo por fase, siempre
// eliminado al cierre). La investigación forense no encontró ningún
// `deleteMany` sin scope en el código de aplicación versionado, pero
// tampoco existía ningún guardrail que impidiera que un futuro script
// manual lo introdujera por error. Estas funciones no reemplazan el
// criterio del script (que sigue buscando el caso/usuario por id o
// email exactos antes de borrar), sino que hacen explícito y verificable
// el supuesto de seguridad que ya se venía siguiendo por convención.

const QA_EMAIL_SUFFIX = "@obrabien.local";

// Todo usuario QA temporal de este proyecto usa el dominio reservado
// `obrabien.local` (ver cualquier docs/FASEXX...md — patrón usado sin
// excepción desde la Fase 5). Lanza si el email no lo cumple, en vez de
// dejar que un cleanup borre silenciosamente un usuario real.
export function assertQaEmail(email: string): void {
  if (!email.endsWith(QA_EMAIL_SUFFIX)) {
    throw new Error(
      `assertQaEmail: "${email}" no termina en "${QA_EMAIL_SUFFIX}" — abortado para evitar borrar datos reales.`
    );
  }
}

// Guardrail genérico de cantidad: un cleanup QA borra 1 (a veces 2)
// casos/usuarios por fase, nunca una cantidad arbitraria. Si el conteo
// real excede lo esperado, algo no coincide con el supuesto del script
// (ej. un `where` demasiado amplio) y debe abortar en vez de continuar.
export function assertMaxCount(actual: number, max: number, label: string): void {
  if (actual > max) {
    throw new Error(`assertMaxCount: se esperaban como máximo ${max} ${label}, se encontraron ${actual} — abortado.`);
  }
}
