import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

// Fase 9A, corrección post-revisión (04-ago-2026): el rendimiento por
// carga (0.0845 m³ = 130L × 65%) se sembró como un literal repetido en 5
// `Formula.expression` distintas (una vez directo, 4 veces multiplicado
// dentro de cada fórmula "por carga"). Si el supuesto cambia (ej. 65% →
// 70%), habría que editar 5 filas en vez de 1.
//
// Se centraliza en una NUEVA fórmula interna `carga_betonera_m3`
// (isResult: false, no se muestra al usuario — es un valor de apoyo, no
// un resultado) y las otras 5 pasan a referenciarla vía `{"ref": ...}`
// — el mismo mecanismo de referencia entre fórmulas ya usado en todo el
// motor (ej. volumen_con_perdida referenciado por cemento_manual/etc).
// Cero cambios en formula-engine: `ref` a otra fórmula ya es un nodo
// soportado, esto es solo reorganizar CÓMO se arma el JSON, no un
// mecanismo nuevo.
const CARGA_M3 = 0.0845;

async function main() {
  const radier = await prisma.module.findUnique({ where: { slug: "radier" } });
  if (!radier) throw new Error("No se encontró el módulo 'radier'.");

  const condicionManual = { op: "==", args: [{ var: "metodo_hormigon" }, { str: "manual" }] };

  const existente = await prisma.formula.findUnique({
    where: { moduleId_key: { moduleId: radier.id, key: "carga_betonera_m3" } },
  });
  if (!existente) {
    await prisma.formula.create({
      data: {
        moduleId: radier.id,
        key: "carga_betonera_m3",
        label: "Rendimiento por carga de betonera (interno)",
        unit: "m³",
        order: 9,
        isResult: false,
        isSecondary: false,
        condition: condicionManual,
        expression: CARGA_M3,
      },
    });
    console.log("Creada carga_betonera_m3.");
  } else {
    console.log("carga_betonera_m3 ya existía — no se duplica.");
  }

  const updates: { key: string; expression: object }[] = [
    {
      key: "numero_cargas_betonera",
      expression: { op: "ceil", value: { op: "/", args: [{ ref: "volumen_con_perdida" }, { ref: "carga_betonera_m3" }] } },
    },
    {
      key: "cemento_por_carga",
      expression: { op: "round", value: { op: "*", args: [7, { ref: "carga_betonera_m3" }, 25] } },
    },
    {
      key: "arena_por_carga",
      expression: { op: "round", value: { op: "*", args: [0.5, { ref: "carga_betonera_m3" }, 1000] } },
    },
    {
      key: "gravilla_por_carga",
      expression: { op: "round", value: { op: "*", args: [0.75, { ref: "carga_betonera_m3" }, 1000] } },
    },
    {
      key: "agua_por_carga",
      expression: { op: "round", value: { op: "*", args: [180, { ref: "carga_betonera_m3" }] } },
    },
  ];

  for (const u of updates) {
    const result = await prisma.formula.updateMany({
      where: { moduleId: radier.id, key: u.key },
      data: { expression: u.expression },
    });
    console.log(`${u.key}: ${result.count} fila(s) actualizada(s).`);
  }
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

main()
  .catch((e) => {
    console.error("FALLÓ:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
