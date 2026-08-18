"use client";

import { useState, useTransition } from "react";
import { FichaToggle } from "./ficha-fields";
import { saveSpaceLevel2ConfigAction, type SpaceLevel2Answer } from "@/app/(app)/inspecciones/[id]/actions";
import {
  resolveComponentState,
  type SpaceConfigJson,
  type SpaceConfigurableComponent,
} from "@/lib/inspecciones/space-config";

const FOCUS_RING =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action";

// Fase 11Y — bloque de configuración Nivel 2, reutilizado en 2 modos:
// "onboarding" (bloquea el checklist hasta responder, primera vez que se
// entra al recinto) y "edit" (panel opcional para cambiar una respuesta
// ya guardada — sección 13 de la fase, "no volver a bloquear"). Misma UI,
// mismo componente: la diferencia la maneja el padre (SpaceLevel2Gate),
// no este archivo.
export function SpaceLevel2Panel({
  mode,
  spaceId,
  components,
  config,
  existingElementKeys,
  onSaved,
  onCancel,
}: {
  mode: "onboarding" | "edit";
  spaceId: string;
  components: SpaceConfigurableComponent[];
  config: SpaceConfigJson;
  existingElementKeys: string[];
  onSaved: (config: SpaceConfigJson) => void;
  onCancel?: () => void;
}) {
  const existingSet = new Set(existingElementKeys);
  const [answers, setAnswers] = useState<Record<string, boolean | undefined>>(() => {
    const initial: Record<string, boolean | undefined> = {};
    for (const c of components) {
      initial[c.componentKey] = resolveComponentState(config, c.componentKey, existingSet.has(c.componentKey));
    }
    return initial;
  });
  const [meta, setMeta] = useState<Record<string, Record<string, string>>>(() => ({ ...(config.componentMeta ?? {}) }));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const allAnswered = components.every((c) => answers[c.componentKey] !== undefined);

  function submit(confirmedComponentKeys: string[] = []) {
    setError(null);
    const payload: SpaceLevel2Answer[] = components
      .filter((c) => answers[c.componentKey] !== undefined)
      .map((c) => ({
        componentKey: c.componentKey,
        present: answers[c.componentKey] === true,
        meta: answers[c.componentKey] === true ? meta[c.componentKey] : undefined,
      }));

    startTransition(async () => {
      const result = await saveSpaceLevel2ConfigAction(spaceId, payload, confirmedComponentKeys);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.requiresConfirmation) {
        const ok = window.confirm(result.message);
        if (ok) submit(result.components);
        return;
      }
      if (result.config) onSaved(result.config);
    });
  }

  return (
    <div className="rounded-2xl p-5 bg-white border border-border grid gap-5">
      {mode === "onboarding" && (
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-ink-muted mb-1">Antes de revisar este espacio</p>
          <p className="text-sm text-ink-muted">Cuéntanos qué tiene este recinto para armar el listado correcto.</p>
        </div>
      )}

      <div className="grid gap-4">
        {components.map((c) => {
          const value = answers[c.componentKey];
          const stringValue = value === undefined ? "" : value ? "si" : "no";
          return (
            <div key={c.componentKey} className="grid gap-3">
              <FichaToggle
                label={c.question}
                value={stringValue}
                options={[
                  { value: "si", label: "Sí" },
                  { value: "no", label: "No" },
                ]}
                onChange={(v) => setAnswers((prev) => ({ ...prev, [c.componentKey]: v === "si" }))}
              />
              {value === true &&
                c.metaOptions?.map((opt) => (
                  <FichaToggle
                    key={opt.key}
                    label={opt.label}
                    value={meta[c.componentKey]?.[opt.key] ?? ""}
                    options={opt.options}
                    onChange={(v) =>
                      setMeta((prev) => ({ ...prev, [c.componentKey]: { ...(prev[c.componentKey] ?? {}), [opt.key]: v } }))
                    }
                  />
                ))}
            </div>
          );
        })}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => submit()}
          disabled={!allAnswered || pending}
          className={`min-h-11 inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold text-white bg-action disabled:opacity-40 disabled:cursor-not-allowed ${FOCUS_RING}`}
        >
          {pending ? "Guardando…" : mode === "onboarding" ? "Continuar" : "Guardar"}
        </button>
        {mode === "edit" && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className={`min-h-11 inline-flex items-center px-4 py-2.5 text-sm font-medium text-ink-muted hover:text-ink ${FOCUS_RING}`}
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
}
