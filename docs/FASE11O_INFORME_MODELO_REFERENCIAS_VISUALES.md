# FASE 11O — Modelo mínimo de referencias visuales BIEN/MAL

Fecha: 2026-08-16
Estado: implementado y aplicado a la BD compartida, **sin commit/push/deploy** (autorización explícita pendiente para publicar).

## A. Auditoría previa

Revisado contra el schema real (no contra lo documentado en fases previas):

- `InspectionChecklistItem` — vive 1:N bajo `InspectionElementTemplate`, tiene `technicalArticleSlug` (referencia libre, no FK) y ya soporta múltiples preguntas por elemento (confirmado: 14 `InspectionChecklistItem` activos hoy, 11 con `technicalArticleSlug`).
- `InspectionPhoto` — 4 niveles de asociación opcionales (`case`/`space`/`element`/`observation`), todos con `onDelete: SetNull` salvo `caseId` (`Cascade`), sin ningún vínculo al catálogo (`InspectionChecklistItem`) — confirma que hoy no existe ningún mecanismo para asociar una imagen a una PREGUNTA del catálogo, solo a una INSTANCIA de inspección real.
- `InspectionPhotoKind` — enum de 5 valores (`GENERAL`, `EVIDENCE`, `GOOD_CONDITION`, `FUTURE_REPAIR`, `COVER`), todos describiendo fotos de una inspección real, ninguno pensado para contenido educativo del catálogo.
- `TechnicalArticle` — capa de contenido textual (`slug`, `title`, `content`), sin ningún campo de imagen.
- Patrones de modelos con imágenes en otros módulos: `ProjectPhoto` (`id`, FKs a `User`/`SavedProject`/`Module`, `url`, `status`, `createdAt`/`updatedAt`, `@@index`, `@@map`) y `RegularizationPhoto` — mismo patrón estructural (`@id @default(cuid())`, timestamps completos, índices sobre FKs, `@@map` a snake_case) usado consistentemente en todo el proyecto.

## B. Separación InspectionPhoto vs ReferenceImage

Confirmado y documentado explícitamente en el schema (comentario sobre el nuevo modelo):

- **`InspectionPhoto`** = evidencia tomada por el usuario **durante una inspección real** — ligada a `case`/`space`/`element`/`observation`, sube el inspector en el momento, es prueba de lo que se encontró en ESA inspección específica.
- **`InspectionReferenceImage`** = contenido **educativo permanente del catálogo** — curado por el equipo, igual para TODOS los usuarios que revisen ese mismo `InspectionChecklistItem`, no ligado a ninguna inspección real.

`InspectionPhoto` **NO** se reutiliza para esto — reutilizarlo mezclaría dos ciclos de vida completamente distintos (evidencia efímera de una inspección vs. contenido curado permanente del catálogo) bajo la misma tabla, con el mismo riesgo que ya evitó la separación `TechnicalArticle`/catálogo operativo en Fase 5B ("no repetir el problema de bibliotecas paralelas", comentario ya existente en el schema).

## C. Schema final

```prisma
enum InspectionReferenceImageKind {
  GOOD
  BAD
}

model InspectionReferenceImage {
  id              String                        @id @default(cuid())
  checklistItem   InspectionChecklistItem       @relation(fields: [checklistItemId], references: [id], onDelete: Cascade)
  checklistItemId String
  kind            InspectionReferenceImageKind
  url             String
  alt             String
  caption         String?
  order           Int                           @default(0)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([checklistItemId])
  @@map("inspection_reference_images")
}
```

Más el campo aditivo `referenceImages InspectionReferenceImage[]` en `InspectionChecklistItem`. Convenciones aplicadas, todas tomadas de patrones ya existentes en el schema (no inventadas):

- `@id @default(cuid())` — mismo patrón que el 100% de los modelos del proyecto.
- `createdAt DateTime @default(now())` / `updatedAt DateTime @updatedAt` — mismo patrón que `TechnicalArticle`/`InspectionChecklistItem` (catálogo mutable con timestamps completos), a diferencia de `InspectionElementTemplateSpace` (tabla puente, solo `createdAt`) — se usan ambos timestamps acá porque `InspectionReferenceImage` SÍ es editable después de creada (caption, order, incluso la imagen misma en un futuro admin).
- `@@index([checklistItemId])` — mismo patrón que `@@index([elementTemplateId])` en `InspectionChecklistItem` y los 3 índices de `InspectionPhoto`.
- `@@map("inspection_reference_images")` — snake_case, mismo patrón que el 100% de las tablas del proyecto.

Ningún campo agregado "por comodidad" — cada campo corresponde exactamente a un requisito explícito de la fase.

## D. Enum

`InspectionReferenceImageKind { GOOD, BAD }` — exactamente la propuesta de Fase 11M/prompt, sin variaciones. Nombre consistente con el patrón `Inspection<Modelo>Kind` ya usado por `InspectionPhotoKind`.

## E. Relación con InspectionChecklistItem

FK directa `checklistItemId → InspectionChecklistItem.id`, **no** al `InspectionElement` completo. Motivo (igual al de Fase 11M, sección L): la imagen educativa ilustra UNA revisión específica ("Vidrio"), no todo un componente ("Ventana") — la granularidad de la referencia visual debe calzar con la granularidad de la pregunta, no con la del elemento que la contiene. Ejemplo futuro (sin implementar): Ventana → Vidrio (`InspectionChecklistItem`) → 1 referencia GOOD + 1 referencia BAD.

## F. onDelete

`onDelete: Cascade` — si se elimina un `InspectionChecklistItem`, sus `InspectionReferenceImage` se eliminan automáticamente. Mismo patrón ya usado por `InspectionChecklistItem.elementTemplate` (`onDelete: Cascade` hacia `InspectionElementTemplate`) — coherente con el resto de la cadena de catálogo, donde el hijo siempre cae con el padre.

**Documentado explícitamente (comentario en el schema)**: este cascade elimina **filas de BD**, nunca el blob físico. Cualquier UI/admin futura que permita borrar una `InspectionReferenceImage` deberá llamar `del(url)` (Vercel Blob) antes o durante el borrado — exactamente el mismo patrón ya validado para `InspectionPhoto` en `deleteObservationAction` (Fase 10Q) y `deleteInspectionCaseAction` (Fase 11K). No se construye esa UI en esta fase.

## G. Alt

`alt String` — **obligatorio**, sin `?`. Justificación (igual a la del prompt): contenido educativo, debe ser accesible. Ejemplos futuros documentados en el comentario del schema, no cargados en BD: "Ventana con sello continuo entre hoja y marco" / "Ventana con separación visible en sello hoja-marco".

## H. Caption

`caption String?` — **opcional**. Comentario explícito en el schema: `caption` NO reemplaza a `TechnicalArticle` — `TechnicalArticle` explica (contenido extenso, "Cómo revisarlo"/"Qué debería verse"/etc.), `ReferenceImage`/`caption` ilustra (leyenda breve junto a la imagen, ej. "Sello continuo, sin separación visible"). No se mezclan conceptualmente ni se cargó ningún ejemplo en BD.

## I. Order

`order Int @default(0)` — mantenido. **Sin** `@@unique([checklistItemId, kind])` — decisión explícita, documentada en el comentario del schema: eso impediría más de 1 imagen GOOD o más de 1 BAD por revisión en el futuro, que es exactamente el caso que la fase pidió no bloquear. `order` da el orden estable entre varias imágenes del mismo `kind`.

## J. SQL de migración

Migración `20260816183126_inspection_reference_image`, generada con `prisma migrate dev --create-only` y revisada manualmente ANTES de aplicarla:

```sql
-- CreateEnum
CREATE TYPE "InspectionReferenceImageKind" AS ENUM ('GOOD', 'BAD');

-- CreateTable
CREATE TABLE "inspection_reference_images" (
    "id" TEXT NOT NULL,
    "checklistItemId" TEXT NOT NULL,
    "kind" "InspectionReferenceImageKind" NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT NOT NULL,
    "caption" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inspection_reference_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inspection_reference_images_checklistItemId_idx" ON "inspection_reference_images"("checklistItemId");

-- AddForeignKey
ALTER TABLE "inspection_reference_images" ADD CONSTRAINT "inspection_reference_images_checklistItemId_fkey" FOREIGN KEY ("checklistItemId") REFERENCES "inspection_checklist_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

Confirmado: `CREATE TYPE` + `CREATE TABLE` + `CREATE INDEX` + `ADD FOREIGN KEY`. **Cero** `DROP`, **cero** `ALTER` de tablas existentes, **cero** backfill, **cero** alteración de datos actuales — 100% aditivo, tal como exigió la fase. No fue necesario detenerse.

## K. Aplicación en BD

Aplicada con `npx prisma migrate deploy` contra la BD compartida (Neon) — exitosa, sin errores. `npx prisma generate` regeneró el cliente sin errores.

## L. Conteo final

Verificado por consulta directa post-migración:

- `InspectionReferenceImageKind` en BD → `['GOOD', 'BAD']`, coincide exactamente con el schema.
- `InspectionReferenceImage.count()` → **0** filas (tabla vacía, como se esperaba — cero imágenes reales subidas en esta fase).
- `InspectionChecklistItem` activos → **14** (sin cambios respecto a antes de la migración).
- `InspectionCase` totales → **3** (los 3 casos reales de producción del usuario, sin cambios).
- `InspectionChecklistCheck` totales → **88** (sin cambios).

Ningún `InspectionChecklistItem` existente fue alterado; ningún caso existente cambió.

## M. Prisma Client

Confirmado con una query tipada real (`prisma.inspectionReferenceImage.findMany({ select: { id: true, kind: true } })`) ejecutada dentro de un script TypeScript vía `tsx` — compiló y ejecutó sin error de tipos, confirmando que el cliente regenerado expone correctamente el nuevo modelo y el nuevo enum (`"GOOD" | "BAD"` como tipo literal).

## N. Helper, si existe

**No se creó ningún helper.** Decisión documentada: Prisma ya resuelve el caso de uso completo con una simple relación anidada —

```ts
prisma.inspectionChecklistItem.findUnique({
  where: { id },
  include: { referenceImages: { orderBy: { order: "asc" } } },
});
```

— y agrupar por `kind` (GOOD/BAD) en el futuro consumidor es un `.filter()` trivial sobre el array ya ordenado, no una operación que justifique una función propia. Además, en esta fase no existe ningún consumidor real (no hay UI ni Server Action que lea `InspectionReferenceImage` todavía) — crear un helper ahora sería sobrearquitectura sin caso de uso concreto que lo valide, exactamente lo que la fase pidió evitar.

## O. Compatibilidad

- Los 3 casos reales existentes (`las dalias`, `PROPIA`, `xcxc`, todos de `jorge.arojasr@gmail.com`) siguen intactos — confirmado por consulta directa, ningún campo ni fila tocada.
- Catálogo actual sin cambios: 14 preguntas activas, 11 guiadas (con `technicalArticleSlug` que resuelve a un artículo con `comoRevisarlo`/`senalesDeProblema`) — mismos números antes y después de la migración.
- Fase 11L (guía breve, expandible, estados, "Nivel del problema", foto post-hallazgo) no fue tocada por esta fase — ningún archivo de UI (`checklist-item-row.tsx`, `element-checklist-group.tsx`, etc.) fue modificado.
- El build de producción confirma tamaños de bundle sin cambios en las rutas de Inspecciones (`/inspecciones`, `/inspecciones/[id]`, `/inspecciones/[id]/resumen`, `/inspecciones/nueva`) — evidencia adicional de que no se tocó ningún código de presentación.
- La existencia de una tabla nueva vacía no cambia ninguna UI: no hay ningún query existente que haga `include: { referenceImages: ... }` todavía, así que ningún flujo actual se ve afectado por la sola presencia de la tabla.

## P. TypeScript

`npx tsc --noEmit` — sin errores.

## Q. ESLint

`npx eslint .` — sin errores ni warnings.

## R. Vitest

`npx vitest run` — 10 archivos, **95/95 tests**, todos pasan (sin cambios respecto al conteo de Fase 11N — no se agregó ningún test nuevo en esta fase, ver sección siguiente).

**Decisión sobre test mínimo**: no se creó ningún test nuevo. No existe lógica de aplicación propia en esta fase (solo schema + migración) — la verificación real es exactamente la combinación que pidió la fase cuando no hay lógica: Prisma (conteos y query tipada, sección L/M) + TypeScript (`tsc --noEmit`) + build. Crear un test artificial solo para subir el conteo habría sido exactamente lo que la fase pidió evitar.

## S. Build

`npx next build` — build de producción exitoso. Rutas de Inspecciones compilan con el mismo tamaño de bundle que en Fase 11N (evidencia de cero cambios de presentación).

## T. Git diff

```
 prisma/schema.prisma | 57 ++++++++++++++++++++++++++++++++++++++++++++++++++++
 1 file changed, 57 insertions(+)
```

Más el directorio nuevo `prisma/migrations/20260816183126_inspection_reference_image/` (untracked, migración nueva). `git status` confirma: cero `checklist-item-row.tsx`, cero catálogo, cero `TechnicalArticle`, cero preguntas de Ventana, cero imágenes, cero Radier, cero otras calculadoras — los archivos de Radier/`module-visual-config`/`diagram-v2` y los docs no relacionados que aparecen en `git status` son trabajo previo a esta fase, no tocados acá. El cliente Prisma regenerado (`src/generated/prisma/`) está en `.gitignore` (línea 39) y correctamente no aparece en el diff.

## U. Pendientes

Explícitamente fuera de alcance de esta fase, tal como exigió la instrucción:

- Nuevas preguntas de Ventana / contenido técnico nuevo.
- Imágenes reales (ninguna subida, `url` sigue sin ningún valor real en BD).
- UI BIEN/MAL (sección O de Fase 11M, no implementada acá).
- Variantes/materiales, motor de selección de material, nuevos componentes.
- Cambios de catálogo, de PDF, de Radier, de otras calculadoras.
- Server Actions para crear/editar/eliminar `InspectionReferenceImage` — no creadas, tal como exigió la fase.

## V. Estado final

Infraestructura de datos mínima para referencias visuales BIEN/MAL creada y aplicada a la BD compartida: 1 modelo nuevo (`InspectionReferenceImage`), 1 enum nuevo (`InspectionReferenceImageKind`), 1 campo aditivo en `InspectionChecklistItem` (`referenceImages`), 1 migración 100% aditiva ya aplicada. Cero filas de datos, cero UI, cero Server Actions — únicamente el modelo. Los 3 casos reales existentes, las 14 preguntas activas del catálogo, las 88 respuestas ya generadas y Fase 11L (ya publicada) permanecen exactamente iguales. TypeScript, ESLint, Vitest (95/95) y build de producción — todos limpios. Todo el trabajo permanece local: sin commit, sin push, sin deploy.

---

FASE 11O — MODELO DE REFERENCIAS VISUALES COMPLETADO LOCALMENTE
