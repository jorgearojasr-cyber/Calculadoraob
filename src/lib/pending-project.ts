export const PENDING_PROJECT_KEY = "obrabien:pendingProject";

export type PendingProject = {
  moduleId: string;
  moduleName: string;
  answersSummary: { label: string; value: string }[];
  result: unknown;
};
