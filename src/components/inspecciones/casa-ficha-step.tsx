"use client";

import { FichaCheckbox, FichaCounter, FichaToggle } from "./ficha-fields";

// Fase 11B — ficha de Casa (docs/FASE11A_DISENO_INSPECCION_TECNICA_GUIADA.md,
// sección 3). Distingue campos que generan recintos (dormitorios, baños,
// living-comedor, bodega, antejardín, acceso vehicular) de características
// puramente informativas que esta etapa NO pregunta (cantidad de pisos —
// ver docs/FASE11W_CIERRE_ARQUITECTURA_FICHA_INSPECCION.md, sección M):
// cocina se incluye siempre sin preguntar, igual que en V1.
// Fase 11X (docs/FASE11X_INFORME_..., NIVEL 1 únicamente) — agrega Patio
// trasero, Terraza y Logia/Lavandería como checkboxes independientes,
// exactamente el mismo patrón que Bodega/Antejardín/Acceso vehicular.
// Reja/Portón NO se agregan acá a propósito — quedan en Nivel 2
// (Configuración del recinto), todavía sin implementar (deuda
// transitoria documentada, sección V del informe).
export type CasaFichaValue = {
  dormitorios: number;
  banos: number;
  livingComedor: "integrado" | "separado";
  bodega: boolean;
  antejardin: boolean;
  patioTrasero: boolean;
  terraza: boolean;
  logiaLavanderia: boolean;
  accesoVehicular: boolean;
};

export const CASA_FICHA_DEFAULT: CasaFichaValue = {
  dormitorios: 1,
  banos: 1,
  livingComedor: "integrado",
  bodega: false,
  antejardin: false,
  patioTrasero: false,
  terraza: false,
  logiaLavanderia: false,
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
  if (value.patioTrasero) counts["patio-trasero"] = 1;
  if (value.terraza) counts["terraza"] = 1;
  if (value.logiaLavanderia) counts["logia-lavanderia"] = 1;
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
        label="Patio trasero"
        checked={value.patioTrasero}
        onChange={(patioTrasero) => onChange({ ...value, patioTrasero })}
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
      <FichaCheckbox
        label="Acceso vehicular"
        checked={value.accesoVehicular}
        onChange={(accesoVehicular) => onChange({ ...value, accesoVehicular })}
      />
    </div>
  );
}
