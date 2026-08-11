import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// FASE 6B — Etapa 3 (10-ago-2026): corrige únicamente problemas de
// trazabilidad claramente confirmados en la Etapa 3 de la auditoría (ver
// prisma/_tmp_audit_etapa3_prep.ts, ya eliminado). No se cambia ninguna
// fórmula, resultado ni porcentaje de pérdida — solo se vinculan
// normId/materialId a fuentes ya existentes y confirmadas, o se formaliza
// una fuente ya citada en texto libre.

async function fixCeramicaParaBano() {
  console.log("\n--- A) ceramica-para-bano ---");
  const mod = await prisma.module.findUniqueOrThrow({
    where: { slug: "ceramica-para-bano" },
    include: { formulas: true, variables: true },
  });

  const normFraguue = await prisma.norm.findUniqueOrThrow({ where: { code: "OBRA-FRAGÜE-CONSUMO" } });
  const matCeramica = await prisma.material.findUniqueOrThrow({ where: { key: "ceramica" } });
  const matAdhesivo = await prisma.material.findUniqueOrThrow({ where: { key: "adhesivo-pegamento" } });
  const matFraguue = await prisma.material.findUniqueOrThrow({ where: { key: "fragüe-bolsa-5kg" } });

  const varFraguue = mod.variables.find((v) => v.key === "kg-por-m2-fraguue")!;
  if (!varFraguue.normId) {
    await prisma.variable.update({ where: { id: varFraguue.id }, data: { normId: normFraguue.id } });
    console.log("  OK Variable kg-por-m2-fraguue -> normId OBRA-FRAGÜE-CONSUMO (reusado de ceramica-pisos)");
  } else {
    console.log("  SKIP (kg-por-m2-fraguue ya tiene normId)");
  }

  const materialMap: Record<string, string> = {
    "cajas-simple": matCeramica.id,
    "cajas-irregular": matCeramica.id,
    "adhesivo-simple": matAdhesivo.id,
    "adhesivo-irregular": matAdhesivo.id,
    "fragüe-simple": matFraguue.id,
    "fragüe-irregular": matFraguue.id,
  };

  for (const [key, materialId] of Object.entries(materialMap)) {
    const f = mod.formulas.find((x) => x.key === key);
    if (!f) {
      console.log(`  AVISO: no se encontró fórmula '${key}' (revisar key)`);
      continue;
    }
    if (!f.materialId) {
      await prisma.formula.update({ where: { id: f.id }, data: { materialId } });
      console.log(`  OK Formula ${key} -> materialId vinculado (reusado de ceramica-pisos)`);
    } else {
      console.log(`  SKIP (${key} ya tiene materialId)`);
    }
  }

  console.log(
    "  NOTA: pérdida 8%/15% seleccionable NO fue modificada (sin fuente para forzar alineación con " +
      "revestimiento-de-muro) — queda como recomendación pendiente de revisión futura, no como fix."
  );
}

async function fixVereda() {
  console.log("\n--- B) vereda ---");
  const mod = await prisma.module.findUniqueOrThrow({
    where: { slug: "vereda" },
    include: { formulas: true, lossFactors: true },
  });
  const norm = await prisma.norm.findUniqueOrThrow({ where: { code: "OBRA-VEREDA-DOSIFICACION-MINVU" } });

  // Solo las fórmulas cuyo contenido está efectivamente cubierto por el
  // texto de la Norm (dosificación cemento/arena/grava/agua por saco,
  // paso de juntas de contracción). area/moldaje son geometría pura;
  // volumen-premezclado documenta despacho Melón, no dosificación —no se
  // vincula. volumen-base-* ya cita esponjamiento_base_vereda (otra Norm,
  // no se toca para no duplicar cita sobre el mismo hecho).
  const formulaKeys = ["sacos-cemento", "grava", "arena", "agua", "cortes-de-junta"];
  for (const key of formulaKeys) {
    const f = mod.formulas.find((x) => x.key === key);
    if (!f) {
      console.log(`  AVISO: no se encontró fórmula '${key}'`);
      continue;
    }
    if (!f.normId) {
      await prisma.formula.update({ where: { id: f.id }, data: { normId: norm.id } });
      console.log(`  OK Formula ${key} -> normId OBRA-VEREDA-DOSIFICACION-MINVU`);
    } else {
      console.log(`  SKIP (${key} ya tiene normId)`);
    }
  }

  const lf = mod.lossFactors.find((x) => x.key === "perdida_hormigon_vereda");
  if (lf && !lf.normId) {
    await prisma.lossFactor.update({ where: { id: lf.id }, data: { normId: norm.id } });
    console.log("  OK LossFactor perdida_hormigon_vereda -> normId OBRA-VEREDA-DOSIFICACION-MINVU");
  } else if (lf) {
    console.log("  SKIP (perdida_hormigon_vereda ya tiene normId)");
  }
}

async function fixCambiarWc() {
  console.log("\n--- C) cambiar-o-instalar-un-wc ---");
  const mod = await prisma.module.findUniqueOrThrow({
    where: { slug: "cambiar-o-instalar-un-wc" },
    include: { formulas: true },
  });
  const norm = await prisma.norm.findUniqueOrThrow({ where: { code: "OBRA-WC-INSTALACION" } });

  const f = mod.formulas.find((x) => x.key === "flexible-conexion")!;
  if (!f.normId) {
    await prisma.formula.update({ where: { id: f.id }, data: { normId: norm.id } });
    console.log("  OK Formula flexible-conexion -> normId OBRA-WC-INSTALACION (mismo que wc-completo/llave-paso/silicona-sellado-base)");
  } else {
    console.log("  SKIP (flexible-conexion ya tiene normId)");
  }
}

async function fixCambiarSilicona() {
  console.log("\n--- D) cambiar-silicona ---");
  const mod = await prisma.module.findUniqueOrThrow({
    where: { slug: "cambiar-silicona" },
    include: { formulas: true, lossFactors: true, variables: true },
  });

  const code = "OBRA-SILICONA-RENDIMIENTO-CARTUCHO";
  let norm = await prisma.norm.findUnique({ where: { code } });
  if (!norm) {
    norm = await prisma.norm.create({
      data: {
        code,
        title: "Rendimiento de cartucho de silicona sanitaria/estructural (fichas técnicas Sika)",
        scope:
          "Rendimiento volumétrico de un cartucho de silicona (280.000 mm³) aplicado a un cordón " +
          "triangular según ancho de junta, para estimar metros lineales cubiertos por cartucho.",
        verificationStatus: "CITADO",
        reinforcedWarning: false,
        note:
          "Fuente: fichas técnicas Sika Sanisil HDP (mar-2025) y Sikasil Universal HDP (may-2019), " +
          "cartucho estándar de 280.000 mm³. Ya utilizada en el módulo desde su creación (Fase 4D), " +
          "formalizada aquí como Norm para trazabilidad. El 15% de desperdicio por corte/reinicio de " +
          "cordón es práctica de obra habitual, NO proviene de la ficha del fabricante — REQUIERE " +
          "VALIDACIÓN si se necesita un valor certificado.",
      },
    });
    console.log(`  OK creada Norm ${code}`);
  } else {
    console.log(`  SKIP (Norm ${code} ya existe)`);
  }

  for (const key of ["rendimiento-m-por-cartucho", "cartuchos"]) {
    const f = mod.formulas.find((x) => x.key === key);
    if (f && !f.normId) {
      await prisma.formula.update({ where: { id: f.id }, data: { normId: norm.id } });
      console.log(`  OK Formula ${key} -> normId ${code}`);
    } else if (f) {
      console.log(`  SKIP (${key} ya tiene normId)`);
    } else {
      console.log(`  AVISO: no se encontró fórmula '${key}'`);
    }
  }

  const lf = mod.lossFactors.find((x) => x.key === "desperdicio-silicona");
  if (lf && !lf.normId) {
    await prisma.lossFactor.update({ where: { id: lf.id }, data: { normId: norm.id } });
    console.log(`  OK LossFactor desperdicio-silicona -> normId ${code}`);
  } else if (lf) {
    console.log("  SKIP (desperdicio-silicona ya tiene normId)");
  }
}

async function fixAislacionTermica() {
  console.log("\n--- E) aislacion-termica-bajo-cubierta ---");
  const norm = await prisma.norm.findUniqueOrThrow({ where: { code: "OBRA-AISLACION-TECHO-RENDIMIENTO" } });

  const newScope =
    "Cobertura de lana mineral por rollo según espesor (Volcán Aislanglass: 28,8 m²/rollo a 40mm, " +
    "14,4 m²/rollo a 60/80mm, 9,0 m²/rollo a 100mm) y de poliestireno expandido por plancha " +
    "(AYRSA: 2,0 m²/plancha), con 10% de pérdida por corte.";

  if (norm.scope.includes("12 m²/rollo") || norm.scope.includes("2,88 m²/plancha")) {
    await prisma.norm.update({ where: { id: norm.id }, data: { scope: newScope } });
    console.log("  OK Norm.scope actualizado (ya no menciona los valores antiguos 12 m²/rollo / 2,88 m²/plancha)");
  } else {
    console.log("  SKIP (scope ya no contiene el texto antiguo)");
  }
}

async function main() {
  await fixCeramicaParaBano();
  await fixVereda();
  await fixCambiarWc();
  await fixCambiarSilicona();
  await fixAislacionTermica();
  console.log("\n=== Etapa 3 completada — ninguna fórmula, resultado ni pérdida fue modificada ===");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
