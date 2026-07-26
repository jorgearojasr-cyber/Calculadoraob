"use client";

import { useId } from "react";

// Diagrama SVG simple para mostrar QUÉ medida se está pidiendo (no
// reemplaza el campo numérico). Generalizado a todos los grupos de
// exactamente 2 campos de medida — ver DIMENSION_DIAGRAMS en
// question-group-step.tsx.
export function MeasureDiagram({
  shape,
  primaryLabel,
  secondaryLabel,
  depthLabel,
}: {
  shape: "rectangle" | "rectangle-with-depth" | "circle" | "circle-with-depth";
  primaryLabel: string;
  secondaryLabel?: string;
  depthLabel?: string;
}) {
  const rawId = useId();
  const markerId = `md-arrow-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;

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
    );
  }

  const showDepth = shape === "rectangle-with-depth" && depthLabel;

  return (
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
  );
}
