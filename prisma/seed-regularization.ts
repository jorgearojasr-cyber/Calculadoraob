// ============================================================
// CONTENIDO NORMATIVO PENDIENTE DE VALIDACIÓN PROFESIONAL.
//
// No promover este seed a producción sin revisión de un arquitecto
// o de una fuente legal primaria (Ley 20.898, OGUC,
// Formulario 12.1 MINVU).
//
// Ver matriz de validación normativa para el detalle de cada documento
// y cada regla.
// ============================================================

import type { PrismaClient } from "../src/generated/prisma/client";

// --- Predicados compartidos entre reglas y documentos (ver decisión de
// arquitectura 2026-08-01: "reglas y checklist deben compartir la misma
// lógica de negocio, sin duplicar criterios distintos") ---

// Tramos de elegibilidad a la vía simplificada — PENDIENTE DE VALIDACIÓN
// NORMATIVA. Provienen de múltiples fuentes coincidentes (blogs de
// arquitectos/corredoras), no de la cita del artículo específico de la
// Ley 20.898/OGUC. Ver matriz de validación normativa.
//   Tramo A: hasta 90 m² construidos, avalúo fiscal menor a 1.000 UF
//   Tramo B: hasta 140 m² construidos, avalúo fiscal menor a 2.000 UF
// "uf_2016" se resuelve en tiempo de evaluación desde Norm("uf-2016-02-04")
// .value — nunca con conversión en tiempo real ni llamada externa.
const TRAMO_MATCH = {
  op: "or",
  args: [
    {
      op: "and",
      args: [
        { op: "<=", args: [{ var: "m2Estimados" }, 90] },
        { op: "<", args: [{ var: "avaluoFiscalPesos" }, { op: "*", args: [1000, { var: "uf_2016" }] }] },
      ],
    },
    {
      op: "and",
      args: [
        { op: "<=", args: [{ var: "m2Estimados" }, 140] },
        { op: "<", args: [{ var: "avaluoFiscalPesos" }, { op: "*", args: [2000, { var: "uf_2016" }] }] },
      ],
    },
  ],
};

const AVALUO_DEFINED = { op: "defined", key: "avaluoFiscalPesos" };

// "Tenemos el dato Y califica" — condición de RegularizationRule #5.
const CALIFICA_TRAMO = { op: "and", args: [AVALUO_DEFINED, TRAMO_MATCH] };

// "Tenemos el dato Y NO califica" — condición de RegularizationRule #7 y
// de dependeDe en los Documentos #7/#10. Mismo bloque exacto en los 3
// lugares, para que reglas y checklist nunca diverjan en el criterio.
const EXCEDE_TRAMO = { op: "and", args: [AVALUO_DEFINED, { op: "not", value: TRAMO_MATCH }] };

const MADERA_SEGUNDO_PISO = {
  op: "and",
  args: [
    { op: "==", args: [{ var: "material" }, { str: "MADERA" }] },
    { op: "==", args: [{ var: "tipoConstruccion" }, { str: "SEGUNDO_PISO" }] },
  ],
};

// --- Norm: valor de referencia de la UF histórica ---
// Idempotente por upsert sobre `code` (@unique) — nunca inserta una
// segunda fila para el mismo código, sin importar cuántas veces se
// corra el seed.
export async function seedRegularizationNorms(prisma: PrismaClient) {
  // Fuente primaria: SII (sii.cl/valores_y_fechas/uf/uf2016.htm),
  // corroborado contra valoruf.cl — ambos coinciden en 25.629,09 pesos
  // para el 4 de febrero de 2016 (valor vigente 1-9 feb 2016, fijado el
  // 10-ene-2016; el siguiente cambio es el 10-feb-2016 a 25.633,50).
  await prisma.norm.upsert({
    where: { code: "uf-2016-02-04" },
    update: {
      title: "Valor de la UF al 4 de febrero de 2016",
      year: 2016,
      scope: "Valor de referencia monetario — conversión de umbrales legales expresados en UF a pesos",
      verificationStatus: "CITADO",
      note: "Fecha de publicación de la Ley 20.898 (\"Ley del Mono\"), usada como corte para la vía simplificada de regularización. Fuente: sii.cl/valores_y_fechas/uf/uf2016.htm, corroborado con valoruf.cl.",
      value: 25629.09,
      valueUnit: "CLP",
    },
    create: {
      code: "uf-2016-02-04",
      title: "Valor de la UF al 4 de febrero de 2016",
      year: 2016,
      scope: "Valor de referencia monetario — conversión de umbrales legales expresados en UF a pesos",
      verificationStatus: "CITADO",
      note: "Fecha de publicación de la Ley 20.898 (\"Ley del Mono\"), usada como corte para la vía simplificada de regularización. Fuente: sii.cl/valores_y_fechas/uf/uf2016.htm, corroborado con valoruf.cl.",
      value: 25629.09,
      valueUnit: "CLP",
    },
  });

  console.log('Seed de Regularización: Norm "uf-2016-02-04" lista (25.629,09 CLP, idempotente por upsert).');
}

// --- RegularizationDocumentChecklist: 15 documentos ---
// RegularizationDocumentChecklist no tiene un campo único de negocio
// (solo `id` cuid) — a diferencia de Norm, no se puede hacer upsert por
// contenido. Se sigue el mismo patrón ya usado en seedRadierModule para
// Formula/Variable/LossFactor/Question: borrar todo el contenido de este
// seed y recrearlo completo en cada corrida, para que el resultado final
// sea idéntico sin importar cuántas veces se ejecute (idempotente a nivel
// de resultado, no de fila individual).
//
// ADVERTENCIA para el futuro: RegularizationDocumentCheck referencia
// RegularizationDocumentChecklist con onDelete: Cascade. Hoy, en
// desarrollo, sin usuarios reales con casos en curso, borrar y recrear es
// inofensivo. El día que este seed corra contra una base con usuarios
// reales marcando su checklist, este patrón borraría el progreso
// existente (los checks quedarían huérfanos y se eliminarían en cascada).
// Antes de promover a producción, cambiar a upsert por un campo único de
// negocio (ej. agregar `key String @unique` al modelo) — requiere
// migración, fuera de alcance de este seed.
export async function seedRegularizationDocuments(prisma: PrismaClient) {
  await prisma.regularizationDocumentCheck.deleteMany({});
  await prisma.regularizationDocumentChecklist.deleteMany({});

  const DOCUMENTS = [
    {
      documento: "Certificado de Informaciones Previas (CIP)",
      category: "MUNICIPAL",
      paraQueSirve: "Informa la normativa urbanística aplicable al predio (uso de suelo, rasantes, etc.) antes de iniciar el trámite",
      dondeSeObtiene: "DOM de la municipalidad correspondiente",
      obligatorio: true,
      dependeDe: null,
    },
    {
      documento: "Certificado de dominio vigente",
      category: "NOTARIA_REGISTRO",
      paraQueSirve: "Acredita quién es el propietario actual del predio ante la DOM",
      dondeSeObtiene: "Conservador de Bienes Raíces (CBR) de la comuna",
      obligatorio: true,
      dependeDe: null,
    },
    {
      documento: "Copia de la escritura de la propiedad",
      category: "NOTARIA_REGISTRO",
      paraQueSirve: "Respalda el dominio junto al certificado de vigencia",
      dondeSeObtiene: "Notaría donde se firmó la escritura original, o CBR",
      obligatorio: true,
      dependeDe: null,
    },
    {
      documento: "Planos de arquitectura (planta, elevaciones, cortes)",
      category: "ARQUITECTO",
      paraQueSirve: "Documento técnico base de toda regularización — muestra lo construido tal como está",
      dondeSeObtiene: "Arquitecto o profesional competente",
      obligatorio: true,
      dependeDe: null,
    },
    {
      documento: "Memoria explicativa",
      category: "ARQUITECTO",
      paraQueSirve: "Describe en texto lo construido, materialidad y uso, acompañando los planos",
      dondeSeObtiene: "Arquitecto o profesional competente",
      obligatorio: true,
      dependeDe: null,
    },
    {
      documento: "Especificaciones técnicas",
      category: "ARQUITECTO",
      paraQueSirve: "Detalla materiales y soluciones constructivas usadas",
      dondeSeObtiene: "Arquitecto o profesional competente",
      obligatorio: false,
      dependeDe: { op: "!=", args: [{ var: "material" }, { str: "OTRO" }] },
    },
    {
      documento: "Informe de cálculo estructural",
      category: "ARQUITECTO",
      paraQueSirve: "Certifica que la estructura es segura — exigible según tamaño/material",
      dondeSeObtiene: "Ingeniero estructural o civil",
      obligatorio: false,
      dependeDe: { op: "or", args: [EXCEDE_TRAMO, MADERA_SEGUNDO_PISO] },
    },
    {
      documento: "Solicitud de regularización (formulario DOM)",
      category: "DOM",
      paraQueSirve: "Formulario formal que da inicio al trámite ante la Dirección de Obras",
      dondeSeObtiene: "DOM de la municipalidad correspondiente",
      obligatorio: true,
      dependeDe: null,
    },
    {
      documento: "Certificado de recepción municipal anterior (si existe)",
      category: "DOM",
      paraQueSirve: "Acredita qué parte de la propiedad ya cuenta con recepción, para regularizar solo lo nuevo",
      dondeSeObtiene: "DOM de la municipalidad correspondiente",
      obligatorio: false,
      dependeDe: { op: "==", args: [{ var: "recepcionMunicipal" }, true] },
    },
    {
      documento: "Informe de revisor independiente",
      category: "DOM",
      paraQueSirve: "Exigido en construcciones de mayor envergadura antes de la recepción",
      dondeSeObtiene: "Revisor independiente inscrito en el municipio",
      obligatorio: false,
      dependeDe: EXCEDE_TRAMO,
    },
    {
      documento: "Certificado de Recepción Definitiva (resultado del trámite)",
      category: "DOM",
      paraQueSirve: "Documento final que certifica que la construcción quedó regularizada",
      dondeSeObtiene: "DOM de la municipalidad correspondiente",
      obligatorio: true,
      dependeDe: null,
    },
    {
      documento: "Pago de derechos municipales",
      category: "MUNICIPAL",
      paraQueSirve: "Comprobante de pago asociado al permiso/regularización",
      dondeSeObtiene: "Tesorería municipal",
      obligatorio: true,
      dependeDe: null,
    },
    {
      documento: "Inscripción de la recepción en el Conservador de Bienes Raíces",
      category: "NOTARIA_REGISTRO",
      paraQueSirve: "Paso final — deja constancia registral de la regularización",
      dondeSeObtiene: "Conservador de Bienes Raíces (CBR) de la comuna",
      obligatorio: true,
      dependeDe: null,
    },
    {
      documento: "Certificado de Avalúo Fiscal, vigente al 4 de febrero de 2016",
      category: "MUNICIPAL",
      paraQueSirve: "Fuente oficial del avalúo fiscal del inmueble — el dato que el usuario carga en avaluoFiscalPesos sale de este certificado",
      dondeSeObtiene: "Servicio de Impuestos Internos (SII), sii.cl con Clave Única o RUT",
      obligatorio: true,
      dependeDe: null,
    },
    {
      documento: "Declaración simple de no reclamaciones pendientes ante la DOM o el Juzgado de Policía Local",
      category: "DOM",
      paraQueSirve: "Acredita que no existen litigios o reclamos pendientes sobre la propiedad que impidan la regularización",
      dondeSeObtiene: "Declaración jurada simple del propio propietario",
      obligatorio: true,
      dependeDe: null,
    },
  ] as const;

  for (let i = 0; i < DOCUMENTS.length; i++) {
    const doc = DOCUMENTS[i];
    await prisma.regularizationDocumentChecklist.create({
      data: {
        documento: doc.documento,
        category: doc.category,
        paraQueSirve: doc.paraQueSirve,
        dondeSeObtiene: doc.dondeSeObtiene,
        obligatorio: doc.obligatorio,
        dependeDe: doc.dependeDe ?? undefined,
        order: i,
      },
    });
  }

  console.log(`Seed de Regularización: ${DOCUMENTS.length} documentos recreados.`);
}

// --- RegularizationRule: 9 reglas ---
// Mismo patrón de idempotencia que los documentos (borrar y recrear
// completo) — RegularizationRule tampoco tiene un campo único de negocio
// hoy, y a diferencia de los documentos, no tiene ninguna relación con
// datos de usuario (se evalúa en vivo, nunca se persiste un resultado),
// así que borrar y recrear no tiene ningún efecto colateral, ni siquiera
// en producción.
export async function seedRegularizationRules(prisma: PrismaClient) {
  await prisma.regularizationRule.deleteMany({});

  const RULES = [
    {
      label: "Año no informado — pedir verificación",
      priority: 10,
      condition: { op: "not", value: { op: "defined", key: "anioConstruccion" } },
      message:
        "No indicaste el año de construcción — la antigüedad de la obra es clave para saber qué vía de regularización aplica. Si no tienes certeza, revisa boletas, fotos aéreas antiguas o consulta directamente en la DOM de tu comuna.",
    },
    {
      label: "Construcción antigua sin recepción — posible vía simplificada",
      priority: 20,
      condition: {
        op: "and",
        args: [
          { op: "defined", key: "anioConstruccion" },
          { op: "<", args: [{ var: "anioConstruccion" }, 2016] },
          { op: "defined", key: "recepcionMunicipal" },
          { op: "==", args: [{ var: "recepcionMunicipal" }, false] },
        ],
      },
      message:
        "Tu construcción podría calificar para una vía simplificada de regularización, pensada para obras construidas antes del 4 de febrero de 2016 sin recepción municipal. Esto es solo una orientación inicial — la evaluación definitiva la hace la DOM de tu comuna.",
    },
    {
      label: "Construcción reciente — vía simplificada probablemente no aplica",
      priority: 20,
      condition: {
        op: "and",
        args: [
          { op: "defined", key: "anioConstruccion" },
          { op: ">=", args: [{ var: "anioConstruccion" }, 2016] },
        ],
      },
      message:
        "Por la fecha de construcción, si es posterior al 4 de febrero de 2016, es probable que la vía simplificada para obras antiguas no aplique en tu caso, y debas seguir el proceso de permiso de edificación regular. Te recomendamos consultar directamente en la DOM de tu comuna.",
    },
    {
      label: "Ya cuenta con recepción municipal",
      priority: 15,
      condition: {
        op: "and",
        args: [
          { op: "defined", key: "recepcionMunicipal" },
          { op: "==", args: [{ var: "recepcionMunicipal" }, true] },
        ],
      },
      message:
        "Indicaste que esta construcción ya cuenta con recepción municipal — si es así, probablemente no necesites este proceso de regularización para esa parte de la obra. Revisa si lo que quieres regularizar es una ampliación posterior no cubierta por esa recepción.",
    },
    {
      label: "Elegibilidad preliminar por superficie y avalúo",
      priority: 30,
      condition: CALIFICA_TRAMO,
      message:
        "Según la superficie y el avalúo fiscal declarados, tu proyecto podría calificar preliminarmente para la vía simplificada. Esta información es solo orientativa y la evaluación definitiva corresponde a la Dirección de Obras Municipales.",
    },
    {
      label: "Segundo piso en madera — atención estructural",
      priority: 30,
      condition: MADERA_SEGUNDO_PISO,
      message:
        "Un segundo piso construido en madera suele requerir un informe de cálculo estructural específico, independientemente de la superficie. Considera consultar con un profesional antes de avanzar.",
    },
    {
      label: "El caso excede los tramos evaluados para la vía simplificada",
      priority: 30,
      condition: EXCEDE_TRAMO,
      message:
        "Según la superficie y el avalúo fiscal declarados, tu proyecto podría requerir documentación técnica adicional o seguir un procedimiento distinto al de la vía simplificada. Te recomendamos confirmar esta situación directamente con la Dirección de Obras Municipales de tu comuna.",
    },
    {
      label: "Avalúo fiscal no informado",
      priority: 10,
      condition: { op: "not", value: { op: "defined", key: "avaluoFiscalPesos" } },
      message:
        "No indicaste el avalúo fiscal de la propiedad — este dato es necesario para evaluar tu elegibilidad preliminar por superficie y avalúo. Puedes completarlo más adelante, cuando tengas a mano tu Certificado de Avalúo Fiscal (disponible gratis en sii.cl con tu Clave Única o RUT) — mientras tanto, puedes seguir avanzando con el resto del proceso.",
    },
    {
      label: "Recepción municipal no informada",
      priority: 10,
      condition: { op: "not", value: { op: "defined", key: "recepcionMunicipal" } },
      message:
        "No indicaste si esta construcción cuenta con recepción municipal — este dato es clave para orientar qué vía de regularización te corresponde. Si no estás seguro, puedes consultarlo en la DOM de tu comuna o revisando los documentos de la propiedad. Mientras tanto, puedes seguir avanzando con el resto del proceso.",
    },
  ];

  for (const rule of RULES) {
    await prisma.regularizationRule.create({
      data: {
        label: rule.label,
        priority: rule.priority,
        enabled: true,
        condition: rule.condition,
        message: rule.message,
      },
    });
  }

  console.log(`Seed de Regularización: ${RULES.length} reglas recreadas.`);
}

// RegularizationStepGuide queda deliberadamente sin seed — permanece
// vacía hasta que existan QuickGuide reales de medición (largo, ancho,
// altura, espesor de muro, techumbre, ventanas, puertas, recintos). La UI
// debe manejar la ausencia de guía por stepKey sin error ni placeholder
// (ver decisión de UX ya aprobada).

export async function seedRegularizationModule(prisma: PrismaClient) {
  await seedRegularizationNorms(prisma);
  await seedRegularizationDocuments(prisma);
  await seedRegularizationRules(prisma);
}
