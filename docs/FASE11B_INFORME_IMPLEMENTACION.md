# FASE 11B — INFORME DE IMPLEMENTACIÓN

Implementación de la primera etapa del diseño aprobado en Fase 11A
(`docs/FASE11A_DISENO_INSPECCION_TECNICA_GUIADA.md`). **No se hizo commit,
push ni deploy** — todo el trabajo está en el working tree local, tal
como exigió explícitamente el alcance de esta fase.

## 1. Archivos modificados/creados

### Nuevos
- `src/components/inspecciones/motivo-selector.tsx` — selector de motivo (3 opciones).
- `src/components/inspecciones/casa-ficha-step.tsx` — ficha de Casa + `casaFichaToCounts`.
- `src/components/inspecciones/departamento-ficha-step.tsx` — ficha de Departamento + `departamentoFichaToCounts`.
- `src/components/inspecciones/ampliacion-ficha-step.tsx` — ficha de Ampliación (7 tipos) + `ampliacionFichaToCounts`.
- `src/components/inspecciones/ficha-fields.tsx` — bloques reutilizables (`FichaCounter`, `FichaCheckbox`, `FichaToggle`).
- `prisma/migrations/20260815202632_inspection_motivo_and_tipo_ampliacion/` — migración aditiva.
- `prisma/db-fixes/fase11b-piso-guia-piloto.ts` — script idempotente que agrega las 2 secciones nuevas a los 2 `TechnicalArticle` de Piso.

### Modificados
- `prisma/schema.prisma` — 2 enums nuevos + 2 campos nullable en `InspectionCase` (detalle en sección 2).
- `prisma/seed-inspecciones.ts` — sin cambios en esta fase (ya estaba completo desde la sesión anterior; el catálogo de Casa/Departamento/Ampliación necesario ya existía).
- `src/components/inspecciones/new-inspection-form.tsx` — reescrito: wizard Motivo → (Tipo) → Ficha → Datos, con `steps` dinámico (3 pasos si `motivo=REVISION_AMPLIACION`, 4 en el resto).
- `src/components/inspecciones/property-type-selector.tsx` — nuevo prop opcional `allow` para restringir las opciones mostradas.
- `src/app/(app)/inspecciones/nueva/page.tsx` — ya no pre-carga `spaceTemplates` (las fichas nuevas no los necesitan; el Server Action los sigue validando igual).
- `src/app/(app)/inspecciones/actions.ts` — `CreateInspectionInput` acepta `motivo`/`tipoAmpliacion` opcionales, validados contra los enums nuevos; la lógica de generación de espacios/elementos/checks **no cambió**.
- `src/components/layout/top-nav.tsx` / `src/components/layout/bottom-nav.tsx` — entrada "Inspecciones" agregada (desktop nav + popup de perfil mobile). Home sin tocar.
- `src/lib/inspecciones-knowledge.ts` — 2 alias de sección nuevos (`comoRevisarlo`, `senalesDeProblema`); se extrajo `parseKnowledgeContent` (reutilizable sin round-trip a la BD) de `loadKnowledgeEntry`.
- `src/app/(app)/inspecciones/[id]/page.tsx` — usa `parseKnowledgeContent` para pasar también `queRevisar`/`comoRevisarlo`/`condicionesCorrectas`/`senalesDeProblema` a cada check.
- `src/components/inspecciones/element-checklist-group.tsx` — tipo `technicalArticle` extendido con los 4 campos de guía.
- `src/components/inspecciones/checklist-item-row.tsx` — nuevo `GuideBlock` (guía antes de los botones) + botones/pastilla relabeled (Está bien / Tiene un problema / No corresponde) **solo** cuando el check trae guía; el resto del catálogo es idéntico a antes.

### Eliminado
- `src/components/inspecciones/space-selection-step.tsx` — quedó sin ningún consumidor tras la reescritura del wizard (las 3 fichas nuevas lo reemplazan).

## 2. Cambios de schema (con justificación)

Aplicados directamente a la base compartida (dev = producción, Neon) por
ser 100% aditivos y nullable — mismo criterio ya usado en Fase 10I/10K:
código en producción no referencia columnas nuevas, cero riesgo.

```prisma
enum InspectionMotivo { RECEPCION_PRE_FIRMA POST_RECEPCION REVISION_AMPLIACION }
enum InspectionTipoAmpliacion { COCINA DORMITORIO DORMITORIO_BANO LIVING_COMEDOR SEGUNDO_PISO TERRAZA_CERRADA OTRO }

model InspectionCase {
  ...
  motivo         InspectionMotivo?
  tipoAmpliacion InspectionTipoAmpliacion?
}
```

**Deliberadamente NO se agregó schema para:**
- Cantidad de pisos de la casa, tipo de cocina, piso/torre del depto — informativos, sin consumidor funcional en esta etapa.
- Patio trasero (Casa) — Fase 11A lo marcó 🔴 sin fuente de contenido confiable; se deja fuera hasta tener contenido real.
- Living-comedor integrado/separado, presencia de bodega/antejardín/etc. — **no se persisten como flags**: son 100% derivables de qué `InspectionSpace` se generaron (si existe un espacio "Bodega", hubo bodega). Guardarlos aparte sería redundante y podría desincronizarse.

Catálogo (`InspectionSpaceTemplate`/`InspectionElementTemplate`/
`InspectionChecklistItem`) no requirió cambios en esta fase: ya estaba
completo desde el trabajo de catálogo hecho en la sesión anterior
(antejardín, acceso vehicular, comedor, living-comedor, terraza/logia,
terraza cerrada, fachada, reja, portón — 13 espacios / 11 elementos / 40
vínculos / 14 preguntas, confirmado idempotente).

## 3. Comportamiento por tipo de ficha

**Casa** (paso 3 de 4): Dormitorios/Baños (contador, mín. 1), Living y
comedor (Integrados/Separados), Bodega/Antejardín/Acceso vehicular
(checkbox). Cocina se incluye siempre sin preguntar.

**Departamento** (paso 3 de 4): igual estructura que Casa, cambiando
Acceso vehicular/Antejardín por Estacionamiento/Terraza o logia.

**Ampliación** (paso 2 de 3 — el paso "Tipo de inmueble" se salta
automáticamente y `tipoInmueble` queda fijo en `AMPLIACION`): selector
de 7 tipos, cada uno reutilizando espacios/partidas ya existentes, sin
inventar ninguna:

| Tipo | Recintos generados |
|---|---|
| Cocina | Cocina |
| Dormitorio | Dormitorio ×N |
| Dormitorio con baño | Dormitorio ×N + Baño ×N |
| Living-comedor | Living-comedor |
| Segundo piso | Dormitorio ×N + Baño ×N + (opcional) Living-comedor + (opcional) Cocina |
| Terraza cerrada | Terraza cerrada |
| Otro | Recinto ampliado ×N (comportamiento V1 sin cambios) |

## 4. Piloto guiado de Piso

Los 2 `TechnicalArticle` de Piso (`piso-como-revisar-danos-visibles`,
`piso-como-revisar-desniveles`) ganaron 2 secciones nuevas ("Cómo
revisarlo", "Qué señales pueden indicar un problema"), aplicadas vía
script idempotente. En el checklist, cuando un check trae esas
secciones se muestra la guía completa (Qué revisar / Cómo revisarlo /
Qué debería verse / Qué puede ser señal de un problema) **antes** de los
3 botones de evaluación, y estos se relabelan a 🟢 Está bien / 🔴 Tiene
un problema / ⚪ No corresponde. El resto del catálogo (Muros, Ventana,
Enchufes, etc.) sigue exactamente igual que antes — sin guía, con
OK/Observación/No aplica y el `TechnicalArticleLink` colapsado de Fase
5B. La distinción Observación → Posible signo → Recomendación se
mantiene: nada se marca ni se sugiere automáticamente.

## 5. Compatibilidad con V1

Confirmada en navegador: se simuló un `InspectionCase` con
`motivo: null, tipoAmpliacion: null` (forma exacta de cualquier caso
creado antes de esta fase) y se verificó que carga y funciona
idénticamente, incluyendo el piloto guiado de Piso (que no depende de
`motivo`, solo de si el check tiene contenido de guía). El Server Action
acepta `motivo`/`tipoAmpliacion` como opcionales — cualquier llamador
que no los envíe (o los envíe `null`) sigue funcionando exactamente
igual que antes de esta fase.

## 6. Pruebas ejecutadas

- `npx tsc --noEmit` — sin errores.
- `npx eslint .` — sin errores.
- `npx vitest run` — 88/88 tests, 9/9 archivos.
- `npx next build` — build de producción exitoso, 29 páginas generadas.
- QA manual en navegador (usuario de prueba, datos limpiados al final):
  - Casa con 2 dormitorios, 2 baños, living/comedor separados, bodega y antejardín → recintos generados exactos: Cocina, Dormitorio 1-2, Baño 1-2, Living, Comedor, Bodega, Antejardín (sin Acceso vehicular, no seleccionado).
  - Departamento con estacionamiento y terraza/logia, sin bodega → Cocina, Dormitorio 1, Baño 1, Living-comedor, Estacionamiento, Terraza/Logia (sin Bodega).
  - Los 7 tipos de Ampliación, uno por uno — cada uno generó exactamente los recintos de la tabla de la sección 3 (incluido "Otro" con cantidad 2, confirmando el comportamiento repetible de V1).
  - Piloto guiado de Piso verificado visualmente: guía completa antes de los botones, botones relabeled, resto del catálogo sin cambios.
  - Caso V1 simulado (motivo/tipoAmpliacion null) — carga y funciona igual.
  - Mobile 375px — sin scroll horizontal en el wizard ni en el detalle del checklist.
  - Nav: "Inspecciones" visible en TopNav (desktop) y en el popup de perfil de BottomNav (mobile), Home sin cambios.

## 7. Regresiones

Ninguna detectada. Los flujos existentes (checklist genérico, fotos,
observaciones, PDF, resumen web, redacción asistida local) no se
tocaron — solo se extendió el wizard de creación y se agregó un
renderizado condicional en `checklist-item-row.tsx` que no afecta a
ningún check sin guía.

## 8. Pendientes para la siguiente etapa

- Construir la biblioteca completa de partidas guiadas (esta fase solo
  cubrió Piso como piloto).
- Evaluar si conviene persistir un flag de "ficha completada con la guía
  Fase 11B" para diferenciar casos nuevos de casos V1 en reportes futuros
  (hoy no hace falta porque nada distingue su comportamiento).
- Contenido de Patio trasero (Casa) y revisión de fuente para Terraza
  cerrada / Terraza-Logia (marcados 🟡/🔴 en Fase 11A).
- Función de IA "explicación en lenguaje simple" (candidata de alto valor
  en Fase 11A, no implementada aún — sigue siendo 100% local cuando se
  aborde).
- Publicación (commit + push + deploy) queda para una fase separada,
  explícitamente autorizada, siguiendo el mismo patrón usado en Fase
  10I/10N/10Q.

## Nota sobre limpieza de datos de QA

Los scripts temporales usados para el QA
(`prisma/db-fixes/_tmp_qa_*.ts`) se dejaron en el repo en vez de
eliminarse, siguiendo la regla de memoria vigente de conservar scripts
en `prisma/db-fixes/` — a diferencia de la convención de sesión de
borrar archivos `_tmp_*` después de usarlos. Esta tensión ya se había
señalado en fases anteriores sin resolución explícita del usuario; se
deja documentada acá otra vez para que se decida en algún momento.
