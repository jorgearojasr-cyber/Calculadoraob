-- CreateEnum
CREATE TYPE "ProjectShowcaseStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "project_showcases" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "savedProjectId" TEXT,
    "title" TEXT NOT NULL,
    "story" TEXT NOT NULL,
    "photosBefore" TEXT[],
    "photosAfter" TEXT[],
    "status" "ProjectShowcaseStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_showcases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_showcases_status_idx" ON "project_showcases"("status");

-- CreateIndex
CREATE INDEX "project_showcases_userId_idx" ON "project_showcases"("userId");

-- AddForeignKey
ALTER TABLE "project_showcases" ADD CONSTRAINT "project_showcases_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_showcases" ADD CONSTRAINT "project_showcases_savedProjectId_fkey" FOREIGN KEY ("savedProjectId") REFERENCES "saved_projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
