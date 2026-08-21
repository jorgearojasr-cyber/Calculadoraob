import type { InspectionSeverity } from "@/generated/prisma/client";

// Fase 18A (DT-01, docs/FASE18A_CIERRE_DEUDAS_TRANSVERSALES_DT01_DT02_DT03.md)
// — severidad inicial del selector al crear/editar un hallazgo. Un
// hallazgo YA GUARDADO siempre respeta su propia severidad (`initial`),
// nunca se resetea al valor por defecto del catálogo. Solo un hallazgo
// NUEVO (`initial === null`) usa `defaultSeverity` del checklist item, y
// solo cuando este último no es null (varios checks base — piso/muros/
// ventana/etc. — no declaran uno) cae en "MEDIUM" como último fallback.
export function resolveInitialSeverity(
  initial: InspectionSeverity | null | undefined,
  defaultSeverity: InspectionSeverity | null | undefined
): InspectionSeverity {
  return initial ?? defaultSeverity ?? "MEDIUM";
}
