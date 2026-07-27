-- CreateEnum
CREATE TYPE "ProjectPhotoStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "project_photos" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "savedProjectId" TEXT,
    "moduleId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "status" "ProjectPhotoStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_photos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_photos_moduleId_status_idx" ON "project_photos"("moduleId", "status");

-- CreateIndex
CREATE INDEX "project_photos_userId_idx" ON "project_photos"("userId");

-- AddForeignKey
ALTER TABLE "project_photos" ADD CONSTRAINT "project_photos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_photos" ADD CONSTRAINT "project_photos_savedProjectId_fkey" FOREIGN KEY ("savedProjectId") REFERENCES "saved_projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_photos" ADD CONSTRAINT "project_photos_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
