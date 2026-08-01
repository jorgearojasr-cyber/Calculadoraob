"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { saveSketchAction } from "@/app/(app)/regularizacion/[id]/actions";
import { STALE_SESSION_ERROR, STALE_SESSION_MESSAGE } from "@/lib/stale-session";
import {
  SKETCH_DISCLAIMER,
  SKETCH_GRID_SIZE,
  SKETCH_DATA_VERSION,
  elementsToPrimitives,
  type SketchData,
  type SketchElement,
} from "@/lib/regularization-sketch";

type Mode = "select" | "wall" | "door" | "window" | "dimension" | "text";

const MODE_LABELS: Record<Mode, string> = {
  select: "Seleccionar",
  wall: "Muro",
  door: "Puerta",
  window: "Ventana",
  dimension: "Cota",
  text: "Texto",
};

const MODE_HINTS: Record<Mode, string> = {
  select: "Hacé clic en un elemento para seleccionarlo. Arrastrá una puerta/ventana para moverla sobre su eje.",
  wall: "Hacé clic para el primer punto, clic de nuevo para cerrar el muro. Podés seguir encadenando muros.",
  door: "Hacé clic donde va la puerta.",
  window: "Hacé clic donde va la ventana.",
  dimension: "Hacé clic en el primer punto y luego en el segundo para medir.",
  text: "Hacé clic donde va el texto.",
};

const VIEW_W = 600;
const VIEW_H = 450;

function snap(value: number): number {
  return Math.round(value / SKETCH_GRID_SIZE) * SKETCH_GRID_SIZE;
}

function newId(): string {
  return `el-${Math.random().toString(36).slice(2, 10)}`;
}

export function RegularizationSketchEditor({
  caseId,
  initialData,
}: {
  caseId: string;
  initialData: SketchData | null;
}) {
  const [elements, setElements] = useState<SketchElement[]>(initialData?.elements ?? []);
  const [mode, setMode] = useState<Mode>("wall");
  const [pendingStart, setPendingStart] = useState<{ x: number; y: number } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const toSvgPoint = (clientX: number, clientY: number): { x: number; y: number } | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const point = svg.createSVGPoint();
    point.x = clientX;
    point.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const transformed = point.matrixTransform(ctm.inverse());
    return { x: snap(transformed.x), y: snap(transformed.y) };
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setPendingStart(null);
    setSelectedId(null);
    setSaved(false);
  };

  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const p = toSvgPoint(e.clientX, e.clientY);
    if (!p) return;
    setSaved(false);

    if (mode === "select") {
      setSelectedId(null);
      return;
    }

    if (mode === "wall") {
      if (!pendingStart) {
        setPendingStart(p);
        return;
      }
      if (pendingStart.x !== p.x || pendingStart.y !== p.y) {
        setElements((prev) => [
          ...prev,
          { id: newId(), type: "wall", x1: pendingStart.x, y1: pendingStart.y, x2: p.x, y2: p.y, thickness: 15 },
        ]);
      }
      setPendingStart(p);
      return;
    }

    if (mode === "door") {
      setElements((prev) => [...prev, { id: newId(), type: "door", x: p.x, y: p.y, rotation: 0, width: 80 }]);
      return;
    }

    if (mode === "window") {
      setElements((prev) => [...prev, { id: newId(), type: "window", x: p.x, y: p.y, rotation: 0, width: 100 }]);
      return;
    }

    if (mode === "dimension") {
      if (!pendingStart) {
        setPendingStart(p);
        return;
      }
      setElements((prev) => [
        ...prev,
        { id: newId(), type: "dimension", x1: pendingStart.x, y1: pendingStart.y, x2: p.x, y2: p.y, label: null },
      ]);
      setPendingStart(null);
      return;
    }

    if (mode === "text") {
      const content = window.prompt("Texto:");
      if (content && content.trim()) {
        setElements((prev) => [...prev, { id: newId(), type: "text", x: p.x, y: p.y, content: content.trim(), fontSize: 14 }]);
      }
      return;
    }
  };

  const handleElementClick = (e: React.MouseEvent, id: string) => {
    if (mode === "select") {
      e.stopPropagation();
      setSelectedId(id);
    }
  };

  const handlePointerDown = (e: React.PointerEvent, el: SketchElement) => {
    if (mode !== "select" || (el.type !== "door" && el.type !== "window")) return;
    e.stopPropagation();
    setSelectedId(el.id);
    setDragId(el.id);
  };

  const handlePointerMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragId) return;
    const p = toSvgPoint(e.clientX, e.clientY);
    if (!p) return;
    setElements((prev) =>
      prev.map((el) => {
        if (el.id !== dragId || (el.type !== "door" && el.type !== "window")) return el;
        const rot = (el.rotation * Math.PI) / 180;
        const dx = Math.cos(rot);
        const dy = Math.sin(rot);
        // Proyecta el cursor sobre el eje propio del elemento (dx,dy) —
        // solo se mueve a lo largo de su orientación, no libremente.
        const t = (p.x - el.x) * dx + (p.y - el.y) * dy;
        return { ...el, x: el.x + t * dx, y: el.y + t * dy };
      })
    );
  };

  const handlePointerUp = () => setDragId(null);

  const deleteSelected = () => {
    if (!selectedId) return;
    setElements((prev) => prev.filter((el) => el.id !== selectedId && !el.id.startsWith(`${selectedId}-`)));
    setSelectedId(null);
    setSaved(false);
  };

  const handleSave = () => {
    const data: SketchData = { version: SKETCH_DATA_VERSION, unit: "cm", grid: { size: SKETCH_GRID_SIZE }, elements };
    startTransition(async () => {
      const result = await saveSketchAction(caseId, data);
      if (result.error) {
        if (result.error === STALE_SESSION_ERROR) setSessionError(STALE_SESSION_MESSAGE);
        return;
      }
      setSaved(true);
    });
  };

  const primitives = elementsToPrimitives(elements);

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm p-5 sm:p-8">
      <h2 className="font-display text-lg font-semibold tracking-tight mb-2">Croquis</h2>
      <p className="text-xs text-safety bg-safety-tint rounded-lg px-3 py-2 mb-4">{SKETCH_DISCLAIMER}</p>

      {sessionError && (
        <div className="rounded-2xl p-4 mb-4 bg-safety-tint border border-safety/30 text-sm text-safety">
          {sessionError}{" "}
          <Link href={`/login?callbackUrl=%2Fregularizacion%2F${caseId}`} className="font-semibold underline">
            Iniciar sesión
          </Link>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-3">
        {(Object.keys(MODE_LABELS) as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium border ${
              mode === m ? "bg-ink text-white border-ink" : "bg-white text-ink border-border"
            }`}
          >
            {MODE_LABELS[m]}
          </button>
        ))}
        {selectedId && mode === "select" && (
          <button onClick={deleteSelected} className="rounded-full px-4 py-1.5 text-sm font-medium bg-safety text-white">
            Eliminar
          </button>
        )}
      </div>

      <p className="text-xs text-ink-muted mb-2">{MODE_HINTS[mode]}</p>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full border border-border rounded-xl bg-concrete touch-none select-none"
        style={{ aspectRatio: `${VIEW_W} / ${VIEW_H}` }}
        onClick={handleCanvasClick}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
      >
        {Array.from({ length: Math.floor(VIEW_W / 50) + 1 }).map((_, i) => (
          <line key={`gx-${i}`} x1={i * 50} y1={0} x2={i * 50} y2={VIEW_H} stroke="#e5e5e5" strokeWidth={1} />
        ))}
        {Array.from({ length: Math.floor(VIEW_H / 50) + 1 }).map((_, i) => (
          <line key={`gy-${i}`} x1={0} y1={i * 50} x2={VIEW_W} y2={i * 50} stroke="#e5e5e5" strokeWidth={1} />
        ))}

        {primitives.map((p) => {
          const el = elements.find((e) => e.id === p.id || p.id === `${e.id}-label`);
          const isSelected = selectedId === (el?.id ?? p.id);
          if (p.kind === "path") {
            return (
              <path
                key={p.id}
                d={p.d}
                stroke={isSelected ? "#ea580c" : p.stroke}
                strokeWidth={p.strokeWidth}
                fill={p.fill ?? "none"}
                strokeDasharray={p.dashed ? "4,3" : undefined}
                onClick={(e) => handleElementClick(e, el?.id ?? p.id)}
                onPointerDown={(e) => el && handlePointerDown(e, el)}
                style={{ cursor: mode === "select" ? "pointer" : "crosshair" }}
              />
            );
          }
          return (
            <text
              key={p.id}
              x={p.x}
              y={p.y}
              fontSize={p.fontSize}
              fill={isSelected ? "#ea580c" : "#1a1a1a"}
              onClick={(e) => handleElementClick(e, el?.id ?? p.id)}
              style={{ cursor: mode === "select" ? "pointer" : "crosshair" }}
            >
              {p.content}
            </text>
          );
        })}

        {pendingStart && (mode === "wall" || mode === "dimension") && (
          <circle cx={pendingStart.x} cy={pendingStart.y} r={4} fill="#ea580c" />
        )}
      </svg>

      <div className="flex items-center gap-3 mt-4">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="rounded-full px-5 py-2 text-sm font-semibold text-white bg-action disabled:opacity-50"
        >
          {isPending ? "Guardando..." : "Guardar croquis"}
        </button>
        {saved && !isPending && <p className="text-sm text-success">Croquis guardado.</p>}
      </div>
    </div>
  );
}
