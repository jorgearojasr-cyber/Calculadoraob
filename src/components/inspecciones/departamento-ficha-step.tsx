"use client";

import { FichaCheckbox, FichaCounter, FichaToggle } from "./ficha-fields";

// Fase 11B — ficha de Departamento (docs/FASE11A_DISENO_INSPECCION_TECNICA_GUIADA.md,
// sección 4). Igual criterio que Casa: piso/torre es informativo y NO se
// pregunta en esta etapa (sin consumidor funcional todavía); cocina se
// incluye siempre sin preguntar.
// Fase 11X (docs/FASE11X_INFORME_..., sección F) — el antiguo checkbox
// combinado "Terraza/Logia" se reemplaza para casos NUEVOS por 2
// checkboxes independientes (Terraza / Logia-Lavandería), selección NO
// excluyente (el usuario puede marcar ninguna, una o ambas). El template
// histórico `terraza-logia` sigue existiendo en catálogo (Fase 11W
// sección G/J, 🟢 separar) — solo deja de ofrecerse en este formulario.
export type DepartamentoFichaValue = {
  dormitorios: number;
  banos: number;
  livingComedor: "integrado" | "separado";
  bodega: boolean;
  estacionamiento: boolean;
  terraza: boolean;
  logiaLavanderia: boolean;
};

export const DEPARTAMENTO_FICHA_DEFAULT: DepartamentoFichaValue = {
  dormitorios: 1,
  banos: 1,
  livingComedor: "integrado",
  bodega: false,
  estacionamiento: false,
  terraza: false,
  logiaLavanderia: false,
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
  if (value.terraza) counts["terraza"] = 1;
  if (value.logiaLavanderia) counts["logia-lavanderia"] = 1;
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
        label="Terraza"
        checked={value.terraza}
        onChange={(terraza) => onChange({ ...value, terraza })}
      />
      <FichaCheckbox
        label="Logia / Lavandería"
        checked={value.logiaLavanderia}
        onChange={(logiaLavanderia) => onChange({ ...value, logiaLavanderia })}
      />
    </div>
  );
}
