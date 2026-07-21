-- AlterTable
ALTER TABLE "saved_projects" ADD COLUMN     "inShoppingList" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "shopping_list_checks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "materialName" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "checked" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shopping_list_checks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shopping_list_checks_userId_idx" ON "shopping_list_checks"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "shopping_list_checks_userId_materialName_unit_key" ON "shopping_list_checks"("userId", "materialName", "unit");

-- AddForeignKey
ALTER TABLE "shopping_list_checks" ADD CONSTRAINT "shopping_list_checks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
