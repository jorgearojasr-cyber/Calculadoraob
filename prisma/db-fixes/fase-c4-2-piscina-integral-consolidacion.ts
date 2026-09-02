import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Prisma } from "../../src/generated/prisma/client";

// FASE C4.2 -- Consolidación global pre-Equipamiento del configurador
// integral de Piscina ("piscina-integral").
//
// Extiende el Module ya creado por fase-c1-piscina-integral.ts (NO lo
// recrea, NO toca su `published`). Este archivo hace 2 cosas, ambas
// idempotentes y sin tocar ninguna Formula/Question de C1-C4 ya
// aprobada salvo los labels puntuales listados abajo:
//
// 1. Agrega 4 Formulas nuevas (volumen de agua, dato geométrico base
//    necesario para Equipamiento -- ver sección 10 del pedido C4.2, NO es
//    todavía Equipamiento). Usa directamente las Variables de dimensión
//    interior ya existentes desde C1 (largo/ancho/profundidad-rect,
//    diametro/profundidad-circ/radio) -- no crea preguntas nuevas, no
//    duplica geometría.
// 2. Unifica el copy de las preguntas de "pérdida" (Pintura/Cerámica/
//    Membrana en Interior, Cerámica/Porcelanato en Entorno) que la
//    auditoría global encontró inconsistente ("Margen / pérdida" vs
//    "Pérdida de instalación" para el mismo concepto según la
//    superficie) -- ver sección 17 del pedido. SOLO se cambia `label`
//    (update puntual por unique constraint, no el upsertQuestion
//    completo) -- type/order/stepGroup/visibleIf/unit quedan intactos,
//    cero riesgo de alterar el schema de esas preguntas.
async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const mod = await prisma.module.findUniqueOrThrow({ where: { slug: "piscina-integral" } });

  // ---------- 1. VOLUMEN DE AGUA ----------
  // Orders 120+ -- despues de C1(40)/C2(72)/C3(96)/C4(115).
  async function upsertFormula(input: {
    key: string;
    label: string;
    unit: string;
    expression: Prisma.InputJsonValue;
    condition?: Prisma.InputJsonValue;
    isResult: boolean;
    order: number;
    note?: string;
  }) {
    const condition: Prisma.InputJsonValue | typeof Prisma.JsonNull = input.condition ?? Prisma.JsonNull;
    await prisma.formula.upsert({
      where: { moduleId_key: { moduleId: mod.id, key: input.key } },
      create: {
        moduleId: mod.id,
        key: input.key,
        label: input.label,
        unit: input.unit,
        expression: input.expression,
        condition,
        isResult: input.isResult,
        order: input.order,
        note: input.note,
      },
      update: {
        label: input.label,
        unit: input.unit,
        expression: input.expression,
        condition,
        isResult: input.isResult,
        order: input.order,
        note: input.note,
      },
    });
  }

  const eqForma = (v: string) => ({ op: "==", args: [{ var: "forma" }, { str: v }] });

  // Supuesto explícito (sección 13 del pedido): volumen GEOMÉTRICO
  // interior, sin restar nivel libre/escalones/equipos/desplazamiento de
  // bañistas -- el `note` deja esto documentado en el propio resultado
  // (ver CollapsibleHelp "¿Cómo calculamos esta cantidad?" en
  // PricedResults, y la tarjeta secundaria de ResultScreen que reusa
  // `note` del primer resultado de secondaryHeroResultKeys).
  const AGUA_NOTE =
    "Volumen geométrico aproximado según las dimensiones interiores configuradas. No es el volumen hidráulico exacto del proyecto: no descuenta nivel libre, escalones, equipos ni desplazamiento de bañistas.";

  // Rect: largo × ancho × profundidad (mismas Variables de C1, "largo"/
  // "ancho"/"profundidad-rect" -- QUESTION sobre largo-interior-metros/
  // ancho-interior-metros/profundidad-interior-metros).
  await upsertFormula({
    key: "agua-volumen-m3-rect",
    label: "",
    unit: "m³",
    isResult: false,
    order: 120,
    condition: eqForma("rectangular"),
    expression: { op: "*", args: [{ op: "*", args: [{ var: "largo" }, { var: "ancho" }] }, { var: "profundidad-rect" }] },
  });
  // Circ: π × radio² × profundidad ("radio" ya existe desde C1, order 12,
  // isResult:false, condición circular -- se reutiliza vía {ref:}, nunca
  // se recalcula diametro/2 en paralelo).
  await upsertFormula({
    key: "agua-volumen-m3-circ",
    label: "",
    unit: "m³",
    isResult: false,
    order: 121,
    condition: eqForma("circular"),
    expression: { op: "*", args: [3.14159265358979, { op: "*", args: [{ op: "*", args: [{ ref: "radio" }, { ref: "radio" }] }, { var: "profundidad-circ" }] }] },
  });
  // Puente coalesce -- mismo criterio EXACTO que "hormigon-total" (C1.1):
  // unifica rect/circ en una sola key SIEMPRE presente, para que
  // secondaryHeroResultKeys no necesite ramificar por forma.
  await upsertFormula({
    key: "agua-volumen-m3",
    label: "Volumen de agua",
    unit: "m³",
    isResult: true,
    order: 122,
    expression: { op: "coalesce", args: [{ ref: "agua-volumen-m3-rect" }, { ref: "agua-volumen-m3-circ" }] },
    note: AGUA_NOTE,
  });
  await upsertFormula({
    key: "agua-volumen-litros",
    label: "Volumen de agua",
    unit: "L",
    isResult: true,
    order: 123,
    expression: { op: "*", args: [{ ref: "agua-volumen-m3" }, 1000] },
  });

  // ---------- 2. COPY DE PÉRDIDAS ----------
  // Solo `label` -- update puntual por unique constraint (moduleId+key),
  // nunca el helper upsertQuestion completo (evitaría tener que repetir
  // type/order/stepGroup/visibleIf/unit exactos y arriesgar un typo que
  // los altere). Pintura -> "Margen de aplicación (%)" (aplicación con
  // rodillo/brocha, manos ya preguntadas aparte); Cerámica/Porcelanato ->
  // "Pérdida por cortes (%)" (mismo concepto que ya usa la industria:
  // recorte de piezas en el perímetro); Membrana -> "Margen de
  // instalación (%)" (holgura de traslape/soldadura del rollo).
  async function relabelQuestion(key: string, label: string) {
    await prisma.question.update({
      where: { moduleId_key: { moduleId: mod.id, key } },
      data: { label },
    });
  }

  // Interior (C2) -- muros y fondo, cada material con su propio Question.key.
  await relabelQuestion("interior-pintura-perdida-muros", "Margen de aplicación (%)");
  await relabelQuestion("interior-ceramica-perdida-muros", "Pérdida por cortes (%)");
  await relabelQuestion("interior-membrana-perdida-muros", "Margen de instalación (%)");
  await relabelQuestion("interior-pintura-perdida-fondo", "Margen de aplicación (%)");
  await relabelQuestion("interior-ceramica-perdida-fondo", "Pérdida por cortes (%)");
  await relabelQuestion("interior-membrana-perdida-fondo", "Margen de instalación (%)");

  // Entorno (C4) -- una sola Question compartida por Cerámica/Porcelanato.
  // Pastelones sigue con su 8% fijo, sin pregunta (sección 17: "no crear
  // nueva pregunta" si el porcentaje no es input).
  await relabelQuestion("entorno-perdida-terminacion-pct", "Pérdida por cortes (%)");

  console.log(`Fase C4.2 (consolidación) lista para Module "piscina-integral". id=${mod.id}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
