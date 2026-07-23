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
  options: { key: string; label: string }[];
  stepGroup: string | null;
  visibleIfQuestionKey: string | null;
  visibleIfValues: string[];
  defaultSource: QuestionDefaultSource | null;
};

export type WizardAnswers = Record<string, string | number>;
