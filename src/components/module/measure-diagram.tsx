"use client";

import { useId } from "react";
import { formatQuantity } from "@/lib/format-number";

// Diagrama SVG simple para mostrar QUÉ medida se está pidiendo (no
// reemplaza el campo numérico). Generalizado a todos los grupos de
// exactamente 2 campos de medida — ver DIMENSION_DIAGRAMS en
// question-group-step.tsx.
export function MeasureDiagram({
  shape,
  primaryLabel,
  secondaryLabel,
  depthLabel,
  primaryValue,
  secondaryValue,
  depthValue,
  primaryUnit,
  secondaryUnit,
  depthUnit,
}: {
  shape: "rectangle" | "rectangle-with-depth" | "circle" | "circle-with-depth";
  primaryLabel: string;
  secondaryLabel?: string;
  depthLabel?: string;
  // Valores en vivo de los campos numéricos asociados (string crudo del
  // input, con coma o punto decimal) — opcional: si no se pasan, el borde
  // simplemente muestra la etiqueta genérica en vez del valor.
  primaryValue?: string;
  secondaryValue?: string;
  depthValue?: string;
  primaryUnit?: string;
  secondaryUnit?: string;
  depthUnit?: string;
}) {
  const rawId = useId();
  const cleanId = rawId.replace(/[^a-zA-Z0-9]/g, "");
  const markerId = `md-arrow-${cleanId}`;
  const patternId = `md-hatch-${cleanId}`;

  // Texto de cada borde: mientras no se haya escrito un valor válido se
  // muestra la etiqueta genérica ("largo"/"ancho"); apenas hay un número
  // válido, se reemplaza por el valor real + unidad, en vivo.
  const borderText = (label: string, raw: string | undefined, unit: string | undefined) => {
    if (!raw) return label;
    const num = Number(raw.replace(",", "."));
    if (!Number.isFinite(num) || num <= 0) return label;
    return unit ? `${formatQuantity(num)} ${unit}` : formatQuantity(num);
  };

  const fillDefs = (
    <>
      <marker
        id={markerId}
        viewBox="0 0 10 10"
        refX="5"
        refY="5"
        markerWidth="5"
        markerHeight="5"
        orient="auto-start-reverse"
      >
        <path d="M0,0 L10,5 L0,10 Z" className="fill-navy" />
      </marker>
      <pattern id={patternId} width="7" height="7" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
        <rect width="7" height="7" fill="#00215210" />
        <line x1="0" y1="0" x2="0" y2="7" stroke="#002152" strokeOpacity="0.3" strokeWidth="1.5" />
      </pattern>
    </>
  );

  if (shape === "circle" || shape === "circle-with-depth") {
    const showCircleDepth = shape === "circle-with-depth" && depthLabel;
    return (
      <svg
        viewBox={showCircleDepth ? "0 0 300 140" : "0 0 220 140"}
        className={showCircleDepth ? "w-full max-w-[320px] mx-auto" : "w-full max-w-[220px] mx-auto"}
        aria-hidden="true"
      >
        <defs>{fillDefs}</defs>
        <circle cx="110" cy="70" r="50" fill={`url(#${patternId})`} className="stroke-navy" strokeWidth="2" />
        <line
          x1="60"
          y1="70"
          x2="160"
          y2="70"
          className="stroke-navy"
          strokeWidth="1.5"
          markerStart={`url(#${markerId})`}
          markerEnd={`url(#${markerId})`}
        />
        <text x="110" y="62" textAnchor="middle" className="fill-navy text-sm font-mono font-semibold">
          {borderText(primaryLabel, primaryValue, primaryUnit)}
        </text>

        {/* Profundidad: corte lateral aparte, junto al círculo (vista en planta) */}
        {showCircleDepth && (
          <>
            <rect x="214" y="24" width="56" height="86" rx="2" fill={`url(#${patternId})`} className="stroke-navy" strokeWidth="2" />
            <line x1="214" y1="24" x2="270" y2="24" className="stroke-navy/40" strokeWidth="1.5" strokeDasharray="3 3" />
            <line
              x1="284"
              y1="24"
              x2="284"
              y2="110"
              className="stroke-navy"
              strokeWidth="1.5"
              markerStart={`url(#${markerId})`}
              markerEnd={`url(#${markerId})`}
            />
            <text
              x="292"
              y="67"
              textAnchor="middle"
              className="fill-navy text-sm font-mono font-semibold"
              transform="rotate(-90 292 67)"
            >
              {borderText(depthLabel, depthValue, depthUnit)}
            </text>
          </>
        )}
      </svg>
    );
  }

  const showDepth = shape === "rectangle-with-depth" && depthLabel;

  return (
    <svg
      viewBox={showDepth ? "0 0 300 150" : "0 0 220 150"}
      className={showDepth ? "w-full max-w-[320px] mx-auto" : "w-full max-w-[240px] mx-auto"}
      aria-hidden="true"
    >
      <defs>{fillDefs}</defs>

      {/* Rectángulo principal (vista en planta) */}
      <rect x="34" y="24" width="130" height="86" rx="2" fill={`url(#${patternId})`} className="stroke-navy" strokeWidth="2" />

      {/* Flecha horizontal: medida principal */}
      <line
        x1="34"
        y1="124"
        x2="164"
        y2="124"
        className="stroke-navy"
        strokeWidth="1.5"
        markerStart={`url(#${markerId})`}
        markerEnd={`url(#${markerId})`}
      />
      <text x="99" y="142" textAnchor="middle" className="fill-navy text-sm font-mono font-semibold">
        {borderText(primaryLabel, primaryValue, primaryUnit)}
      </text>

      {/* Flecha vertical: medida secundaria */}
      {secondaryLabel && (
        <>
          <line
            x1="20"
            y1="24"
            x2="20"
            y2="110"
            className="stroke-navy"
            strokeWidth="1.5"
            markerStart={`url(#${markerId})`}
            markerEnd={`url(#${markerId})`}
          />
          <text
            x="12"
            y="67"
            textAnchor="middle"
            className="fill-navy text-sm font-mono font-semibold"
            transform="rotate(-90 12 67)"
          >
            {borderText(secondaryLabel, secondaryValue, secondaryUnit)}
          </text>
        </>
      )}

      {/* Profundidad: corte lateral aparte, para no forzar una 3ra dimensión en la misma vista en planta */}
      {showDepth && (
        <>
          <rect x="214" y="24" width="56" height="86" rx="2" fill={`url(#${patternId})`} className="stroke-navy" strokeWidth="2" />
          <line x1="214" y1="24" x2="270" y2="24" className="stroke-navy/40" strokeWidth="1.5" strokeDasharray="3 3" />
          <line
            x1="284"
            y1="24"
            x2="284"
            y2="110"
            className="stroke-navy"
            strokeWidth="1.5"
            markerStart={`url(#${markerId})`}
            markerEnd={`url(#${markerId})`}
          />
          <text
            x="292"
            y="67"
            textAnchor="middle"
            className="fill-navy text-sm font-mono font-semibold"
            transform="rotate(-90 292 67)"
          >
            {borderText(depthLabel, depthValue, depthUnit)}
          </text>
        </>
      )}
    </svg>
  );
}
