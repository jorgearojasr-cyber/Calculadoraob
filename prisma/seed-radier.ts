import type { PrismaClient } from "../src/generated/prisma/client";

export async function seedRadierModule(prisma: PrismaClient) {
  const category = await prisma.category.findUniqueOrThrow({ where: { slug: "hormigon" } });

  const mod = await prisma.module.upsert({
    where: { slug: "radier" },
    update: {
      name: "Radier",
      description: "Losa de hormigón sobre el terreno para patios, antepisos y estacionamientos",
      categoryId: category.id,
      published: true,
    },
    create: {
      slug: "radier",
      name: "Radier",
      description: "Losa de hormigón sobre el terreno para patios, antepisos y estacionamientos",
      categoryId: category.id,
      published: true,
    },
  });

  // Limpiar contenido previo del módulo para que el seed sea idempotente.
  await prisma.formula.deleteMany({ where: { moduleId: mod.id } });
  await prisma.lossFactor.deleteMany({ where: { moduleId: mod.id } });
  await prisma.variable.deleteMany({ where: { moduleId: mod.id } });
  await prisma.questionOption.deleteMany({ where: { question: { moduleId: mod.id } } });
  await prisma.question.deleteMany({ where: { moduleId: mod.id } });

  const qUso = await prisma.question.create({
    data: {
      moduleId: mod.id,
      key: "uso",
      label: "¿Para qué usarás este radier?",
      type: "SELECT",
      order: 1,
      options: {
        create: [
          { key: "patio_terraza", label: "Patio o terraza", order: 1 },
          { key: "antepiso_interior", label: "Antepiso interior", order: 2 },
          { key: "estacionamiento", label: "Estacionamiento", order: 3 },
          { key: "bodega_industrial", label: "Bodega o industrial", order: 4 },
        ],
      },
    },
  });

  await prisma.question.create({
    data: {
      moduleId: mod.id,
      key: "largo",
      label: "¿Cuánto mide de largo?",
      type: "NUMBER",
      unit: "m",
      order: 2,
    },
  });

  await prisma.question.create({
    data: {
      moduleId: mod.id,
      key: "ancho",
      label: "¿Cuánto mide de ancho?",
      type: "NUMBER",
      unit: "m",
      order: 3,
    },
  });

  await prisma.question.create({
    data: {
      moduleId: mod.id,
      key: "metodo_hormigon",
      label: "¿Cómo vas a obtener el hormigón?",
      type: "SELECT",
      order: 4,
      options: {
        create: [
          { key: "premezclado", label: "Comprarlo premezclado (camión mixer)", order: 1 },
          { key: "manual", label: "Prepararlo tú mismo en obra", order: 2 },
        ],
      },
    },
  });

  await prisma.variable.createMany({
    data: [
      {
        moduleId: mod.id,
        key: "largo",
        valueType: "NUMBER",
        source: { type: "QUESTION", questionKey: "largo" },
        order: 1,
      },
      {
        moduleId: mod.id,
        key: "ancho",
        valueType: "NUMBER",
        source: { type: "QUESTION", questionKey: "ancho" },
        order: 2,
      },
      {
        moduleId: mod.id,
        key: "espesor_cm",
        valueType: "NUMBER",
        source: {
          type: "LOOKUP",
          questionKey: "uso",
          table: {
            patio_terraza: 8,
            antepiso_interior: 7,
            estacionamiento: 10,
            bodega_industrial: 12,
          },
        },
        order: 3,
      },
      {
        moduleId: mod.id,
        key: "tipo_hormigon",
        valueType: "TEXT",
        source: {
          type: "LOOKUP",
          questionKey: "uso",
          table: {
            patio_terraza: "H-20",
            antepiso_interior: "H-20",
            estacionamiento: "H-25",
            bodega_industrial: "H-30",
          },
        },
        order: 4,
      },
      {
        moduleId: mod.id,
        key: "metodo_hormigon",
        valueType: "TEXT",
        source: { type: "QUESTION", questionKey: "metodo_hormigon" },
        order: 5,
      },
    ],
  });

  const [cemento, arena, gravilla, agua] = await Promise.all([
    prisma.material.upsert({
      where: { key: "cemento_25kg" },
      update: {},
      create: { key: "cemento_25kg", name: "Cemento (bolsa 25kg)", unit: "bolsa" },
    }),
    prisma.material.upsert({
      where: { key: "arena" },
      update: {},
      create: { key: "arena", name: "Arena", unit: "m³" },
    }),
    prisma.material.upsert({
      where: { key: "gravilla" },
      update: {},
      create: { key: "gravilla", name: "Gravilla", unit: "m³" },
    }),
    prisma.material.upsert({
      where: { key: "agua" },
      update: {},
      create: { key: "agua", name: "Agua", unit: "litro" },
    }),
  ]);

  await prisma.lossFactor.create({
    data: {
      moduleId: mod.id,
      key: "perdida_hormigon",
      label: "Pérdida de hormigón en vaciado",
      percentage: 0.07,
    },
  });

  const volumenBruto = {
    op: "*",
    args: [{ var: "largo" }, { var: "ancho" }, { op: "/", args: [{ var: "espesor_cm" }, 100] }],
  };

  const volumenConPerdida = {
    op: "lossFactor",
    key: "perdida_hormigon",
    value: { ref: "volumen_bruto" },
  };

  const esPremezclado = {
    op: "==",
    args: [{ var: "metodo_hormigon" }, { str: "premezclado" }],
  };

  const esManual = {
    op: "==",
    args: [{ var: "metodo_hormigon" }, { str: "manual" }],
  };

  await prisma.formula.createMany({
    data: [
      {
        moduleId: mod.id,
        key: "volumen_bruto",
        label: "Volumen bruto",
        unit: "m³",
        expression: volumenBruto,
        isResult: false,
        order: 1,
      },
      {
        moduleId: mod.id,
        key: "volumen_con_perdida",
        label: "Volumen con pérdida",
        unit: "m³",
        expression: volumenConPerdida,
        isResult: false,
        order: 2,
      },
      {
        moduleId: mod.id,
        key: "volumen_premezclado",
        label: "Volumen de hormigón a pedir",
        unit: "m³",
        expression: { op: "ceilTo", value: { ref: "volumen_con_perdida" }, step: 0.5 },
        condition: esPremezclado,
        isResult: true,
        note: "Despacho mínimo habitual de camiones mixer: 3 m³. Si tu cálculo da menos, probablemente igual te cobren el mínimo — consulta con tu proveedor.",
        order: 3,
      },
      {
        moduleId: mod.id,
        key: "cemento_manual",
        label: "Cemento",
        unit: "bolsa",
        expression: { op: "ceil", value: { op: "*", args: [{ ref: "volumen_con_perdida" }, 7] } },
        condition: esManual,
        isResult: true,
        materialId: cemento.id,
        order: 4,
      },
      {
        moduleId: mod.id,
        key: "arena_manual",
        label: "Arena",
        unit: "m³",
        expression: { op: "*", args: [{ ref: "volumen_con_perdida" }, 0.5] },
        condition: esManual,
        isResult: true,
        materialId: arena.id,
        order: 5,
      },
      {
        moduleId: mod.id,
        key: "gravilla_manual",
        label: "Gravilla",
        unit: "m³",
        expression: { op: "*", args: [{ ref: "volumen_con_perdida" }, 0.75] },
        condition: esManual,
        isResult: true,
        materialId: gravilla.id,
        order: 6,
      },
      {
        moduleId: mod.id,
        key: "agua_manual",
        label: "Agua",
        unit: "litro",
        expression: { op: "*", args: [{ ref: "volumen_con_perdida" }, 180] },
        condition: esManual,
        isResult: true,
        materialId: agua.id,
        order: 7,
      },
    ],
  });

  console.log("Seed del módulo Radier completado.");
}
