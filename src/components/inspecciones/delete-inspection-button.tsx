"use client";

import { useRouter } from "next/navigation";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteInspectionCaseAction } from "@/app/(app)/inspecciones/actions";

// Fase 11K (docs/FASE11J..., sección F) — reutiliza el mismo componente
// de confirmación ya validado en el resto del proyecto (`DeleteButton`,
// `window.confirm` + estado de carga) en vez de construir un modal
// nuevo. El mensaje de confirmación incluye el nombre/referencia real
// del caso y aclara explícitamente que la acción no se puede deshacer,
// tal como pide el diseño.
export function DeleteInspectionButton({ caseId, name }: { caseId: string; name: string }) {
  const router = useRouter();

  return (
    <DeleteButton
      label="Eliminar inspección"
      confirmMessage={`¿Eliminar "${name}"? Esta acción no se puede deshacer: se borrarán todos los espacios, respuestas, hallazgos y fotografías de esta inspección.`}
      onDelete={async () => {
        const result = await deleteInspectionCaseAction(caseId);
        if (result.success) router.refresh();
        return result;
      }}
    />
  );
}
