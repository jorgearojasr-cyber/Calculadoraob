"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { WizardHeader } from "@/components/module/wizard-header";
import { MotivoSelector } from "./motivo-selector";
import { PropertyTypeSelector } from "./property-type-selector";
import { CasaFichaStep, CASA_FICHA_DEFAULT, casaFichaToCounts, type CasaFichaValue } from "./casa-ficha-step";
import {
  DepartamentoFichaStep,
  DEPARTAMENTO_FICHA_DEFAULT,
  departamentoFichaToCounts,
  type DepartamentoFichaValue,
} from "./departamento-ficha-step";
import {
  AmpliacionFichaStep,
  AMPLIACION_FICHA_DEFAULT,
  ampliacionFichaToCounts,
  type AmpliacionFichaValue,
} from "./ampliacion-ficha-step";
import { createInspectionAndGenerateAction } from "@/app/(app)/inspecciones/actions";
import type { InspectionMotivo, InspectionPropertyType } from "@/generated/prisma/client";

// Fase 11B — nuevo flujo: Motivo → Tipo de inmueble → Ficha específica →
// Datos (docs/FASE11A_DISENO_INSPECCION_TECNICA_GUIADA.md, sección 1/2).
// Cuando motivo=REVISION_AMPLIACION el tipo queda fijo en AMPLIACION y el
// paso de Tipo se salta, por eso el total de pasos varía (4 vs 5).
type Step = "motivo" | "tipo" | "ficha" | "datos";

export function NewInspectionForm() {
  const router = useRouter();
  const [motivo, setMotivo] = useState<InspectionMotivo | null>(null);
  const [tipoInmueble, setTipoInmueble] = useState<InspectionPropertyType | null>(null);
  const [casaFicha, setCasaFicha] = useState<CasaFichaValue>(CASA_FICHA_DEFAULT);
  const [depaFicha, setDepaFicha] = useState<DepartamentoFichaValue>(DEPARTAMENTO_FICHA_DEFAULT);
  const [ampliacionFicha, setAmpliacionFicha] = useState<AmpliacionFichaValue>(AMPLIACION_FICHA_DEFAULT);
  const [name, setName] = useState("");
  const [direccion, setDireccion] = useState("");
  const [fecha, setFecha] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const steps: Step[] = useMemo(
    () => (motivo === "REVISION_AMPLIACION" ? ["motivo", "ficha", "datos"] : ["motivo", "tipo", "ficha", "datos"]),
    [motivo]
  );
  const [stepIndex, setStepIndex] = useState(0);
  const step = steps[stepIndex];

  const goBack = () => setStepIndex((i) => Math.max(0, i - 1));
  const goNext = () => setStepIndex((i) => Math.min(steps.length - 1, i + 1));

  const handleMotivo = (value: InspectionMotivo) => {
    setMotivo(value);
    if (value === "REVISION_AMPLIACION") {
      setTipoInmueble("AMPLIACION");
    } else {
      setTipoInmueble(null);
    }
    setStepIndex(1);
  };

  const handleTipo = (value: InspectionPropertyType) => {
    setTipoInmueble(value);
    goNext();
  };

  const handleSubmit = () => {
    if (!tipoInmueble) return;
    if (!name.trim()) {
      setError("Ingresa un nombre o referencia para la inspección.");
      return;
    }
    setError(null);

    const counts =
      tipoInmueble === "CASA"
        ? casaFichaToCounts(casaFicha)
        : tipoInmueble === "DEPARTAMENTO"
          ? departamentoFichaToCounts(depaFicha)
          : ampliacionFichaToCounts(ampliacionFicha);

    startTransition(async () => {
      const result = await createInspectionAndGenerateAction({
        name,
        tipoInmueble,
        direccion: direccion.trim() || null,
        fecha: fecha || null,
        motivo,
        tipoAmpliacion: tipoInmueble === "AMPLIACION" ? ampliacionFicha.tipo : null,
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
        step={{ index: stepIndex, total: steps.length }}
        back={stepIndex === 0 ? { label: "Inicio", href: "/inspecciones" } : { label: "Atrás", onClick: goBack }}
      />

      {step === "motivo" && (
        <div>
          <h2 className="font-display text-[19px] font-semibold tracking-tight mb-2">¿Cuál es el motivo de esta inspección?</h2>
          <p className="text-sm text-ink-muted mb-6">Esto ayuda a dar el tono correcto al informe final.</p>
          <MotivoSelector value={motivo} onSelect={handleMotivo} />
        </div>
      )}

      {step === "tipo" && (
        <div>
          <h2 className="font-display text-[19px] font-semibold tracking-tight mb-6">¿Qué vas a inspeccionar?</h2>
          <PropertyTypeSelector value={tipoInmueble} onSelect={handleTipo} allow={["CASA", "DEPARTAMENTO"]} />
        </div>
      )}

      {step === "ficha" && tipoInmueble && (
        <div>
          <h2 className="font-display text-[19px] font-semibold tracking-tight mb-2">Características del inmueble</h2>
          <p className="text-sm text-ink-muted mb-6">
            Cuéntanos cómo está distribuido para armar el listado de revisión.
          </p>
          {tipoInmueble === "CASA" && <CasaFichaStep value={casaFicha} onChange={setCasaFicha} />}
          {tipoInmueble === "DEPARTAMENTO" && (
            <DepartamentoFichaStep value={depaFicha} onChange={setDepaFicha} />
          )}
          {tipoInmueble === "AMPLIACION" && (
            <AmpliacionFichaStep value={ampliacionFicha} onChange={setAmpliacionFicha} />
          )}
          <button
            type="button"
            onClick={goNext}
            className="mt-6 rounded-full px-6 py-3 text-sm font-semibold text-white flex items-center gap-2 bg-action"
          >
            Siguiente
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {step === "datos" && (
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
