-- AlterEnum
ALTER TYPE "QuestionType" ADD VALUE 'TEXT';

-- AlterTable
ALTER TABLE "variables" ADD COLUMN     "label" TEXT NOT NULL DEFAULT '';
