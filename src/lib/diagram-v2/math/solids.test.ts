import { describe, expect, it } from "vitest";
import { buildCylinder } from "./solids";
import { AXIS_LARGO } from "./camera";

// Fase 7, sprint UX V1.2 — fija el contrato matemático del fix de
// proyección del cilindro: topLeft/topRight/bottomLeft/bottomRight deben
// caer exactamente sobre la elipse dibujada (semiejes rx/ry), para
// cualquier radio y profundidad, no solo para el caso calibrado a ojo que
// tenía la versión anterior (ver comentario en solids.ts).
//
// Ecuación de una elipse centrada en (cx, cy) con semiejes (rx, ry):
//   ((x-cx)/rx)^2 + ((y-cy)/ry)^2 = 1
function onEllipse(point: [number, number], center: [number, number], rx: number, ry: number): number {
  const dx = (point[0] - center[0]) / rx;
  const dy = (point[1] - center[1]) / ry;
  return dx * dx + dy * dy;
}

describe("buildCylinder — proyección elíptica", () => {
  it("topLeft/topRight caen exactamente sobre la elipse superior (radio 1)", () => {
    const c = buildCylinder(1, 0.5);
    expect(onEllipse(c.topLeft, c.topCenter, c.rx, c.ry)).toBeCloseTo(1, 10);
    expect(onEllipse(c.topRight, c.topCenter, c.rx, c.ry)).toBeCloseTo(1, 10);
  });

  it("bottomLeft/bottomRight caen exactamente sobre la elipse inferior (radio 1)", () => {
    const c = buildCylinder(1, 0.5);
    expect(onEllipse(c.bottomLeft, c.bottomCenter, c.rx, c.ry)).toBeCloseTo(1, 10);
    expect(onEllipse(c.bottomRight, c.bottomCenter, c.rx, c.ry)).toBeCloseTo(1, 10);
  });

  it("se mantiene sobre la elipse para radios y profundidades arbitrarios", () => {
    const cases: [number, number][] = [
      [0.3, 0.1],
      [2.7, 1.9],
      [0.01, 5],
      [10, 0],
    ];
    for (const [radiusR, profundidadR] of cases) {
      const c = buildCylinder(radiusR, profundidadR);
      expect(onEllipse(c.topLeft, c.topCenter, c.rx, c.ry)).toBeCloseTo(1, 8);
      expect(onEllipse(c.topRight, c.topCenter, c.rx, c.ry)).toBeCloseTo(1, 8);
      expect(onEllipse(c.bottomLeft, c.bottomCenter, c.rx, c.ry)).toBeCloseTo(1, 8);
      expect(onEllipse(c.bottomRight, c.bottomCenter, c.rx, c.ry)).toBeCloseTo(1, 8);
    }
  });

  it("topLeft/topRight son simétricos respecto al centro (extremos horizontales reales)", () => {
    const c = buildCylinder(3, 1);
    expect(c.topLeft[1]).toBeCloseTo(c.topCenter[1], 10);
    expect(c.topRight[1]).toBeCloseTo(c.topCenter[1], 10);
    expect(c.topCenter[0] - c.topLeft[0]).toBeCloseTo(c.rx, 10);
    expect(c.topRight[0] - c.topCenter[0]).toBeCloseTo(c.rx, 10);
  });

  it("los semiejes rx/ry se derivan del ángulo de cámara, no de una constante libre", () => {
    const radiusR = 2;
    const c = buildCylinder(radiusR, 1);
    const expectedRx = radiusR * Math.SQRT2 * AXIS_LARGO[0];
    const expectedRy = radiusR * Math.SQRT2 * AXIS_LARGO[1];
    expect(c.rx).toBeCloseTo(expectedRx, 10);
    expect(c.ry).toBeCloseTo(expectedRy, 10);
  });

  it("radio 0 colapsa a un punto sin división por cero", () => {
    const c = buildCylinder(0, 1);
    expect(c.rx).toBe(0);
    expect(c.ry).toBe(0);
    expect(c.topLeft).toEqual(c.topCenter);
    expect(c.topRight).toEqual(c.topCenter);
  });
});
