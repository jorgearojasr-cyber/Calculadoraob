import type {
  AsesorEjecucionEvaluacion,
  ExecutionAdvisorCondition,
  ExecutionAdvisorConfianzaNivel,
  ExecutionAdvisorConfig,
  ExecutionAdvisorFactorExplanationData,
  ExecutionAdvisorTipoConsideracion,
  WizardAnswersLike,
} from "./types";

// Asesor de Ejecución — motor de evaluación (Fase 2, 04-ago-2026).
// Función PURA: sin React, sin Prisma, sin I/O — toda la información
// (respuestas, preguntas, configuración del asesor) llega por parámetro.
// Ver Fase 0/2 (decisión de arquitectura): la resolución moduleSlug ->
// ExecutionAdvisorConfig vive en un loader aparte que SÍ usa Prisma; ese
// loader no es parte de este archivo.
//
// Toda la especialización de Excavación (qué preguntas existen, qué
// opciones son válidas, qué reglas aplican) viene de `config` — este
// archivo no conoce ningún questionKey ni optionKey de Excavación en
// particular. La antigua constante `RESPUESTAS_INCIERTAS` (2 literales
// hardcodeados "no_seguro"/"no_se") se reemplazó por
// `ExecutionAdvisorOption.reduceConfidence` (04-ago-2026, tras auditoría
// de variantes de incertidumbre en el proyecto) — ver `tieneReduceConfidence`.

const NIVELES_CONFIANZA: ExecutionAdvisorConfianzaNivel[] = ["baja", "media", "alta"];

const ETIQUETAS_CONSIDERACION: Record<ExecutionAdvisorTipoConsideracion, string> = {
  ten_presente: "Ten presente",
  consideracion_importante: "Consideración importante",
  revisa_antes_contratar: "Revisa antes de contratar",
};

function valorComoTexto(valor: string | number | undefined): string | undefined {
  if (valor === undefined) return undefined;
  return String(valor);
}

function evaluarCondicion(condicion: ExecutionAdvisorCondition, answers: WizardAnswersLike): boolean {
  const respuesta = valorComoTexto(answers[condicion.questionKey]);
  if (respuesta === undefined) return false;

  if (condicion.operador === "equals") {
    return respuesta === condicion.valor;
  }

  // "in"
  const valores = Array.isArray(condicion.valor) ? condicion.valor : [condicion.valor];
  return valores.includes(respuesta);
}

function evaluarCondiciones(condiciones: ExecutionAdvisorCondition[], answers: WizardAnswersLike): boolean {
  return condiciones.every((condicion) => evaluarCondicion(condicion, answers));
}

// Cascada por prioridad (ver Fase 2): prioridad ascendente = se evalúa
// primero. La convención esperada del seed (Fase 5) es prioridad 1 para
// reglas de acceso, 2 para terreno, 3+ para volumen/profundidad como
// desempate — pero el motor no conoce esos nombres, solo ordena por el
// número y toma la primera regla cuyas condiciones (AND) se cumplan
// todas.
//
// EMPATES DE PRIORIDAD (documentado en Fase 10B, sin cambiar el
// comportamiento): `Array.prototype.sort` es estable en JS/V8, así que
// entre 2 reglas con la MISMA `prioridad`, gana la que aparezca primero
// en `config.rules` — es decir, el orden en que el loader las entrega
// (hoy: el orden de inserción/`id` de la tabla, no `prioridad` como
// segundo criterio explícito). No es una decisión de negocio, es un
// efecto secundario de la implementación. En los datos reales de
// Excavación (Fase 5) no hay 2 reglas de la misma prioridad cuyas
// condiciones puedan cumplirse simultáneamente, así que hoy no se
// manifiesta — pero si una futura Fase 10C agrega una regla que sí
// empate con otra existente, el resultado dependerá de un orden no
// declarado explícitamente en el seed. Aceptable temporalmente (no
// bloquea el gate de publicación de Fase 10B), pero debe resolverse
// antes de escalar el catálogo de reglas más allá de lo actual.
function encontrarReglaGanadora(config: ExecutionAdvisorConfig, answers: WizardAnswersLike) {
  const reglasOrdenadas = [...config.rules].sort((a, b) => a.prioridad - b.prioridad);
  return reglasOrdenadas.find((regla) => evaluarCondiciones(regla.condiciones, answers)) ?? null;
}

// Factores activos: aquellos cuya `condicion` se cumple contra las
// respuestas reales — no todos los factores configurados participan en
// cada evaluación, solo los que aplican a esta combinación de respuestas.
function factoresActivos(
  factorExplanations: ExecutionAdvisorFactorExplanationData[],
  answers: WizardAnswersLike
): ExecutionAdvisorFactorExplanationData[] {
  return factorExplanations
    .filter((factor) => evaluarCondicion(factor.condicion, answers))
    .sort((a, b) => b.peso - a.peso);
}

// Lee el flag directamente de la opción que corresponde a esta respuesta
// — si la respuesta no coincide con ninguna opción cargada, se asume
// false (mismo criterio por defecto que la columna en BD).
function tieneReduceConfidence(config: ExecutionAdvisorConfig, respuesta: string): boolean {
  return config.options.find((o) => o.key === respuesta)?.reduceConfidence ?? false;
}

function bajarUnNivel(nivel: ExecutionAdvisorConfianzaNivel): ExecutionAdvisorConfianzaNivel {
  const index = NIVELES_CONFIANZA.indexOf(nivel);
  return NIVELES_CONFIANZA[Math.max(0, index - 1)];
}

// Texto explicativo compuesto dinámicamente (ver Fase 2: "no textos fijos
// por regla") a partir del factor decisivo (mayor peso entre los activos)
// y el nivel de confianza final.
function componerTextoExplicativo(
  nivel: ExecutionAdvisorConfianzaNivel,
  factorDecisivo: ExecutionAdvisorFactorExplanationData | undefined,
  fueDegradada: boolean
): string {
  const etiquetaNivel = nivel === "alta" ? "Alta confianza" : nivel === "media" ? "Confianza media" : "Confianza baja";
  if (!factorDecisivo) return `${etiquetaNivel}.`;

  const base = `${etiquetaNivel}: ${factorDecisivo.fragmentoTexto}.`;
  if (!fueDegradada) return base;

  return `${base} La certeza de esta respuesta es baja, así que la confianza de la recomendación se ajustó a la baja.`;
}

// Determina qué método eligió REALMENTE el usuario — de forma genérica,
// sin conocer los questionKeys de Excavación: busca, entre TODAS las
// respuestas dadas, cuál coincide con una key que ALGUNA regla pueda
// recomendar (`config.rules[].opcionRecomendadaKey`). Deliberadamente NO
// usa `config.options` para esto (a diferencia de la versión anterior a
// `reduceConfidence`, 04-ago-2026): `options` ahora incluye también
// opciones de acceso/terreno (para que el motor pueda leer su
// `reduceConfidence`), así que ya no representa "solo métodos" — usar esa
// lista acá detectaría por error una respuesta de acceso/terreno como si
// fuera el método elegido. "Método real" se define como "una key que al
// menos una regla reconoce como recomendable", que es justo lo que hace
// falta para poder comparar con la recomendación.
function detectarEleccionUsuario(config: ExecutionAdvisorConfig, answers: WizardAnswersLike): string | null {
  const metodosValidos = new Set(config.rules.map((r) => r.opcionRecomendadaKey));
  for (const valor of Object.values(answers)) {
    const texto = valorComoTexto(valor);
    if (texto !== undefined && metodosValidos.has(texto)) return texto;
  }
  return null;
}

// Firma: (answers, config) — ver informe de cierre de Fase 2 para la
// justificación de por qué se omiten `moduleSlug` y `allQuestions` frente
// a la especificación original (ninguno de los dos aporta información
// que el motor use: `config` ya viene resuelto/filtrado por moduleSlug
// por el loader, y ninguna regla necesita el objeto Question completo,
// solo su `key`).
export function evaluarAsesorEjecucion(
  answers: WizardAnswersLike,
  config: ExecutionAdvisorConfig
): AsesorEjecucionEvaluacion {
  const reglaGanadora = encontrarReglaGanadora(config, answers);
  const eleccionMetodoKey = detectarEleccionUsuario(config, answers);

  if (!reglaGanadora) {
    return {
      recomendacion: null,
      eleccionUsuario: { metodoKey: eleccionMetodoKey, difiereDeRecomendacion: false },
      antesDeComenzar: {
        tips: config.tips
          .filter((tip) => tip.aplicaAOpcionKey === eleccionMetodoKey)
          .sort((a, b) => a.orden - b.orden)
          .map((tip) => tip.texto),
      },
    };
  }

  const activos = factoresActivos(config.factorExplanations, answers);
  const factorDecisivo = activos[0];
  const respuestaFactorDecisivo = factorDecisivo
    ? valorComoTexto(answers[factorDecisivo.factorQuestionKey])
    : undefined;
  const esFactorDecisivoIncierto =
    respuestaFactorDecisivo !== undefined && tieneReduceConfidence(config, respuestaFactorDecisivo);

  const nivelFinal = esFactorDecisivoIncierto
    ? bajarUnNivel(reglaGanadora.confianzaBase)
    : reglaGanadora.confianzaBase;

  const opcionRecomendada = config.options.find((o) => o.key === reglaGanadora.opcionRecomendadaKey);

  const difiereDeRecomendacion =
    eleccionMetodoKey !== null && eleccionMetodoKey !== reglaGanadora.opcionRecomendadaKey;

  const tipsDeLaEleccionReal = config.tips
    .filter((tip) => tip.aplicaAOpcionKey === eleccionMetodoKey)
    .sort((a, b) => a.orden - b.orden)
    .map((tip) => tip.texto);

  return {
    recomendacion: {
      metodoKey: reglaGanadora.opcionRecomendadaKey,
      label: opcionRecomendada?.label ?? reglaGanadora.opcionRecomendadaKey,
      confianza: {
        nivel: nivelFinal,
        textoExplicativo: componerTextoExplicativo(nivelFinal, factorDecisivo, esFactorDecisivoIncierto),
      },
      explicacion: activos.map((f) => ({ factorQuestionKey: f.factorQuestionKey, fragmentoTexto: f.fragmentoTexto })),
      consideraciones: activos
        .filter((f) => f.tipoConsideracion !== null && f.textoConsideracion !== null)
        .map((f) => ({
          etiqueta: ETIQUETAS_CONSIDERACION[f.tipoConsideracion!],
          texto: f.textoConsideracion!,
        })),
    },
    eleccionUsuario: { metodoKey: eleccionMetodoKey, difiereDeRecomendacion },
    antesDeComenzar: {
      mensajeAclaratorio: difiereDeRecomendacion
        ? `Elegiste una opción distinta a la recomendada. Nuestra sugerencia era "${opcionRecomendada?.label ?? reglaGanadora.opcionRecomendadaKey}" — puedes continuar con tu elección, solo ten en cuenta las consideraciones de arriba.`
        : undefined,
      tips: tipsDeLaEleccionReal,
    },
  };
}
