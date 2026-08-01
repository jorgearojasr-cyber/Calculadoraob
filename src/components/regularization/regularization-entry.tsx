"use client";

import { useState } from "react";
import { RegularizationWizard, type RegularizationWizardResult } from "./regularization-wizard";

// Pantalla de resultados es deliberadamente mínima en 2A — solo muestra
// los mensajes de las reglas que aplicaron. La pantalla real (checklist,
// documentos, croquis) es 2B en adelante. Sin punto de entrada público
// todavía (ver decisión de despliegue, Opción C, 2026-08-01) — esta ruta
// existe mientras se construye el resto del módulo, sin ningún link desde
// la navegación.
export function RegularizationEntry() {
  const [result, setResult] = useState<RegularizationWizardResult | null>(null);

  if (result) {
    return (
      <div className="bg-white rounded-2xl border border-border shadow-sm p-5 sm:p-8">
        <h2 className="font-display text-xl font-semibold tracking-tight mb-2">
          Evaluación preliminar
        </h2>
        <p className="text-sm text-ink-muted mb-6">
          Esta información es solo orientativa y no reemplaza la evaluación de un profesional ni de
          la Dirección de Obras Municipales.
        </p>
        {result.rules.length === 0 ? (
          <p className="text-sm text-ink-muted">No hay observaciones adicionales para este caso.</p>
        ) : (
          <div className="grid gap-3">
            {result.rules.map((rule) => (
              <div key={rule.label} className="rounded-xl px-4 py-3 bg-concrete">
                <p className="text-sm font-semibold text-ink mb-1">{rule.label}</p>
                <p className="text-sm text-ink-muted">{rule.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return <RegularizationWizard onComplete={setResult} />;
}
