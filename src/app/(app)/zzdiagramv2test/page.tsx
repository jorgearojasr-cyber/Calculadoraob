"use client";

import { useState } from "react";
import { DiagramV2 } from "@/lib/diagram-v2";

// Ruta de prueba TEMPORAL — Fase 0 de Diagram System V2 (ver conversación
// 2026-08-01). Reproduce los 9 ejemplos del PDF "El diagrama de medidas,
// diseñado de nuevo" para comparación visual directa contra el mockup
// aprobado. Se borra una vez cerrada la Fase 0 — no es parte del sistema
// real, ningún módulo de producción la referencia.

const CASES: {
  title: string;
  note: string;
  props: React.ComponentProps<typeof DiagramV2>;
}[] = [
  {
    title: "Excavación 4,50 × 2,80 × 1,20 m",
    note: "Caso normal: proporción fiel. 85% del ancho",
    props: { kind: "box", largo: 4.5, ancho: 2.8, profundidad: 1.2, labels: { largo: "Largo", ancho: "Ancho", profundidad: "Profundidad" } },
  },
  {
    title: "Jardinera 1,20 × 0,60 × 0,45 m",
    note: "Objeto chico, mismos carriles. 84% del alto",
    props: { kind: "box", largo: 1.2, ancho: 0.6, profundidad: 0.45, labels: { largo: "Largo", ancho: "Ancho", profundidad: "Profundidad" } },
  },
  {
    title: "Pilar / columna 0,30 × 0,30 × 2,80 m",
    note: "Vertical: el panel se alarga con el objeto. 84% del alto",
    props: { kind: "box", largo: 0.3, ancho: 0.3, profundidad: 2.8, labels: { largo: "Largo", ancho: "Ancho", profundidad: "Profundidad" } },
  },
  {
    title: "Zanja para tuberías 12,00 × 0,60 × 0,80 m",
    note: "Extremo 20:1 y las tres medidas siguen legibles. 84% del ancho",
    props: { kind: "box", largo: 12, ancho: 0.6, profundidad: 0.8, labels: { largo: "Largo", ancho: "Ancho", profundidad: "Profundidad" } },
  },
  {
    title: "Piscina circular Ø5,00 × 0,80 m",
    note: "Misma cámara, cotas fuera de la silueta. 84% del ancho",
    props: { kind: "cylinder", diametro: 5, profundidad: 0.8, labels: { diametro: "Diámetro", profundidad: "Profundidad" } },
  },
  {
    title: "Radier 5,00 × 3,20 m",
    note: "Ortogonal pura, sin profundidad. 84% del ancho",
    props: { kind: "rect2d", largo: 5, ancho: 3.2, labels: { largo: "Largo", ancho: "Ancho" } },
  },
  {
    title: "Cerámica de baño 2,40 × 1,80 m",
    note: "Área compacta, cotas idénticas. 84% del alto",
    props: { kind: "rect2d", largo: 2.4, ancho: 1.8, labels: { largo: "Largo", ancho: "Ancho" } },
  },
  {
    title: "Vereda 12,00 × 1,20 m",
    note: "Franja larga sin colapsar. 85% del ancho",
    props: { kind: "rect2d", largo: 12, ancho: 1.2, labels: { largo: "Largo", ancho: "Ancho" } },
  },
];

function ActiveFieldDemo() {
  const [active, setActive] = useState<"largo" | "ancho" | "profundidad" | undefined>("largo");
  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, background: "#fff" }}>
      <div style={{ fontFamily: "monospace", fontSize: 12, marginBottom: 8 }}>
        En pantalla — activeField=&quot;{active ?? "ninguno"}&quot;
        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
          {(["largo", "ancho", "profundidad"] as const).map((f) => (
            <button key={f} onClick={() => setActive(f)} style={{ border: "1px solid #ccc", padding: "4px 8px", borderRadius: 4 }}>
              {f}
            </button>
          ))}
          <button onClick={() => setActive(undefined)} style={{ border: "1px solid #ccc", padding: "4px 8px", borderRadius: 4 }}>
            ninguno
          </button>
        </div>
      </div>
      <div style={{ maxWidth: 420 }}>
        <DiagramV2 kind="box" largo={4.5} ancho={2.8} profundidad={1.2} labels={{ largo: "Largo", ancho: "Ancho", profundidad: "Profundidad" }} activeField={active} />
      </div>
    </div>
  );
}

export default function ZZDiagramV2TestPage() {
  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 20, marginBottom: 4 }}>Diagram System V2 — Fase 0</h1>
      <p style={{ fontSize: 13, color: "#666", marginBottom: 24 }}>Los 9 ejemplos del PDF, para comparación 1:1 contra el mockup aprobado.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 24 }}>
        {CASES.map((c) => (
          <div key={c.title} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, background: "#fff" }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{c.title}</div>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 8 }}>{c.note}</div>
            <DiagramV2 {...c.props} />
          </div>
        ))}
      </div>
      <ActiveFieldDemo />
    </div>
  );
}
