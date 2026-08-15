"use client";

import { FichaCheckbox, FichaCounter } from "./ficha-fields";
import type { InspectionTipoAmpliacion } from "@/generated/prisma/client";

// Fase 11B — ficha de Ampliación (docs/FASE11A_DISENO_INSPECCION_TECNICA_GUIADA.md,
// sección 5). Los 7 tipos reutilizan exactamente los recintos/partidas ya
// definidos para Casa/Departamento/genérico — ninguno inventa una partida
// nueva. "Otro" preserva el comportamiento genérico de V1 (contador
// repetible de "Recinto ampliado") sin cambios.
const TIPO_OPTIONS: { value: InspectionTipoAmpliacion; label: string }[] = [
  { value: "COCINA", label: "Cocina" },
  { value: "DORMITORIO", label: "Dormitorio" },
  { value: "DORMITORIO_BANO", label: "Dormitorio con baño" },
  { value: "LIVING_COMEDOR", label: "Living-comedor" },
  { value: "SEGUNDO_PISO", label: "Segundo piso" },
  { value: "TERRAZA_CERRADA", label: "Terraza cerrada" },
  { value: "OTRO", label: "Otro" },
];

export type AmpliacionFichaValue = {
  tipo: InspectionTipoAmpliacion;
  dormitorios: number;
  banos: number;
  incluyeLivingComedor: boolean;
  incluyeCocina: boolean;
  otroCantidad: number;
};

export const AMPLIACION_FICHA_DEFAULT: AmpliacionFichaValue = {
  tipo: "DORMITORIO",
  dormitorios: 1,
  banos: 1,
  incluyeLivingComedor: false,
  incluyeCocina: false,
  otroCantidad: 1,
};

export function ampliacionFichaToCounts(value: AmpliacionFichaValue): Record<string, number> {
  switch (value.tipo) {
    case "COCINA":
      return { cocina: 1 };
    case "DORMITORIO":
      return { dormitorio: value.dormitorios };
    case "DORMITORIO_BANO":
      return { dormitorio: value.dormitorios, bano: value.banos };
    case "LIVING_COMEDOR":
      return { "living-comedor": 1 };
    case "SEGUNDO_PISO": {
      const counts: Record<string, number> = { dormitorio: value.dormitorios, bano: value.banos };
      if (value.incluyeLivingComedor) counts["living-comedor"] = 1;
      if (value.incluyeCocina) counts["cocina"] = 1;
      return counts;
    }
    case "TERRAZA_CERRADA":
      return { "terraza-cerrada": 1 };
    case "OTRO":
      return { "recinto-ampliado": value.otroCantidad };
    default:
      return {};
  }
}

export function AmpliacionFichaStep({
  value,
  onChange,
}: {
  value: AmpliacionFichaValue;
  onChange: (value: AmpliacionFichaValue) => void;
}) {
  return (
    <div className="grid gap-5">
      <div className="grid gap-3">
        {TIPO_OPTIONS.map((option) => {
          const selected = value.tipo === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange({ ...value, tipo: option.value })}
              aria-pressed={selected}
              className={`text-left rounded-xl px-5 py-4 border transition-colors font-medium text-[15px] ${
                selected ? "border-safety bg-safety-tint" : "border-border bg-white hover:border-ink"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {value.tipo === "DORMITORIO" && (
        <FichaCounter
          label="Dormitorios"
          value={value.dormitorios}
          min={1}
          onChange={(dormitorios) => onChange({ ...value, dormitorios })}
        />
      )}

      {value.tipo === "DORMITORIO_BANO" && (
        <div className="grid gap-3">
          <FichaCounter
            label="Dormitorios"
            value={value.dormitorios}
            min={1}
            onChange={(dormitorios) => onChange({ ...value, dormitorios })}
          />
          <FichaCounter
            label="Baños"
            value={value.banos}
            min={1}
            onChange={(banos) => onChange({ ...value, banos })}
          />
        </div>
      )}

      {value.tipo === "SEGUNDO_PISO" && (
        <div className="grid gap-3">
          <FichaCounter
            label="Dormitorios"
            value={value.dormitorios}
            min={1}
            onChange={(dormitorios) => onChange({ ...value, dormitorios })}
          />
          <FichaCounter
            label="Baños"
            value={value.banos}
            min={1}
            onChange={(banos) => onChange({ ...value, banos })}
          />
          <FichaCheckbox
            label="Incluye living-comedor"
            checked={value.incluyeLivingComedor}
            onChange={(incluyeLivingComedor) => onChange({ ...value, incluyeLivingComedor })}
          />
          <FichaCheckbox
            label="Incluye cocina"
            checked={value.incluyeCocina}
            onChange={(incluyeCocina) => onChange({ ...value, incluyeCocina })}
          />
        </div>
      )}

      {value.tipo === "OTRO" && (
        <FichaCounter
          label="Recintos ampliados"
          value={value.otroCantidad}
          min={1}
          onChange={(otroCantidad) => onChange({ ...value, otroCantidad })}
        />
      )}
    </div>
  );
}
