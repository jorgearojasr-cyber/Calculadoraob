-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('NUMBER', 'SELECT');

-- CreateEnum
CREATE TYPE "VariableValueType" AS ENUM ('NUMBER', 'TEXT');

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL,
    "unit" TEXT,
    "helpText" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_options" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "question_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variables" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "valueType" "VariableValueType" NOT NULL,
    "source" JSONB NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "variables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materials" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "formulas" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "expression" JSONB NOT NULL,
    "condition" JSONB,
    "isResult" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "materialId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "formulas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loss_factors" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "condition" JSONB,

    CONSTRAINT "loss_factors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "questions_moduleId_idx" ON "questions"("moduleId");

-- CreateIndex
CREATE UNIQUE INDEX "questions_moduleId_key_key" ON "questions"("moduleId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "question_options_questionId_key_key" ON "question_options"("questionId", "key");

-- CreateIndex
CREATE INDEX "variables_moduleId_idx" ON "variables"("moduleId");

-- CreateIndex
CREATE UNIQUE INDEX "variables_moduleId_key_key" ON "variables"("moduleId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "materials_key_key" ON "materials"("key");

-- CreateIndex
CREATE INDEX "formulas_moduleId_idx" ON "formulas"("moduleId");

-- CreateIndex
CREATE UNIQUE INDEX "formulas_moduleId_key_key" ON "formulas"("moduleId", "key");

-- CreateIndex
CREATE INDEX "loss_factors_moduleId_idx" ON "loss_factors"("moduleId");

-- CreateIndex
CREATE UNIQUE INDEX "loss_factors_moduleId_key_key" ON "loss_factors"("moduleId", "key");

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_options" ADD CONSTRAINT "question_options_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variables" ADD CONSTRAINT "variables_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formulas" ADD CONSTRAINT "formulas_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formulas" ADD CONSTRAINT "formulas_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loss_factors" ADD CONSTRAINT "loss_factors_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
