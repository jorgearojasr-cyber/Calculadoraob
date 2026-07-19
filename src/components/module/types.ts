export type WizardQuestion = {
  id: string;
  key: string;
  label: string;
  type: "NUMBER" | "SELECT" | "TEXT";
  unit: string | null;
  helpText: string | null;
  options: { key: string; label: string }[];
};

export type WizardAnswers = Record<string, string | number>;
