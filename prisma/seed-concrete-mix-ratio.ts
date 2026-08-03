import type { PrismaClient } from "../src/generated/prisma/client";

// Catálogo de dosificación — decisión de producto (2026-08-02): "si las
// fórmulas actuales utilizan una única proporción para todos los grados,
// no quiero sembrar un catálogo con proporciones diferentes solo porque
// 'suena más correcto'". Hoy TODAS las fórmulas de hormigón de la app
// (Radier, Losa, Muro, Fundación, Cadena, Viga, Escalera) usan los MISMOS
// multiplicadores por m³ sin importar el grado (G17/G20/G25):
//   cemento = 7 bolsas/m³, arena = 0.5 m³/m³, gravilla = 0.75 m³/m³
// (ver cemento_manual/arena_manual/gravilla_manual en prisma/seed-radier.ts
// — los demás módulos de hormigón replican estos mismos números).
// Por eso este catálogo tiene UNA sola fila, gradeCode="DEFAULT", en vez
// de una fila por G17/G20/G25: inventar una diferenciación por grado sería
// agregar una distinción técnica que la lógica real no tiene hoy.
//
// IMPORTANTE — nota sobre las unidades: "cementParts/sandParts/gravelParts"
// en el schema sugieren una proporción adimensional (ej. 1:2:3 por
// volumen), pero los valores de acá son los multiplicadores REALES de las
// fórmulas, en sus unidades reales (bolsas/m³ para cemento, m³/m³ para
// arena y gravilla) — no una proporción volumétrica normalizada. Convertir
// esto a una razón 1:2:3 real requeriría asumir una densidad/volumen de
// bolsa de cemento que hoy no está validada en ningún dato del proyecto.
// Se deja así, documentado, hasta que se revisen normas o especificaciones
// técnicas (ej. manual del ICH) que respalden una proporción volumétrica
// real y, eventualmente, una diferenciación por grado — ver docs/.
export async function seedConcreteMixRatio(prisma: PrismaClient) {
  await prisma.concreteMixRatio.upsert({
    where: { gradeCode: "DEFAULT" },
    update: { cementParts: 7, sandParts: 0.5, gravelParts: 0.75 },
    create: { gradeCode: "DEFAULT", cementParts: 7, sandParts: 0.5, gravelParts: 0.75 },
  });
  console.log("Seed de ConcreteMixRatio completado.");
}
