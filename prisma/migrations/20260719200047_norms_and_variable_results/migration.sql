-- CreateEnum
CREATE TYPE "NormVerificationStatus" AS ENUM ('CITADO', 'PRACTICA_GENERAL_NO_VERIFICADA');

-- AlterTable
ALTER TABLE "formulas" ADD COLUMN     "normId" TEXT;

-- AlterTable
ALTER TABLE "loss_factors" ADD COLUMN     "normId" TEXT;

-- AlterTable
ALTER TABLE "variables" ADD COLUMN     "isResult" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "normId" TEXT;

-- CreateTable
CREATE TABLE "norms" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "year" INTEGER,
    "scope" TEXT NOT NULL,
    "verificationStatus" "NormVerificationStatus" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "norms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "norms_code_key" ON "norms"("code");

-- AddForeignKey
ALTER TABLE "variables" ADD CONSTRAINT "variables_normId_fkey" FOREIGN KEY ("normId") REFERENCES "norms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formulas" ADD CONSTRAINT "formulas_normId_fkey" FOREIGN KEY ("normId") REFERENCES "norms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loss_factors" ADD CONSTRAINT "loss_factors_normId_fkey" FOREIGN KEY ("normId") REFERENCES "norms"("id") ON DELETE SET NULL ON UPDATE CASCADE;
