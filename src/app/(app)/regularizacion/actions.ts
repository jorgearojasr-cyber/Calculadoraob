"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { evaluateRegularizationRules, type RegularizationRuleResult } from "@/lib/regularization-rules";
import type { RegularizationWizardAnswers } from "@/components/regularization/types";

// Mismo patrón de sesión que createSavedProjectAction
// (src/app/(app)/proyectos/actions.ts) — sin sesión activa, no se crea
// nada. `name` sigue la misma convención que SavedProject.name: un
// default calculado en código, editable después (edición todavía no
// implementada, fuera de alcance de 2A).
export async function createRegularizationCaseAction(
  input: RegularizationWizardAnswers
): Promise<{ caseId: string; rules: RegularizationRuleResult[]; error?: undefined } | { error: string; caseId?: undefined }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "No hay sesión activa." };

  if (
    !input.tipoConstruccion ||
    input.anioConstruccion === undefined ||
    input.recepcionMunicipal === undefined ||
    !input.m2Estimados ||
    !input.material
  ) {
    return { error: "Faltan respuestas del wizard." };
  }

  const defaultName = `Regularización - ${new Date().toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "short",
  })}`;

  const created = await prisma.regularizationCase.create({
    data: {
      userId: session.user.id,
      name: defaultName,
      tipoConstruccion: input.tipoConstruccion,
      anioConstruccion: input.anioConstruccion,
      recepcionMunicipal: input.recepcionMunicipal,
      m2Estimados: input.m2Estimados,
      material: input.material,
    },
  });

  const rules = await evaluateRegularizationRules({
    tipoConstruccion: created.tipoConstruccion,
    anioConstruccion: created.anioConstruccion,
    recepcionMunicipal: created.recepcionMunicipal,
    m2Estimados: created.m2Estimados,
    material: created.material,
    // Todavía no se captura en el wizard inicial (ver Fase 2B, compuerta
    // de avalúo en la etapa de documentación) — null es el estado
    // correcto, dispara la Regla #8 ("Avalúo fiscal no informado") como
    // corresponde.
    avaluoFiscalPesos: null,
  });

  return { caseId: created.id, rules };
}
