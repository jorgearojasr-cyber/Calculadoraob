import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Prisma } from "../../src/generated/prisma/client";

// FASE A — Piscinas: correcciones funcionales/de configuración/contenido,
// SIN tocar ilustraciones (eso es Fase B). Ver
// docs (reporte de auditoría previo, no versionado en este script) para
// el diagnóstico completo. Aplica exclusivamente a:
//   - piscina-rectangular-hormigon-armado
//   - piscina-circular-hormigon-armado
// Ningún módulo ajeno (Excavación, Radier, Pastelones, Cerámica,
// Porcelanato, Fundación, Pilar, Jardinera) se toca acá.
//
// Confirmado antes de ejecutar (ver _tmp_fasea_check_saved.ts, ya
// eliminado): 0 SavedProject reales sobre ninguno de los 2 módulos — el
// riesgo de romper un resultado guardado real es nulo hoy.

const ESPESOR_HELPTEXT =
  "Valor referencial para estimación. El espesor definitivo depende del diseño estructural, dimensiones de la piscina, suelo y condiciones del proyecto.";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  // --- Normas/avisos reutilizando NormsDisclaimer (ver
  // src/components/module/norms-disclaimer.tsx) — mecanismo ya existente,
  // ningún componente nuevo. reinforcedWarning:true = banner rojo
  // (reservado para el aviso de tamaño fuera de rango); false = banner
  // ámbar informativo (refuerzo/impermeabilización, siempre visibles).
  const normFueraDeRango = await prisma.norm.upsert({
    where: { code: "piscina-tamano-fuera-de-rango" },
    update: {
      note: "Tu piscina supera el rango que este estimador cubre con confianza razonable (profundidad mayor a 2 m o superficie de fondo mayor a 100 m²). Te recomendamos que un profesional revise el diseño estructural antes de construir.",
      reinforcedWarning: true,
    },
    create: {
      code: "piscina-tamano-fuera-de-rango",
      title: "Piscina fuera del rango típico residencial",
      scope: "Alcance de esta estimación de materiales para piscinas de hormigón armado",
      verificationStatus: "PRACTICA_GENERAL_NO_VERIFICADA",
      reinforcedWarning: true,
      note: "Tu piscina supera el rango que este estimador cubre con confianza razonable (profundidad mayor a 2 m o superficie de fondo mayor a 100 m²). Te recomendamos que un profesional revise el diseño estructural antes de construir.",
    },
  });

  const normRefuerzo = await prisma.norm.upsert({
    where: { code: "piscina-refuerzo-estructural-pendiente" },
    update: {},
    create: {
      code: "piscina-refuerzo-estructural-pendiente",
      title: "Refuerzo estructural de piscina — pendiente de cálculo estructural",
      scope: "Alcance del resultado de refuerzo/armadura en piscinas de hormigón armado",
      verificationStatus: "PRACTICA_GENERAL_NO_VERIFICADA",
      reinforcedWarning: false,
      note: "Refuerzo estructural: requiere definición según cálculo estructural. El refuerzo depende, entre otros factores, de las dimensiones, suelo, napa y condiciones estructurales del proyecto.",
    },
  });

  const normImpermeabilizacion = await prisma.norm.upsert({
    where: { code: "piscina-impermeabilizacion-aviso" },
    update: {},
    create: {
      code: "piscina-impermeabilizacion-aviso",
      title: "Impermeabilización de piscina — aclaración de alcance",
      scope: "Relación entre terminación interior e impermeabilización del vaso en piscinas de hormigón armado",
      verificationStatus: "PRACTICA_GENERAL_NO_VERIFICADA",
      reinforcedWarning: false,
      note: "La terminación interior no reemplaza el sistema de impermeabilización del vaso. La solución definitiva depende del sistema constructivo utilizado.",
    },
  });

  console.log("Normas listas:", normFueraDeRango.code, normRefuerzo.code, normImpermeabilizacion.code);

  for (const cfg of [
    {
      slug: "piscina-rectangular-hormigon-armado",
      revestimientoQuestionKey: "que-revestimiento-vas-a-usar",
      // Geometría: L = largo, A = ancho, e = espesor-muro-cm/100, p = profundidad.
      volumenMurosExpr: {
        op: "*",
        args: [
          {
            op: "-",
            args: [
              {
                op: "*",
                args: [
                  { op: "+", args: [{ var: "largo" }, { op: "*", args: [2, { op: "/", args: [{ var: "espesor-muro-cm" }, 100] }] }] },
                  { op: "+", args: [{ var: "ancho" }, { op: "*", args: [2, { op: "/", args: [{ var: "espesor-muro-cm" }, 100] }] }] },
                ],
              },
              { op: "*", args: [{ var: "largo" }, { var: "ancho" }] },
            ],
          },
          { var: "profundidad" },
        ],
      },
    },
    {
      slug: "piscina-circular-hormigon-armado",
      revestimientoQuestionKey: "revestimiento",
      // Geometría: r = radio (ya calculado como fórmula "radio"), e = espesor-muro-cm/100, p = profundidad.
      volumenMurosExpr: {
        op: "*",
        args: [
          3.14159265358979,
          {
            op: "-",
            args: [
              {
                op: "*",
                args: [
                  { op: "+", args: [{ ref: "radio" }, { op: "/", args: [{ var: "espesor-muro-cm" }, 100] }] },
                  { op: "+", args: [{ ref: "radio" }, { op: "/", args: [{ var: "espesor-muro-cm" }, 100] }] },
                ],
              },
              { op: "*", args: [{ ref: "radio" }, { ref: "radio" }] },
            ],
          },
          { var: "profundidad" },
        ],
      },
    },
  ] as const) {
    const mod = await prisma.module.findUniqueOrThrow({ where: { slug: cfg.slug } });
    console.log(`\n=== ${cfg.slug} ===`);

    // ---------- 1. Revestimiento: eliminar Fulget ----------
    const revQuestion = await prisma.question.findUniqueOrThrow({
      where: { moduleId_key: { moduleId: mod.id, key: cfg.revestimientoQuestionKey } },
    });
    const deletedOption = await prisma.questionOption.deleteMany({
      where: { questionId: revQuestion.id, key: "fulget" },
    });
    console.log(`  Opción "fulget" eliminada: ${deletedOption.count}`);

    for (const varKey of ["perdida-revestimiento", "cobertura-por-unidad-m"] as const) {
      const variable = await prisma.variable.findUnique({ where: { moduleId_key: { moduleId: mod.id, key: varKey } } });
      if (!variable) continue;
      const source = variable.source as { type: string; table?: Record<string, number>; questionKey?: string };
      if (source.table && "fulget" in source.table) {
        const { fulget: _fulget, ...restTable } = source.table;
        void _fulget;
        await prisma.variable.update({
          where: { id: variable.id },
          data: { source: { ...source, table: restTable } },
        });
        console.log(`  Variable "${varKey}": key "fulget" removida de la tabla LOOKUP`);
      }
    }

    // ---------- 2. Eliminar "Solo el borde" y su pregunta condicional ----------
    const alcanceQuestion = await prisma.question.findUnique({
      where: { moduleId_key: { moduleId: mod.id, key: "alcance-revestimiento" } },
    });
    const anchoBordeQuestion = await prisma.question.findUnique({
      where: { moduleId_key: { moduleId: mod.id, key: "ancho-del-borde-a-revestir-cm" } },
    });
    // Fórmulas exclusivas de la rama "solo-borde" — huérfanas sin la pregunta.
    const deletedFormulasBorde = await prisma.formula.deleteMany({
      where: { moduleId: mod.id, key: { in: ["area-revestimiento-borde", "area-revestimiento-con-perdida-borde", "revestimiento-borde"] } },
    });
    console.log(`  Fórmulas de "solo borde" eliminadas: ${deletedFormulasBorde.count}`);

    if (anchoBordeQuestion) {
      await prisma.question.delete({ where: { id: anchoBordeQuestion.id } });
      console.log(`  Pregunta "ancho-del-borde-a-revestir-cm" eliminada`);
    }
    if (alcanceQuestion) {
      await prisma.question.delete({ where: { id: alcanceQuestion.id } });
      console.log(`  Pregunta "alcance-revestimiento" eliminada`);
    }
    for (const varKey of ["alcance-revestimiento", "ancho-borde-cm"]) {
      const del = await prisma.variable.deleteMany({ where: { moduleId: mod.id, key: varKey } });
      if (del.count) console.log(`  Variable "${varKey}" eliminada`);
    }

    // Fase 2 ahora calcula EXCLUSIVAMENTE "todo el interior" — se quita la
    // condición de la rama que antes solo corría si alcance=todo-interior
    // (ahora es la única rama que existe).
    await prisma.formula.update({
      where: { moduleId_key: { moduleId: mod.id, key: "area-revestimiento-con-perdida" } },
      data: { condition: Prisma.JsonNull },
    });
    await prisma.formula.update({
      where: { moduleId_key: { moduleId: mod.id, key: "revestimiento" } },
      data: { condition: Prisma.JsonNull, label: "Revestimiento (interior)" },
    });
    console.log(`  Fórmulas "area-revestimiento-con-perdida"/"revestimiento": condición de alcance removida`);

    // ---------- 3. Espesores: helpText no normativo + dejan de ser "resultado" ----------
    for (const qKey of ["espesor-de-los-muros-cm", "espesor-del-fondo-losa-cm"]) {
      await prisma.question.update({
        where: { moduleId_key: { moduleId: mod.id, key: qKey } },
        data: { helpText: ESPESOR_HELPTEXT },
      });
    }
    await prisma.variable.update({
      where: { moduleId_key: { moduleId: mod.id, key: "espesor-muro-cm" } },
      data: { isResult: false },
    });
    await prisma.variable.update({
      where: { moduleId_key: { moduleId: mod.id, key: "espesor-fondo-cm" } },
      data: { isResult: false },
    });
    console.log(`  Espesores: helpText actualizado, isResult=false (dejan de mostrarse como resultado)`);
    // NOTA: NO se agrega defaultSource:20 a estas preguntas en esta fase —
    // PENDIENTE_VALIDACION explícito (ver sección 3 del pedido). El
    // mecanismo genérico de precarga editable (defaultSource, ya usado por
    // "tipo-de-camion" en Excavación) sigue disponible sin cambios de
    // código si se decide activarlo más adelante.

    // ---------- 4. Hormigón: corregir volumen de muros + desglose ----------
    const hormigonBruto = await prisma.formula.findUniqueOrThrow({
      where: { moduleId_key: { moduleId: mod.id, key: "hormigon-bruto" } },
    });
    const hormigonTotal = await prisma.formula.findUniqueOrThrow({
      where: { moduleId_key: { moduleId: mod.id, key: "hormigon" } },
    });

    await prisma.formula.upsert({
      where: { moduleId_key: { moduleId: mod.id, key: "volumen-muros-m3" } },
      update: { expression: cfg.volumenMurosExpr },
      create: {
        moduleId: mod.id,
        key: "volumen-muros-m3",
        label: "Volumen de muros (anillo, corregido)",
        unit: "m³",
        expression: cfg.volumenMurosExpr,
        isResult: false,
        order: 15,
      },
    });
    await prisma.formula.upsert({
      where: { moduleId_key: { moduleId: mod.id, key: "hormigon-fondo" } },
      update: {},
      create: {
        moduleId: mod.id,
        key: "hormigon-fondo",
        label: "Hormigón fondo/losa",
        unit: "m³",
        expression: { op: "*", args: [{ ref: "area-fondo" }, { op: "/", args: [{ var: "espesor-fondo-cm" }, 100] }] },
        isResult: true,
        order: 16,
        note: "Sin el 7% de pérdida de vaciado — ya incluido solo en \"Hormigón total\", para no sumarlo dos veces.",
      },
    });
    await prisma.formula.upsert({
      where: { moduleId_key: { moduleId: mod.id, key: "hormigon-muros" } },
      update: {},
      create: {
        moduleId: mod.id,
        key: "hormigon-muros",
        label: "Hormigón muros",
        unit: "m³",
        expression: { ref: "volumen-muros-m3" },
        isResult: true,
        order: 17,
        note: "Volumen real del anillo de muros (incluye las 4 esquinas) — sin el 7% de pérdida de vaciado, ya incluido solo en \"Hormigón total\".",
      },
    });
    await prisma.formula.update({
      where: { id: hormigonBruto.id },
      data: {
        expression: { op: "+", args: [{ ref: "hormigon-fondo" }, { ref: "hormigon-muros" }] },
        order: 20,
      },
    });
    await prisma.formula.update({
      where: { id: hormigonTotal.id },
      data: { label: "Hormigón total" },
    });
    console.log(`  Hormigón: volumen de muros corregido (geometría de anillo con esquinas), desglose fondo/muros/total agregado`);

    // ---------- 5. Malla/refuerzo: quitar regla automática ----------
    const deletedMalla = await prisma.formula.deleteMany({
      where: { moduleId: mod.id, key: { in: ["malla-recomendada-simple", "malla-recomendada-doble"] } },
    });
    console.log(`  Fórmulas de malla eliminadas: ${deletedMalla.count}`);

    await prisma.formula.upsert({
      where: { moduleId_key: { moduleId: mod.id, key: "refuerzo-estructural-aviso" } },
      update: { normId: normRefuerzo.id },
      create: {
        moduleId: mod.id,
        key: "refuerzo-estructural-aviso",
        label: "Refuerzo estructural",
        unit: "info",
        expression: 1,
        condition: Prisma.JsonNull,
        isResult: false,
        order: 46,
        normId: normRefuerzo.id,
      },
    });

    // ---------- 6. Impermeabilización: aclaración de alcance (siempre visible) ----------
    await prisma.formula.upsert({
      where: { moduleId_key: { moduleId: mod.id, key: "impermeabilizacion-aviso" } },
      update: { normId: normImpermeabilizacion.id },
      create: {
        moduleId: mod.id,
        key: "impermeabilizacion-aviso",
        label: "Impermeabilización",
        unit: "info",
        expression: 1,
        condition: Prisma.JsonNull,
        isResult: false,
        order: 47,
        normId: normImpermeabilizacion.id,
      },
    });

    // ---------- 7. Aviso de tamaño fuera de rango: mecanismo de banner ----------
    await prisma.formula.update({
      where: { moduleId_key: { moduleId: mod.id, key: "aviso-tamano-fuera-de-rango" } },
      data: { normId: normFueraDeRango.id },
    });
    console.log(`  Aviso de tamaño fuera de rango: conectado a Norm (banner reforzado vía NormsDisclaimer)`);
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
