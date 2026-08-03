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
// Redacción exacta para documentos sin respaldo directo en el listado
// oficial del Formulario 12.1 (ver clasificacion-documentos-ley-20898.md,
// sección 3) — nunca "No corresponde"/"No es necesario"/"Puedes omitirlo".
const LENGUAJE_PRUDENTE =
  "No aparece dentro de los antecedentes adjuntos del Formulario 12.1 y permanece pendiente de validación profesional. Algunas Direcciones de Obras Municipales podrían solicitarlo igualmente según el caso.";

export async function seedRegularizationDocuments(prisma: PrismaClient) {
  await prisma.regularizationDocumentCheck.deleteMany({});
  await prisma.regularizationDocumentChecklist.deleteMany({});

  // Fase 2 del plan de implementación del Informe de Evaluación Preliminar
  // — modelo de tres ejes (obligatoriedad/origen/momento) + soporteObraBien
  // + citaNormativa + estadoValidacion. Fuente exacta de esta lista:
  // clasificacion-documentos-ley-20898.md (documento cerrado, en la raíz
  // del proyecto) — específicamente su sección 2 (Tramo 1 verificado
  // contra Formulario 12.1), sección 3 (sin respaldo confirmado, lenguaje
  // prudente) y sección 4 (momento: posterior, fuera del checklist de
  // entrada). No reemplaza la necesidad de validación profesional del
  // Tramo 2 (Formulario 12.4) — ver "Pendientes explícitos" en ese mismo
  // documento.
  //
  // Nota sobre el eje `origen`: el documento de clasificación describe
  // varios orígenes compuestos en prosa (ej. "Profesional + Usuario
  // (firma conjunta)", "Usuario, con respaldo del profesional") que no
  // caben en el enum de 3 valores tal cual — se resolvieron eligiendo el
  // origen principal (quién prepara/aporta el documento en la práctica),
  // consistente con que el propio documento de clasificación aclara que
  // el modelo de datos necesita "tres atributos separados, no una sola
  // etiqueta" (la prosa es contexto legible para humanos, el enum es lo
  // normativo). Ver informe de Fase 2 para el detalle de esta decisión.
  const DOCUMENTS = [
    // ===== Tramo 1 (Formulario 12.1) — momento: previo =====
    {
      documento: "Formulario 12.1 (solicitud firmada por propietario y profesional)",
      category: "DOM",
      paraQueSirve: "Formulario formal que da inicio al trámite ante la Dirección de Obras, firmado conjuntamente por el propietario y el profesional a cargo",
      dondeSeObtiene: "DOM de la municipalidad correspondiente, con tu profesional a cargo",
      obligatoriedad: "MINIMO",
      origen: "PROFESIONAL",
      momento: "PREVIO",
      soporteObraBien: "GESTION_EXTERNA",
      citaNormativa: "Formulario 12.1 oficial MINVU",
      estadoValidacion: "VALIDADO",
      dependeDe: null,
    },
    {
      documento: "Declaración simple de no reclamaciones pendientes ante la DOM o el Juzgado de Policía Local",
      category: "DOM",
      paraQueSirve: "Declaración jurada integrada en la sección 2 del propio Formulario 12.1 — no es un documento separado, se firma junto con la solicitud",
      dondeSeObtiene: "Se completa junto con el Formulario 12.1",
      obligatoriedad: "MINIMO",
      origen: "USUARIO",
      momento: "PREVIO",
      soporteObraBien: "GESTION_EXTERNA",
      citaNormativa: "Formulario 12.1, sección 2 (declaración jurada)",
      estadoValidacion: "VALIDADO",
      dependeDe: null,
    },
    {
      documento: "Listado de documentos y planos numerados",
      category: "ARQUITECTO",
      paraQueSirve: "Índice numerado de todos los antecedentes y planos que se adjuntan al expediente",
      dondeSeObtiene: "Arquitecto o profesional competente",
      obligatoriedad: "MINIMO",
      origen: "PROFESIONAL",
      momento: "PREVIO",
      soporteObraBien: "GESTION_EXTERNA",
      citaNormativa: "Formulario 12.1, sección 6",
      estadoValidacion: "VALIDADO",
      dependeDe: null,
    },
    {
      documento: "Certificado de avalúo fiscal simple, a la fecha 04/02/2016",
      category: "MUNICIPAL",
      paraQueSirve: "Fuente oficial del avalúo fiscal del inmueble a la fecha de publicación de la ley (no el avalúo vigente actual) — el dato que cargas en el sistema sale de este certificado",
      dondeSeObtiene: "Servicio de Impuestos Internos (SII), sii.cl con Clave Única o RUT",
      obligatoriedad: "MINIMO",
      origen: "USUARIO",
      momento: "PREVIO",
      soporteObraBien: "ORIENTA_ACCESO_DIRECTO",
      citaNormativa: "Formulario 12.1, sección 6; numeral 5, art. 1° Ley 20.898",
      estadoValidacion: "VALIDADO",
      dependeDe: null,
    },
    {
      documento: "Antecedentes que acrediten antigüedad anterior al 04/02/2016",
      category: "DOM",
      paraQueSirve: "Evidencia de que la construcción existía antes del 4 de febrero de 2016 (boletas de servicios, fotografías aéreas, certificados de avalúo antiguos, u otro medio a elección)",
      dondeSeObtiene: "Reúnes tú los antecedentes disponibles, con respaldo de tu profesional",
      obligatoriedad: "MINIMO",
      origen: "USUARIO",
      momento: "PREVIO",
      soporteObraBien: "GESTION_EXTERNA",
      citaNormativa: "Formulario 12.1, sección 6",
      estadoValidacion: "VALIDADO",
      dependeDe: null,
    },
    {
      documento: "Certificado de recepción municipal anterior (si existe)",
      category: "DOM",
      paraQueSirve: "Acredita qué parte de la propiedad ya cuenta con recepción anterior, para regularizar solo lo nuevo",
      dondeSeObtiene: "DOM de la municipalidad correspondiente",
      obligatoriedad: "CONDICIONAL",
      origen: "USUARIO",
      momento: "PREVIO",
      soporteObraBien: "GESTION_EXTERNA",
      citaNormativa: "Formulario 12.1, sección 5.2 — pendiente confirmar si la DOM exige el certificado físico o basta la declaración",
      estadoValidacion: "PENDIENTE_VALIDACION_PROFESIONAL",
      // Hotfix (post-Fase 5, 2026-08-02): {var:"recepcionMunicipal"} solo,
      // sin guard, lanza "Variable no resuelta" cuando el caso no tiene
      // ese campo respondido (recepcionMunicipal: null se omite del
      // contexto — ver buildRegularizationContext). Antes solo se había
      // verificado en ejecución con el campo definido. Ahora usa el mismo
      // patrón defensivo { op: "defined" } que ya usan las Reglas #2/#4 en
      // seedRegularizationRules para este mismo campo.
      dependeDe: {
        op: "and",
        args: [{ op: "defined", key: "recepcionMunicipal" }, { var: "recepcionMunicipal" }],
      },
    },
    {
      documento: "Croquis de ubicación + plano de emplazamiento escala 1:500",
      category: "ARQUITECTO",
      paraQueSirve: "Ubica la propiedad y la construcción dentro del predio",
      dondeSeObtiene: "Lo generas tú mismo en ObraBien (croquis referencial), o tu profesional prepara la versión final",
      obligatoriedad: "MINIMO",
      origen: "PROFESIONAL",
      momento: "PREVIO",
      soporteObraBien: "GENERA_PLATAFORMA",
      citaNormativa: "Formulario 12.1, sección 6",
      estadoValidacion: "VALIDADO",
      dependeDe: null,
    },
    {
      documento: "Planos escala 1:50 (plantas, elevación, corte) + cuadro de superficies",
      category: "ARQUITECTO",
      paraQueSirve: "Documento técnico base de toda regularización — muestra lo construido tal como está, con el cuadro de superficies",
      dondeSeObtiene: "Arquitecto o profesional competente (ObraBien aporta el cálculo de recintos como insumo)",
      obligatoriedad: "MINIMO",
      origen: "PROFESIONAL",
      momento: "PREVIO",
      soporteObraBien: "GESTION_EXTERNA",
      citaNormativa: "Formulario 12.1, sección 6",
      estadoValidacion: "VALIDADO",
      dependeDe: null,
    },
    {
      documento: "Especificaciones técnicas resumidas",
      category: "ARQUITECTO",
      paraQueSirve: "Detalla materiales y soluciones constructivas usadas",
      dondeSeObtiene: "Arquitecto o profesional competente",
      obligatoriedad: "MINIMO",
      origen: "PROFESIONAL",
      momento: "PREVIO",
      soporteObraBien: "GESTION_EXTERNA",
      citaNormativa: "Formulario 12.1, sección 6",
      estadoValidacion: "VALIDADO",
      dependeDe: null,
    },
    {
      documento: "Informe del profesional competente",
      category: "ARQUITECTO",
      paraQueSirve: "Informe técnico del profesional que certifica la seguridad y habitabilidad de la construcción",
      dondeSeObtiene: "Arquitecto, ingeniero civil, ingeniero constructor o constructor civil habilitado",
      obligatoriedad: "MINIMO",
      origen: "PROFESIONAL",
      momento: "PREVIO",
      soporteObraBien: "GESTION_EXTERNA",
      citaNormativa: "Numeral 6, art. 1° Ley 20.898",
      estadoValidacion: "VALIDADO",
      dependeDe: null,
    },
    {
      documento: "Formulario único de estadísticas de edificación",
      category: "DOM",
      paraQueSirve: "Formulario estadístico oficial que acompaña toda solicitud de permiso o regularización",
      dondeSeObtiene: "Tu profesional lo completa junto con el resto del expediente",
      obligatoriedad: "MINIMO",
      origen: "PROFESIONAL",
      momento: "PREVIO",
      soporteObraBien: "GESTION_EXTERNA",
      citaNormativa: "Formulario 12.1, sección 6",
      estadoValidacion: "VALIDADO",
      dependeDe: null,
    },
    {
      documento: "Fotocopia patente del profesional que suscribe",
      category: "ARQUITECTO",
      paraQueSirve: "Acredita que el profesional está habilitado para ejercer en la comuna",
      dondeSeObtiene: "Tu profesional la aporta",
      obligatoriedad: "MINIMO",
      origen: "PROFESIONAL",
      momento: "PREVIO",
      soporteObraBien: "GESTION_EXTERNA",
      citaNormativa: "Formulario 12.1, sección 6",
      estadoValidacion: "VALIDADO",
      dependeDe: null,
    },
    {
      documento: "Proyecto de cálculo estructural",
      category: "ARQUITECTO",
      paraQueSirve: "Certifica que la estructura es segura — exigible según tamaño/material",
      dondeSeObtiene: "Ingeniero estructural o civil",
      obligatoriedad: "CONDICIONAL",
      origen: "PROFESIONAL",
      momento: "PREVIO",
      soporteObraBien: "GESTION_EXTERNA",
      citaNormativa: "Numeral 6, art. 2° Ley 20.898",
      estadoValidacion: "VALIDADO",
      dependeDe: { op: "or", args: [EXCEDE_TRAMO, MADERA_SEGUNDO_PISO] },
    },
    {
      documento: "Fotocopia cédula de identidad, propietario mayor de 65 años",
      category: "DOM",
      paraQueSirve: "Exigido cuando el propietario es mayor de 65 años",
      dondeSeObtiene: "La aportas tú",
      obligatoriedad: "CONDICIONAL",
      origen: "USUARIO",
      momento: "PREVIO",
      soporteObraBien: "GESTION_EXTERNA",
      citaNormativa: "Formulario 12.1, sección 6",
      estadoValidacion: "VALIDADO",
      // Sin pregunta de edad en el wizard hoy — fuera de alcance de esta
      // fase agregarla (no se toca el motor de reglas). Sin dependeDe
      // computable, el documento se muestra siempre como condicional.
      dependeDe: null,
    },
    {
      documento: "Acuerdo de asamblea de copropietarios",
      category: "DOM",
      paraQueSirve: "Exigido solo si la propiedad está acogida a copropiedad inmobiliaria",
      dondeSeObtiene: "Comunidad/administración de copropiedad",
      obligatoriedad: "CONDICIONAL",
      origen: "USUARIO",
      momento: "PREVIO",
      soporteObraBien: "GESTION_EXTERNA",
      citaNormativa: "Ley 21.442, si procede",
      estadoValidacion: "VALIDADO",
      dependeDe: null,
    },
    {
      documento: "Inscripción en el Registro Nacional de la Discapacidad",
      category: "DOM",
      paraQueSirve: "Exigido si corresponde acogerse a beneficios asociados a discapacidad",
      dondeSeObtiene: "Registro Civil / Registro Nacional de la Discapacidad",
      obligatoriedad: "CONDICIONAL",
      origen: "USUARIO",
      momento: "PREVIO",
      soporteObraBien: "GESTION_EXTERNA",
      citaNormativa: "Formulario 12.1, sección 6",
      estadoValidacion: "VALIDADO",
      dependeDe: null,
    },
    {
      documento: "Certificado de subsidio MINVU",
      category: "MUNICIPAL",
      paraQueSirve: "Exigido solo si el financiamiento de la construcción incluyó un subsidio MINVU",
      dondeSeObtiene: "SERVIU / MINVU",
      obligatoriedad: "CONDICIONAL",
      origen: "USUARIO",
      momento: "PREVIO",
      soporteObraBien: "GESTION_EXTERNA",
      citaNormativa: "Art. 15 Ley 20.898",
      estadoValidacion: "VALIDADO",
      dependeDe: null,
    },

    // ===== Sin respaldo confirmado en el Formulario 12.1 — lenguaje
    // prudente exacto, momento: previo, obligatoriedad: condicional =====
    {
      documento: "Certificado de Informaciones Previas (CIP)",
      category: "MUNICIPAL",
      paraQueSirve: LENGUAJE_PRUDENTE,
      dondeSeObtiene: "DOM de la municipalidad correspondiente",
      obligatoriedad: "CONDICIONAL",
      origen: "USUARIO",
      momento: "PREVIO",
      soporteObraBien: "GESTION_EXTERNA",
      citaNormativa: "Sin cita directa — típico de permisos de edificación regulares, proceso distinto al Formulario 12.1",
      estadoValidacion: "PENDIENTE_VALIDACION_PROFESIONAL",
      dependeDe: null,
    },
    {
      documento: "Copia de la escritura de la propiedad",
      category: "NOTARIA_REGISTRO",
      paraQueSirve: LENGUAJE_PRUDENTE,
      dondeSeObtiene: "Notaría donde se firmó la escritura original, o CBR",
      obligatoriedad: "CONDICIONAL",
      origen: "USUARIO",
      momento: "PREVIO",
      soporteObraBien: "GESTION_EXTERNA",
      citaNormativa: "Sin cita directa — el formulario pide datos de inscripción (fojas/año/CBR), normalmente acreditados con un certificado de dominio vigente, no con la escritura",
      estadoValidacion: "PENDIENTE_VALIDACION_PROFESIONAL",
      dependeDe: null,
    },
    {
      documento: "Informe de revisor independiente",
      category: "DOM",
      paraQueSirve: LENGUAJE_PRUDENTE,
      dondeSeObtiene: "Revisor independiente inscrito en el municipio",
      obligatoriedad: "CONDICIONAL",
      origen: "PROFESIONAL",
      momento: "PREVIO",
      soporteObraBien: "GESTION_EXTERNA",
      citaNormativa: "Sin cita directa — la figura del revisor independiente aplica típicamente a proyectos de mayor complejidad bajo la OGUC, no a esta vía simplificada",
      estadoValidacion: "PENDIENTE_VALIDACION_PROFESIONAL",
      dependeDe: EXCEDE_TRAMO,
    },
    {
      // Corrección Fase 2 (ver clasificacion-documentos-ley-20898.md,
      // sección 3 y 6, punto 4): antes `obligatorio: true` sin respaldo
      // directo — baja a condicional + lenguaje prudente.
      documento: "Certificado de dominio vigente",
      category: "NOTARIA_REGISTRO",
      paraQueSirve: LENGUAJE_PRUDENTE,
      dondeSeObtiene: "Conservador de Bienes Raíces (CBR) de la comuna",
      obligatoriedad: "CONDICIONAL",
      origen: "USUARIO",
      momento: "PREVIO",
      soporteObraBien: "GESTION_EXTERNA",
      citaNormativa: "Sin cita directa — el formulario pide datos de inscripción registral (fojas/año/CBR) que normalmente se acreditan con este certificado, pero no lo exige explícitamente como adjunto en la sección 6",
      estadoValidacion: "PENDIENTE_VALIDACION_PROFESIONAL",
      dependeDe: null,
    },
    {
      // ADVERTENCIA — clasificación TEMPORAL, no definitiva. "Memoria
      // explicativa" no está resuelta en ninguna de las 3 especificaciones
      // (diseno-informe-regularizacion.md, clasificacion-documentos-
      // ley-20898.md, plan-implementacion-informe-regularizacion.md): no
      // aparece ni en el listado oficial verificado (sección 2), ni en
      // "sin respaldo" (sección 3), ni en "sale del checklist" (sección
      // 4). Existía en el checklist antes de la Fase 2 (obligatorio:
      // true, sin respaldo citado). Para no hacerla desaparecer
      // silenciosamente ni afirmar una obligatoriedad sin respaldo
      // directo, se le aplicó el MISMO tratamiento prudente ya definido
      // para CIP/escritura/certificado de dominio (sección 3 de la
      // clasificación) — es una decisión de implementación (aplicar un
      // patrón ya aprobado a un caso no cubierto), NO una clasificación
      // normativa nueva ni definitiva. No usar esta fila como precedente
      // de que "Memoria explicativa" quedó normativamente resuelta —
      // sigue pendiente de la misma validación profesional que el resto
      // de la sección 3, y de la revisión del Formulario 12.4 (Tramo 2)
      // mencionada en esa sección. Ver informe de Fase 2, sección
      // "Contradicciones encontradas", y la aprobación de Jorge
      // (2026-08-02) que pidió esta anotación explícita.
      documento: "Memoria explicativa",
      category: "ARQUITECTO",
      paraQueSirve: LENGUAJE_PRUDENTE,
      dondeSeObtiene: "Arquitecto o profesional competente",
      obligatoriedad: "CONDICIONAL",
      origen: "PROFESIONAL",
      momento: "PREVIO",
      soporteObraBien: "GESTION_EXTERNA",
      citaNormativa: "Sin cita directa — no aparece como línea separada en el listado oficial verificado; podría estar cubierta por 'Especificaciones técnicas' o los planos",
      estadoValidacion: "PENDIENTE_VALIDACION_PROFESIONAL",
      dependeDe: null,
    },

    // ===== momento: posterior — nunca en el checklist de entrada, solo
    // en la sección "¿Qué Ocurre Después?" del informe =====
    {
      documento: "Certificado de Recepción Definitiva (resultado del trámite)",
      category: "DOM",
      paraQueSirve: "Documento final que certifica que la construcción quedó regularizada — se obtiene al final del trámite, no se aporta para iniciarlo",
      dondeSeObtiene: "DOM de la municipalidad correspondiente",
      obligatoriedad: "MINIMO",
      origen: "INSTITUCION",
      momento: "POSTERIOR",
      soporteObraBien: "GESTION_EXTERNA",
      citaNormativa: "Resultado del trámite ante la DOM",
      estadoValidacion: "VALIDADO",
      dependeDe: null,
    },
    {
      documento: "Pago de derechos municipales",
      category: "MUNICIPAL",
      paraQueSirve: "Comprobante de pago que la propia DOM calcula y emite después de revisar el expediente",
      dondeSeObtiene: "Tesorería municipal",
      obligatoriedad: "MINIMO",
      origen: "INSTITUCION",
      momento: "POSTERIOR",
      soporteObraBien: "GESTION_EXTERNA",
      citaNormativa: "Formularios 12.2 / 12.3",
      estadoValidacion: "VALIDADO",
      dependeDe: null,
    },
    {
      documento: "Inscripción de la recepción en el Conservador de Bienes Raíces",
      category: "NOTARIA_REGISTRO",
      paraQueSirve: "Paso final — deja constancia registral de la regularización, una vez obtenida la recepción definitiva",
      dondeSeObtiene: "Conservador de Bienes Raíces (CBR) de la comuna",
      obligatoriedad: "MINIMO",
      origen: "USUARIO",
      momento: "POSTERIOR",
      soporteObraBien: "GESTION_EXTERNA",
      citaNormativa: "Paso final de registro, no un requisito de entrada",
      estadoValidacion: "VALIDADO",
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
        obligatoriedad: doc.obligatoriedad,
        origen: doc.origen,
        momento: doc.momento,
        soporteObraBien: doc.soporteObraBien,
        citaNormativa: doc.citaNormativa,
        estadoValidacion: doc.estadoValidacion,
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
          // Sin literal booleano en el DSL (ver nota en Doc #9 arriba) —
          // "not({var:...})" expresa "recepcionMunicipal == false" sin
          // necesitar un nodo que el intérprete no soporta.
          { op: "not", value: { var: "recepcionMunicipal" } },
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
          // {var:"recepcionMunicipal"} solo ya resuelve al booleano real
          // — equivalente a "== true" sin necesitar un literal booleano
          // (ver nota en Doc #9).
          { var: "recepcionMunicipal" },
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
        "Más adelante, al reunir tus documentos, te pediremos tu avalúo fiscal — lo encuentras gratis en sii.cl con tu Clave Única o RUT. Por ahora puedes seguir avanzando sin él.",
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
