-- CreateEnum
CREATE TYPE "RegularizationConstructionType" AS ENUM ('AMPLIACION', 'SEGUNDO_PISO', 'TERRAZA_CERRADA', 'QUINCHO', 'BODEGA', 'ESTACIONAMIENTO_TECHADO', 'VIVIENDA_COMPLETA', 'OTRO');

-- CreateEnum
CREATE TYPE "RegularizationMaterial" AS ENUM ('MADERA', 'ALBANILERIA', 'METALCON', 'HORMIGON', 'MIXTA', 'OTRO');

-- CreateEnum
CREATE TYPE "RegularizationCaseStatus" AS ENUM ('EN_PROGRESO', 'EVALUACION_LISTA', 'CARPETA_GENERADA');

-- CreateEnum
CREATE TYPE "RegularizationRoomType" AS ENUM ('DORMITORIO', 'COCINA', 'BANO', 'LIVING_COMEDOR', 'LAVANDERIA', 'BODEGA', 'OTRO');

-- CreateEnum
CREATE TYPE "RegularizationPhotoKind" AS ENUM ('FACHADA', 'POSTERIOR', 'COSTADO', 'INTERIOR', 'TECHUMBRE', 'FUNDACION', 'OTRO');

-- CreateEnum
CREATE TYPE "RegularizationDocumentCategory" AS ENUM ('MUNICIPAL', 'DOM', 'ARQUITECTO', 'NOTARIA_REGISTRO');

-- CreateTable
CREATE TABLE "regularization_cases" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tipoConstruccion" "RegularizationConstructionType" NOT NULL,
    "anioConstruccion" INTEGER,
    "recepcionMunicipal" BOOLEAN,
    "m2Estimados" DOUBLE PRECISION NOT NULL,
    "material" "RegularizationMaterial" NOT NULL,
    "estadoProceso" "RegularizationCaseStatus" NOT NULL DEFAULT 'EN_PROGRESO',
    "medidas" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regularization_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regularization_rooms" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "roomType" "RegularizationRoomType" NOT NULL,
    "label" TEXT,
    "largo" DOUBLE PRECISION NOT NULL,
    "ancho" DOUBLE PRECISION NOT NULL,
    "m2Calculado" DOUBLE PRECISION NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regularization_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regularization_photos" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "kind" "RegularizationPhotoKind" NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regularization_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regularization_step_completions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "stepKey" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "regularization_step_completions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regularization_document_checklist" (
    "id" TEXT NOT NULL,
    "documento" TEXT NOT NULL,
    "category" "RegularizationDocumentCategory" NOT NULL,
    "paraQueSirve" TEXT NOT NULL,
    "dondeSeObtiene" TEXT NOT NULL,
    "obligatorio" BOOLEAN NOT NULL DEFAULT true,
    "dependeDe" JSONB,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regularization_document_checklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regularization_document_checks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "checked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "regularization_document_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regularization_sketches" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "dataJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regularization_sketches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regularization_step_guides" (
    "id" TEXT NOT NULL,
    "stepKey" TEXT NOT NULL,
    "quickGuideId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regularization_step_guides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regularization_rules" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "condition" JSONB NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regularization_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "regularization_cases_userId_idx" ON "regularization_cases"("userId");

-- CreateIndex
CREATE INDEX "regularization_rooms_caseId_idx" ON "regularization_rooms"("caseId");

-- CreateIndex
CREATE INDEX "regularization_photos_caseId_idx" ON "regularization_photos"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "regularization_step_completions_userId_caseId_stepKey_key" ON "regularization_step_completions"("userId", "caseId", "stepKey");

-- CreateIndex
CREATE UNIQUE INDEX "regularization_document_checks_userId_caseId_documentId_key" ON "regularization_document_checks"("userId", "caseId", "documentId");

-- CreateIndex
CREATE UNIQUE INDEX "regularization_sketches_caseId_key" ON "regularization_sketches"("caseId");

-- CreateIndex
CREATE INDEX "regularization_step_guides_stepKey_idx" ON "regularization_step_guides"("stepKey");

-- CreateIndex
CREATE INDEX "regularization_rules_enabled_priority_idx" ON "regularization_rules"("enabled", "priority");

-- AddForeignKey
ALTER TABLE "regularization_cases" ADD CONSTRAINT "regularization_cases_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regularization_rooms" ADD CONSTRAINT "regularization_rooms_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "regularization_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regularization_photos" ADD CONSTRAINT "regularization_photos_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "regularization_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regularization_step_completions" ADD CONSTRAINT "regularization_step_completions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regularization_step_completions" ADD CONSTRAINT "regularization_step_completions_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "regularization_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regularization_document_checks" ADD CONSTRAINT "regularization_document_checks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regularization_document_checks" ADD CONSTRAINT "regularization_document_checks_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "regularization_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regularization_document_checks" ADD CONSTRAINT "regularization_document_checks_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "regularization_document_checklist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regularization_sketches" ADD CONSTRAINT "regularization_sketches_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "regularization_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regularization_step_guides" ADD CONSTRAINT "regularization_step_guides_quickGuideId_fkey" FOREIGN KEY ("quickGuideId") REFERENCES "quick_guides"("id") ON DELETE CASCADE ON UPDATE CASCADE;
