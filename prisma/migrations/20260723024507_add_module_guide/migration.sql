-- CreateTable
CREATE TABLE "module_guides" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "tools" TEXT[],
    "estimatedTime" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "recommendedPeople" TEXT NOT NULL,
    "tipsBeforeStart" TEXT[],
    "commonMistakes" TEXT[],
    "safetyRecommendations" TEXT[],
    "bestPractice" TEXT NOT NULL,
    "masterTip" TEXT NOT NULL,
    "faqs" JSONB NOT NULL,
    "stepByStepSummary" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "module_guides_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "module_guides_moduleId_key" ON "module_guides"("moduleId");

-- AddForeignKey
ALTER TABLE "module_guides" ADD CONSTRAINT "module_guides_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
