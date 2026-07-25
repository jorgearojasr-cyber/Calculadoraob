-- CreateTable
CREATE TABLE "project_plans" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_plan_phases" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_plan_phases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_plan_phase_modules" (
    "id" TEXT NOT NULL,
    "phaseId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "label" TEXT,
    "presetQuery" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_plan_phase_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_plan_phase_completions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phaseId" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_plan_phase_completions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "project_plans_slug_key" ON "project_plans"("slug");

-- CreateIndex
CREATE INDEX "project_plan_phases_planId_idx" ON "project_plan_phases"("planId");

-- CreateIndex
CREATE INDEX "project_plan_phase_modules_phaseId_idx" ON "project_plan_phase_modules"("phaseId");

-- CreateIndex
CREATE INDEX "project_plan_phase_modules_moduleId_idx" ON "project_plan_phase_modules"("moduleId");

-- CreateIndex
CREATE INDEX "project_plan_phase_completions_userId_idx" ON "project_plan_phase_completions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "project_plan_phase_completions_userId_phaseId_key" ON "project_plan_phase_completions"("userId", "phaseId");

-- AddForeignKey
ALTER TABLE "project_plan_phases" ADD CONSTRAINT "project_plan_phases_planId_fkey" FOREIGN KEY ("planId") REFERENCES "project_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_plan_phase_modules" ADD CONSTRAINT "project_plan_phase_modules_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "project_plan_phases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_plan_phase_modules" ADD CONSTRAINT "project_plan_phase_modules_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_plan_phase_completions" ADD CONSTRAINT "project_plan_phase_completions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_plan_phase_completions" ADD CONSTRAINT "project_plan_phase_completions_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "project_plan_phases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
