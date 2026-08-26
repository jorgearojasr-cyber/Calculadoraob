-- Fase 21A (docs/FASE21A_SEED_REGULARIZACION_IDEMPOTENTE_SEGURO.md) —
-- agrega una clave de negocio estable (`key`) a
-- regularization_document_checklist para que el seed pueda sincronizar
-- por upsert en vez de borrar y recrear (lo que destruía en cascada
-- RegularizationDocumentCheck, progreso real de usuario).
--
-- Backfill seguro para una columna NOT NULL + UNIQUE sobre una tabla con
-- filas existentes:
--   1. agregar `key` nullable;
--   2. rellenar cada fila existente con su clave canónica exacta,
--      mapeada 1:1 por el texto `documento` (verificado contra
--      producción — 25 filas, 25 textos únicos, ver BASELINE_PRE_21A en
--      docs/FASE21A_SEED_REGULARIZACION_IDEMPOTENTE_SEGURO.md);
--   3. verificar 0 NULL (paso de control, no ejecutable por sí solo);
--   4. aplicar NOT NULL + UNIQUE.
--
-- No usa DROP/TRUNCATE/reset. No genera keys aleatorias: cada fila
-- existente se mapea a su entrada canónica real del catálogo.

-- 1) columna nullable
ALTER TABLE "regularization_document_checklist" ADD COLUMN "key" TEXT;

-- 2) backfill por texto exacto de "documento" (fuente: producción actual)
UPDATE "regularization_document_checklist" SET "key" = CASE "documento"
  WHEN 'Formulario 12.1 (solicitud firmada por propietario y profesional)' THEN 'formulario-12-1'
  WHEN 'Declaración simple de no reclamaciones pendientes ante la DOM o el Juzgado de Policía Local' THEN 'declaracion-no-reclamaciones'
  WHEN 'Listado de documentos y planos numerados' THEN 'listado-documentos-planos'
  WHEN 'Certificado de avalúo fiscal simple, a la fecha 04/02/2016' THEN 'certificado-avaluo-fiscal'
  WHEN 'Antecedentes que acrediten antigüedad anterior al 04/02/2016' THEN 'antecedentes-antiguedad'
  WHEN 'Certificado de recepción municipal anterior (si existe)' THEN 'certificado-recepcion-municipal-anterior'
  WHEN 'Croquis de ubicación + plano de emplazamiento escala 1:500' THEN 'croquis-emplazamiento'
  WHEN 'Planos escala 1:50 (plantas, elevación, corte) + cuadro de superficies' THEN 'planos-escala-1-50'
  WHEN 'Especificaciones técnicas resumidas' THEN 'especificaciones-tecnicas'
  WHEN 'Informe del profesional competente' THEN 'informe-profesional-competente'
  WHEN 'Formulario único de estadísticas de edificación' THEN 'formulario-estadisticas-edificacion'
  WHEN 'Fotocopia patente del profesional que suscribe' THEN 'fotocopia-patente-profesional'
  WHEN 'Proyecto de cálculo estructural' THEN 'proyecto-calculo-estructural'
  WHEN 'Fotocopia cédula de identidad, propietario mayor de 65 años' THEN 'cedula-propietario-mayor-65'
  WHEN 'Acuerdo de asamblea de copropietarios' THEN 'acuerdo-asamblea-copropietarios'
  WHEN 'Inscripción en el Registro Nacional de la Discapacidad' THEN 'inscripcion-registro-discapacidad'
  WHEN 'Certificado de subsidio MINVU' THEN 'certificado-subsidio-minvu'
  WHEN 'Certificado de Informaciones Previas (CIP)' THEN 'certificado-informaciones-previas'
  WHEN 'Copia de la escritura de la propiedad' THEN 'copia-escritura-propiedad'
  WHEN 'Informe de revisor independiente' THEN 'informe-revisor-independiente'
  WHEN 'Certificado de dominio vigente' THEN 'certificado-dominio-vigente'
  WHEN 'Memoria explicativa' THEN 'memoria-explicativa'
  WHEN 'Certificado de Recepción Definitiva (resultado del trámite)' THEN 'certificado-recepcion-definitiva'
  WHEN 'Pago de derechos municipales' THEN 'pago-derechos-municipales'
  WHEN 'Inscripción de la recepción en el Conservador de Bienes Raíces' THEN 'inscripcion-recepcion-cbr'
  ELSE NULL
END;

-- 3) verificación de control — si alguna fila no fue mapeada, esto lanza
-- un error explícito ANTES de aplicar NOT NULL (mejor un fallo ruidoso
-- acá que una fila silenciosamente rota).
DO $$
DECLARE unmapped INTEGER;
BEGIN
  SELECT COUNT(*) INTO unmapped FROM "regularization_document_checklist" WHERE "key" IS NULL;
  IF unmapped > 0 THEN
    RAISE EXCEPTION 'Migración 21A abortada: % fila(s) de regularization_document_checklist sin key mapeada (documento nuevo no contemplado en el backfill).', unmapped;
  END IF;
END $$;

-- 4) NOT NULL + UNIQUE
ALTER TABLE "regularization_document_checklist" ALTER COLUMN "key" SET NOT NULL;
CREATE UNIQUE INDEX "regularization_document_checklist_key_key" ON "regularization_document_checklist"("key");

-- Columna adicional: soft-disable (sección 15 del diseño) — aditiva, con
-- default, sin riesgo de backfill (todas las filas existentes son
-- activas hoy).
ALTER TABLE "regularization_document_checklist" ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;
