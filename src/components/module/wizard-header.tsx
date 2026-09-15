import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LogoMark } from "@/components/brand/logo-mark";
import { WizardStepper } from "./wizard-stepper";

// Encabezado compartido del wizard de módulos — antes esto era un <p> con
// el nombre del módulo y, por separado, una barra de progreso continua
// (ver conversación 2026-07-30, rediseño de pasos con diagrama). Se
// mantiene fuera de QuestionGroupStep/QuestionStep porque también se
// muestra (sin la fila de progreso) en la pantalla de resultado, donde no
// hay un "paso" que contar.
//
// Rediseño (spec "ObraBien Calculadora - Flujo rediseñado", 2026-08-01):
// el link de "volver" (antes vivía suelto en ModuleWizard, encima de este
// componente) pasa a integrarse en la misma fila que el nombre del
// módulo — "← Inicio" en el primer paso, "← Atrás" en los siguientes,
// "← Volver al paso N" en el resultado. El caller decide la etiqueta y el
// destino (href o onClick); este componente solo dibuja la fila.
export function WizardHeader({
  moduleName,
  step,
  back,
  resultMode,
}: {
  moduleName: string;
  // Ausente en la pantalla de resultado — ahí no se muestra la fila de
  // "Paso X de Y" ni la barra segmentada, solo el nombre del módulo.
  step?: { index: number; total: number };
  // Link/botón de "volver" a la izquierda de esta fila — reemplaza el
  // link "Inicio" que antes vivía suelto en ModuleWizard. href navega
  // (Inicio); onClick vuelve un paso o al wizard sin navegar.
  back?: { label: string; href?: string; onClick?: () => void };
  // Agrega "· Resultado" al título — solo en la pantalla de resultado.
  resultMode?: boolean;
}) {
  return (
    <div className="mt-6 mb-8">
      <div className="flex items-center justify-between gap-4">
        {/* Con `back` ausente (ej. Regularización, que maneja su propia
            navegación afuera de este componente), este bloque no se
            renderiza y el título queda solo — justify-between con un
            único hijo lo deja igual que antes (pegado a la izquierda),
            sin necesidad de un placeholder. */}
        {back &&
          (back.href ? (
            <Link
              href={back.href}
              className="inline-flex items-center gap-1.5 font-body text-sm font-medium text-ds-text-secondary hover:text-ds-navy-900 flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              {back.label}
            </Link>
          ) : (
            <button
              type="button"
              onClick={back.onClick}
              className="inline-flex items-center gap-1.5 font-body text-sm font-medium text-ds-text-secondary hover:text-ds-navy-900 flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              {back.label}
            </button>
          ))}
        <div className="flex items-center gap-2 min-w-0">
          {/* Sin artículo ("Hacer un/una X"): el género gramatical de
              moduleName varía entre módulos (Radier = masculino, Pintura/
              Excavación/Piscina = femenino) y no hay un campo de género en
              la base — "Hacer un Pintura" es un error real de concordancia
              que apareció al probar Fase 3 con otros módulos. El nombre
              solo, en mayúsculas, evita el problema sin inventar un dato
              nuevo por módulo. */}
          <p className="font-body text-xs font-bold uppercase tracking-wider text-ds-orange-600 truncate">
            {moduleName}
            {resultMode ? " · Resultado" : ""}
          </p>
          <LogoMark className="w-6 h-[15px] text-ds-navy-900 flex-shrink-0" />
        </div>
      </div>
      {step && (
        <>
          {/* Design Spec v1.0, Parte 3 (punto 6 del pedido): dots +
              conector reemplazan la barra segmentada continua — ver
              wizard-stepper.tsx. "Paso X de Y" se mantiene como
              complemento textual, permitido explícitamente por el pedido. */}
          <p className="mt-3 font-body text-xs text-ds-text-tertiary">
            Paso {step.index + 1} de {step.total}
          </p>
          <div className="mt-2">
            <WizardStepper current={step.index} total={step.total} />
          </div>
        </>
      )}
    </div>
  );
}
