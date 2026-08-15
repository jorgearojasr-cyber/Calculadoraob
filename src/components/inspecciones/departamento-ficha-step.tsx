"use client";

import { FichaCheckbox, FichaCounter, FichaToggle } from "./ficha-fields";

// Fase 11B — ficha de Departamento (docs/FASE11A_DISENO_INSPECCION_TECNICA_GUIADA.md,
// sección 4). Igual criterio que Casa: piso/torre es informativo y NO se
// pregunta en esta etapa (sin consumidor funcional todavía); cocina se
// incluye siempre sin preguntar.
export type DepartamentoFichaValue = {
  dormitorios: number;
  banos: number;
  livingComedor: "integrado" | "separado";
  bodega: boolean;
  estacionamiento: boolean;
  terrazaLogia: boolean;
};

export const DEPARTAMENTO_FICHA_DEFAULT: DepartamentoFichaValue = {
  dormitorios: 1,
  banos: 1,
  livingComedor: "integrado",
  bodega: false,
  estacionamiento: false,
  terrazaLogia: false,
};

export function departamentoFichaToCounts(value: DepartamentoFichaValue): Record<string, number> {
  const counts: Record<string, number> = {
    cocina: 1,
    dormitorio: value.dormitorios,
    bano: value.banos,
  };
  if (value.livingComedor === "integrado") {
    counts["living-comedor"] = 1;
  } else {
    counts["living"] = 1;
    counts["comedor"] = 1;
  }
  if (value.bodega) counts["bodega"] = 1;
  if (value.estacionamiento) counts["estacionamiento"] = 1;
  if (value.terrazaLogia) counts["terraza-logia"] = 1;
  return counts;
}

export function DepartamentoFichaStep({
  value,
  onChange,
}: {
  value: DepartamentoFichaValue;
  onChange: (value: DepartamentoFichaValue) => void;
}) {
  return (
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
      <FichaToggle
        label="Living y comedor"
        value={value.livingComedor}
        options={[
          { value: "integrado", label: "Integrados" },
          { value: "separado", label: "Separados" },
        ]}
        onChange={(livingComedor) =>
          onChange({ ...value, livingComedor: livingComedor as DepartamentoFichaValue["livingComedor"] })
        }
      />
      <FichaCheckbox
        label="Bodega"
        checked={value.bodega}
        onChange={(bodega) => onChange({ ...value, bodega })}
      />
      <FichaCheckbox
        label="Estacionamiento"
        checked={value.estacionamiento}
        onChange={(estacionamiento) => onChange({ ...value, estacionamiento })}
      />
      <FichaCheckbox
        label="Terraza o logia"
        checked={value.terrazaLogia}
        onChange={(terrazaLogia) => onChange({ ...value, terrazaLogia })}
      />
    </div>
  );
}
