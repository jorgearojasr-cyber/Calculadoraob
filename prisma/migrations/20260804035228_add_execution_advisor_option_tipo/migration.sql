/*
  Warnings:

  - Added the required column `tipo` to the `execution_advisor_options` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ExecutionAdvisorOptionTipo" AS ENUM ('METODO', 'ACCESO', 'TERRENO');

-- AlterTable
ALTER TABLE "execution_advisor_options" ADD COLUMN     "tipo" "ExecutionAdvisorOptionTipo" NOT NULL;
