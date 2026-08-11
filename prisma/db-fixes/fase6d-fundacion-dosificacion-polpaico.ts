import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// FASE 6D (10-ago-2026): corrige arena/gravilla/agua de "fundacion" a los
// valores verificados en Fase 6C desde la fuente primaria Polpaico
// "Dosificaciones", tabla EN BALDE, fila CIMIENTOS (baldes de 10 L):
//   10 baldes arena/saco, 9 baldes grava/saco, 1,5 baldes agua/saco, 7
//   sacos cemento/m³.
// Conversión (verificada desde cero en Fase 6C, no reutilizada sin más):
//   arena  = 10,0 baldes/saco × 10 L/balde × 7 sacos/m³ = 700 L/m³ = 0,700 m³/m³
//   grava  =  9,0 baldes/saco × 10 L/balde × 7 sacos/m³ = 630 L/m³ = 0,630 m³/m³
//   agua   =  1,5 baldes/saco × 10 L/balde × 7 sacos/m³ = 105 L/m³
//
// Alcance estricto: solo arena/gravilla/agua de "fundacion". NO se toca
// cemento (ya correcto en 7 sacos/m³), volumen/pérdida/premezclado/despacho,
// preguntas, Radier, piscinas, ni la Norm compartida
// OBRA-HORMIGON-DOSIFICACION-MANUAL (usada también por Radier/piscinas/D).
// Se crea una Norm específica para documentar esta fuente puntual.

async function main() {
  const mod = await prisma.module.findUniqueOrThrow({
    where: { slug: "fundacion" },
    include: { formulas: true },
  });

  const code = "OBRA-FUNDACION-DOSIFICACION-POLPAICO-CIMIENTOS";
  let norm = await prisma.norm.findUnique({ where: { code } });
  if (!norm) {
    norm = await prisma.norm.create({
      data: {
        code,
        title: "Dosificación de fundaciones (cimientos) — Polpaico, tabla EN BALDE",
        scope:
          "Proporción de arena, grava y agua por m³ de hormigón para fundaciones/cimientos de hormigón " +
          "vaciado manualmente.",
        verificationStatus: "CITADO",
        reinforcedWarning: false,
        note:
          "Fuente: Polpaico, documento \"Dosificaciones\" (VOL_DOSIFICACION_jul_2020_ok.pdf, creado " +
          "23-07-2020), tabla \"EN BALDE\" (sacos de cemento de 25 kg y baldes de 10 litros), fila " +
          "CIMIENTOS: 10 baldes de arena/saco, 9 baldes de grava/saco, 1,5 baldes de agua/saco, 7 sacos " +
          "de cemento por m³. Conversión: arena = 10 baldes × 10 L × 7 sacos/m³ = 700 L/m³ = 0,700 m³/m³; " +
          "grava = 9 baldes × 10 L × 7 sacos/m³ = 630 L/m³ = 0,630 m³/m³; agua = 1,5 baldes × 10 L × 7 " +
          "sacos/m³ = 105 L/m³. Se usó exclusivamente la tabla EN BALDE (baldes de 10 L declarados " +
          "explícitamente) — la tabla EN SACO de ese mismo documento mide arena/grava en \"sacos\" sin " +
          "litraje declarado y no es convertible a m³, por lo que no se usó. Validado en Fase 6C contra " +
          "las filas Radieres sin armar y Pavimento tránsito vehicular menor de la misma tabla, sin " +
          "encontrar inconsistencias.",
      },
    });
    console.log(`OK creada Norm ${code}`);
  } else {
    console.log(`SKIP (Norm ${code} ya existe)`);
  }

  const targets: Array<{ key: string; coefficient: number }> = [
    { key: "arena", coefficient: 0.7 },
    { key: "gravilla", coefficient: 0.63 },
    { key: "agua", coefficient: 105 },
  ];

  for (const { key, coefficient } of targets) {
    const f = mod.formulas.find((x) => x.key === key);
    if (!f) {
      console.log(`AVISO: no se encontró fórmula '${key}'`);
      continue;
    }
    const expr = f.expression as { op: string; args: unknown[] };
    if (expr.op !== "*" || !Array.isArray(expr.args) || expr.args.length !== 2) {
      console.log(`AVISO: expresión de '${key}' no tiene la forma esperada {op:"*", args:[ref, coef]}, revisar manualmente`);
      continue;
    }
    const newExpression = { op: "*", args: [expr.args[0], coefficient] };
    await prisma.formula.update({
      where: { id: f.id },
      data: { expression: newExpression as object, normId: norm.id },
    });
    console.log(`OK Formula '${key}': coeficiente -> ${coefficient}, normId -> ${code}`);
  }

  console.log("\n=== Fase 6D completada — cemento, volumen, pérdida, premezclado y demás módulos no fueron tocados ===");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
