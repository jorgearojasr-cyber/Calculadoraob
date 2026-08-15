"use client";

import { FichaCheckbox, FichaCounter, FichaToggle } from "./ficha-fields";

// Fase 11B — ficha de Casa (docs/FASE11A_DISENO_INSPECCION_TECNICA_GUIADA.md,
// sección 3). Distingue campos que generan recintos (dormitorios, baños,
// living-comedor, bodega, antejardín, acceso vehicular) de características
// puramente informativas que esta etapa NO pregunta (cantidad de pisos,
// patio trasero — sin contenido de fuente, ver sección 3 🔴): cocina se
// incluye siempre sin preguntar, igual que en V1.
export type CasaFichaValue = {
  dormitorios: number;
  banos: number;
  livingComedor: "integrado" | "separado";
  bodega: boolean;
  antejardin: boolean;
  accesoVehicular: boolean;
};

export const CASA_FICHA_DEFAULT: CasaFichaValue = {
  dormitorios: 1,
  banos: 1,
  livingComedor: "integrado",
  bodega: false,
  antejardin: false,
  accesoVehicular: false,
};

// Traduce la ficha estructurada al mismo shape `{templateKey, count}` que
// ya consume createInspectionAndGenerateAction — el Server Action no
// cambia su forma de generar espacios, solo recibe una selección más
// guiada en el armado.
export function casaFichaToCounts(value: CasaFichaValue): Record<string, number> {
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
  if (value.antejardin) counts["antejardin"] = 1;
  if (value.accesoVehicular) counts["acceso-vehicular"] = 1;
  return counts;
}

export function CasaFichaStep({
  value,
  onChange,
}: {
  value: CasaFichaValue;
  onChange: (value: CasaFichaValue) => void;
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
        onChange={(livingComedor) => onChange({ ...value, livingComedor: livingComedor as CasaFichaValue["livingComedor"] })}
      />
      <FichaCheckbox
        label="Bodega"
        checked={value.bodega}
        onChange={(bodega) => onChange({ ...value, bodega })}
      />
      <FichaCheckbox
        label="Antejardín"
        checked={value.antejardin}
        onChange={(antejardin) => onChange({ ...value, antejardin })}
      />
      <FichaCheckbox
        label="Acceso vehicular"
        checked={value.accesoVehicular}
        onChange={(accesoVehicular) => onChange({ ...value, accesoVehicular })}
      />
    </div>
  );
}
