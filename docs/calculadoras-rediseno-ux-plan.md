# Plan técnico — Nuevo estándar UX de calculadoras (Fase 1)

Confirma que la implementación se apoya 100% en la arquitectura existente. No se crea una segunda arquitectura paralela: todo componente nuevo vive junto a los genéricos actuales en `src/components/module/` y `src/lib/diagram-v2/`, y es consumido primero por Radier, después por el resto de los ~57 módulos sin fork.

## Capas que NO se tocan

- `src/lib/formula-engine/*` — motor DSL, cero cambios.
- `prisma/schema.prisma` — modelos `Question`, `QuestionOption`, `Variable`, `Formula`, `LossFactor`, `Material`, `Norm` — cero cambios de forma o de datos de negocio.
- `calculateModuleAction` (`src/app/(app)/categorias/[slug]/[moduleSlug]/actions.ts`) — mismo contrato de entrada/salida.

## Componentes a modificar (genéricos, afectan a los 57 módulos a la vez)

| Componente | Cambio | Por qué es seguro |
|---|---|---|
| `WizardHeader` | Agregar "← Inicio" / "← Atrás · Hacer un [módulo]" | Solo presentación, mismo `step`/`moduleName` que ya recibe |
| `ImageOptionCard` | Layout 16:9 (banda superior en desktop y en listas de 2 opciones; miniatura 112×63 a la izquierda en listas de 3+ opciones mobile), fallback `#E7EBF2` cuando `imageUrl` es null | Mismo dato (`option.imageUrl`), solo cambia el layout. El fallback ya usa una condición existente (`hasImageOptions`) |
| `ResultScreen` | Nueva cabecera "dato protagonista" (el primer resultado con mayor `isResult`/prioridad, en tipografía grande) antes de la lista de `PricedResults` | No cambia qué se calcula ni cómo, solo el orden visual y el tamaño del primer dato |
| `RecalculateField` | Se activa para Radier (`espesor-cm`) — el mecanismo genérico ya existe y ya dispara recálculo completo (volumen/materiales/dosificación/costos) vía `onRecalculate` → `calculateModuleAction` | Cero cambios al mecanismo en sí, solo se agrega la entrada a `RECALCULATE_FIELDS` (ya diseñado para admitir cualquier módulo) |

## Componentes nuevos (genéricos desde el día 1, no exclusivos de Radier)

1. **`LiveSummaryPanel`** (`src/components/module/live-summary-panel.tsx`) — recibe `answersSummary` (mismo shape que ya arma `ModuleWizard` para el resumen final) + un callback `onEditField`. Desktop: columna derecha fija junto al wizard. Mobile: tarjeta plegable. Cada línea es clickeable → salta al `stepIndex` de esa pregunta (usa el mapeo `Question.key → stepIndex` que `ModuleWizard` ya calcula internamente en `buildSteps()`, solo se expone). No introduce estado nuevo de negocio: lee `answers`, que ya existe en `ModuleWizard`.
2. **`MeasurementStep`** (agrupación de largo/ancho/espesor con diagrama) — en vez de un componente nuevo paralelo a `QuestionGroupStep`, se extiende `QuestionGroupStep` para que un stepGroup con 3 campos numéricos + diagrama configurado funcione igual que hoy funciona con 2 (`VolumeStep` ya existe para esto — hoy se usa para `box`/`cylinder` reales, ej. Excavación 3D). Para Radier, esto significa: el campo "espesor" pasa a compartir `stepGroup` con largo/ancho (cambio de metadata de agrupación visual en la fila `Question` de Radier en DB — no cambia `label`, `type`, `key` ni el vínculo con la fórmula, solo en qué paso se pregunta). El valor por defecto de espesor sigue viniendo de `defaultSource` (LOOKUP por uso), que ya existe.

## Diagram System V2 — extensión (no reemplazo)

Dentro de `src/lib/diagram-v2/`, dispatch por `kind` sigue igual, se agregan casos:

- **Fix `circle2d`**: hoy usa un fit fijo `[[-1,-1],[1,1]]` ignorando `diametro` (`DiagramV2.tsx:261-268`). Se corrige para que pase por el mismo pipeline `compressedRatios`/`fitToSilhouette` que ya usan `rect2d`/`box`/`cylinder`.
- **Nuevo `kind: "wall"`**: prisma delgado (alto × largo × espesor de muro fijo/estético, sin variable de negocio) reutilizando `buildBox`/`BoxSolid` ya existentes — solo una nueva combinación de proporciones + etiquetas (Alto/Largo en vez de Largo/Ancho/Profundidad). Usado por Muros y Pintura.
- **Nuevo `kind: "roof"`**: plano inclinado — geometría nueva en `math/solids.ts` (un `buildRoofPlane` análogo a `buildBox`), con `pendiente` como parámetro opcional (si el módulo no pregunta pendiente, se dibuja plano). Renderer nuevo en `render/`, mismo `theme.ts`/`DimensionChip` reutilizados.
- Se unifica el mapeo `shape → kind` (hoy duplicado en `question-group-step.tsx`) en una sola función, para que agregar figuras no vuelva a duplicar lógica.

Ningún cambio toca `camera.ts` (la proyección isométrica de 18° se mantiene, aprobada/congelada) ni `theme.ts` salvo que se necesite un color/label nuevo para pendiente.

## Fases (como acordamos)

- **Fase 1 (esto)** — plan confirmado, sin código tocado todavía.
- **Fase 2** — Implemento el flujo completo nuevo **solo en Radier**: `WizardHeader` con nav, `ImageOptionCard` 16:9 (Radier ya tiene sus 4 fotos de uso), `LiveSummaryPanel`, medidas agrupadas (largo/ancho/espesor con diagrama `rect2d`→ mostrando las 3 dimensiones), `RecalculateField` de espesor activado con el nuevo estilo, `ResultScreen` con dato protagonista. Te muestro el resultado (desktop + mobile) antes de seguir.
- **Fase 3** — Generalizo: reviso que cada pieza construida en Fase 2 funcione igual de bien con un módulo que NO tenga fotos, uno 3D (`box`/`cylinder`), uno sin `ModuleGuide`, y Regularización (que reutiliza `QuestionStep`/`WizardHeader`).
- **Fase 4** — Aplico el estándar al resto de los módulos (que ya lo reciben automáticamente al ser componentes compartidos) + QA transversal + `tsc`/`eslint`/`build`, mismo criterio que la Home.

Confirmo: ningún componente se construye "solo para Radier" — Radier es el primer módulo en usarlos, pero cada pieza de Fase 2 nace ya genérica (recibe props derivadas de datos reales de DB, no valores de Radier hardcodeados).

¿Empiezo la Fase 2?
