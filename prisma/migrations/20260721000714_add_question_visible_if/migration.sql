-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "visibleIfQuestionKey" TEXT,
ADD COLUMN     "visibleIfValues" TEXT[] DEFAULT ARRAY[]::TEXT[];
