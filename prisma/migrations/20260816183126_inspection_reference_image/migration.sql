-- CreateEnum
CREATE TYPE "InspectionReferenceImageKind" AS ENUM ('GOOD', 'BAD');

-- CreateTable
CREATE TABLE "inspection_reference_images" (
    "id" TEXT NOT NULL,
    "checklistItemId" TEXT NOT NULL,
    "kind" "InspectionReferenceImageKind" NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT NOT NULL,
    "caption" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inspection_reference_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inspection_reference_images_checklistItemId_idx" ON "inspection_reference_images"("checklistItemId");

-- AddForeignKey
ALTER TABLE "inspection_reference_images" ADD CONSTRAINT "inspection_reference_images_checklistItemId_fkey" FOREIGN KEY ("checklistItemId") REFERENCES "inspection_checklist_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
