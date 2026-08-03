-- CreateTable
CREATE TABLE "concrete_mix_ratios" (
    "id" TEXT NOT NULL,
    "gradeCode" TEXT NOT NULL,
    "cementParts" DOUBLE PRECISION NOT NULL,
    "sandParts" DOUBLE PRECISION NOT NULL,
    "gravelParts" DOUBLE PRECISION NOT NULL,
    "normId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "concrete_mix_ratios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "concrete_mix_ratios_gradeCode_key" ON "concrete_mix_ratios"("gradeCode");

-- AddForeignKey
ALTER TABLE "concrete_mix_ratios" ADD CONSTRAINT "concrete_mix_ratios_normId_fkey" FOREIGN KEY ("normId") REFERENCES "norms"("id") ON DELETE SET NULL ON UPDATE CASCADE;
