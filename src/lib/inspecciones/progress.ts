// Cálculo de progreso — derivado siempre desde los InspectionChecklistCheck
// ya generados, nunca persistido (mismo criterio ya usado en SavedProject
// pero evitando su problema: progressPercent ahí es una columna que hay
// que recordar actualizar a mano; acá no existe esa columna en absoluto,
// ver diseño aprobado de Inspecciones — agregación por CONTEO total, no
// promedio de porcentajes, para no darle más peso a un espacio/elemento
// con pocas preguntas que a uno con muchas).
export type ProgressCount = { answered: number; total: number; percent: number };

export function computeProgress(statuses: (string | null)[]): ProgressCount {
  const total = statuses.length;
  const answered = statuses.filter((s) => s !== null).length;
  const percent = total > 0 ? Math.round((answered / total) * 100) : 0;
  return { answered, total, percent };
}

export function sumProgress(parts: ProgressCount[]): ProgressCount {
  const total = parts.reduce((acc, p) => acc + p.total, 0);
  const answered = parts.reduce((acc, p) => acc + p.answered, 0);
  const percent = total > 0 ? Math.round((answered / total) * 100) : 0;
  return { answered, total, percent };
}
