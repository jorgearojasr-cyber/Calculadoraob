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
};

export type WizardAnswers = Record<string, string | number>;
