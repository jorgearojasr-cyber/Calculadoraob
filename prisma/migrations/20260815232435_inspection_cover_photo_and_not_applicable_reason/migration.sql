-- AlterEnum
ALTER TYPE "InspectionPhotoKind" ADD VALUE 'COVER';

-- AlterTable
ALTER TABLE "inspection_checklist_checks" ADD COLUMN     "notApplicableReason" TEXT;
