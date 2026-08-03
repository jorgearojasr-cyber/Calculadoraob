export type QuestionDefaultSource = {
  type: "LOOKUP";
  questionKey: string;
  // number para preguntas NUMBER (ej. dimensiones sugeridas), string para
  // preguntas SELECT (ej. preseleccionar una opción según otra respuesta).
  table: Record<string, number | string>;
};

export type WizardQuestion = {
  id: string;
  key: string;
  label: string;
  type: "NUMBER" | "SELECT" | "TEXT";
  unit: string | null;
  helpText: string | null;
  options: {
    key: string;
    label: string;
    description: string | null;
    imageUrl: string | null;
    // Valor numérico que representa esta opción (ej. "10cm" -> 0.1 metros)
    // — permite que un campo SELECT actúe como dimensión de un diagrama
    // (ver VolumeStep en question-group-step.tsx), sin convertirlo a un
    // NUMBER libre. null para preguntas SELECT normales, sin relación con
    // ninguna medida.
    numericValue: number | null;
  }[];
  stepGroup: string | null;
  visibleIfQuestionKey: string | null;
  visibleIfValues: string[];
  hiddenDefaultValue: string | null;
  defaultSource: QuestionDefaultSource | null;
};

export type WizardAnswers = Record<string, string | number>;
