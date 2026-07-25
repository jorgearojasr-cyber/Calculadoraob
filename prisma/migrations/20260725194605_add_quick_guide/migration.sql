-- AlterTable
ALTER TABLE "project_tasks" ADD COLUMN     "quickGuideId" TEXT;

-- CreateTable
CREATE TABLE "quick_guides" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "tools" TEXT[],
    "estimatedTime" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "peopleNeeded" TEXT NOT NULL,
    "steps" TEXT[],
    "tips" TEXT[],
    "commonMistakes" TEXT[],
    "masterTip" TEXT NOT NULL,
    "faqs" JSONB NOT NULL,
    "reinforcedWarning" BOOLEAN NOT NULL DEFAULT false,
    "reinforcedWarningText" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quick_guides_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "quick_guides_slug_key" ON "quick_guides"("slug");

-- AddForeignKey
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_quickGuideId_fkey" FOREIGN KEY ("quickGuideId") REFERENCES "quick_guides"("id") ON DELETE SET NULL ON UPDATE CASCADE;
