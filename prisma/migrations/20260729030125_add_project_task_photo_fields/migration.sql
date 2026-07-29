-- AlterTable
ALTER TABLE "project_task_modules" ADD COLUMN     "description" TEXT,
ADD COLUMN     "imageUrl" TEXT;

-- AlterTable
ALTER TABLE "project_tasks" ADD COLUMN     "description" TEXT,
ADD COLUMN     "imageUrl" TEXT;
