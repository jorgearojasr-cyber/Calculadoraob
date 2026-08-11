import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// FASE 3C — Cierre de correcciones técnicas pendientes (09-ago-2026).
// Ejecuta las 4 correcciones aprobadas tras la validación de fuentes de
// Fase 3B. Cada bloque cita su fuente en el propio código — ver el informe
// de cierre para el detalle completo.

async function main() {
  await fixRadierAridosYAgua();
  await fixDespachoMinimoDosNiveles();
  await fixDuchaExplicacionYAltura();
  await fixEstucoFuenteChilena();
  console.log("\n=== FASE 3C completada ===");
}

// ---------------------------------------------------------------------------
// 1. radier — arena/grava/agua diferenciados por dosificación (antes fijos
// en 0,5 m³ / 0,75 m³ / 180 L para cualquier uso). Fuente: Polpaico,
// "Dosificaciones" (misma tabla ya usada para el cemento, jul-2020, sobre
// NCh170:2016) — tabla "EN BALDE", convertida a m³/m³ y L/m³:
//   Radieres sin armar (10 sacos/m³):        arena 0,70 / grava 0,60 / agua 100L
//   Pavimento tránsito vehicular (15 sacos/m³): arena 0,60 / grava 0,75 / agua 150L
// ---------------------------------------------------------------------------
async function fixRadierAridosYAgua() {
  console.log("\n--- 1. radier — arena/grava/agua por dosificación (Polpaico) ---");
  const mod = await prisma.module.findUniqueOrThrow({
    where: { slug: "radier" },
    include: { variables: true, formulas: true },
  });

  const usoTable = {
    patio_terraza: "sin_armar",
    antepiso_interior: "sin_armar",
    estacionamiento: "vehicular",
    bodega_industrial: "vehicular",
  };

  async function upsertVariable(key: string, label: string, table: Record<string, number>) {
    const existing = mod.variables.find((v) => v.key === key);
    const source = { type: "LOOKUP", questionKey: "uso", table };
    if (!existing) {
      await prisma.variable.create({ data: { moduleId: mod.id, key, label, valueType: "NUMBER", source } });
      console.log(`  OK creada variable ${key}`);
    } else {
      await prisma.variable.update({ where: { id: existing.id }, data: { source } });
      console.log(`  OK actualizada variable ${key}`);
    }
  }

  // Las 4 opciones de "uso" se mapean directo a las 2 dosificaciones
  // Polpaico (sin_armar / vehicular) — se listan las 4 explícitamente en
  // cada tabla en vez de depender de la variable intermedia usoTable, para
  // que cada LOOKUP sea autocontenida y auditable por separado.
  await upsertVariable("arena-m3-por-m3", "Arena (m³ por m³ de hormigón)", {
    patio_terraza: 0.7,
    antepiso_interior: 0.7,
    estacionamiento: 0.6,
    bodega_industrial: 0.6,
  });
  await upsertVariable("grava-m3-por-m3", "Grava (m³ por m³ de hormigón)", {
    patio_terraza: 0.6,
    antepiso_interior: 0.6,
    estacionamiento: 0.75,
    bodega_industrial: 0.75,
  });
  await upsertVariable("agua-litros-por-m3", "Agua (litros por m³ de hormigón)", {
    patio_terraza: 100,
    antepiso_interior: 100,
    estacionamiento: 150,
    bodega_industrial: 150,
  });
  void usoTable; // documentación del mapeo — no se usa como variable propia, cada LOOKUP ya lo aplica directo.

  const fuente =
    "Polpaico, \"Dosificaciones\" (jul-2020, tabla sobre NCh170:2016) — mismo documento ya citado para el cemento. Radieres sin armar (10 sacos/m³): arena 0,70 m³/m³, grava 0,60 m³/m³, agua 100 L/m³. Pavimento tránsito vehicular menor (15 sacos/m³): arena 0,60 m³/m³, grava 0,75 m³/m³, agua 150 L/m³. Corrige los valores anteriores (arena 0,5 / grava 0,75 / agua 180 L, fijos para cualquier dosificación).";

  const fArena = mod.formulas.find((f) => f.key === "arena_manual")!;
  await prisma.formula.update({
    where: { id: fArena.id },
    data: {
      expression: { op: "*", args: [{ ref: "volumen_con_perdida" }, { var: "arena-m3-por-m3" }] },
      note: `${fuente} → {ref:volumen_con_perdida} m³ × {arena-m3-por-m3} = {value} {unit}.`,
    },
  });
  console.log("  OK fórmula arena_manual: 0,5 m³/m³ fijo -> 0,70 o 0,60 según dosificación");

  const fGravilla = mod.formulas.find((f) => f.key === "gravilla_manual")!;
  await prisma.formula.update({
    where: { id: fGravilla.id },
    data: {
      expression: { op: "*", args: [{ ref: "volumen_con_perdida" }, { var: "grava-m3-por-m3" }] },
      note: `${fuente} → {ref:volumen_con_perdida} m³ × {grava-m3-por-m3} = {value} {unit}.`,
    },
  });
  console.log("  OK fórmula gravilla_manual: 0,75 m³/m³ fijo -> 0,60 o 0,75 según dosificación");

  const fAgua = mod.formulas.find((f) => f.key === "agua_manual")!;
  await prisma.formula.update({
    where: { id: fAgua.id },
    data: {
      expression: { op: "*", args: [{ ref: "volumen_con_perdida" }, { var: "agua-litros-por-m3" }] },
      note: `${fuente} → {ref:volumen_con_perdida} m³ × {agua-litros-por-m3} = {value} {unit}.`,
    },
  });
  console.log("  OK fórmula agua_manual: 180 L/m³ fijo -> 100 o 150 según dosificación");

  // Las variantes "por carga de betonera" replican la misma proporción —
  // antes también usaban 0,5 / 0,75 / 180 hardcodeados.
  const fArenaCarga = mod.formulas.find((f) => f.key === "arena_por_carga")!;
  await prisma.formula.update({
    where: { id: fArenaCarga.id },
    data: {
      expression: { op: "round", value: { op: "*", args: [{ var: "arena-m3-por-m3" }, { ref: "carga_betonera_m3" }, 1000] } },
    },
  });
  const fGravillaCarga = mod.formulas.find((f) => f.key === "gravilla_por_carga")!;
  await prisma.formula.update({
    where: { id: fGravillaCarga.id },
    data: {
      expression: { op: "round", value: { op: "*", args: [{ var: "grava-m3-por-m3" }, { ref: "carga_betonera_m3" }, 1000] } },
    },
  });
  const fAguaCarga = mod.formulas.find((f) => f.key === "agua_por_carga")!;
  await prisma.formula.update({
    where: { id: fAguaCarga.id },
    data: {
      expression: { op: "round", value: { op: "*", args: [{ var: "agua-litros-por-m3" }, { ref: "carga_betonera_m3" }] } },
    },
  });
  console.log("  OK fórmulas *_por_carga también usan la proporción por dosificación");

  await prisma.norm.update({
    where: { code: "OBRA-RADIER-ESPESOR-DOSIF" },
    data: {
      note:
        "Cemento, arena, grava y agua: tabla de dosificaciones Polpaico (jul-2020, sobre NCh170:2016) — \"Radieres y sobrecimientos sin armar\" (10 sacos/m³ = 250 kg/m³; arena 0,70 m³/m³; grava 0,60 m³/m³; agua 100 L/m³) para patio/antepiso interior; \"Pavimento tránsito vehicular menor\" (15 sacos/m³ = 375 kg/m³; arena 0,60 m³/m³; grava 0,75 m³/m³; agua 150 L/m³) para estacionamiento/bodega. Corrige el valor anterior (7 sacos/m³ y arena/grava/agua fijos en 0,5/0,75/180L para todo uso). Espesores por uso siguen sin verificar contra fuente específica.",
    },
  });
  console.log("  OK norma OBRA-RADIER-ESPESOR-DOSIF actualizada — arena/grava/agua ya no marcados REQUIERE VALIDACIÓN");
}

// ---------------------------------------------------------------------------
// 2. Despacho mínimo — deja de presentarse como una cifra universal (antes
// "3 m³", luego unificada entre radier/fundación). Fuente: Melón, Términos
// y Condiciones (tienda.melon.cl/terms-condictions) — hay 2 servicios
// distintos, no 1 mínimo: mixer tradicional (referencia 7,5 m³, recargo
// por carga incompleta) y mixer volumétrico (desde 0,5 m³). No se calcula
// ningún volumen nuevo — solo cambia el texto explicativo de la nota.
// ---------------------------------------------------------------------------
async function fixDespachoMinimoDosNiveles() {
  console.log("\n--- 2. Despacho mínimo — reformulado en 2 niveles (radier + fundación) ---");
  const nuevaNota =
    "El costo/condición de despacho depende del tipo de servicio, no de un \"mínimo\" único (Melón, Términos y Condiciones, tienda.melon.cl/terms-condictions): con camión mixer tradicional, el precio se calcula sobre una referencia de 7,5 m³ por viaje — pedir menos puede generar un recargo por carga incompleta, pero igual te lo despachan. Si tu proyecto es chico, algunos proveedores ofrecen mixer volumétrico (planta móvil) desde 0,5 m³, sin ese recargo. Consulta directamente con tu proveedor qué servicio te conviene — esto es información comercial orientativa, no una regla técnica.";

  for (const slug of ["radier", "fundacion"]) {
    const mod = await prisma.module.findUniqueOrThrow({ where: { slug }, include: { formulas: true } });
    const f = mod.formulas.find((x) => x.key === "volumen_premezclado")!;
    await prisma.formula.update({ where: { id: f.id }, data: { note: nuevaNota } });
    console.log(`  OK nota de despacho actualizada en ${slug} (ya no dice "3 m³" como mínimo universal)`);
  }
}

// ---------------------------------------------------------------------------
// 3. instalar-una-ducha — corrige la explicación del consumo (Sika
// Sikalastic-1K es 1,2 kg/m² POR MM DE ESPESOR, no "por mano") y marca
// explícitamente la altura de 2,0 m como criterio de obra, no como dato
// de la ficha Sika. El valor numérico (2,4 kg/m²) NO cambia.
// ---------------------------------------------------------------------------
async function fixDuchaExplicacionYAltura() {
  console.log("\n--- 3. instalar-una-ducha — corrige explicación (no cambia el valor 2,4 kg/m²) ---");
  const mod = await prisma.module.findUniqueOrThrow({
    where: { slug: "instalar-una-ducha" },
    include: { formulas: true },
  });

  const nuevaNotaFormula =
    "Consumo de referencia según espesor especificado por fabricante (Sika Sikalastic-1K: 1,2 kg/m² por mm de espesor) — se asume un espesor total de 2 mm en 2 capas (esquema bajo cerámica), 2,4 kg/m². Altura de aplicación de 2,0 m: criterio de obra utilizado para esta estimación, no es una exigencia de Sika ni aparece en su ficha técnica. Ducha de rincón (2 muros) — ajusta el resultado si tu ducha tiene otra configuración.";

  const f = mod.formulas.find((x) => x.key === "kg-membrana-impermeabilizante-ducha")!;
  await prisma.formula.update({ where: { id: f.id }, data: { note: nuevaNotaFormula } });
  console.log("  OK nota de la fórmula corregida: ya no dice 'por mano', altura marcada como criterio de obra");

  const nuevaNotaNorma =
    "Sika Sikalastic-1K (mortero impermeabilizante monocomponente reforzado con fibras, ficha oficial Sika Chile jun-2025 v.03.01, industry.sika.com/content/dam/dms/cl01/4/sikalastic-1k.pdf), indicado para \"impermeabilizaciones de techos, balcones, terrazas, muros, baños, duchas, antes de la aplicación de baldosas cerámicas\". Consumo declarado: 1,2 kg/m² POR MM DE ESPESOR (no \"por mano\" — corrección de Fase 3C). Esquema bajo cerámica de la ficha: 2 capas de 2 mm con rodillo → 2,4 kg/m². La ficha también documenta una especificación general más conservadora (mínimo 3 mm en 2 capas, probada a 3,6 kg/m² según ensayo de estanqueidad EN14891 A.7) — no se adoptó en esta fase por decisión explícita, queda como referencia. La ficha NO menciona altura de aplicación ni \"zona de salpicadura\" para duchas — los 2,0 m usados en esta calculadora son un criterio de obra, no una exigencia del fabricante ni de una norma.";
  await prisma.norm.update({
    where: { code: "OBRA-DUCHA-IMPERMEABILIZACION-MEMBRANA-LIQUIDA" },
    data: { note: nuevaNotaNorma },
  });
  console.log("  OK norma OBRA-DUCHA-IMPERMEABILIZACION-MEMBRANA-LIQUIDA actualizada");
}

// ---------------------------------------------------------------------------
// 4. preparar-y-estucar-un-muro — actualiza la cita de fuente de Sika
// Uruguay a Sika Chile (Presec E01/E03), que confirma el mismo valor con
// fuente local. El valor numérico (25 kg/m²) NO cambia.
// ---------------------------------------------------------------------------
async function fixEstucoFuenteChilena() {
  console.log("\n--- 4. preparar-y-estucar-un-muro — actualiza fuente a Sika Chile (sin cambiar el valor) ---");
  await prisma.norm.update({
    where: { code: "OBRA-ESTUCO-MURO-RENDIMIENTOS" },
    data: {
      note:
        "Estuco completo (25 kg/m² a 1,5 cm): Sika Chile, ficha \"Presec E01 Estuco Exterior Normal\" (chl.sika.com/dms/getdocument.get/412f86f9-f111-4217-80f6-8da3ee736377/presec-e01-normalexteriorstucco.pdf, jul-2026, v.01.05) — \"≈15 litros de mezcla por saco de 25kg, ≈1,5 m² a 10mm de espesor\" → 25,0 kg/m² a 1,5cm, coincide exactamente. Producto certificado NCh 2256/1 (estuco exterior grado M-C). Contraste: ficha \"Presec E03 Estuco Interior y Exterior\" (chl.sika.com, jun-2026, v.01.06) da 26,2 kg/m² a 1,5cm — variante levemente distinta, dentro de un rango razonable. Reemplaza la fuente anterior (Sika Uruguay, regional) por una fuente 100% chilena que confirma el mismo valor. Retoque puntual (0,3 kg/m²) se mantiene como práctica de obra no verificada, sin cambio.",
    },
  });
  console.log("  OK norma OBRA-ESTUCO-MURO-RENDIMIENTOS actualizada: fuente Uruguay -> Sika Chile (valor 25kg/m² sin cambio)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
