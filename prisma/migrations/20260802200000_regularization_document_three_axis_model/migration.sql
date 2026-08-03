-- CreateEnum
CREATE TYPE "RegularizationDocObligatoriedad" AS ENUM ('MINIMO', 'CONDICIONAL');

-- CreateEnum
CREATE TYPE "RegularizationDocOrigen" AS ENUM ('USUARIO', 'PROFESIONAL', 'INSTITUCION');

-- CreateEnum
CREATE TYPE "RegularizationDocMomento" AS ENUM ('PREVIO', 'DURANTE', 'POSTERIOR');

-- CreateEnum
CREATE TYPE "RegularizationDocSoporteObraBien" AS ENUM ('GENERA_PLATAFORMA', 'ORIENTA_ACCESO_DIRECTO', 'GESTION_EXTERNA');

-- CreateEnum
CREATE TYPE "RegularizationDocEstadoValidacion" AS ENUM ('PENDIENTE_VALIDACION_PROFESIONAL', 'VALIDADO');

-- AlterTable: agrega las columnas nuevas con un default temporal (para
-- las 15 filas existentes), luego quita el default de las que en el
-- schema NO lo llevan — el seed de la Fase 2 borra y recrea todas las
-- filas de todas formas, así que el valor temporal nunca se usa en la
-- práctica, solo evita que la migración falle por NOT NULL sin default
-- en filas preexistentes.
ALTER TABLE "regularization_document_checklist"
  ADD COLUMN "obligatoriedad" "RegularizationDocObligatoriedad" NOT NULL DEFAULT 'CONDICIONAL',
  ADD COLUMN "origen" "RegularizationDocOrigen" NOT NULL DEFAULT 'USUARIO',
  ADD COLUMN "momento" "RegularizationDocMomento" NOT NULL DEFAULT 'PREVIO',
  ADD COLUMN "soporteObraBien" "RegularizationDocSoporteObraBien" NOT NULL DEFAULT 'GESTION_EXTERNA',
  ADD COLUMN "citaNormativa" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "estadoValidacion" "RegularizationDocEstadoValidacion" NOT NULL DEFAULT 'VALIDADO';

ALTER TABLE "regularization_document_checklist"
  ALTER COLUMN "obligatoriedad" DROP DEFAULT,
  ALTER COLUMN "origen" DROP DEFAULT,
  ALTER COLUMN "soporteObraBien" DROP DEFAULT,
  ALTER COLUMN "citaNormativa" DROP DEFAULT;

-- DropColumn
ALTER TABLE "regularization_document_checklist" DROP COLUMN "obligatorio";
