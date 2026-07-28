-- AlterTable
ALTER TABLE "saved_projects" ADD COLUMN     "phaseId" TEXT,
ADD COLUMN     "planId" TEXT;

-- CreateIndex
CREATE INDEX "saved_projects_planId_moduleId_idx" ON "saved_projects"("planId", "moduleId");

-- AddForeignKey
ALTER TABLE "saved_projects" ADD CONSTRAINT "saved_projects_planId_fkey" FOREIGN KEY ("planId") REFERENCES "project_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_projects" ADD CONSTRAINT "saved_projects_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "project_plan_phases"("id") ON DELETE SET NULL ON UPDATE CASCADE;
