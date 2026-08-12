# Framework Visual de ObraBien — Guía del registro (`MODULE_CONFIG`)

Guía técnica de referencia para `src/components/module/module-visual-config.ts`. Para un análisis de qué tan preparado está el framework para crecer, ver `docs/framework-visual-auditoria-cierre.md` (auditoría previa, 02-ago-2026). Este documento es la guía práctica de "cómo se usa" y "cómo se extiende".

---

## 1. Propósito de `MODULE_CONFIG`

`MODULE_CONFIG` es la **única fuente de configuración visual y de comportamiento por módulo** de todo el framework, indexada por `moduleSlug`. Antes de la consolidación (Fase de arquitectura, 02-ago-2026) esta configuración vivía dispersa en 6 mapas independientes, cada uno indexado en un espacio de claves distinto (`stepGroup` vs `moduleSlug`), sin ningún registro central que documentara qué mapa pertenecía a qué módulo.

Seis registros derivados se exportan desde el mismo archivo, todos calculados a partir de `MODULE_CONFIG` (nunca definidos por separado):

```ts
DIMENSION_DIAGRAMS      // stepGroup -> DiagramConfig
COMBINED_AREA_QUESTION  // stepGroup -> CombinedAreaQuestionConfig
HERO_RESULT_KEYS        // moduleSlug -> Formula.key
RECALCULATE_FIELDS      // moduleSlug -> Question.key
OPTIONAL_QUESTION_KEYS  // moduleSlug -> Question.key[]
RECIPE_GROUPS           // moduleSlug -> RecipeGroupConfig[]
```

Regla de la consolidación, todavía vigente: **agregar o modificar configuración visual de un módulo significa editar una sola entrada en `MODULE_CONFIG`**, nunca tocar varios archivos ni definir un mapa nuevo por fuera de este registro. Ningún componente del framework (`question-group-step/`, `module-wizard.tsx`, `result-screen.tsx`) lee configuración por módulo desde ningún otro lugar — verificado por auditoría de consistencia el 04-ago-2026 (ver sección 5).

---

## 2. Propiedades de `ModuleVisualConfig`

Cada entrada de `MODULE_CONFIG[moduleSlug]` acepta estas propiedades, todas opcionales:

### `diagrams?: Record<string, DiagramConfig>`

Uno o más diagramas de medida, indexados por `Question.stepGroup` (el mismo valor que agrupa preguntas en un solo paso del wizard). `DiagramConfig.shape` determina la geometría (`"rectangle"`, `"rectangle-with-depth"`, `"circle"`, `"circle-with-depth"`) y, junto con `secondaryLabel`/`depthLabel`, cuántos campos NUMBER se esperan en ese stepGroup (posicional: `questions[0]` = primario, `questions[1]` = secundario si `secondaryLabel` está seteado, profundidad = el que sigue si `depthLabel` está seteado). Excepción documentada: con `allowAreaToggle: true`, el grupo puede tener una sola pregunta (el usuario cambia a "m² directo").

```ts
radier: {
  diagrams: {
    "radier-medidas": {
      shape: "rectangle-with-depth",
      primaryLabel: "largo",
      secondaryLabel: "ancho",
      depthLabel: "espesor recomendado",
      groupLabel: "¿Qué medidas tiene el radier?",
      showArea: true,
    },
  },
},
```

### `combinedAreaQuestion?: Record<string, CombinedAreaQuestionConfig>`

También indexado por `stepGroup` — activa el layout de `AreaInputToggle` (largo×alto con cambio a m² directo, con o sin descuento de vanos). Mutuamente excluyente en la práctica con `diagrams` para el mismo stepGroup: si ambos existen, `VolumeStep` gana (ver `question-group-step/index.tsx`) — documentar esa intención en un comentario si se da el caso, no dejarlo implícito.

### `heroResultKey?: string`

Fuerza qué `Formula.key` ocupa la tarjeta protagonista (`ResultHero`) cuando el dato más relevante no es el primer resultado priced (ej. Piscina: volumen de agua antes que el hormigón). Debe apuntar a un `Formula.key` real del módulo — sin esta propiedad, el criterio por defecto es "el primer resultado no-secundario con `materialName`".

### `recipeGroups?: RecipeGroupConfig[]`

Agrupa un resultado "primario" con sus resultados "ingrediente" para pintarlos como una tarjeta de receta (`RecipeCard`) en vez de la lista genérica de `PricedResults` — pensado para el patrón "cantidad base + desglose por unidad" (ej. Radier: cargas de betonera + cemento/arena/gravilla/agua por carga, Fase 9B, 04-ago-2026). `primaryKey` y cada entrada de `itemKeys` deben ser `Formula.key` reales del módulo.

```ts
recipeGroups: [
  {
    title: "Dosificación por carga de betonera",
    primaryKey: "numero_cargas_betonera",
    itemKeys: ["cemento_por_carga", "arena_por_carga", "gravilla_por_carga", "agua_por_carga"],
  },
],
```

### `recalculateField?: string`

Habilita editar una pregunta NUMBER ya contestada directamente desde la pantalla de resultado, disparando un recálculo completo sin volver atrás en el wizard (`RecalculateField`, ver `result-screen.tsx`). Debe ser un `Question.key` real del módulo.

### `optionalQuestionKeys?: string[]`

Preguntas NUMBER que el usuario puede dejar en blanco y avanzar igual (botón "Omitir" en `QuestionStep`). Cada key debe ser un `Question.key` real del módulo, de tipo `NUMBER`.

---

## 3. Cómo agregar una nueva calculadora usando el framework existente

1. **Crear el módulo y sus preguntas/fórmulas** vía el panel admin o un script en `prisma/db-fixes/` (según corresponda — ver convención de trazabilidad de esa carpeta).
2. **¿La calculadora tiene una geometría cubierta por el framework genérico?** (rectángulo, caja con profundidad, círculo, cilindro, o "largo×alto con descuento de vanos"). Si sí: agregar una entrada en `MODULE_CONFIG[moduleSlug]` con `diagrams` o `combinedAreaQuestion` apuntando al `stepGroup` real de las preguntas — **no crear ningún componente nuevo**, el motor (`DiagramV2`, `VolumeStep`, `AreaInputToggle`) ya lo renderiza.
3. Si la calculadora necesita alguno de los comportamientos opcionales (destacar un resultado distinto al primero, recalcular un campo desde el resultado, permitir omitir una pregunta, o mostrar una receta de ingredientes), agregar `heroResultKey`/`recalculateField`/`optionalQuestionKeys`/`recipeGroups` en la misma entrada.
4. **Verificar cada key contra la base real** antes de cerrar la fase — cada `Formula.key`/`Question.key` referenciado debe existir tal cual en la BD (sin typos, sin referencias a filas renombradas o borradas). Ver sección 5 para el criterio de auditoría ya aplicado.
5. Si la geometría NO está cubierta por el framework genérico (ej. Fundación: base + cuello, dos secciones reales distintas), es válido escribir un componente específico — pero esa excepción debe quedar documentada como tal (ver sección 4), no agregada en silencio.
6. `tsc`, `eslint`, `next build` limpios antes de cerrar.

## 4. Cómo documentar exclusiones deliberadas

Un módulo sin entrada en `MODULE_CONFIG`, o un stepGroup con 2+ preguntas NUMBER pero sin diagrama, no es automáticamente un error — puede ser una exclusión intencional. El criterio ya establecido en el archivo: **toda exclusión deliberada se documenta con un comentario en el punto donde alguien buscaría la entrada faltante**, explicando el motivo (ej. "usa `FoundationStep`, geometría no representable como caja simple" para Fundación; "espesor de muros × espesor de losa, ambos ecos de respuestas, no una recomendación" para los stepGroups de espesor de Piscina). Sin ese comentario, una auditoría de consistencia futura no puede distinguir "excluido a propósito" de "config faltante por descuido" — y lo reportará como hallazgo a verificar.

## 5. Sprint UX V1.2 — cierre

El **Sprint UX V1.2** (correcciones puntuales de UX: Radier, navegación entre fases de Planes, flujo de WC, envase de pintura, DiagramV2, vanos de puertas/ventanas, dosificación por betonera) quedó **formalmente cerrado el 04-ago-2026**, con una auditoría de consistencia completa del registro `MODULE_CONFIG` (40 entradas, 56 módulos en BD) que no encontró referencias huérfanas, duplicadas ni con errores tipográficos en `diagrams`, `combinedAreaQuestion`, `heroResultKey`, `recalculateField`, `optionalQuestionKeys` ni en el campo `recipeGroups` agregado durante este sprint. No hay trabajo pendiente de este sprint sobre el framework visual — cualquier cambio futuro sobre `module-visual-config.ts` debe tratarse como una fase nueva, no como continuación de esta.
