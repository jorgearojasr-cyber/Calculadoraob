# FASE 11Y — Piloto Nivel 2: configuración de recinto para Reja y Portón

Fecha: 17/18-ago-2026
Fuente de arquitectura: [docs/FASE11W_CIERRE_ARQUITECTURA_FICHA_INSPECCION.md](FASE11W_CIERRE_ARQUITECTURA_FICHA_INSPECCION.md), [docs/FASE11XP_INFORME_PUBLICACION_FICHA_ESTRUCTURAL.md](FASE11XP_INFORME_PUBLICACION_FICHA_ESTRUCTURAL.md)

## A. Auditoría actual

Se revisó el modelo (`InspectionSpace`, `InspectionElement`, `InspectionElementTemplate`, `InspectionElementTemplateSpace`), la generación de elementos/checks en `createInspectionAndGenerateAction`, `[id]/page.tsx`, `space-detail-view.tsx`, `[id]/actions.ts`, y el catálogo actual de Reja/Portón. Baseline (solo lectura, BD compartida):

- Vínculo `Reja → Antejardín`: **1** (`InspectionElementTemplateSpace`).
- Vínculo `Portón → Acceso vehicular`: **1**.
- Preguntas actuales: Reja — "¿Abre y cierra correctamente, sin forzar?" (1); Portón — "¿Abre y cierra correctamente?" (1).
- Casos reales con `InspectionElement` de Reja: **2** (Jorge — "las dalias", "casa").
- Casos reales con `InspectionElement` de Portón: **1** (Jorge — "las dalias").
- En los 3, los checks estaban **sin responder** (`status: null`), 0 observaciones, 0 fotos — riesgo de dato real bajo, pero de todos modos ningún caso real fue tocado en ningún momento de esta fase.

## B. Modelo elegido

Se agregó **`InspectionSpace.config Json?`** (nullable, aditivo). Forma:
```ts
{ components?: Record<elementTemplateKey, boolean>,
  componentMeta?: Record<elementTemplateKey, Record<string, string>> }
```
`components` guarda si el usuario respondió Sí/No para un componente (clave = `key` del `InspectionElementTemplate` real, ej. `"reja"`, `"porton"` — sin duplicar catálogo). `componentMeta` guarda datos informativos opcionales por componente (ej. `{"porton": {"tipo": "AUTOMATICO"}}`).

## C. Justificación schema/no-schema

Se auditó si el modelo actual permitía guardar esto sin cambio de Prisma: no existía ningún campo en `InspectionSpace` para configuración arbitraria, así que se requería un cambio mínimo. Se descartó explícitamente crear columnas específicas (`hasReja`, `hasPorton`, futuros `hasTina`/`hasLavaplatos`) porque no escala — cada componente nuevo de Cocina/Baño exigiría una migración nueva. Se eligió un único campo `Json?` genérico: la misma columna sirve para Reja/Portón hoy y para Cocina (muebles, lavaplatos, cubierta) o Baño (tina, shower door, extractor) en el futuro **sin ningún cambio de schema adicional** — solo se agrega una entrada más al mapa `SPACE_LEVEL2_CONFIG` en código (`src/lib/inspecciones/space-config.ts`).

## D. Migración

`prisma/migrations/20260818004031_inspection_space_level2_config/migration.sql`:
```sql
-- AlterTable
ALTER TABLE "inspection_spaces" ADD COLUMN     "config" JSONB;
```
Un solo `ADD COLUMN` nullable — revisada manualmente antes de aplicar, sin ningún `DROP`/`ALTER` destructivo. Aplicada con `prisma migrate deploy` contra la BD compartida. `prisma migrate status` confirma "Database schema is up to date!" al cierre de la fase.

## E. UX Nivel 2

Al entrar por primera vez a un espacio con componentes configurables sin responder, se bloquea el contenido normal (fotos + checklist) y se muestra un bloque "Antes de revisar este espacio" con la(s) pregunta(s) pendientes (Sí/No vía `FichaToggle`, mismo lenguaje visual que la ficha Nivel 1) y un botón "Continuar" (deshabilitado hasta responder todas). Implementado en `SpaceLevel2Gate` (bloquea) + `SpaceLevel2Panel` (formulario, reutilizado también en modo "editar").

## F. Antejardín

`SPACE_LEVEL2_CONFIG["antejardin"] = [{ componentKey: "reja", label: "Reja", question: "¿Tiene reja?" }]`. Verificado en navegador: caso nuevo → onboarding bloquea con "¿Tiene reja?"; Sí → Reja aparece con su check (idempotente, verificado respondiendo dos veces "Sí" sin duplicar); No → Reja no aparece.

## G. Reja

Componente reutilizado tal cual del catálogo existente (`elementTemplate.key = "reja"`, misma pregunta "¿Abre y cierra correctamente, sin forzar?"). No se creó ninguna revisión nueva.

## H. Acceso vehicular

`SPACE_LEVEL2_CONFIG["acceso-vehicular"] = [{ componentKey: "porton", ... }]`. Mismo comportamiento verificado: Portón aparece exactamente una vez con Sí, no aparece con No.

## I. Portón

Componente reutilizado del catálogo existente, sin revisiones nuevas (ni eléctrica, ni motor, ni controles, ni fotoceldas).

## J. Manual/automático

Implementado como `metaOptions` opcional en `SPACE_LEVEL2_CONFIG["acceso-vehicular"][0]`: tras responder "Sí" a Portón, aparece "Tipo de portón" (Manual / Automático / No sé), guardado en `config.componentMeta.porton.tipo`. Verificado en navegador y en BD (`{"components":{"porton":true},"componentMeta":{"porton":{"tipo":"AUTOMATICO"}}}`). Puramente informativo — no genera ni condiciona ninguna revisión técnica adicional.

## K. Generación de elementos

Reja/Portón **ya no se generan** en `createInspectionAndGenerateAction` — se agregó `LEVEL2_GATED_ELEMENT_KEYS = new Set(["reja", "porton"])` y el loop de generación los omite explícitamente, sin importar si el vínculo de catálogo sigue existiendo. La generación real ocurre en `saveSpaceLevel2ConfigAction` ([id]/actions.ts): busca si ya existe el `InspectionElement` para ese `elementTemplate.key` en ese espacio; si no existe, lo crea junto con sus checks (snapshot de pregunta, igual patrón que la generación original). Verificado explícitamente: responder "Sí" dos veces (una vez, cambiar a No, volver a Sí) nunca produjo más de un `InspectionElement`/set de checks a la vez.

## L. Edición de configuración

Una vez configurado (explícita o implícitamente), el espacio muestra un botón secundario "Editar configuración" que despliega el mismo panel con los valores actuales pre-cargados — **nunca vuelve a bloquear** el checklist. Verificado: entrar de nuevo al espacio ya configurado no repite el onboarding.

## M. Política con datos existentes

Implementada como "todo o nada, con confirmación explícita" (sección 7 de la fase): al intentar pasar un componente de Sí→No, `saveSpaceLevel2ConfigAction` revisa si el `InspectionElement` tiene algún check respondido, alguna observación, o alguna foto. Si tiene datos y el llamador no envió ese `componentKey` en `confirmedComponentKeys`, la acción **no aplica ningún cambio** y devuelve `{requiresConfirmation: true, message}`. El cliente (`SpaceLevel2Panel`) muestra `window.confirm(message)` — mismo patrón ya usado en `DeleteInspectionButton`. Si el usuario rechaza, no pasa nada (datos intactos, verificado). Si confirma, se reenvía con el `componentKey` confirmado y recién ahí se borra: fotos (blob + fila) primero (best-effort, mismo patrón que `deleteObservationAction`), luego el `InspectionElement` (cascade elimina checks/observaciones). Si el componente NO tiene datos, se quita directamente sin pedir confirmación. Verificado en navegador y en BD (ver sección Ñ del control funcional): 0 fotos huérfanas tras el borrado confirmado.

## N. Compatibilidad histórica

Se simuló un caso histórico (Antejardín con Fachada+Reja generados directamente, sin `config`, replicando el comportamiento del código viejo). Al abrirlo: **no se mostró el onboarding** — se resolvió como configurado implícitamente (`resolveComponentState`: si `config.components[key]` no existe pero ya hay un `InspectionElement` para ese `elementTemplate.key`, se trata como `true`). El botón "Editar configuración" apareció directamente y los checks (Fachada, Reja) resolvieron con sus preguntas completas, sin ningún cambio de datos.

## O. Progreso

`computeProgress` sigue derivándose 100% de los checks realmente generados (sin cambios en `src/lib/inspecciones/progress.ts`). Antejardín sin Reja mostró "0/1" (solo Fachada); con Reja, "0/2". Nunca se generó un check "No corresponde" para un componente ausente — la ausencia del componente simplemente no genera ningún check, exactamente como pide la fase.

## P. Resumen/PDF

Probado con el caso "QA Fase11Y - Casa Antejardin+Acceso" (Reja=Sí, Portón=Sí+Automático): el resumen web mostró Antejardín (2 pendientes: Fachada, Reja) y Acceso vehicular (1 pendiente: Portón) con sus preguntas reales — en ningún punto apareció "No tiene reja" ni "No tiene portón" como hallazgo. PDF resumen y PDF detallado: ambos `200 application/pdf`.

## Q. Ownership

`saveSpaceLevel2ConfigAction` resuelve ownership igual que el resto del módulo: `space -> case -> userId`, comparado contra la sesión — nunca confía en `spaceId` sin verificar. Prueba en navegador: un segundo usuario QA (`qa.fase11y.b@example.com`) intentó acceder por URL directa al caso del primer usuario y recibió "Inspección no disponible" (bloqueo a nivel de página, consistente con el resto del módulo — el segundo usuario nunca pudo siquiera cargar el panel para intentar guardar).

## R. Mobile (375px)

Sin overflow horizontal (`scrollWidth === clientWidth === 375`) en: configuración Antejardín (onboarding), panel "Editar configuración" expandido, y el checklist posterior con Reja ya generada. Botones Sí/No (`FichaToggle`) mantienen el mismo target táctil ya validado en el resto del módulo (min-height consistente con `FichaCheckbox`/`FichaCounter`).

## S. TypeScript

`npx tsc --noEmit` → sin errores (tras corregir un error de tipos en `space-level2-panel.tsx` sobre narrowing de `SaveSpaceLevel2ConfigResult`, resuelto con un chequeo explícito antes de usar `result.config`).

## T. ESLint

`npx eslint .` → sin errores ni warnings.

## U. Vitest

`npx vitest run` → 10 archivos, 95 tests, todos pasan.

## V. Build

`npx next build` → compilación exitosa, 29 páginas generadas, sin errores.

## W. BD compartida

**Solo se aplicó la migración aditiva** (`config Json?`) contra la BD compartida — segura por definición (columna nueva nullable, sin afectar filas existentes ni el código actualmente desplegado en producción, que ni siquiera conoce este campo). **El desacople de catálogo (vínculos `Reja→Antejardín`, `Portón→Acceso vehicular`) NO se tocó**: el script `prisma/db-fixes/fase11y-configuracion-reja-porton.ts` confirma en modo lectura que ambos vínculos siguen intactos, y define — sin llamar — `removeRejaPortonAutoLinks()` para ejecutarse manualmente solo en la ventana de publicación futura (mismo patrón que `deactivateOldTerrazaLogia` de Fase 11X-P). La razón: el código HOY desplegado en producción sigue dependiendo de esos vínculos para generar Reja/Portón automáticamente (todavía no tiene Nivel 2) — quitarlos ahora rompería esa generación sin que el nuevo flujo esté disponible para reemplazarla. El desacople real para código nuevo se logra en la capa de aplicación (`LEVEL2_GATED_ELEMENT_KEYS`), no en catálogo, así que esta fase no requiere ninguna ventana de activación adicional en BD más allá de la migración de columna ya aplicada.

## X. Limpieza QA

- Usuarios QA (`qa.fase11y@example.com`, `qa.fase11y.b@example.com`): **0 restantes**.
- Casos QA (6 creados durante el smoke test): **0 restantes** (cascade con los usuarios).
- Fotos/blobs QA: **0** (ninguna se subió).
- Scripts temporales `_tmp_11y_*.ts`: todos eliminados. Se conserva `prisma/db-fixes/fase11y-configuracion-reja-porton.ts` (permanente) y todos los `faseXX-*.ts` previos.

## Y. Casos reales

Comparación antes/después: los 4 casos reales de Jorge (PROPIA, xcxc, las dalias, casa) mantienen exactamente los mismos ids, espacios, checks, observaciones y fotos — incluyendo los checks de Reja/Portón en "las dalias"/"casa", que siguen sin `config` (null) y sin ningún dato alterado. **Cero diferencias.**

## Z. Diff final

```
 M prisma/schema.prisma
 M src/app/(app)/inspecciones/[id]/actions.ts
 M src/app/(app)/inspecciones/[id]/page.tsx
 M src/app/(app)/inspecciones/actions.ts
 M src/components/inspecciones/space-detail-view.tsx
?? prisma/db-fixes/fase11y-configuracion-reja-porton.ts
?? prisma/migrations/20260818004031_inspection_space_level2_config/
?? src/components/inspecciones/space-level2-gate.tsx
?? src/components/inspecciones/space-level2-panel.tsx
?? src/lib/inspecciones/space-config.ts
?? docs/FASE11Y_INFORME_PILOTO_CONFIGURACION_NIVEL2.md
```
Explícitamente fuera de este diff (trabajo preexistente no relacionado, no tocado): `src/components/module/*`, `src/lib/diagram-v2/*`, `prisma/db-fixes/inspect-uncertainty-options.ts`, y los `docs/FASE*.md` sin prefijo 11Y ya presentes como untracked antes de esta fase.

## AA. Riesgos

1. **Reja/Portón siguen técnicamente vinculados en catálogo** a Antejardín/Acceso vehicular (`InspectionElementTemplateSpace`), aunque el código nuevo ya no los use para generación automática — deuda de limpieza cosmética, no funcional, documentada en el script de db-fixes para ejecutarse en la publicación futura.
2. **Piloto de un solo componente por espacio** — la arquitectura genérica (`SPACE_LEVEL2_CONFIG`, JSON `components`/`componentMeta`) está lista para múltiples preguntas por espacio (ej. Cocina), pero no se probó ese caso multi-pregunta en este piloto; el código lo soporta (el bloque de onboarding itera sobre el array completo), pero merece un smoke test dedicado cuando se implemente el primer espacio con 2+ componentes.
3. **`window.confirm`** para la política de datos existentes es el mismo patrón ya usado en `DeleteInspectionButton` — consistente, pero es un modal nativo del navegador, no un componente de diseño propio; aceptable para este piloto, revisar si escala mal visualmente cuando haya más componentes por espacio.

## AB. Estado final

- Código modificado: **SÍ**.
- Prisma/schema modificado: **SÍ** (`InspectionSpace.config Json?`, aditivo).
- Migración creada: **SÍ** (`20260818004031_inspection_space_level2_config`), aplicada contra la BD compartida (segura, aditiva, sin afectar código en producción).
- BD modificada: **SÍ** — solo la columna nueva (nullable). Catálogo de Reja/Portón **sin tocar**. Cero filas de casos/espacios/checks reales alteradas.
- Commit: **NO**.
- Push: **NO**.
- Deploy: **NO**.

---

FASE 11Y — PILOTO NIVEL 2 REJA/PORTÓN IMPLEMENTADO LOCALMENTE
