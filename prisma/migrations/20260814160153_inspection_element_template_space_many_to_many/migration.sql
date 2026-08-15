/*
  Warnings:

  - You are about to drop the column `spaceTemplateId` on the `inspection_element_templates` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "inspection_element_templates" DROP CONSTRAINT "inspection_element_templates_spaceTemplateId_fkey";

-- DropIndex
DROP INDEX "inspection_element_templates_spaceTemplateId_idx";

-- AlterTable
ALTER TABLE "inspection_element_templates" DROP COLUMN "spaceTemplateId";

-- CreateTable
CREATE TABLE "inspection_element_template_spaces" (
    "id" TEXT NOT NULL,
    "spaceTemplateId" TEXT NOT NULL,
    "elementTemplateId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inspection_element_template_spaces_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inspection_element_template_spaces_elementTemplateId_idx" ON "inspection_element_template_spaces"("elementTemplateId");

-- CreateIndex
CREATE UNIQUE INDEX "inspection_element_template_spaces_spaceTemplateId_elementT_key" ON "inspection_element_template_spaces"("spaceTemplateId", "elementTemplateId");

-- AddForeignKey
ALTER TABLE "inspection_element_template_spaces" ADD CONSTRAINT "inspection_element_template_spaces_spaceTemplateId_fkey" FOREIGN KEY ("spaceTemplateId") REFERENCES "inspection_space_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_element_template_spaces" ADD CONSTRAINT "inspection_element_template_spaces_elementTemplateId_fkey" FOREIGN KEY ("elementTemplateId") REFERENCES "inspection_element_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
