-- AlterTable
ALTER TABLE "project_tasks" ADD COLUMN     "planId" TEXT;

-- AddForeignKey
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_planId_fkey" FOREIGN KEY ("planId") REFERENCES "project_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
