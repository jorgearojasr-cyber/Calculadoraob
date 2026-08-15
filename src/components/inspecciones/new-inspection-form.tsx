"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { WizardHeader } from "@/components/module/wizard-header";
import { PropertyTypeSelector } from "./property-type-selector";
import { SpaceSelectionStep } from "./space-selection-step";
import { createInspectionAndGenerateAction } from "@/app/(app)/inspecciones/actions";
import type { InspectionPropertyType, InspectionSpaceTemplate } from "@/generated/prisma/client";

const STEP_COUNT = 3;

export function NewInspectionForm({ spaceTemplates }: { spaceTemplates: InspectionSpaceTemplate[] }) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [tipoInmueble, setTipoInmueble] = useState<InspectionPropertyType | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [name, setName] = useState("");
  const [direccion, setDireccion] = useState("");
  const [fecha, setFecha] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const templatesForType = useMemo(
    () => (tipoInmueble ? spaceTemplates.filter((t) => t.appliesTo.includes(tipoInmueble)) : []),
    [spaceTemplates, tipoInmueble]
  );
  const totalSelected = Object.values(counts).reduce((acc, n) => acc + n, 0);

  const goBack = () => setStepIndex((i) => Math.max(0, i - 1));

  const handleTipo = (value: InspectionPropertyType) => {
    setTipoInmueble(value);
    setCounts({});
    setStepIndex(1);
  };

  const handleCountChange = (templateKey: string, count: number) => {
    setCounts((prev) => ({ ...prev, [templateKey]: count }));
  };

  const handleSubmit = () => {
    if (!tipoInmueble) return;
    if (!name.trim()) {
      setError("Ingresa un nombre o referencia para la inspección.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await createInspectionAndGenerateAction({
        name,
        tipoInmueble,
        direccion: direccion.trim() || null,
        fecha: fecha || null,
        spaceSelections: Object.entries(counts).map(([templateKey, count]) => ({ templateKey, count })),
      });
      if (!result.caseId) {
        setError(result.error ?? "No se pudo crear la inspección.");
        return;
      }
      router.push(`/inspecciones/${result.caseId}`);
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm p-5 sm:p-8">
      <WizardHeader
        moduleName="Inspecciones"
        step={{ index: stepIndex, total: STEP_COUNT }}
        back={stepIndex === 0 ? { label: "Inicio", href: "/inspecciones" } : { label: "Atrás", onClick: goBack }}
      />

      {stepIndex === 0 && (
        <div>
          <h2 className="font-display text-[19px] font-semibold tracking-tight mb-6">¿Qué vas a inspeccionar?</h2>
          <PropertyTypeSelector value={tipoInmueble} onSelect={handleTipo} />
        </div>
      )}

      {stepIndex === 1 && (
        <div>
          <h2 className="font-display text-[19px] font-semibold tracking-tight mb-2">Características del inmueble</h2>
          <p className="text-sm text-ink-muted mb-6">Elige los espacios que quieres incluir en esta inspección.</p>
          <SpaceSelectionStep templates={templatesForType} counts={counts} onChange={handleCountChange} />
          {templatesForType.length > 0 && (
            <button
              type="button"
              onClick={() => setStepIndex(2)}
              disabled={totalSelected === 0}
              className="mt-6 rounded-full px-6 py-3 text-sm font-semibold text-white flex items-center gap-2 bg-action disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Siguiente
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {stepIndex === 2 && (
        <div>
          <h2 className="font-display text-[19px] font-semibold tracking-tight mb-6">Datos de la inspección</h2>
          <div className="grid gap-4">
            <label className="grid gap-1.5">
              <span className="text-sm font-medium">Nombre o referencia</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Casa Los Aromos 123"
                className="rounded-2xl px-5 py-4 bg-white border-[1.5px] border-ink outline-none text-[15px] focus-within:ring-2 focus-within:ring-action/70"
              />
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm font-medium">Dirección (opcional)</span>
              <input
                type="text"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                className="rounded-2xl px-5 py-4 bg-white border-[1.5px] border-ink outline-none text-[15px]"
              />
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm font-medium">Fecha (opcional)</span>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="rounded-2xl px-5 py-4 bg-white border-[1.5px] border-ink outline-none text-[15px]"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="mt-6 rounded-full px-6 py-3 text-sm font-semibold text-white flex items-center gap-2 bg-action disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {isPending ? "Creando…" : "Crear inspección"}
            {!isPending && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      )}

      {error && <p className="mt-4 text-sm text-safety">{error}</p>}
    </div>
  );
}
