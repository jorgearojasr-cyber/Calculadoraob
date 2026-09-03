import { describe, expect, it } from "vitest";
import { calculateModule } from "./index";

// Fase C6 (2026-09-02) — Costos de materiales y partidas cotizadas del
// configurador integral de Piscina ("piscina-integral"). DSL construido a
// mano reflejando EXACTAMENTE lo que queda en prisma/db-fixes/fase-c6-
// piscina-integral-costos.ts (mismo criterio que fase-c5-equipamiento.
// test.ts) — no duplica el motor, solo fija el contrato numérico de C6.
// Incluye las piezas mínimas de C1/C3/C4 de las que depende (rect
// solamente — circular no se re-testea acá, ya cubierto por sus propios
// archivos de fase), sin repetir el resto del Module.

function resultOf(results: ReturnType<typeof calculateModule>["results"], key: string) {
  const r = results.find((x) => x.key === key);
  return r?.value;
}

const eqForma = (v: string) => ({ op: "==", args: [{ var: "forma" }, { str: v }] });
const eqVar = (variable: string, v: string) => ({ op: "==", args: [{ var: variable }, { str: v }] });
const neqVar = (variable: string, v: string) => ({ op: "!=", args: [{ var: variable }, { str: v }] });
const orC = (...args: object[]) => ({ op: "or", args });
const andC = (...args: object[]) => ({ op: "and", args });
const definedC = (key: string) => ({ op: "defined", key });
const subtotal = (quantityRef: string, priceVar: string) => ({
  op: "round",
  value: { op: "*", args: [{ ref: quantityRef }, { var: priceVar }] },
});

const variables = [
  { key: "forma", label: "Forma", valueType: "TEXT", source: { type: "QUESTION", questionKey: "que-forma-tendra-tu-piscina" }, isResult: false },
  { key: "largo", label: "Largo", source: { type: "QUESTION", questionKey: "largo-interior-metros" }, isResult: false },
  { key: "ancho", label: "Ancho", source: { type: "QUESTION", questionKey: "ancho-interior-metros" }, isResult: false },
  { key: "profundidad-rect", label: "Profundidad", source: { type: "QUESTION", questionKey: "profundidad-interior-metros" }, isResult: false },
  { key: "espesor-muro-cm-rect", label: "Espesor muro", source: { type: "QUESTION", questionKey: "espesor-de-los-muros-cm" }, isResult: false },
  { key: "espesor-fondo-cm-rect", label: "Espesor fondo", source: { type: "QUESTION", questionKey: "espesor-del-fondo-losa-cm" }, isResult: false },
  { key: "terminacion-muros", label: "Terminación muros", valueType: "TEXT", source: { type: "QUESTION", questionKey: "interior-terminacion-muros" }, isResult: false },
  { key: "terminacion-fondo", label: "Terminación fondo", valueType: "TEXT", source: { type: "QUESTION", questionKey: "interior-terminacion-fondo" }, isResult: false },
  { key: "pintura-manos-muros", label: "Manos muros", source: { type: "QUESTION", questionKey: "interior-pintura-manos-muros" }, isResult: false },
  { key: "pintura-rendimiento-muros", label: "Rendimiento muros", source: { type: "QUESTION", questionKey: "interior-pintura-rendimiento-muros" }, isResult: false },
  { key: "pintura-perdida-muros", label: "Pérdida muros", source: { type: "QUESTION", questionKey: "interior-pintura-perdida-muros" }, isResult: false },
  { key: "pintura-manos-fondo", label: "Manos fondo", source: { type: "QUESTION", questionKey: "interior-pintura-manos-fondo" }, isResult: false },
  { key: "pintura-rendimiento-fondo", label: "Rendimiento fondo", source: { type: "QUESTION", questionKey: "interior-pintura-rendimiento-fondo" }, isResult: false },
  { key: "pintura-perdida-fondo", label: "Pérdida fondo", source: { type: "QUESTION", questionKey: "interior-pintura-perdida-fondo" }, isResult: false },
  { key: "ceramica-perdida-muros", label: "Pérdida cerámica muros", source: { type: "QUESTION", questionKey: "interior-ceramica-perdida-muros" }, isResult: false },
  { key: "ceramica-perdida-fondo", label: "Pérdida cerámica fondo", source: { type: "QUESTION", questionKey: "interior-ceramica-perdida-fondo" }, isResult: false },
  { key: "membrana-perdida-muros", label: "Pérdida membrana muros", source: { type: "QUESTION", questionKey: "interior-membrana-perdida-muros" }, isResult: false },
  { key: "membrana-perdida-fondo", label: "Pérdida membrana fondo", source: { type: "QUESTION", questionKey: "interior-membrana-perdida-fondo" }, isResult: false },
  { key: "excavacion-espacio-trabajo-cm", label: "Espacio trabajo", source: { type: "QUESTION", questionKey: "excavacion-espacio-trabajo-cm" }, isResult: false },
  { key: "excavacion-preparacion-losa-cm", label: "Preparación losa", source: { type: "QUESTION", questionKey: "excavacion-preparacion-losa-cm" }, isResult: false },
  { key: "excavacion-esponjamiento", label: "Esponjamiento", source: { type: "LOOKUP", questionKey: "excavacion-tipo-terreno", table: { "tierra-normal": 0.25, "con-arcilla-o-piedras": 0.35 } }, isResult: false },
  { key: "excavacion-capacidad-camion-m3-lookup", label: "Capacidad camión", source: { type: "LOOKUP", questionKey: "excavacion-tipo-camion", table: { chico: 6, mediano: 10, grande: 15 } }, isResult: false },
  { key: "excavacion-capacidad-personalizada-m3", label: "Capacidad personalizada", source: { type: "QUESTION", questionKey: "excavacion-capacidad-personalizada-m3" }, isResult: false },
  { key: "excavacion-tipo-camion", label: "Tipo camión", valueType: "TEXT", source: { type: "QUESTION", questionKey: "excavacion-tipo-camion" }, isResult: false },
  { key: "entorno-ancho-m", label: "Ancho entorno", source: { type: "QUESTION", questionKey: "entorno-ancho-m" }, isResult: false },
  { key: "entorno-terminacion", label: "Terminación entorno", valueType: "TEXT", source: { type: "QUESTION", questionKey: "entorno-terminacion" }, isResult: false },
  { key: "entorno-base-existente", label: "Base existente", valueType: "TEXT", source: { type: "QUESTION", questionKey: "entorno-base-existente" }, isResult: false },
  { key: "entorno-espesor-base-cm", label: "Espesor base", source: { type: "QUESTION", questionKey: "entorno-espesor-base-cm" }, isResult: false },
  { key: "entorno-espesor-radier-cm", label: "Espesor radier", source: { type: "QUESTION", questionKey: "entorno-espesor-radier-cm" }, isResult: false },
  { key: "entorno-perdida-terminacion-pct", label: "Pérdida terminación", source: { type: "QUESTION", questionKey: "entorno-perdida-terminacion-pct" }, isResult: false },
  { key: "entorno-pastelon-cobertura-m2", label: "Cobertura pastelón", source: { type: "LOOKUP", questionKey: "entorno-tamano-pastelon", table: { "40x40cm": 0.16, "50x50cm": 0.25, "60x40cm": 0.24 } }, isResult: false },
  // Precios C6
  { key: "costos-precio-hormigon-var", label: "Precio hormigón", source: { type: "QUESTION", questionKey: "costos-precio-hormigon-m3" }, isResult: false },
  { key: "costos-precio-retiro-var", label: "Precio retiro", source: { type: "QUESTION", questionKey: "costos-precio-retiro-viaje" }, isResult: false },
  { key: "costos-precio-pintura-var", label: "Precio pintura", source: { type: "QUESTION", questionKey: "costos-precio-pintura-litro" }, isResult: false },
  { key: "costos-precio-ceramica-interior-var", label: "Precio cerámica interior", source: { type: "QUESTION", questionKey: "costos-precio-ceramica-interior-m2" }, isResult: false },
  { key: "costos-precio-membrana-var", label: "Precio membrana", source: { type: "QUESTION", questionKey: "costos-precio-membrana-m2" }, isResult: false },
  { key: "costos-precio-base-entorno-var", label: "Precio base entorno", source: { type: "QUESTION", questionKey: "costos-precio-base-entorno-m3" }, isResult: false },
  { key: "costos-precio-radier-terminado-var", label: "Precio radier terminado", source: { type: "QUESTION", questionKey: "costos-precio-radier-terminado-m3" }, isResult: false },
  { key: "costos-precio-ceramica-entorno-var", label: "Precio cerámica entorno", source: { type: "QUESTION", questionKey: "costos-precio-ceramica-entorno-m2" }, isResult: false },
  { key: "costos-precio-porcelanato-entorno-var", label: "Precio porcelanato entorno", source: { type: "QUESTION", questionKey: "costos-precio-porcelanato-entorno-m2" }, isResult: false },
  { key: "costos-precio-pastelon-var", label: "Precio pastelón", source: { type: "QUESTION", questionKey: "costos-precio-pastelon-unidad" }, isResult: false },
].map((v) => ({ valueType: "NUMBER" as const, ...v }));

const formulas = [
  // --- C1 (estructura, rect) ---
  { key: "espesor-muro-m-rect", label: "", unit: "m", order: 1, condition: eqForma("rectangular"), expression: { op: "/", args: [{ var: "espesor-muro-cm-rect" }, 100] } },
  { key: "espesor-fondo-m-rect", label: "", unit: "m", order: 2, condition: eqForma("rectangular"), expression: { op: "/", args: [{ var: "espesor-fondo-cm-rect" }, 100] } },
  { key: "largo-ext", label: "Largo exterior", unit: "m", isResult: true, order: 10, condition: eqForma("rectangular"), expression: { op: "+", args: [{ var: "largo" }, { op: "*", args: [2, { ref: "espesor-muro-m-rect" }] }] } },
  { key: "ancho-ext", label: "Ancho exterior", unit: "m", isResult: true, order: 11, condition: eqForma("rectangular"), expression: { op: "+", args: [{ var: "ancho" }, { op: "*", args: [2, { ref: "espesor-muro-m-rect" }] }] } },
  { key: "hormigon-fondo-rect", label: "Hormigón fondo", unit: "m3", isResult: true, order: 20, condition: eqForma("rectangular"), expression: { op: "*", args: [{ op: "*", args: [{ ref: "largo-ext" }, { ref: "ancho-ext" }] }, { ref: "espesor-fondo-m-rect" }] } },
  { key: "hormigon-muros-rect", label: "Hormigón muros", unit: "m3", isResult: true, order: 21, condition: eqForma("rectangular"), expression: { op: "*", args: [{ op: "-", args: [{ op: "*", args: [{ ref: "largo-ext" }, { ref: "ancho-ext" }] }, { op: "*", args: [{ var: "largo" }, { var: "ancho" }] }] }, { var: "profundidad-rect" }] } },
  { key: "hormigon-bruto-rect", label: "", unit: "m3", order: 22, condition: eqForma("rectangular"), expression: { op: "+", args: [{ ref: "hormigon-fondo-rect" }, { ref: "hormigon-muros-rect" }] } },
  { key: "hormigon-total-rect", label: "", unit: "m3", order: 26, condition: eqForma("rectangular"), expression: { op: "lossFactor", key: "perdida_hormigon", value: { ref: "hormigon-bruto-rect" } } },
  { key: "hormigon-total", label: "Hormigón total", unit: "m3", isResult: true, order: 28, expression: { op: "coalesce", args: [{ ref: "hormigon-total-rect" }] } },
  // --- C2 (interior, rect) ---
  { key: "area-fondo-rect", label: "", unit: "m²", order: 50, condition: eqForma("rectangular"), expression: { op: "*", args: [{ var: "largo" }, { var: "ancho" }] } },
  { key: "area-muros-rect", label: "", unit: "m²", order: 51, condition: eqForma("rectangular"), expression: { op: "*", args: [{ op: "*", args: [2, { op: "+", args: [{ var: "largo" }, { var: "ancho" }] }] }, { var: "profundidad-rect" }] } },
  { key: "area-fondo", label: "Fondo — superficie interior", unit: "m²", isResult: true, order: 54, expression: { op: "coalesce", args: [{ ref: "area-fondo-rect" }] } },
  { key: "area-muros", label: "Muros — superficie interior", unit: "m²", isResult: true, order: 55, expression: { op: "coalesce", args: [{ ref: "area-muros-rect" }] } },
  { key: "muros-pintura-litros-brutos", label: "", unit: "L", order: 60, condition: eqVar("terminacion-muros", "pintura"), expression: { op: "/", args: [{ op: "*", args: [{ ref: "area-muros" }, { var: "pintura-manos-muros" }] }, { var: "pintura-rendimiento-muros" }] } },
  { key: "muros-pintura-litros-total", label: "Pintura muros", unit: "L", isResult: true, order: 61, condition: eqVar("terminacion-muros", "pintura"), expression: { op: "*", args: [{ ref: "muros-pintura-litros-brutos" }, { op: "+", args: [1, { op: "/", args: [{ var: "pintura-perdida-muros" }, 100] }] }] } },
  { key: "muros-ceramica-m2-compra", label: "Cerámica muros", unit: "m²", isResult: true, order: 62, condition: eqVar("terminacion-muros", "ceramica"), expression: { op: "*", args: [{ ref: "area-muros" }, { op: "+", args: [1, { op: "/", args: [{ var: "ceramica-perdida-muros" }, 100] }] }] } },
  { key: "muros-membrana-m2", label: "Membrana muros", unit: "m²", isResult: true, order: 63, condition: eqVar("terminacion-muros", "membrana"), expression: { op: "*", args: [{ ref: "area-muros" }, { op: "+", args: [1, { op: "/", args: [{ var: "membrana-perdida-muros" }, 100] }] }] } },
  { key: "fondo-pintura-litros-brutos", label: "", unit: "L", order: 64, condition: eqVar("terminacion-fondo", "pintura"), expression: { op: "/", args: [{ op: "*", args: [{ ref: "area-fondo" }, { var: "pintura-manos-fondo" }] }, { var: "pintura-rendimiento-fondo" }] } },
  { key: "fondo-pintura-litros-total", label: "Pintura fondo", unit: "L", isResult: true, order: 65, condition: eqVar("terminacion-fondo", "pintura"), expression: { op: "*", args: [{ ref: "fondo-pintura-litros-brutos" }, { op: "+", args: [1, { op: "/", args: [{ var: "pintura-perdida-fondo" }, 100] }] }] } },
  { key: "fondo-ceramica-m2-compra", label: "Cerámica fondo", unit: "m²", isResult: true, order: 66, condition: eqVar("terminacion-fondo", "ceramica"), expression: { op: "*", args: [{ ref: "area-fondo" }, { op: "+", args: [1, { op: "/", args: [{ var: "ceramica-perdida-fondo" }, 100] }] }] } },
  { key: "fondo-membrana-m2", label: "Membrana fondo", unit: "m²", isResult: true, order: 67, condition: eqVar("terminacion-fondo", "membrana"), expression: { op: "*", args: [{ ref: "area-fondo" }, { op: "+", args: [1, { op: "/", args: [{ var: "membrana-perdida-fondo" }, 100] }] }] } },
  { key: "pintura-litros-combinado", label: "Pintura combinada", unit: "L", isResult: true, order: 70, condition: andC(eqVar("terminacion-muros", "pintura"), eqVar("terminacion-fondo", "pintura")), expression: { op: "+", args: [{ ref: "muros-pintura-litros-total" }, { ref: "fondo-pintura-litros-total" }] } },
  { key: "ceramica-m2-combinado", label: "Cerámica combinada", unit: "m²", isResult: true, order: 71, condition: andC(eqVar("terminacion-muros", "ceramica"), eqVar("terminacion-fondo", "ceramica")), expression: { op: "+", args: [{ ref: "muros-ceramica-m2-compra" }, { ref: "fondo-ceramica-m2-compra" }] } },
  { key: "membrana-m2-combinado", label: "Membrana combinada", unit: "m²", isResult: true, order: 72, condition: andC(eqVar("terminacion-muros", "membrana"), eqVar("terminacion-fondo", "membrana")), expression: { op: "+", args: [{ ref: "muros-membrana-m2" }, { ref: "fondo-membrana-m2" }] } },
  // --- C3 (excavación, rect) ---
  { key: "excavacion-espacio-trabajo-m", label: "", unit: "m", order: 80, expression: { op: "/", args: [{ var: "excavacion-espacio-trabajo-cm" }, 100] } },
  { key: "excavacion-preparacion-losa-m", label: "", unit: "m", order: 81, expression: { op: "/", args: [{ var: "excavacion-preparacion-losa-cm" }, 100] } },
  { key: "excavacion-largo-hoyo-rect", label: "Largo del hoyo", unit: "m", isResult: true, order: 82, condition: eqForma("rectangular"), expression: { op: "+", args: [{ ref: "largo-ext" }, { op: "*", args: [2, { ref: "excavacion-espacio-trabajo-m" }] }] } },
  { key: "excavacion-ancho-hoyo-rect", label: "Ancho del hoyo", unit: "m", isResult: true, order: 83, condition: eqForma("rectangular"), expression: { op: "+", args: [{ ref: "ancho-ext" }, { op: "*", args: [2, { ref: "excavacion-espacio-trabajo-m" }] }] } },
  { key: "excavacion-prof-hoyo-rect", label: "Profundidad del hoyo", unit: "m", isResult: true, order: 84, condition: eqForma("rectangular"), expression: { op: "+", args: [{ op: "+", args: [{ var: "profundidad-rect" }, { ref: "espesor-fondo-m-rect" }] }, { ref: "excavacion-preparacion-losa-m" }] } },
  { key: "excavacion-volumen-hoyo-rect", label: "", unit: "m³", order: 85, condition: eqForma("rectangular"), expression: { op: "*", args: [{ op: "*", args: [{ ref: "excavacion-largo-hoyo-rect" }, { ref: "excavacion-ancho-hoyo-rect" }] }, { ref: "excavacion-prof-hoyo-rect" }] } },
  { key: "excavacion-volumen-excavado", label: "Volumen excavado", unit: "m³", isResult: true, order: 90, expression: { op: "coalesce", args: [{ ref: "excavacion-volumen-hoyo-rect" }] } },
  { key: "excavacion-factor-esponjamiento", label: "", unit: "factor", order: 91, expression: { op: "+", args: [1, { var: "excavacion-esponjamiento" }] } },
  { key: "excavacion-volumen-suelto", label: "Tierra suelta estimada", unit: "m³", isResult: true, order: 92, expression: { op: "*", args: [{ ref: "excavacion-volumen-excavado" }, { ref: "excavacion-factor-esponjamiento" }] } },
  { key: "excavacion-capacidad-camion-estandar", label: "", unit: "m³", order: 93, condition: { op: "not", value: eqVar("excavacion-tipo-camion", "personalizado") }, expression: { var: "excavacion-capacidad-camion-m3-lookup" } },
  { key: "excavacion-capacidad-camion-personalizada", label: "", unit: "m³", order: 94, condition: eqVar("excavacion-tipo-camion", "personalizado"), expression: { var: "excavacion-capacidad-personalizada-m3" } },
  { key: "excavacion-capacidad-camion", label: "Capacidad del camión", unit: "m³", isResult: true, order: 95, expression: { op: "coalesce", args: [{ ref: "excavacion-capacidad-camion-estandar" }, { ref: "excavacion-capacidad-camion-personalizada" }] } },
  { key: "excavacion-viajes", label: "Viajes estimados", unit: "viaje", isResult: true, order: 96, expression: { op: "ceil", value: { op: "/", args: [{ ref: "excavacion-volumen-suelto" }, { ref: "excavacion-capacidad-camion" }] } } },
  // --- C4 (entorno, rect) ---
  { key: "entorno-area-total-rect", label: "", unit: "m²", order: 100, condition: eqForma("rectangular"), expression: { op: "*", args: [{ op: "+", args: [{ ref: "largo-ext" }, { op: "*", args: [2, { var: "entorno-ancho-m" }] }] }, { op: "+", args: [{ ref: "ancho-ext" }, { op: "*", args: [2, { var: "entorno-ancho-m" }] }] }] } },
  { key: "entorno-area-vaso-rect", label: "", unit: "m²", order: 101, condition: eqForma("rectangular"), expression: { op: "*", args: [{ ref: "largo-ext" }, { ref: "ancho-ext" }] } },
  { key: "entorno-area-rect", label: "", unit: "m²", order: 102, condition: eqForma("rectangular"), expression: { op: "-", args: [{ ref: "entorno-area-total-rect" }, { ref: "entorno-area-vaso-rect" }] } },
  { key: "entorno-area", label: "Área del entorno", unit: "m²", isResult: true, order: 107, expression: { op: "coalesce", args: [{ ref: "entorno-area-rect" }] } },
  { key: "entorno-espesor-base-m", label: "", unit: "m", order: 108, condition: andC(neqVar("entorno-terminacion", "radier"), eqVar("entorno-base-existente", "no")), expression: { op: "/", args: [{ var: "entorno-espesor-base-cm" }, 100] } },
  { key: "entorno-volumen-base", label: "Volumen de la base/radier", unit: "m³", isResult: true, order: 109, condition: andC(neqVar("entorno-terminacion", "radier"), eqVar("entorno-base-existente", "no")), expression: { op: "*", args: [{ ref: "entorno-area" }, { ref: "entorno-espesor-base-m" }] } },
  { key: "entorno-espesor-radier-m", label: "", unit: "m", order: 110, condition: eqVar("entorno-terminacion", "radier"), expression: { op: "/", args: [{ var: "entorno-espesor-radier-cm" }, 100] } },
  { key: "entorno-volumen-radier-terminado", label: "Volumen radier terminado", unit: "m³", isResult: true, order: 111, condition: eqVar("entorno-terminacion", "radier"), expression: { op: "*", args: [{ ref: "entorno-area" }, { ref: "entorno-espesor-radier-m" }] } },
  { key: "entorno-ceramica-m2-compra", label: "Cerámica entorno", unit: "m²", isResult: true, order: 112, condition: eqVar("entorno-terminacion", "ceramica"), expression: { op: "*", args: [{ ref: "entorno-area" }, { op: "+", args: [1, { op: "/", args: [{ var: "entorno-perdida-terminacion-pct" }, 100] }] }] } },
  { key: "entorno-porcelanato-m2-compra", label: "Porcelanato entorno", unit: "m²", isResult: true, order: 113, condition: eqVar("entorno-terminacion", "porcelanato"), expression: { op: "*", args: [{ ref: "entorno-area" }, { op: "+", args: [1, { op: "/", args: [{ var: "entorno-perdida-terminacion-pct" }, 100] }] }] } },
  { key: "entorno-pastelones-area-con-perdida", label: "", unit: "m²", order: 114, condition: eqVar("entorno-terminacion", "pastelones"), expression: { op: "*", args: [{ ref: "entorno-area" }, 1.08] } },
  { key: "entorno-pastelones-unidades", label: "Pastelones — unidades", unit: "unidad", isResult: true, order: 115, condition: eqVar("entorno-terminacion", "pastelones"), expression: { op: "ceil", value: { op: "/", args: [{ ref: "entorno-pastelones-area-con-perdida" }, { var: "entorno-pastelon-cobertura-m2" }] } } },
  // --- C6 ---
  { key: "costos-pintura-cantidad-litros", label: "Pintura a comprar (Costos)", unit: "L", isResult: true, order: 140, condition: orC(eqVar("terminacion-muros", "pintura"), eqVar("terminacion-fondo", "pintura")), expression: { op: "coalesce", args: [{ ref: "pintura-litros-combinado" }, { ref: "muros-pintura-litros-total" }, { ref: "fondo-pintura-litros-total" }] } },
  { key: "costos-ceramica-cantidad-m2", label: "Cerámica/mosaico a comprar (Costos)", unit: "m²", isResult: true, order: 141, condition: orC(eqVar("terminacion-muros", "ceramica"), eqVar("terminacion-fondo", "ceramica")), expression: { op: "coalesce", args: [{ ref: "ceramica-m2-combinado" }, { ref: "muros-ceramica-m2-compra" }, { ref: "fondo-ceramica-m2-compra" }] } },
  { key: "costos-membrana-cantidad-m2", label: "Membrana a comprar (Costos)", unit: "m²", isResult: true, order: 142, condition: orC(eqVar("terminacion-muros", "membrana"), eqVar("terminacion-fondo", "membrana")), expression: { op: "coalesce", args: [{ ref: "membrana-m2-combinado" }, { ref: "muros-membrana-m2" }, { ref: "fondo-membrana-m2" }] } },
  { key: "costos-hormigon-estructura-subtotal", label: "Hormigón de estructura (subtotal)", unit: "CLP", isResult: true, order: 143, condition: definedC("costos-precio-hormigon-var"), expression: subtotal("hormigon-total", "costos-precio-hormigon-var") },
  { key: "costos-retiro-tierra-subtotal", label: "Retiro de tierra (subtotal)", unit: "CLP", isResult: true, order: 144, condition: definedC("costos-precio-retiro-var"), expression: subtotal("excavacion-viajes", "costos-precio-retiro-var") },
  { key: "costos-pintura-interior-subtotal", label: "Pintura interior (subtotal)", unit: "CLP", isResult: true, order: 145, condition: andC(definedC("costos-precio-pintura-var"), orC(eqVar("terminacion-muros", "pintura"), eqVar("terminacion-fondo", "pintura"))), expression: subtotal("costos-pintura-cantidad-litros", "costos-precio-pintura-var") },
  { key: "costos-ceramica-interior-subtotal", label: "Cerámica/mosaico interior (subtotal)", unit: "CLP", isResult: true, order: 146, condition: andC(definedC("costos-precio-ceramica-interior-var"), orC(eqVar("terminacion-muros", "ceramica"), eqVar("terminacion-fondo", "ceramica"))), expression: subtotal("costos-ceramica-cantidad-m2", "costos-precio-ceramica-interior-var") },
  { key: "costos-membrana-interior-subtotal", label: "Membrana interior (subtotal)", unit: "CLP", isResult: true, order: 147, condition: andC(definedC("costos-precio-membrana-var"), orC(eqVar("terminacion-muros", "membrana"), eqVar("terminacion-fondo", "membrana"))), expression: subtotal("costos-membrana-cantidad-m2", "costos-precio-membrana-var") },
  { key: "costos-base-entorno-subtotal", label: "Hormigón base/radier del entorno (subtotal)", unit: "CLP", isResult: true, order: 148, condition: andC(definedC("costos-precio-base-entorno-var"), neqVar("entorno-terminacion", "radier"), eqVar("entorno-base-existente", "no")), expression: subtotal("entorno-volumen-base", "costos-precio-base-entorno-var") },
  { key: "costos-radier-terminado-subtotal", label: "Radier/hormigón terminado del entorno (subtotal)", unit: "CLP", isResult: true, order: 149, condition: andC(definedC("costos-precio-radier-terminado-var"), eqVar("entorno-terminacion", "radier")), expression: subtotal("entorno-volumen-radier-terminado", "costos-precio-radier-terminado-var") },
  { key: "costos-ceramica-entorno-subtotal", label: "Cerámica exterior del entorno (subtotal)", unit: "CLP", isResult: true, order: 150, condition: andC(definedC("costos-precio-ceramica-entorno-var"), eqVar("entorno-terminacion", "ceramica")), expression: subtotal("entorno-ceramica-m2-compra", "costos-precio-ceramica-entorno-var") },
  { key: "costos-porcelanato-entorno-subtotal", label: "Porcelanato exterior del entorno (subtotal)", unit: "CLP", isResult: true, order: 151, condition: andC(definedC("costos-precio-porcelanato-entorno-var"), eqVar("entorno-terminacion", "porcelanato")), expression: subtotal("entorno-porcelanato-m2-compra", "costos-precio-porcelanato-entorno-var") },
  { key: "costos-pastelones-subtotal", label: "Pastelones del entorno (subtotal)", unit: "CLP", isResult: true, order: 152, condition: andC(definedC("costos-precio-pastelon-var"), eqVar("entorno-terminacion", "pastelones")), expression: subtotal("entorno-pastelones-unidades", "costos-precio-pastelon-var") },
].map((f) => ({ note: null, material: null, condition: null, isResult: false, isSecondary: false, ...f }));

const BASE: Record<string, string | number> = {
  "que-forma-tendra-tu-piscina": "rectangular",
  "largo-interior-metros": 12,
  "ancho-interior-metros": 6,
  "profundidad-interior-metros": 1.5,
  "espesor-de-los-muros-cm": 15,
  "espesor-del-fondo-losa-cm": 25,
  "excavacion-espacio-trabajo-cm": 60,
  "excavacion-preparacion-losa-cm": 0,
  "excavacion-tipo-terreno": "tierra-normal",
  "excavacion-tipo-camion": "mediano",
  "entorno-ancho-m": 1.5,
};

function run(answers: Record<string, string | number>) {
  return calculateModule({ variables, formulas, lossFactors: [{ key: "perdida_hormigon", percentage: 0.07, condition: null }], answers }).results;
}

describe("piscina-integral — Costos (Fase C6)", () => {
  // Sección 38-43 del pedido: caso QA principal (12×6×1,5).
  it("QA principal: hormigón 29,540025 m³ × $100.000 = $2.954.003", () => {
    const results = run({ ...BASE, "interior-terminacion-muros": "sin-calcular", "interior-terminacion-fondo": "sin-calcular", "entorno-terminacion": "sin-calcular", "entorno-base-existente": "si", "costos-precio-hormigon-m3": 100000 });
    expect(resultOf(results, "hormigon-total")).toBeCloseTo(29.540025, 6);
    expect(resultOf(results, "costos-hormigon-estructura-subtotal")).toBe(2954003);
  });

  it("QA retiro: 23 viajes × $50.000 = $1.150.000", () => {
    const results = run({ ...BASE, "interior-terminacion-muros": "sin-calcular", "interior-terminacion-fondo": "sin-calcular", "entorno-terminacion": "sin-calcular", "entorno-base-existente": "si", "costos-precio-retiro-viaje": 50000 });
    expect(resultOf(results, "excavacion-viajes")).toBe(23);
    expect(resultOf(results, "costos-retiro-tierra-subtotal")).toBe(1150000);
  });

  it("QA base entorno: 6,48 m³ × $100.000 = $648.000", () => {
    const results = run({ ...BASE, "interior-terminacion-muros": "sin-calcular", "interior-terminacion-fondo": "sin-calcular", "entorno-terminacion": "ceramica", "entorno-base-existente": "no", "entorno-espesor-base-cm": 10, "entorno-perdida-terminacion-pct": 10, "costos-precio-base-entorno-m3": 100000 });
    expect(resultOf(results, "entorno-volumen-base")).toBeCloseTo(6.48, 6);
    expect(resultOf(results, "costos-base-entorno-subtotal")).toBe(648000);
  });

  it("QA cerámica entorno: 71,28 m² × $20.000 = $1.425.600", () => {
    const results = run({ ...BASE, "interior-terminacion-muros": "sin-calcular", "interior-terminacion-fondo": "sin-calcular", "entorno-terminacion": "ceramica", "entorno-base-existente": "no", "entorno-espesor-base-cm": 10, "entorno-perdida-terminacion-pct": 10, "costos-precio-ceramica-entorno-m2": 20000 });
    expect(resultOf(results, "entorno-ceramica-m2-compra")).toBeCloseTo(71.28, 6);
    expect(resultOf(results, "costos-ceramica-entorno-subtotal")).toBe(1425600);
  });

  it("total parcial (4 partidas QA): suma de subtotales redondeados = $6.177.603", () => {
    const results = run({
      ...BASE,
      "interior-terminacion-muros": "sin-calcular",
      "interior-terminacion-fondo": "sin-calcular",
      "entorno-terminacion": "ceramica",
      "entorno-base-existente": "no",
      "entorno-espesor-base-cm": 10,
      "entorno-perdida-terminacion-pct": 10,
      "costos-precio-hormigon-m3": 100000,
      "costos-precio-retiro-viaje": 50000,
      "costos-precio-base-entorno-m3": 100000,
      "costos-precio-ceramica-entorno-m2": 20000,
    });
    const total =
      (resultOf(results, "costos-hormigon-estructura-subtotal") ?? 0) +
      (resultOf(results, "costos-retiro-tierra-subtotal") ?? 0) +
      (resultOf(results, "costos-base-entorno-subtotal") ?? 0) +
      (resultOf(results, "costos-ceramica-entorno-subtotal") ?? 0);
    expect(total).toBe(6177603);
  });

  it("Interior — Pintura (mismo material en ambas superficies): usa el combinado, sin doble conteo", () => {
    const results = run({
      ...BASE,
      "interior-terminacion-muros": "pintura",
      "interior-terminacion-fondo": "pintura",
      "interior-pintura-manos-muros": 2,
      "interior-pintura-rendimiento-muros": 10,
      "interior-pintura-perdida-muros": 10,
      "interior-pintura-manos-fondo": 2,
      "interior-pintura-rendimiento-fondo": 10,
      "interior-pintura-perdida-fondo": 10,
      "entorno-terminacion": "sin-calcular",
      "entorno-base-existente": "si",
      "costos-precio-pintura-litro": 15000,
    });
    const combinado = resultOf(results, "pintura-litros-combinado")!;
    expect(resultOf(results, "costos-pintura-cantidad-litros")).toBeCloseTo(combinado, 8);
    expect(resultOf(results, "costos-pintura-interior-subtotal")).toBe(Math.round(combinado * 15000));
  });

  it("Interior — Cerámica/mosaico: materiales distintos (muros=pintura, fondo=cerámica) — cero doble conteo", () => {
    const results = run({
      ...BASE,
      "interior-terminacion-muros": "pintura",
      "interior-terminacion-fondo": "ceramica",
      "interior-pintura-manos-muros": 2,
      "interior-pintura-rendimiento-muros": 10,
      "interior-pintura-perdida-muros": 10,
      "interior-ceramica-perdida-fondo": 10,
      "entorno-terminacion": "sin-calcular",
      "entorno-base-existente": "si",
      "costos-precio-pintura-litro": 15000,
      "costos-precio-ceramica-interior-m2": 12000,
    });
    // La cantidad de pintura es SOLO la de muros (fondo no es pintura) —
    // el combinado no existe, así que coalesce cae a la individual.
    expect(resultOf(results, "pintura-litros-combinado")).toBeUndefined();
    expect(resultOf(results, "costos-pintura-cantidad-litros")).toBeCloseTo(resultOf(results, "muros-pintura-litros-total")!, 8);
    expect(resultOf(results, "costos-ceramica-cantidad-m2")).toBeCloseTo(resultOf(results, "fondo-ceramica-m2-compra")!, 8);
    expect(resultOf(results, "costos-membrana-interior-subtotal")).toBeUndefined();
  });

  it("Membrana interior: mismo patrón, ambas superficies", () => {
    const results = run({
      ...BASE,
      "interior-terminacion-muros": "membrana",
      "interior-terminacion-fondo": "membrana",
      "interior-membrana-perdida-muros": 5,
      "interior-membrana-perdida-fondo": 5,
      "entorno-terminacion": "sin-calcular",
      "entorno-base-existente": "si",
      "costos-precio-membrana-m2": 8000,
    });
    const combinado = resultOf(results, "membrana-m2-combinado")!;
    expect(resultOf(results, "costos-membrana-cantidad-m2")).toBeCloseTo(combinado, 8);
    expect(resultOf(results, "costos-membrana-interior-subtotal")).toBe(Math.round(combinado * 8000));
  });

  it("Pastelones: multiplicador es la UNIDAD ya calculada, sin re-aplicar pérdida", () => {
    const results = run({
      ...BASE,
      "interior-terminacion-muros": "sin-calcular",
      "interior-terminacion-fondo": "sin-calcular",
      "entorno-terminacion": "pastelones",
      "entorno-base-existente": "no",
      "entorno-espesor-base-cm": 10,
      "entorno-tamano-pastelon": "60x40cm",
      "costos-precio-pastelon-unidad": 8000,
    });
    const unidades = resultOf(results, "entorno-pastelones-unidades")!;
    expect(resultOf(results, "costos-pastelones-subtotal")).toBe(Math.round(unidades * 8000));
    // Anti doble conteo: pastelones no es radier, pero si no se ingresó
    // precio de base, no debe existir subtotal de base.
    expect(resultOf(results, "costos-base-entorno-subtotal")).toBeUndefined();
  });

  it("Radier terminado: una sola partida, nunca base + radier terminado juntas", () => {
    const results = run({
      ...BASE,
      "interior-terminacion-muros": "sin-calcular",
      "interior-terminacion-fondo": "sin-calcular",
      "entorno-terminacion": "radier",
      "entorno-base-existente": "no",
      "entorno-espesor-radier-cm": 10,
      "costos-precio-radier-terminado-m3": 90000,
      "costos-precio-base-entorno-m3": 999999,
    });
    const volumen = resultOf(results, "entorno-volumen-radier-terminado")!;
    expect(resultOf(results, "costos-radier-terminado-subtotal")).toBe(Math.round(volumen * 90000));
    expect(resultOf(results, "costos-base-entorno-subtotal")).toBeUndefined();
  });

  it("Base entorno existente: no debe generar precio ni subtotal de base", () => {
    const results = run({
      ...BASE,
      "interior-terminacion-muros": "sin-calcular",
      "interior-terminacion-fondo": "sin-calcular",
      "entorno-terminacion": "ceramica",
      "entorno-base-existente": "si",
      "entorno-perdida-terminacion-pct": 10,
      "costos-precio-base-entorno-m3": 100000,
    });
    expect(resultOf(results, "entorno-volumen-base")).toBeUndefined();
    expect(resultOf(results, "costos-base-entorno-subtotal")).toBeUndefined();
  });

  it("Sin precios: ningún subtotal-clp presente", () => {
    const results = run({ ...BASE, "interior-terminacion-muros": "sin-calcular", "interior-terminacion-fondo": "sin-calcular", "entorno-terminacion": "sin-calcular", "entorno-base-existente": "si" });
    const anySubtotal = results.some((r) => r.key.startsWith("costos-") && r.key.endsWith("-subtotal"));
    expect(anySubtotal).toBe(false);
  });

  it("Precio $0 explícito: subtotal presente y en $0, distinto de ausencia", () => {
    const results = run({ ...BASE, "interior-terminacion-muros": "sin-calcular", "interior-terminacion-fondo": "sin-calcular", "entorno-terminacion": "sin-calcular", "entorno-base-existente": "si", "costos-precio-hormigon-m3": 0 });
    expect(resultOf(results, "costos-hormigon-estructura-subtotal")).toBe(0);
  });

  it("Cambio de cantidades: mismo precio, subtotal se recalcula automáticamente (largo 12 -> 10)", () => {
    const base = { ...BASE, "interior-terminacion-muros": "sin-calcular", "interior-terminacion-fondo": "sin-calcular", "entorno-terminacion": "sin-calcular", "entorno-base-existente": "si", "costos-precio-hormigon-m3": 100000 };
    const before = run(base);
    const after = run({ ...base, "largo-interior-metros": 10 });
    const hormigonAntes = resultOf(before, "hormigon-total")!;
    const hormigonDespues = resultOf(after, "hormigon-total")!;
    expect(hormigonDespues).not.toBeCloseTo(hormigonAntes, 3);
    expect(resultOf(before, "costos-hormigon-estructura-subtotal")).toBe(Math.round(hormigonAntes * 100000));
    expect(resultOf(after, "costos-hormigon-estructura-subtotal")).toBe(Math.round(hormigonDespues * 100000));
  });

  it("Equipamiento nunca se valoriza: ninguna Formula de Costos referencia caudal/filtro", () => {
    const costosFormulas = formulas.filter((f) => f.key.startsWith("costos-"));
    const referencesEquipamiento = costosFormulas.some((f) => JSON.stringify(f.expression).includes("equipamiento"));
    expect(referencesEquipamiento).toBe(false);
  });
});
