"use client";

import { useState } from "react";
import { RegularizationWizard, type RegularizationWizardResult } from "./regularization-wizard";
import { RegularizationRulesList } from "./regularization-rules-list";
import type { RegularizationRuleResult } from "@/lib/regularization-rules";
import type { RegularizationWizardAnswers } from "./types";

// Panel persistente de resultados en la página del caso (diseño aprobado
// 2026-08-04) — antes de esto, las reglas solo existían efímeramente en
// el estado local de RegularizationEntry, justo después del wizard, y
// desaparecían para siempre al navegar a /regularizacion/[id]. Se
// recibe initialRules ya evaluado en el servidor (page.tsx), y se
// reemplaza con el resultado fresco que devuelve RegularizationWizard al
// terminar de editar — sin depender de revalidatePath/recarga para verlo
// en la misma pantalla (mismo patrón que RegularizationCaseView con la
// compuerta de avalúo).
export function RegularizationRulesView({
  caseId,
  initialAnswers,
  initialRules,
}: {
  caseId: string;
  initialAnswers: Required<RegularizationWizardAnswers>;
  initialRules: RegularizationRuleResult[];
}) {
  const [rules, setRules] = useState(initialRules);
  const [editing, setEditing] = useState(false);

  const handleComplete = (result: RegularizationWizardResult) => {
    setRules(result.rules);
    setEditing(false);
  };

  if (editing) {
    return <RegularizationWizard caseId={caseId} initialAnswers={initialAnswers} onComplete={handleComplete} />;
  }

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm p-5 sm:p-8">
      <div className="flex items-start justify-between gap-4 mb-2">
        <h2 className="font-display text-xl font-semibold tracking-tight">Evaluación preliminar</h2>
        <button
          onClick={() => setEditing(true)}
          className="rounded-full px-4 py-2 text-sm font-medium border border-border text-ink hover:border-ink transition-colors flex-shrink-0"
        >
          Editar datos
        </button>
      </div>
      <p className="text-sm text-ink-muted mb-6">
        Esta información es solo orientativa y no reemplaza la evaluación de un profesional ni de la
        Dirección de Obras Municipales.
      </p>

      <RegularizationRulesList rules={rules} />
    </div>
  );
}
