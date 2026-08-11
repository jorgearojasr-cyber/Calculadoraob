// Asesor de Ejecución — tipos del motor puro (Fase 2, 04-ago-2026).
// Estos tipos son deliberadamente planos (no usan los tipos generados por
// Prisma) para que evaluate.ts no dependa de Prisma ni de ningún I/O — ver
// decisión de Fase 2: la resolución moduleSlug -> configuración vive en un
// loader aparte (fuera de este motor), que arma `ExecutionAdvisorConfig` a
// partir de las tablas ExecutionAdvisor*.

export type ExecutionAdvisorConfianzaNivel = "alta" | "media" | "baja";

export type ExecutionAdvisorTipoConsideracion =
  | "ten_presente"
  | "consideracion_importante"
  | "revisa_antes_contratar";

// Mismo shape que Question.options en el wizard (ver types.ts) — sin
// importarlo directamente para no acoplar este motor al tipo del wizard.
export type WizardAnswersLike = Record<string, string | number | undefined>;

// Catálogo ampliado (04-ago-2026, ver schema.prisma): no son solo
// "métodos" recomendables — cualquier opción cuya respuesta pueda ser el
// factor decisivo de una regla necesita existir acá, para que el motor
// pueda leer su `reduceConfidence`.
//
// `tipo` (04-ago-2026, Fase 4) — el motor (evaluate.ts) NO LO LEE, sigue
// derivando "método válido" de ExecutionAdvisorRule.opcionRecomendadaKey
// exactamente igual que antes (sin cambios). Este campo existe solo para
// el fallback de action.ts (capa de ensamblaje, fuera del motor puro),
// que sí necesita distinguir la categoría de una opción explícitamente.
export type ExecutionAdvisorOptionData = {
  key: string;
  label: string;
  descripcion: string | null;
  reduceConfidence: boolean;
  tipo: "metodo" | "acceso" | "terreno";
};

// Condición de comparación simple — NO es el árbol de nodos DSL de
// Formula.condition/RegularizationRule.condition (ver comentario en
// schema.prisma, Fase 1): acá solo hace falta comparar una respuesta
// contra un valor o una lista de valores.
export type ExecutionAdvisorCondition = {
  questionKey: string;
  operador: "equals" | "in";
  valor: string | string[];
};

export type ExecutionAdvisorRuleData = {
  prioridad: number;
  // AND — todas deben cumplirse para que la regla aplique.
  condiciones: ExecutionAdvisorCondition[];
  opcionRecomendadaKey: string;
  confianzaBase: ExecutionAdvisorConfianzaNivel;
};

export type ExecutionAdvisorFactorExplanationData = {
  factorQuestionKey: string;
  condicion: ExecutionAdvisorCondition;
  fragmentoTexto: string;
  peso: number;
  tipoConsideracion: ExecutionAdvisorTipoConsideracion | null;
  textoConsideracion: string | null;
};

export type ExecutionAdvisorTipData = {
  aplicaAOpcionKey: string;
  texto: string;
  orden: number;
};

// Ya resuelto por el loader (fuera de este motor) a partir de las tablas
// ExecutionAdvisor* filtradas por moduleSlug y por estado (el loader
// decide si incluye reglas pendiente_validacion o no — el motor no sabe
// de "estado", solo evalúa lo que se le pasa).
export type ExecutionAdvisorConfig = {
  nombre: string;
  options: ExecutionAdvisorOptionData[];
  rules: ExecutionAdvisorRuleData[];
  factorExplanations: ExecutionAdvisorFactorExplanationData[];
  tips: ExecutionAdvisorTipData[];
};

// Salida del motor — NO incluye `resultadoTecnico`: ese campo del
// InformeEjecucion original (ver Fase 2, prompt) ya existe en
// CalculateModuleResult (motor de fórmulas) y el asesor no lo calcula ni
// lo toca. Quien ensamble el InformeEjecucion final para la UI (Fase 4)
// combina esta salida con el resultado técnico ya existente.
export type AsesorEjecucionEvaluacion = {
  recomendacion: {
    metodoKey: string;
    label: string;
    confianza: { nivel: ExecutionAdvisorConfianzaNivel; textoExplicativo: string };
    explicacion: { factorQuestionKey: string; fragmentoTexto: string }[];
    consideraciones: { etiqueta: string; texto: string }[];
  } | null;
  eleccionUsuario: { metodoKey: string | null; difiereDeRecomendacion: boolean };
  antesDeComenzar: { mensajeAclaratorio?: string; tips: string[] };
};
