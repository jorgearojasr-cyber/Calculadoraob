"use server";

import { getExecutionAdvisorConfig } from "./loader";
import { evaluarAsesorEjecucion } from "./evaluate";
import type { AsesorEjecucionEvaluacion, WizardAnswersLike } from "./types";

// Capa de ensamblaje para la UI (Fase 4, 04-ago-2026) — NO es el motor
// puro (ver evaluate.ts, sin cambios desde Fase 2, ni en su firma ni en
// su lógica interna). Acá vive TODO lo que la UI necesita y que el motor
// deliberadamente no resuelve:
// 1. Ir a buscar la config real (vía el loader de Prisma).
// 2. Resolver el LABEL humano de `eleccionUsuario.metodoKey`.
// 3. El fallback de "método real sin regla que lo recomiende" (decisión
//    04-ago-2026, ver los 3 casos documentados en getExecutionAdvisorReport).

type RecomendacionConDatos = NonNullable<AsesorEjecucionEvaluacion["recomendacion"]>;

// Unión discriminada — NO es el tipo que devuelve el motor (ese solo
// tiene recomendacion: {...} | null). Acá hay un tercer estado: "sabemos
// qué eligió el usuario, pero ninguna regla cubre esa opción todavía".
export type InformeEjecucionRecomendacion =
  | ({ tipo: "con-datos" } & RecomendacionConDatos)
  | { tipo: "sin-cobertura"; mensaje: string }
  | null;

export type InformeEjecucionUI = {
  recomendacion: InformeEjecucionRecomendacion;
  eleccionUsuario: { metodoKey: string | null; label: string | null; difiereDeRecomendacion: boolean };
  antesDeComenzar: AsesorEjecucionEvaluacion["antesDeComenzar"];
};

const MENSAJE_SIN_COBERTURA = "No tenemos una recomendación específica todavía para esta opción.";

// Se llama una sola vez desde la pantalla de resultado (ver
// result-screen.tsx), con el objeto de respuestas ya completo — nunca
// desde el wizard. Devuelve null si el módulo no tiene Asesor configurado
// (el caso de los otros ~56 módulos hoy) — la UI simplemente no renderiza
// nada en ese caso.
//
// 4 casos posibles frente a `eleccionUsuario` (decisión 04-ago-2026,
// ampliada durante el diseño del seed de Fase 5 con el caso "diferido"):
//
// CASO 1 — el motor (evaluate.ts, sin cambios) ya reconoció la elección:
// alguna regla recomienda esa key. Se arma el informe normal.
//
// CASO 2 — el motor devolvió metodoKey=null, pero la respuesta SÍ
// corresponde a una ExecutionAdvisorOption con tipo=METODO — es un método
// real, solo que ninguna regla lo cubre todavía. "Tu elección" se muestra
// igual (con la elección real), y "Nuestra recomendación" se reemplaza
// por un mensaje explícito en vez de desaparecer en silencio.
//
// CASO "DIFERIDO" — el usuario respondió "no_se" (Fase 3: la pregunta de
// método tiene esa opción explícita, "quiero una recomendación") — no es
// un método real ni una inconsistencia, es el caso de uso PRINCIPAL del
// Asesor: mostrar la recomendación calculada (si existe) sin "Tu
// elección" ni advertencia de ningún tipo. Bug real encontrado al diseñar
// el seed (04-ago-2026): antes de este caso, "no_se" caía en CASO 3
// (ocultaba TODO el panel, incluida una recomendación válida) — corregido
// acá, sin tocar el motor.
//
// CASO 3 — ni siquiera existe una ExecutionAdvisorOption tipo=METODO que
// coincida con ninguna respuesta dada, Y el usuario no dijo "no_se". Esto
// SÍ es una inconsistencia real entre el wizard y la configuración del
// Asesor (no debería pasar en producción). No se inventa nada: se
// registra internamente y no se renderiza el panel, igual que hoy.
export async function getExecutionAdvisorReport(
  moduleSlug: string,
  answers: WizardAnswersLike
): Promise<InformeEjecucionUI | null> {
  const config = await getExecutionAdvisorConfig(moduleSlug);
  if (!config) return null;

  const evaluacion = evaluarAsesorEjecucion(answers, config);

  // CASO 1
  if (evaluacion.eleccionUsuario.metodoKey !== null) {
    const labelEleccion =
      config.options.find((o) => o.key === evaluacion.eleccionUsuario.metodoKey)?.label ??
      evaluacion.eleccionUsuario.metodoKey;

    return {
      recomendacion: evaluacion.recomendacion ? { tipo: "con-datos", ...evaluacion.recomendacion } : null,
      eleccionUsuario: { ...evaluacion.eleccionUsuario, label: labelEleccion },
      antesDeComenzar: evaluacion.antesDeComenzar,
    };
  }

  // El motor no reconoció ninguna elección — segunda pasada, buscando
  // directamente entre las respuestas dadas una que coincida con una
  // opción tipo=METODO del catálogo (sin pasar por qué reglas existen).
  const metodosConocidos = config.options.filter((o) => o.tipo === "metodo");
  const metodoElegidoSinCobertura = Object.values(answers)
    .filter((valor): valor is string | number => valor !== undefined)
    .map((valor) => metodosConocidos.find((o) => o.key === String(valor)))
    .find((opcion) => opcion !== undefined);

  if (!metodoElegidoSinCobertura) {
    // Antes de tratarlo como inconsistencia: ¿el usuario dijo "no_se"?
    // Ver CASO "DIFERIDO" arriba — estado normal y esperado, no un error.
    const huboRespuestaNoSe = Object.values(answers).some((valor) => String(valor) === "no_se");
    if (huboRespuestaNoSe) {
      return {
        recomendacion: evaluacion.recomendacion ? { tipo: "con-datos", ...evaluacion.recomendacion } : null,
        eleccionUsuario: { metodoKey: null, label: null, difiereDeRecomendacion: false },
        antesDeComenzar: evaluacion.antesDeComenzar,
      };
    }

    // CASO 3 — inconsistencia real, no se inventa nada.
    console.warn(
      `[execution-advisor] moduleSlug="${moduleSlug}": ninguna respuesta coincide con una opción tipo=METODO del catálogo (y no se detectó "no_se"). Posible inconsistencia entre las preguntas del wizard y la configuración del Asesor de Ejecución.`
    );
    return null;
  }

  // CASO 2 — método real, sin regla que lo recomiende todavía.
  const tipsDeLaEleccionReal = config.tips
    .filter((tip) => tip.aplicaAOpcionKey === metodoElegidoSinCobertura.key)
    .sort((a, b) => a.orden - b.orden)
    .map((tip) => tip.texto);

  return {
    recomendacion: { tipo: "sin-cobertura", mensaje: MENSAJE_SIN_COBERTURA },
    eleccionUsuario: {
      metodoKey: metodoElegidoSinCobertura.key,
      label: metodoElegidoSinCobertura.label,
      difiereDeRecomendacion: true,
    },
    antesDeComenzar: { tips: tipsDeLaEleccionReal },
  };
}
