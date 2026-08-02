"use client";

import { useTransition } from "react";
import { ConditionalRevealStep } from "@/components/module/conditional-reveal-step";
import { CollapsibleHelp } from "@/components/module/collapsible-help";
import type { WizardQuestion } from "@/components/module/types";
import { updateAvaluoFiscalAction, getDocumentChecklistAction } from "@/app/(app)/regularizacion/[id]/actions";
import type { RegularizationDocumentItem } from "@/lib/regularization-documents";

// Reutiliza ConditionalRevealStep tal cual (sin modificarlo) — mismo
// componente ya usado en Cerámica para "¿sabes el dato exacto?". Las
// opciones van en el orden que el componente espera: options[1] es la
// que revela el campo numérico (ver conditional-reveal-step.tsx), así
// que "Sí, lo tengo" va segunda, no primera.
const SELECT_QUESTION: WizardQuestion = {
  id: "conoce-avaluo",
  key: "conoce-avaluo",
  label: "¿Conoces el avalúo fiscal de la propiedad?",
  type: "SELECT",
  unit: null,
  helpText: null,
  options: [
    { key: "no_se", label: "No lo sé", description: null, imageUrl: null },
    { key: "si_lo_se", label: "Sí, lo tengo", description: null, imageUrl: null },
  ],
  stepGroup: null,
  visibleIfQuestionKey: null,
  visibleIfValues: [],
  hiddenDefaultValue: null,
  defaultSource: null,
};

const NUMBER_QUESTION: WizardQuestion = {
  id: "avaluoFiscalPesos",
  key: "avaluoFiscalPesos",
  label: "Avalúo fiscal",
  type: "NUMBER",
  unit: "$",
  helpText: "Lo encuentras en tu Certificado de Avalúo Fiscal (gratis en sii.cl, con Clave Única o RUT).",
  options: [],
  stepGroup: null,
  visibleIfQuestionKey: null,
  visibleIfValues: [],
  hiddenDefaultValue: null,
  defaultSource: null,
};

// Tras guardar, pide el checklist ya filtrado con el caso actualizado —
// no depende de router.refresh()/re-render del server component para
// pasar de la compuerta al checklist en la misma pantalla (ver
// getDocumentChecklistAction). Elegir "No lo sé" también avanza al
// checklist (con avaluoFiscalPesos aún null) — los documentos cuyo
// dependeDe depende de ese dato simplemente quedan excluidos hasta que
// se complete más adelante, no bloquea el resto del checklist.
export function AvaluoFiscalGate({
  caseId,
  onDone,
}: {
  caseId: string;
  onDone: (documents: RegularizationDocumentItem[]) => void;
}) {
  const [isPending, startTransition] = useTransition();

  const handleAnswer = (values: Record<string, string | number>) => {
    const avaluoFiscalPesos =
      values["conoce-avaluo"] === "si_lo_se" ? Number(values.avaluoFiscalPesos) : null;
    startTransition(async () => {
      await updateAvaluoFiscalAction(caseId, avaluoFiscalPesos);
      const result = await getDocumentChecklistAction(caseId);
      onDone(result.documents ?? []);
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm p-5 sm:p-8">
      <div className="mb-6">
        <CollapsibleHelp label="¿Qué es el avalúo fiscal?" ariaLabel="Qué es el avalúo fiscal y dónde encontrarlo">
          <div className="grid gap-2 text-sm text-ink-muted">
            <p>
              Es el valor que el Servicio de Impuestos Internos (SII) le asigna a tu propiedad para
              efectos de contribuciones — no es lo mismo que el valor comercial o de venta. Es el
              avalúo que se usa para evaluar tu elegibilidad según la Ley 20.898.
            </p>
            <p>
              Puedes obtenerlo gratis en{" "}
              <a href="https://www.sii.cl" target="_blank" rel="noopener noreferrer" className="text-safety underline">
                sii.cl
              </a>
              , con tu Clave Única o RUT: entra a &ldquo;Avalúos y Contribuciones de Bienes Raíces&rdquo; →
              &ldquo;Consulta de Certificado de Avalúo Fiscal&rdquo; → busca tu propiedad por rol de avalúo o
              dirección.
            </p>
            <p>Si no lo tienes a mano ahora, no hay problema — puedes continuar y completarlo más adelante.</p>
          </div>
        </CollapsibleHelp>
      </div>
      <ConditionalRevealStep
        selectQuestion={SELECT_QUESTION}
        numberQuestion={NUMBER_QUESTION}
        initialValues={{}}
        onAnswer={handleAnswer}
      />
      {isPending && <p className="mt-4 text-sm text-ink-muted">Guardando...</p>}
    </div>
  );
}
