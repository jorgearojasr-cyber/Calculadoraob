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
  // input, con coma o punto decimal) — opcional: si no se pasan, el
  // resumen "Ingresaste: ..." simplemente no se muestra.
  primaryValue?: string;
  secondaryValue?: string;
  depthValue?: string;
  primaryUnit?: string;
  secondaryUnit?: string;
  depthUnit?: string;
}) {
  const rawId = useId();
  const markerId = `md-arrow-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;

  // Resumen en vivo arriba del diagrama, ej. "Ingresaste: 3,5 m × 2,8 m".
  // Se arma con los mismos campos que tiene el diagrama (2 o 3 según el
  // shape) — un guión para el que todavía no se ha llenado, para que el
  // resumen aparezca desde el primer campo y se complete en tiempo real.
  const formatPart = (raw: string | undefined, unit: string | undefined) => {
    if (!raw) return "—";
    const num = Number(raw.replace(",", "."));
    if (!Number.isFinite(num) || num <= 0) return "—";
    return unit ? `${formatQuantity(num)} ${unit}` : formatQuantity(num);
  };

  const summaryParts = [
    primaryValue !== undefined ? formatPart(primaryValue, primaryUnit) : null,
    secondaryLabel && secondaryValue !== undefined ? formatPart(secondaryValue, secondaryUnit) : null,
    depthLabel && depthValue !== undefined ? formatPart(depthValue, depthUnit) : null,
  ].filter((part): part is string => part !== null);

  const summary =
    summaryParts.length > 0 ? (
      <p className="text-xs font-mono text-ink-muted text-center mb-2">
        Ingresaste: {summaryParts.join(" × ")}
      </p>
    ) : null;

  const arrowDefs = (
    <marker
      id={markerId}
      viewBox="0 0 10 10"
      refX="5"
      refY="5"
      markerWidth="5"
      markerHeight="5"
      orient="auto-start-reverse"
    >
      <path d="M0,0 L10,5 L0,10 Z" className="fill-ink-faint" />
    </marker>
  );

  if (shape === "circle" || shape === "circle-with-depth") {
    const showCircleDepth = shape === "circle-with-depth" && depthLabel;
    return (
      <>
      {summary}
      <svg
        viewBox={showCircleDepth ? "0 0 300 140" : "0 0 220 140"}
        className={showCircleDepth ? "w-full max-w-[320px] mx-auto" : "w-full max-w-[220px] mx-auto"}
        aria-hidden="true"
      >
        <defs>{arrowDefs}</defs>
        <circle cx="110" cy="70" r="50" className="fill-concrete stroke-border" strokeWidth="2" />
        <line
          x1="60"
          y1="70"
          x2="160"
          y2="70"
          className="stroke-ink-faint"
          strokeWidth="1.5"
          markerStart={`url(#${markerId})`}
          markerEnd={`url(#${markerId})`}
        />
        <text x="110" y="62" textAnchor="middle" className="fill-ink-muted text-[11px] font-mono">
          {primaryLabel}
        </text>

        {/* Profundidad: corte lateral aparte, junto al círculo (vista en planta) */}
        {showCircleDepth && (
          <>
            <rect x="214" y="24" width="56" height="86" rx="2" className="fill-concrete stroke-border" strokeWidth="2" />
            <line x1="214" y1="24" x2="270" y2="24" className="stroke-border" strokeWidth="1.5" strokeDasharray="3 3" />
            <line
              x1="284"
              y1="24"
              x2="284"
              y2="110"
              className="stroke-ink-faint"
              strokeWidth="1.5"
              markerStart={`url(#${markerId})`}
              markerEnd={`url(#${markerId})`}
            />
            <text
              x="292"
              y="67"
              textAnchor="middle"
              className="fill-ink-muted text-[11px] font-mono"
              transform="rotate(-90 292 67)"
            >
              {depthLabel}
            </text>
          </>
        )}
      </svg>
      </>
    );
  }

  const showDepth = shape === "rectangle-with-depth" && depthLabel;

  return (
    <>
    {summary}
    <svg
      viewBox={showDepth ? "0 0 300 150" : "0 0 220 150"}
      className={showDepth ? "w-full max-w-[320px] mx-auto" : "w-full max-w-[240px] mx-auto"}
      aria-hidden="true"
    >
      <defs>{arrowDefs}</defs>

      {/* Rectángulo principal (vista en planta) */}
      <rect x="34" y="24" width="130" height="86" rx="2" className="fill-concrete stroke-border" strokeWidth="2" />

      {/* Flecha horizontal: medida principal */}
      <line
        x1="34"
        y1="124"
        x2="164"
        y2="124"
        className="stroke-ink-faint"
        strokeWidth="1.5"
        markerStart={`url(#${markerId})`}
        markerEnd={`url(#${markerId})`}
      />
      <text x="99" y="142" textAnchor="middle" className="fill-ink-muted text-[11px] font-mono">
        {primaryLabel}
      </text>

      {/* Flecha vertical: medida secundaria */}
      {secondaryLabel && (
        <>
          <line
            x1="20"
            y1="24"
            x2="20"
            y2="110"
            className="stroke-ink-faint"
            strokeWidth="1.5"
            markerStart={`url(#${markerId})`}
            markerEnd={`url(#${markerId})`}
          />
          <text
            x="12"
            y="67"
            textAnchor="middle"
            className="fill-ink-muted text-[11px] font-mono"
            transform="rotate(-90 12 67)"
          >
            {secondaryLabel}
          </text>
        </>
      )}

      {/* Profundidad: corte lateral aparte, para no forzar una 3ra dimensión en la misma vista en planta */}
      {showDepth && (
        <>
          <rect x="214" y="24" width="56" height="86" rx="2" className="fill-concrete stroke-border" strokeWidth="2" />
          <line x1="214" y1="24" x2="270" y2="24" className="stroke-border" strokeWidth="1.5" strokeDasharray="3 3" />
          <line
            x1="284"
            y1="24"
            x2="284"
            y2="110"
            className="stroke-ink-faint"
            strokeWidth="1.5"
            markerStart={`url(#${markerId})`}
            markerEnd={`url(#${markerId})`}
          />
          <text
            x="292"
            y="67"
            textAnchor="middle"
            className="fill-ink-muted text-[11px] font-mono"
            transform="rotate(-90 292 67)"
          >
            {depthLabel}
          </text>
        </>
      )}
    </svg>
    </>
  );
}
