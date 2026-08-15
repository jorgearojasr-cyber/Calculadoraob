-- CreateEnum
CREATE TYPE "InspectionPropertyType" AS ENUM ('CASA', 'DEPARTAMENTO', 'AMPLIACION');

-- CreateEnum
CREATE TYPE "InspectionCaseStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'CLOSED');

-- CreateEnum
CREATE TYPE "InspectionAnswerStatus" AS ENUM ('OK', 'OBSERVATION', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "InspectionSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "InspectionObservationStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'RESOLVED');

-- CreateEnum
CREATE TYPE "InspectionPhotoKind" AS ENUM ('GENERAL', 'EVIDENCE', 'GOOD_CONDITION', 'FUTURE_REPAIR');

-- CreateTable
CREATE TABLE "inspection_space_templates" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "appliesTo" "InspectionPropertyType"[],
    "repeatable" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inspection_space_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_element_templates" (
    "id" TEXT NOT NULL,
    "spaceTemplateId" TEXT,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "appliesTo" "InspectionPropertyType"[],
    "materialVariantOf" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inspection_element_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_checklist_items" (
    "id" TEXT NOT NULL,
    "elementTemplateId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "helpText" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "condition" JSONB,
    "defaultSeverity" "InspectionSeverity",
    "technicalArticleSlug" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inspection_checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_cases" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "direccion" TEXT,
    "tipoInmueble" "InspectionPropertyType" NOT NULL,
    "fecha" TIMESTAMP(3),
    "estado" "InspectionCaseStatus" NOT NULL DEFAULT 'DRAFT',
    "bedroomCount" INTEGER,
    "bathroomCount" INTEGER,
    "observacionesGenerales" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inspection_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_spaces" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "spaceTemplateId" TEXT,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inspection_spaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_elements" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "elementTemplateId" TEXT,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inspection_elements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_checklist_checks" (
    "id" TEXT NOT NULL,
    "elementId" TEXT NOT NULL,
    "checklistItemId" TEXT NOT NULL,
    "questionSnapshot" TEXT NOT NULL,
    "status" "InspectionAnswerStatus",
    "answeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inspection_checklist_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_observations" (
    "id" TEXT NOT NULL,
    "checklistCheckId" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "severity" "InspectionSeverity" NOT NULL,
    "recommendation" TEXT,
    "status" "InspectionObservationStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inspection_observations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_photos" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "spaceId" TEXT,
    "elementId" TEXT,
    "observationId" TEXT,
    "kind" "InspectionPhotoKind" NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inspection_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "technical_articles" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "technical_articles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "inspection_space_templates_key_key" ON "inspection_space_templates"("key");

-- CreateIndex
CREATE UNIQUE INDEX "inspection_element_templates_key_key" ON "inspection_element_templates"("key");

-- CreateIndex
CREATE INDEX "inspection_element_templates_spaceTemplateId_idx" ON "inspection_element_templates"("spaceTemplateId");

-- CreateIndex
CREATE INDEX "inspection_checklist_items_elementTemplateId_idx" ON "inspection_checklist_items"("elementTemplateId");

-- CreateIndex
CREATE INDEX "inspection_cases_userId_idx" ON "inspection_cases"("userId");

-- CreateIndex
CREATE INDEX "inspection_spaces_caseId_idx" ON "inspection_spaces"("caseId");

-- CreateIndex
CREATE INDEX "inspection_spaces_spaceTemplateId_idx" ON "inspection_spaces"("spaceTemplateId");

-- CreateIndex
CREATE INDEX "inspection_elements_spaceId_idx" ON "inspection_elements"("spaceId");

-- CreateIndex
CREATE INDEX "inspection_elements_elementTemplateId_idx" ON "inspection_elements"("elementTemplateId");

-- CreateIndex
CREATE INDEX "inspection_checklist_checks_elementId_idx" ON "inspection_checklist_checks"("elementId");

-- CreateIndex
CREATE UNIQUE INDEX "inspection_checklist_checks_elementId_checklistItemId_key" ON "inspection_checklist_checks"("elementId", "checklistItemId");

-- CreateIndex
CREATE INDEX "inspection_observations_checklistCheckId_idx" ON "inspection_observations"("checklistCheckId");

-- CreateIndex
CREATE INDEX "inspection_photos_caseId_idx" ON "inspection_photos"("caseId");

-- CreateIndex
CREATE INDEX "inspection_photos_spaceId_idx" ON "inspection_photos"("spaceId");

-- CreateIndex
CREATE INDEX "inspection_photos_elementId_idx" ON "inspection_photos"("elementId");

-- CreateIndex
CREATE INDEX "inspection_photos_observationId_idx" ON "inspection_photos"("observationId");

-- CreateIndex
CREATE UNIQUE INDEX "technical_articles_slug_key" ON "technical_articles"("slug");

-- AddForeignKey
ALTER TABLE "inspection_element_templates" ADD CONSTRAINT "inspection_element_templates_spaceTemplateId_fkey" FOREIGN KEY ("spaceTemplateId") REFERENCES "inspection_space_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_checklist_items" ADD CONSTRAINT "inspection_checklist_items_elementTemplateId_fkey" FOREIGN KEY ("elementTemplateId") REFERENCES "inspection_element_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_cases" ADD CONSTRAINT "inspection_cases_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_spaces" ADD CONSTRAINT "inspection_spaces_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "inspection_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_spaces" ADD CONSTRAINT "inspection_spaces_spaceTemplateId_fkey" FOREIGN KEY ("spaceTemplateId") REFERENCES "inspection_space_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_elements" ADD CONSTRAINT "inspection_elements_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "inspection_spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_elements" ADD CONSTRAINT "inspection_elements_elementTemplateId_fkey" FOREIGN KEY ("elementTemplateId") REFERENCES "inspection_element_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_checklist_checks" ADD CONSTRAINT "inspection_checklist_checks_elementId_fkey" FOREIGN KEY ("elementId") REFERENCES "inspection_elements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_checklist_checks" ADD CONSTRAINT "inspection_checklist_checks_checklistItemId_fkey" FOREIGN KEY ("checklistItemId") REFERENCES "inspection_checklist_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_observations" ADD CONSTRAINT "inspection_observations_checklistCheckId_fkey" FOREIGN KEY ("checklistCheckId") REFERENCES "inspection_checklist_checks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_photos" ADD CONSTRAINT "inspection_photos_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "inspection_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_photos" ADD CONSTRAINT "inspection_photos_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "inspection_spaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_photos" ADD CONSTRAINT "inspection_photos_elementId_fkey" FOREIGN KEY ("elementId") REFERENCES "inspection_elements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_photos" ADD CONSTRAINT "inspection_photos_observationId_fkey" FOREIGN KEY ("observationId") REFERENCES "inspection_observations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
