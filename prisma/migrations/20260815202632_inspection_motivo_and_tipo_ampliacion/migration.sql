-- CreateEnum
CREATE TYPE "InspectionMotivo" AS ENUM ('RECEPCION_PRE_FIRMA', 'POST_RECEPCION', 'REVISION_AMPLIACION');

-- CreateEnum
CREATE TYPE "InspectionTipoAmpliacion" AS ENUM ('COCINA', 'DORMITORIO', 'DORMITORIO_BANO', 'LIVING_COMEDOR', 'SEGUNDO_PISO', 'TERRAZA_CERRADA', 'OTRO');

-- AlterTable
ALTER TABLE "inspection_cases" ADD COLUMN     "motivo" "InspectionMotivo",
ADD COLUMN     "tipoAmpliacion" "InspectionTipoAmpliacion";
