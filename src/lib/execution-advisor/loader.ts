import { prisma } from "@/lib/prisma";
import type {
  ExecutionAdvisorCondition,
  ExecutionAdvisorConfig,
} from "./types";

// Loader — única pieza de este motor que toca Prisma (ver Fase 0/2:
// decisión de arquitectura, separa el "cálculo puro" del "acceso a
// datos"). Arma un ExecutionAdvisorConfig plano a partir de las tablas
// ExecutionAdvisor* para el moduleSlug pedido — evaluarAsesorEjecucion
// (evaluate.ts) no importa este archivo ni sabe que existe.
//
// GATE DE PUBLICACIÓN (Fase 10B, 10-ago-2026): `estado: "VALIDADO"` va
// directo en el `where` — es el único punto de control de todo el
// sistema (loader/action/UI no duplican esta regla en ninguna otra
// capa). Cualquier valor que no sea exactamente "VALIDADO" (incluyendo
// PENDIENTE_VALIDACION y cualquier estado futuro/desconocido que se
// agregue al enum) hace que Prisma no encuentre coincidencia y esta
// función devuelva `null` — el mismo camino que "no existe Asesor para
// este módulo". No es una lista negra de estados prohibidos, es una
// lista blanca de un único estado permitido: por construcción, un
// estado nuevo que se agregue al enum en el futuro queda excluido por
// defecto hasta que se decida explícitamente publicarlo.
//
// Antes de esta fase, TODO el contenido sembrado estaba
// pendiente_validacion (ver Fase 5) y este loader no filtraba por
// `estado` — ver informe de cierre de Fase 10A: eso permitía que
// contenido no aprobado editorialmente llegara al usuario final. Esta
// fase NO valida el contenido de Excavación (sigue en
// PENDIENTE_VALIDACION en BD) — solo cierra la vía por la que ese
// contenido podía mostrarse.
export async function getExecutionAdvisorConfig(moduleSlug: string): Promise<ExecutionAdvisorConfig | null> {
  const advisor = await prisma.executionAdvisor.findUnique({
    where: { moduleSlug, estado: "VALIDADO" },
    include: {
      options: true,
      rules: true,
      factorExplanations: true,
      tips: true,
    },
  });

  if (!advisor) return null;

  return {
    nombre: advisor.nombre,
    options: advisor.options.map((o) => ({
      key: o.key,
      label: o.label,
      descripcion: o.descripcion,
      reduceConfidence: o.reduceConfidence,
      tipo: o.tipo.toLowerCase() as ExecutionAdvisorConfig["options"][number]["tipo"],
    })),
    rules: advisor.rules.map((r) => ({
      prioridad: r.prioridad,
      condiciones: r.condiciones as unknown as ExecutionAdvisorCondition[],
      opcionRecomendadaKey: r.opcionRecomendadaKey,
      confianzaBase: r.confianzaBase.toLowerCase() as ExecutionAdvisorConfig["rules"][number]["confianzaBase"],
    })),
    factorExplanations: advisor.factorExplanations.map((f) => ({
      factorQuestionKey: f.factorQuestionKey,
      condicion: f.condicion as unknown as ExecutionAdvisorCondition,
      fragmentoTexto: f.fragmentoTexto,
      peso: f.peso,
      tipoConsideracion: f.tipoConsideracion
        ? (f.tipoConsideracion.toLowerCase() as ExecutionAdvisorConfig["factorExplanations"][number]["tipoConsideracion"])
        : null,
      textoConsideracion: f.textoConsideracion,
    })),
    tips: advisor.tips
      .map((t) => ({ aplicaAOpcionKey: t.aplicaAOpcionKey, texto: t.texto, orden: t.orden }))
      .sort((a, b) => a.orden - b.orden),
  };
}
