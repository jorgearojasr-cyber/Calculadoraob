import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

// Asesor de Ejecución — SEED INICIAL de Excavación (Fase 5, 04-ago-2026).
// Primer Asesor completo del proyecto. Todo el contenido queda en
// estado: PENDIENTE_VALIDACION, sin excepción — nada de esto se considera
// aprobado para producción hasta revisión editorial/técnica explícita.
//
// Alcance de esta fase (según lo aprobado): reglas basadas SOLO en acceso
// y tipo de terreno. NO hay reglas de volumen/profundidad todavía — eso
// es del sprint de coeficientes (m³/hora, tiempos), pendiente y fuera de
// alcance acá. La cascada de prioridad queda:
//   prioridad 1 — acceso decide solo (casos donde el acceso ya es
//                 suficiente señal: solo_peatonal, no_seguro, patio_pasillo)
//   prioridad 2 — acceso=calle_directo (ambiguo por sí solo entre
//                 retroexcavadora/excavadora) + terreno como desempate
//   prioridad 3+ — RESERVADO para volumen/profundidad, sprint de
//                 coeficientes. No existen reglas acá todavía.
//
// Cobertura de métodos (requisito de esta fase): los 4 métodos
// seleccionables en el wizard (manual, mini_excavadora, retroexcavadora,
// excavadora) tienen al menos una regla que los recomienda — evita caer
// en el Caso 2 ("sin cobertura") salvo en combinaciones de
// acceso+terreno no cubiertas aún (ninguna hoy, con solo 2 preguntas de
// entrada y 2x4 = 8 combinaciones posibles, todas cubiertas por las 5
// reglas de abajo).
//
// Mejora futura documentada, NO bloqueante para este cierre (revisión
// editorial 04-ago-2026): la pregunta "¿Qué tipo de terreno es?" no tiene
// opción "No estoy seguro" (a diferencia de la de acceso). Agregarla
// implicaría rediseñar esa pregunta del wizard, no solo el Asesor —
// se deja pendiente para un sprint aparte.
async function main() {
  const existente = await prisma.executionAdvisor.findUnique({ where: { moduleSlug: "excavacion" } });
  if (existente) {
    console.log("Ya existe un Asesor de Ejecución para excavacion — no se duplica. Bórralo primero si quieres re-sembrar.");
    return;
  }

  const advisor = await prisma.executionAdvisor.create({
    data: {
      moduleSlug: "excavacion",
      nombre: "Asesor de Ejecución — Excavación",
      estado: "PENDIENTE_VALIDACION",
      options: {
        create: [
          { key: "manual", label: "Manual", tipo: "METODO", reduceConfidence: false },
          { key: "mini_excavadora", label: "Mini excavadora", tipo: "METODO", reduceConfidence: false },
          { key: "retroexcavadora", label: "Retroexcavadora", tipo: "METODO", reduceConfidence: false },
          { key: "excavadora", label: "Excavadora", tipo: "METODO", reduceConfidence: false },
          { key: "calle_directo", label: "Calle directa, entrada amplia", tipo: "ACCESO", reduceConfidence: false },
          { key: "patio_pasillo", label: "Por patio o pasillo, algo angosto", tipo: "ACCESO", reduceConfidence: false },
          { key: "solo_peatonal", label: "Solo acceso peatonal, sin entrada de vehículos", tipo: "ACCESO", reduceConfidence: false },
          // reduceConfidence=true: el usuario mismo indica no estar
          // seguro — ver evaluate.ts, motor de Fase 2 (sin cambios).
          { key: "no_seguro", label: "No estoy seguro", tipo: "ACCESO", reduceConfidence: true },
          { key: "tierra-normal", label: "Tierra normal", tipo: "TERRENO", reduceConfidence: false },
          { key: "con-arcilla-o-piedras", label: "Con arcilla o piedras", tipo: "TERRENO", reduceConfidence: false },
        ],
      },
      rules: {
        create: [
          // --- Prioridad 1: acceso decide solo ---
          {
            prioridad: 1,
            condiciones: [
              { questionKey: "como-se-puede-acceder-al-terreno-para-excavar", operador: "equals", valor: "solo_peatonal" },
            ],
            opcionRecomendadaKey: "manual",
            confianzaBase: "ALTA",
            estado: "PENDIENTE_VALIDACION",
          },
          {
            prioridad: 1,
            condiciones: [
              { questionKey: "como-se-puede-acceder-al-terreno-para-excavar", operador: "equals", valor: "no_seguro" },
            ],
            opcionRecomendadaKey: "manual",
            confianzaBase: "ALTA", // se ajusta a MEDIA por reduceConfidence en "no_seguro"
            estado: "PENDIENTE_VALIDACION",
          },
          {
            prioridad: 1,
            condiciones: [
              { questionKey: "como-se-puede-acceder-al-terreno-para-excavar", operador: "equals", valor: "patio_pasillo" },
            ],
            opcionRecomendadaKey: "mini_excavadora",
            confianzaBase: "ALTA",
            estado: "PENDIENTE_VALIDACION",
          },
          // --- Prioridad 2: calle_directo + terreno como desempate ---
          {
            prioridad: 2,
            condiciones: [
              { questionKey: "como-se-puede-acceder-al-terreno-para-excavar", operador: "equals", valor: "calle_directo" },
              { questionKey: "que-tipo-de-terreno-es", operador: "equals", valor: "tierra-normal" },
            ],
            opcionRecomendadaKey: "retroexcavadora",
            confianzaBase: "ALTA",
            estado: "PENDIENTE_VALIDACION",
          },
          {
            prioridad: 2,
            condiciones: [
              { questionKey: "como-se-puede-acceder-al-terreno-para-excavar", operador: "equals", valor: "calle_directo" },
              { questionKey: "que-tipo-de-terreno-es", operador: "equals", valor: "con-arcilla-o-piedras" },
            ],
            opcionRecomendadaKey: "excavadora",
            confianzaBase: "MEDIA",
            estado: "PENDIENTE_VALIDACION",
          },
          // Prioridad 3+ (volumen/profundidad): reservado, sprint de
          // coeficientes — sin reglas todavía.
        ],
      },
      factorExplanations: {
        create: [
          {
            factorQuestionKey: "como-se-puede-acceder-al-terreno-para-excavar",
            condicion: { questionKey: "como-se-puede-acceder-al-terreno-para-excavar", operador: "equals", valor: "solo_peatonal" },
            fragmentoTexto: "el acceso al terreno es solo peatonal",
            peso: 10,
            tipoConsideracion: "CONSIDERACION_IMPORTANTE",
            textoConsideracion:
              "Sin acceso vehicular, vas a necesitar más tiempo y esfuerzo para sacar la tierra excavada — puede convenir coordinar ayuda extra o repartir el trabajo en varias jornadas.",
            estado: "PENDIENTE_VALIDACION",
          },
          {
            factorQuestionKey: "como-se-puede-acceder-al-terreno-para-excavar",
            condicion: { questionKey: "como-se-puede-acceder-al-terreno-para-excavar", operador: "equals", valor: "no_seguro" },
            fragmentoTexto: "todavía no estás seguro de cómo se accede al terreno",
            peso: 10,
            tipoConsideracion: "REVISA_ANTES_CONTRATAR",
            textoConsideracion:
              "Antes de coordinar máquina o ayuda extra, conviene confirmar el acceso real al terreno — puede cambiar bastante qué opción resulta más práctica.",
            estado: "PENDIENTE_VALIDACION",
          },
          {
            factorQuestionKey: "como-se-puede-acceder-al-terreno-para-excavar",
            condicion: { questionKey: "como-se-puede-acceder-al-terreno-para-excavar", operador: "equals", valor: "patio_pasillo" },
            fragmentoTexto: "el acceso es por patio o pasillo, más angosto que una entrada directa",
            peso: 8,
            tipoConsideracion: "TEN_PRESENTE",
            textoConsideracion:
              "Antes de contratar la máquina, conviene medir el ancho real del paso — no todas las mini excavadoras entran por el mismo espacio.",
            estado: "PENDIENTE_VALIDACION",
          },
          {
            factorQuestionKey: "como-se-puede-acceder-al-terreno-para-excavar",
            condicion: { questionKey: "como-se-puede-acceder-al-terreno-para-excavar", operador: "equals", valor: "calle_directo" },
            fragmentoTexto: "el terreno tiene acceso directo desde la calle",
            peso: 5,
            tipoConsideracion: null,
            textoConsideracion: null,
            estado: "PENDIENTE_VALIDACION",
          },
          {
            factorQuestionKey: "que-tipo-de-terreno-es",
            condicion: { questionKey: "que-tipo-de-terreno-es", operador: "equals", valor: "con-arcilla-o-piedras" },
            fragmentoTexto: "el terreno tiene arcilla o piedras, lo que suele hacer la excavación más lenta",
            peso: 6,
            tipoConsideracion: "TEN_PRESENTE",
            textoConsideracion:
              "Con arcilla o piedras, el trabajo puede tomar más tiempo del esperado — conviene dejar algo de holgura en la planificación.",
            estado: "PENDIENTE_VALIDACION",
          },
        ],
      },
      tips: {
        create: [
          {
            aplicaAOpcionKey: "manual",
            texto: "Ten pala, pico y carretilla a mano antes de marcar el área, para no interrumpir el trabajo a mitad de camino.",
            orden: 1,
          },
          {
            aplicaAOpcionKey: "manual",
            texto: "Confirma que el lugar donde vas a dejar la tierra excavada tenga espacio suficiente antes de empezar.",
            orden: 2,
          },
          {
            aplicaAOpcionKey: "mini_excavadora",
            texto: "Confirma con el operador el ancho exacto de acceso disponible antes de coordinar la máquina.",
            orden: 1,
          },
          {
            aplicaAOpcionKey: "mini_excavadora",
            texto: "Revisa que no haya cables, tuberías u otras instalaciones marcadas en la zona antes de que llegue la máquina.",
            orden: 2,
          },
          {
            aplicaAOpcionKey: "retroexcavadora",
            texto: "Coordina con el operador el punto de entrada y el espacio de giro de la máquina antes del día de trabajo.",
            orden: 1,
          },
          {
            aplicaAOpcionKey: "retroexcavadora",
            texto: "Verifica que el camino de acceso soporte el peso de la máquina, especialmente si hay veredas o pavimento de por medio.",
            orden: 2,
          },
          {
            aplicaAOpcionKey: "excavadora",
            texto: "Confirma con el operador el espacio de maniobra necesario — una excavadora completa suele necesitar más radio de giro que una retroexcavadora.",
            orden: 1,
          },
          {
            // Texto ajustado en revisión editorial (04-ago-2026): la
            // versión original ("Revisa si necesitas algún permiso
            // municipal...") sonaba a instrucción/advertencia legal.
            aplicaAOpcionKey: "excavadora",
            texto: "Si la maquinaria ocupará parte de la vía pública, consulta con tu municipalidad si corresponde realizar alguna coordinación o solicitar un permiso.",
            orden: 2,
          },
        ],
      },
    },
  });

  console.log("Asesor de Ejecución sembrado para excavacion, id:", advisor.id);
  console.log("Estado: PENDIENTE_VALIDACION en todo el contenido (opciones, reglas, factores, tips).");
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

main()
  .catch((e) => {
    console.error("FALLÓ:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
