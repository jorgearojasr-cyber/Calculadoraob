import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

// Fase 9A, sprint UX V1.2 (04-ago-2026): dosificación PRÁCTICA por carga de
// betonera para Radier (camino "manual" — con premezclado no aplica, el
// hormigón ya viene mezclado). Motor de cálculo únicamente — SIN
// componente de presentación (eso es Fase 9B, deliberadamente separado).
//
// Reutiliza las mismas proporciones por m³ YA validadas y en uso en
// cemento_manual/arena_manual/gravilla_manual/agua_manual (7 bolsas/m³,
// 0.5 m³/m³, 0.75 m³/m³, 180 L/m³) — no se inventa una dosificación
// nueva, solo se expresa la MISMA receta por carga de una betonera de
// referencia en vez de solo como total del proyecto.
//
// ============================================================
// SUPUESTO TÉCNICO PENDIENTE DE VALIDACIÓN DE CAMPO (documentado
// explícitamente, igual que el patrón ya usado en el Asesor de Ejecución
// de Excavación) — Formula no tiene un campo `estado` en el schema, así
// que este aviso vive acá y en el propio `note` visible al usuario:
//
//   - Betonera de referencia: 130 litros de capacidad NOMINAL (tamaño
//     común en obra chica/mediana — no es un dato que el usuario elija,
//     es la referencia fija de esta fase).
//   - Rendimiento real asumido: 65% de la capacidad nominal. Una
//     betonera no rinde 130 litros de hormigón mezclado por carga — los
//     áridos secos ocupan más volumen ANTES de mezclarse (esponjamiento)
//     que el hormigón ya mezclado y compactado. 65% es una regla
//     práctica de obra, no un valor medido para ESTE proyecto — queda
//     pendiente de validación con datos reales antes de tratarse como
//     definitivo.
//   - Rendimiento por carga: 130 L × 0.65 = 84.5 L = 0.0845 m³/carga.
// ============================================================
const CARGA_M3 = 0.0845;

async function main() {
  const radier = await prisma.module.findUnique({ where: { slug: "radier" } });
  if (!radier) throw new Error("No se encontró el módulo 'radier'.");

  const existing = await prisma.formula.findUnique({
    where: { moduleId_key: { moduleId: radier.id, key: "numero_cargas_betonera" } },
  });
  if (existing) {
    console.log("Ya existe 'numero_cargas_betonera' — no se duplica. Bórrala primero si quieres re-sembrar.");
    return;
  }

  const condicionManual = { op: "==", args: [{ var: "metodo_hormigon" }, { str: "manual" }] };

  const numeroCargas = await prisma.formula.create({
    data: {
      moduleId: radier.id,
      key: "numero_cargas_betonera",
      label: "Cargas de betonera",
      // "carga" (no "carga(s)") — pluralizeUnit ya agrega la "s" sola para
      // plural (ver src/lib/pluralize.ts); el "(s)" manual duplicaba el
      // sufijo y producía "17 carga(s)es" (bug real, corregido en
      // fix-radier-cargas-betonera-unit.ts tras verlo en el wizard).
      unit: "carga",
      order: 10,
      isResult: true,
      isSecondary: false,
      condition: condicionManual,
      expression: { op: "ceil", value: { op: "/", args: [{ ref: "volumen_con_perdida" }, CARGA_M3] } },
      note: "Referencia: betonera de 130 litros de capacidad nominal, con un rendimiento real estimado de 65% (por el esponjamiento de los áridos secos antes de mezclar) — cada carga rinde aprox. 84,5 litros de hormigón mezclado. Este supuesto está pendiente de validación con datos reales de obra.",
    },
  });

  const cementoPorCarga = await prisma.formula.create({
    data: {
      moduleId: radier.id,
      key: "cemento_por_carga",
      label: "Cemento por carga",
      unit: "kg",
      order: 11,
      isResult: true,
      isSecondary: true,
      condition: condicionManual,
      expression: { op: "round", value: { op: "*", args: [7, CARGA_M3, 25] } },
    },
  });

  const arenaPorCarga = await prisma.formula.create({
    data: {
      moduleId: radier.id,
      key: "arena_por_carga",
      label: "Arena por carga",
      unit: "litro",
      order: 12,
      isResult: true,
      isSecondary: true,
      condition: condicionManual,
      expression: { op: "round", value: { op: "*", args: [0.5, CARGA_M3, 1000] } },
      note: "Aprox. 2 baldes de 20 litros.",
    },
  });

  const gravillaPorCarga = await prisma.formula.create({
    data: {
      moduleId: radier.id,
      key: "gravilla_por_carga",
      label: "Gravilla por carga",
      unit: "litro",
      order: 13,
      isResult: true,
      isSecondary: true,
      condition: condicionManual,
      expression: { op: "round", value: { op: "*", args: [0.75, CARGA_M3, 1000] } },
      note: "Aprox. 3 baldes de 20 litros.",
    },
  });

  const aguaPorCarga = await prisma.formula.create({
    data: {
      moduleId: radier.id,
      key: "agua_por_carga",
      label: "Agua por carga",
      unit: "litro",
      order: 14,
      isResult: true,
      isSecondary: true,
      condition: condicionManual,
      expression: { op: "round", value: { op: "*", args: [180, CARGA_M3] } },
    },
  });

  console.log("Fórmulas creadas:", [numeroCargas, cementoPorCarga, arenaPorCarga, gravillaPorCarga, aguaPorCarga].map((f) => f.key));
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

main()
  .catch((e) => {
    console.error("FALLÓ:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
