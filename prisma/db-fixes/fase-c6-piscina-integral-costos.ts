import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Prisma } from "../../src/generated/prisma/client";

// FASE C6 -- Configurador integral de Piscina ("piscina-integral"): etapa
// final "COSTOS de materiales y partidas cotizadas".
//
// Objetivo DELIBERADAMENTE acotado (sección 1 del pedido C6): valorizar
// SOLO cantidades que el motor YA calculó -- nunca mano de obra, nunca
// Equipamiento, nunca m³ de excavación (solo viajes), nunca un
// presupuesto completo de construcción. cantidad × precio = subtotal,
// donde "cantidad" es SIEMPRE una Formula.key existente de C1-C4.2 (o una
// Formula "canónica" nueva que solo resuelve un problema de doble conteo
// ya existente en Interior, ver más abajo) -- NUNCA se recalcula una
// cantidad técnica en paralelo.
//
// Arquitectura de precios (sección 52 del pedido): se investigó el
// mecanismo YA existente de precios (CalculationResult.unitPrice +
// PricedResults, usado por Materiales en ~57 módulos) y se decidió NO
// reutilizarlo tal cual, por 2 razones concretas encontradas en el código
// real:
//   1. Ese mecanismo solo aparece para una fila con `materialName`
//      (Formula.material) y la vincula automáticamente adentro de SU
//      PROPIO grupo (ej. "Estructura") -- el pedido C6 exige explícitamente
//      que Costos sea una SECCIÓN PROPIA, no mezclada dentro de
//      ESTRUCTURA/INTERIOR/EXCAVACIÓN/ENTORNO (sección 33).
//   2. Su `parsePrice` (priced-results.tsx) trata "0" igual que vacío
//      (`num > 0` para aceptar) -- no distingue "sin precio ingresado" de
//      "precio explícito $0", algo que el pedido C6 sí exige (secciones
//      19/49). Cambiar esa función es un cambio compartido usado por TODO
//      el catálogo -- fuera de alcance ("no ampliar aceptación de 0 a
//      todo el catálogo").
// En vez de eso, cada precio es una Question NUMBER real (igual que
// cualquier otra pregunta del wizard) -- reutiliza 100% la infraestructura
// YA existente de answers/draft/SavedProject (sección 34: "no crear
// almacenamiento paralelo") y el operador DSL `defined` (ya existía,
// pensado exactamente para "Formula condicionada a que una pregunta
// NUMBER opcional haya sido respondida", ver formula-engine/types.ts) da
// la distinción real vacío/valor: si la pregunta de precio no fue
// respondida, la Variable que la envuelve no existe en el contexto, la
// Formula de subtotal (condicionada con `defined`) simplemente no se
// calcula esta vez y NO aparece en `results` -- nunca un $0 inventado. Si
// el usuario respondió "0" explícito, sí aparece, con subtotal $0 real.
//
// El "0 explícito debe ser válido" (a diferencia de cualquier medida
// física del catálogo) se resuelve con el MISMO mecanismo scopeado
// Module+Question que ya existía para "Preparación bajo losa" (ver
// src/app/(app)/categorias/[slug]/[moduleSlug]/answer-validation.ts) --
// las 10 preguntas de precio de este archivo se agregaron a ese Set, sin
// ampliar la excepción a ningún otro módulo ni pregunta.
async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const mod = await prisma.module.findUniqueOrThrow({ where: { slug: "piscina-integral" } });

  // ---------- PREGUNTAS (todas NUMBER, todas opcionales) ----------
  async function upsertQuestion(input: { key: string; label: string; unit: string; order: number; helpText?: string }) {
    await prisma.question.upsert({
      where: { moduleId_key: { moduleId: mod.id, key: input.key } },
      create: {
        moduleId: mod.id,
        key: input.key,
        label: input.label,
        type: "NUMBER",
        unit: input.unit,
        order: input.order,
        stepGroup: STEP_GROUP,
        helpText: input.helpText,
      },
      update: { label: input.label, unit: input.unit, order: input.order, stepGroup: STEP_GROUP, helpText: input.helpText },
    });
  }

  const STEP_GROUP = "costs";

  // Sección 5.
  await upsertQuestion({
    key: "costos-precio-hormigon-m3",
    label: "Precio del hormigón ($/m³)",
    unit: "$/m³",
    order: 140,
    helpText: "Ingresa el precio por metro cúbico que te cotizaron para el hormigón.",
  });
  // Sección 4.
  await upsertQuestion({
    key: "costos-precio-retiro-viaje",
    label: "Precio por viaje de retiro ($)",
    unit: "$/viaje",
    order: 141,
  });
  // Sección 7.
  await upsertQuestion({ key: "costos-precio-pintura-litro", label: "Precio pintura ($/L)", unit: "$/L", order: 142 });
  // Sección 8.
  await upsertQuestion({
    key: "costos-precio-ceramica-interior-m2",
    label: "Precio cerámica/mosaico ($/m²)",
    unit: "$/m²",
    order: 143,
  });
  // Sección 9.
  await upsertQuestion({ key: "costos-precio-membrana-m2", label: "Precio membrana ($/m²)", unit: "$/m²", order: 144 });
  // Sección 12.
  await upsertQuestion({
    key: "costos-precio-base-entorno-m3",
    label: "Precio hormigón base/radier ($/m³)",
    unit: "$/m³",
    order: 145,
  });
  // Sección 14.
  await upsertQuestion({
    key: "costos-precio-radier-terminado-m3",
    label: "Precio hormigón radier terminado ($/m³)",
    unit: "$/m³",
    order: 146,
  });
  // Sección 15.
  await upsertQuestion({
    key: "costos-precio-ceramica-entorno-m2",
    label: "Precio cerámica exterior ($/m²)",
    unit: "$/m²",
    order: 147,
  });
  // Sección 16.
  await upsertQuestion({
    key: "costos-precio-porcelanato-entorno-m2",
    label: "Precio porcelanato exterior ($/m²)",
    unit: "$/m²",
    order: 148,
  });
  // Sección 17.
  await upsertQuestion({
    key: "costos-precio-pastelon-unidad",
    label: "Precio por pastelón ($/unidad)",
    unit: "$/unidad",
    order: 149,
  });

  // ---------- VARIABLES (envuelven cada pregunta de precio) ----------
  async function upsertPriceVariable(key: string, label: string, questionKey: string) {
    await prisma.variable.upsert({
      where: { moduleId_key: { moduleId: mod.id, key } },
      create: { moduleId: mod.id, key, label, valueType: "NUMBER", source: { type: "QUESTION", questionKey }, isResult: false },
      update: { label, source: { type: "QUESTION", questionKey } },
    });
  }

  await upsertPriceVariable("costos-precio-hormigon-var", "Precio hormigón", "costos-precio-hormigon-m3");
  await upsertPriceVariable("costos-precio-retiro-var", "Precio retiro", "costos-precio-retiro-viaje");
  await upsertPriceVariable("costos-precio-pintura-var", "Precio pintura", "costos-precio-pintura-litro");
  await upsertPriceVariable("costos-precio-ceramica-interior-var", "Precio cerámica interior", "costos-precio-ceramica-interior-m2");
  await upsertPriceVariable("costos-precio-membrana-var", "Precio membrana", "costos-precio-membrana-m2");
  await upsertPriceVariable("costos-precio-base-entorno-var", "Precio base entorno", "costos-precio-base-entorno-m3");
  await upsertPriceVariable("costos-precio-radier-terminado-var", "Precio radier terminado", "costos-precio-radier-terminado-m3");
  await upsertPriceVariable("costos-precio-ceramica-entorno-var", "Precio cerámica entorno", "costos-precio-ceramica-entorno-m2");
  await upsertPriceVariable("costos-precio-porcelanato-entorno-var", "Precio porcelanato entorno", "costos-precio-porcelanato-entorno-m2");
  await upsertPriceVariable("costos-precio-pastelon-var", "Precio pastelón", "costos-precio-pastelon-unidad");

  // ---------- FORMULAS ----------
  // Orders 140+ -- despues de C1(40)/C2(72)/C3(96)/C4(115)/C4.2(123)/C5(131).
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

  const eqVar = (variable: string, value: string) => ({ op: "==", args: [{ var: variable }, { str: value }] });
  const neqVar = (variable: string, value: string) => ({ op: "!=", args: [{ var: variable }, { str: value }] });
  const orC = (...args: Prisma.InputJsonValue[]) => ({ op: "or", args });
  const andC = (...args: Prisma.InputJsonValue[]) => ({ op: "and", args });
  const definedC = (key: string) => ({ op: "defined", key });
  const subtotal = (quantityRef: string, priceVar: string) => ({
    op: "round",
    value: { op: "*", args: [{ ref: quantityRef }, { var: priceVar }] },
  });

  // --- Cantidades "canónicas" de Interior (secciones 7-10): evitan doble
  // conteo cuando muros y fondo usan terminaciones DISTINTAS -- en ese
  // caso ni "X-combinado" (exige que AMBAS superficies usen el mismo
  // material) ni tomar solo una de las 2 individuales por separado sirve
  // como fuente única. `coalesce` (ya existía en el DSL) prueba primero
  // el combinado (ambas superficies, sin doble conteo porque YA suma las
  // 2 una sola vez) y si no aplica, cae a la que sí tenga esa
  // terminación -- nunca sale de acá con las 2 individuales sumadas dos
  // veces sobre el combinado.
  await upsertFormula({
    key: "costos-pintura-cantidad-litros",
    label: "Pintura a comprar (Costos)",
    unit: "L",
    isResult: true,
    order: 140,
    condition: orC(eqVar("terminacion-muros", "pintura"), eqVar("terminacion-fondo", "pintura")),
    expression: { op: "coalesce", args: [{ ref: "pintura-litros-combinado" }, { ref: "muros-pintura-litros-total" }, { ref: "fondo-pintura-litros-total" }] },
  });
  await upsertFormula({
    key: "costos-ceramica-cantidad-m2",
    label: "Cerámica/mosaico a comprar (Costos)",
    unit: "m²",
    isResult: true,
    order: 141,
    condition: orC(eqVar("terminacion-muros", "ceramica"), eqVar("terminacion-fondo", "ceramica")),
    expression: { op: "coalesce", args: [{ ref: "ceramica-m2-combinado" }, { ref: "muros-ceramica-m2-compra" }, { ref: "fondo-ceramica-m2-compra" }] },
  });
  await upsertFormula({
    key: "costos-membrana-cantidad-m2",
    label: "Membrana a comprar (Costos)",
    unit: "m²",
    isResult: true,
    order: 142,
    condition: orC(eqVar("terminacion-muros", "membrana"), eqVar("terminacion-fondo", "membrana")),
    expression: { op: "coalesce", args: [{ ref: "membrana-m2-combinado" }, { ref: "muros-membrana-m2" }, { ref: "fondo-membrana-m2" }] },
  });

  // --- Subtotales (sección 28: cantidad × precio, sin IVA, sin
  // descuento, sin redondear la cantidad antes de multiplicar -- solo el
  // resultado monetario se redondea al peso, sección 39). Cada uno
  // condicionado a `defined(<precio>)` -- ausente en `results` si el
  // usuario no respondió esa pregunta (nunca un $0 inventado).
  await upsertFormula({
    key: "costos-hormigon-estructura-subtotal",
    label: "Hormigón de estructura (subtotal)",
    unit: "CLP",
    isResult: true,
    order: 143,
    condition: definedC("costos-precio-hormigon-var"),
    expression: subtotal("hormigon-total", "costos-precio-hormigon-var"),
  });
  await upsertFormula({
    key: "costos-retiro-tierra-subtotal",
    label: "Retiro de tierra (subtotal)",
    unit: "CLP",
    isResult: true,
    order: 144,
    condition: definedC("costos-precio-retiro-var"),
    expression: subtotal("excavacion-viajes", "costos-precio-retiro-var"),
  });
  await upsertFormula({
    key: "costos-pintura-interior-subtotal",
    label: "Pintura interior (subtotal)",
    unit: "CLP",
    isResult: true,
    order: 145,
    condition: andC(definedC("costos-precio-pintura-var"), orC(eqVar("terminacion-muros", "pintura"), eqVar("terminacion-fondo", "pintura"))),
    expression: subtotal("costos-pintura-cantidad-litros", "costos-precio-pintura-var"),
  });
  await upsertFormula({
    key: "costos-ceramica-interior-subtotal",
    label: "Cerámica/mosaico interior (subtotal)",
    unit: "CLP",
    isResult: true,
    order: 146,
    condition: andC(definedC("costos-precio-ceramica-interior-var"), orC(eqVar("terminacion-muros", "ceramica"), eqVar("terminacion-fondo", "ceramica"))),
    expression: subtotal("costos-ceramica-cantidad-m2", "costos-precio-ceramica-interior-var"),
  });
  await upsertFormula({
    key: "costos-membrana-interior-subtotal",
    label: "Membrana interior (subtotal)",
    unit: "CLP",
    isResult: true,
    order: 147,
    condition: andC(definedC("costos-precio-membrana-var"), orC(eqVar("terminacion-muros", "membrana"), eqVar("terminacion-fondo", "membrana"))),
    expression: subtotal("costos-membrana-cantidad-m2", "costos-precio-membrana-var"),
  });
  // Base entorno: MISMA condición exacta que ya usa "entorno-volumen-base"
  // (sección 14 del pedido: "mantener exactamente la lógica anti doble
  // conteo aprobada en C4") -- terminación != radier Y base existente=no.
  await upsertFormula({
    key: "costos-base-entorno-subtotal",
    label: "Hormigón base/radier del entorno (subtotal)",
    unit: "CLP",
    isResult: true,
    order: 148,
    condition: andC(
      definedC("costos-precio-base-entorno-var"),
      neqVar("entorno-terminacion", "radier"),
      eqVar("entorno-base-existente", "no")
    ),
    expression: subtotal("entorno-volumen-base", "costos-precio-base-entorno-var"),
  });
  await upsertFormula({
    key: "costos-radier-terminado-subtotal",
    label: "Radier/hormigón terminado del entorno (subtotal)",
    unit: "CLP",
    isResult: true,
    order: 149,
    condition: andC(definedC("costos-precio-radier-terminado-var"), eqVar("entorno-terminacion", "radier")),
    expression: subtotal("entorno-volumen-radier-terminado", "costos-precio-radier-terminado-var"),
  });
  await upsertFormula({
    key: "costos-ceramica-entorno-subtotal",
    label: "Cerámica exterior del entorno (subtotal)",
    unit: "CLP",
    isResult: true,
    order: 150,
    condition: andC(definedC("costos-precio-ceramica-entorno-var"), eqVar("entorno-terminacion", "ceramica")),
    expression: subtotal("entorno-ceramica-m2-compra", "costos-precio-ceramica-entorno-var"),
  });
  await upsertFormula({
    key: "costos-porcelanato-entorno-subtotal",
    label: "Porcelanato exterior del entorno (subtotal)",
    unit: "CLP",
    isResult: true,
    order: 151,
    condition: andC(definedC("costos-precio-porcelanato-entorno-var"), eqVar("entorno-terminacion", "porcelanato")),
    expression: subtotal("entorno-porcelanato-m2-compra", "costos-precio-porcelanato-entorno-var"),
  });
  // Pastelones (sección 17/45): el multiplicador es la UNIDAD ya
  // calculada (con pérdida y ceil ya aplicados, ej. 280) -- no se vuelve a
  // aplicar pérdida ni se convierte a m² para costear.
  await upsertFormula({
    key: "costos-pastelones-subtotal",
    label: "Pastelones del entorno (subtotal)",
    unit: "CLP",
    isResult: true,
    order: 152,
    condition: andC(definedC("costos-precio-pastelon-var"), eqVar("entorno-terminacion", "pastelones")),
    expression: subtotal("entorno-pastelones-unidades", "costos-precio-pastelon-var"),
  });

  console.log(`Fase C6 (costos) lista para Module "piscina-integral". id=${mod.id}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
