-- CreateEnum
CREATE TYPE "ExecutionAdvisorEstado" AS ENUM ('PENDIENTE_VALIDACION', 'VALIDADO');

-- CreateEnum
CREATE TYPE "ExecutionAdvisorConfianza" AS ENUM ('ALTA', 'MEDIA', 'BAJA');

-- CreateEnum
CREATE TYPE "ExecutionAdvisorTipoConsideracion" AS ENUM ('TEN_PRESENTE', 'CONSIDERACION_IMPORTANTE', 'REVISA_ANTES_CONTRATAR');

-- CreateTable
CREATE TABLE "execution_advisors" (
    "id" TEXT NOT NULL,
    "moduleSlug" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "estado" "ExecutionAdvisorEstado" NOT NULL DEFAULT 'PENDIENTE_VALIDACION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "execution_advisors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "execution_advisor_options" (
    "id" TEXT NOT NULL,
    "advisorId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "execution_advisor_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "execution_advisor_rules" (
    "id" TEXT NOT NULL,
    "advisorId" TEXT NOT NULL,
    "prioridad" INTEGER NOT NULL,
    "condiciones" JSONB NOT NULL,
    "opcionRecomendadaKey" TEXT NOT NULL,
    "confianzaBase" "ExecutionAdvisorConfianza" NOT NULL,
    "estado" "ExecutionAdvisorEstado" NOT NULL DEFAULT 'PENDIENTE_VALIDACION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "execution_advisor_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "execution_advisor_factor_explanations" (
    "id" TEXT NOT NULL,
    "advisorId" TEXT NOT NULL,
    "factorQuestionKey" TEXT NOT NULL,
    "condicion" JSONB NOT NULL,
    "fragmentoTexto" TEXT NOT NULL,
    "peso" INTEGER NOT NULL,
    "tipoConsideracion" "ExecutionAdvisorTipoConsideracion",
    "textoConsideracion" TEXT,
    "estado" "ExecutionAdvisorEstado" NOT NULL DEFAULT 'PENDIENTE_VALIDACION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "execution_advisor_factor_explanations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "execution_advisor_tips" (
    "id" TEXT NOT NULL,
    "advisorId" TEXT NOT NULL,
    "aplicaAOpcionKey" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "estado" "ExecutionAdvisorEstado" NOT NULL DEFAULT 'PENDIENTE_VALIDACION',

    CONSTRAINT "execution_advisor_tips_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "execution_advisors_moduleSlug_key" ON "execution_advisors"("moduleSlug");

-- CreateIndex
CREATE UNIQUE INDEX "execution_advisor_options_advisorId_key_key" ON "execution_advisor_options"("advisorId", "key");

-- CreateIndex
CREATE INDEX "execution_advisor_rules_advisorId_prioridad_idx" ON "execution_advisor_rules"("advisorId", "prioridad");

-- CreateIndex
CREATE INDEX "execution_advisor_factor_explanations_advisorId_peso_idx" ON "execution_advisor_factor_explanations"("advisorId", "peso");

-- CreateIndex
CREATE INDEX "execution_advisor_tips_advisorId_aplicaAOpcionKey_idx" ON "execution_advisor_tips"("advisorId", "aplicaAOpcionKey");

-- AddForeignKey
ALTER TABLE "execution_advisor_options" ADD CONSTRAINT "execution_advisor_options_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "execution_advisors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "execution_advisor_rules" ADD CONSTRAINT "execution_advisor_rules_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "execution_advisors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "execution_advisor_factor_explanations" ADD CONSTRAINT "execution_advisor_factor_explanations_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "execution_advisors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "execution_advisor_tips" ADD CONSTRAINT "execution_advisor_tips_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "execution_advisors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
