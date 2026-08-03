# Auditoría — Estándar de UX "flujo de cálculo" (spec: `ObraBien CC.pdf`)

Fuente: PDF "ObraBien Calculadora - Flujo rediseñado", turno 6. Mockups: Mobile 375px y Desktop 1280px del flujo de Radier (elección → medidas → origen del hormigón → resultado).

## 0. Conclusión de arquitectura (antes de los detalles)

**Esto no es "construir un framework desde cero".** La app ya tiene, desde antes de este pedido:

- Un wizard **completamente genérico**, usado por los ~57 módulos vía datos de DB, no código por módulo: `ModuleWizard` → `QuestionStep`/`QuestionGroupStep` → `ResultScreen` → `PricedResults`/`GuideSection` (`src/components/module/`, 18 archivos).
- Un motor de cálculo **completamente genérico** (DSL declarativo en `src/lib/formula-engine/`) — ninguna fórmula vive en código TypeScript por módulo. Esta capa **no la toco en absoluto**.
- Un sistema de diagramas paramétrico real, **Diagram System V2** (`src/lib/diagram-v2/`), ya aprobado y congelado como único renderer — exactamente lo que el PDF pide como "motor de diagramas paramétrico reutilizable". No hay que inventarlo, hay que **extenderlo y conectarlo mejor**.

Lo que el PDF pide es, en el fondo: **restylear/completar componentes genéricos que ya existen**, más **cerrar 2-3 huecos reales** (panel de resumen en vivo, un par de figuras del motor de diagramas, la conexión del espesor de Radier al diagrama). El riesgo de "romper otras calculadoras" es real — porque todo es compartido, un cambio en `QuestionStep` afecta a los 57 módulos simultáneamente — pero el riesgo de "duplicar código" es bajo, porque ya no hay 57 implementaciones distintas que unificar.

## 1. Qué ya existe y sirve tal cual (o casi)

| Pieza del PDF | Componente real | Estado |
|---|---|---|
| Wizard de pasos | `ModuleWizard` (`module-wizard.tsx`) | Genérico, 57 módulos, sin cambios de lógica necesarios |
| Barra de progreso segmentada | `WizardHeader` (`wizard-header.tsx:29-40`) | **Ya es segmentada** (un tramo por paso), coincide con el PDF. Falta el link "← Inicio" / "← Atrás · Hacer un [módulo]" que el PDF sí muestra en el header |
| Pantallas de selección con fotos | `QuestionStep` + `ImageOptionCard` (`image-option-card.tsx`) | Existe, pero la miniatura es **cuadrada 96×96/112×112 con `object-cover`**, no 16:9. Es el cambio de UI más visible del PDF |
| Resultado / materiales / precios editables | `ResultScreen` + `PricedResults` | Genérico, precios editables ya funcionan. Falta el tratamiento "dato protagonista" (número gigante arriba) — hoy es una lista plana |
| Guía práctica | `GuideSection` (DB-driven, `ModuleGuide`) | Ya existe, solo Radier tiene contenido cargado hoy |
| Espesor editable con recálculo en cascada | `RecalculateField` (`recalculate-field.tsx`) | El mecanismo genérico **ya existe y ya recalcula todo** (volumen/materiales/costos/dosificación) — pero **hoy solo está conectado en Radier vía `RECALCULATE_FIELDS`**. Es justo el ejemplo del PDF, así que esto se activa, no se construye |
| Diagrama que se actualiza en vivo mientras se escribe | `DiagramV2` (`src/lib/diagram-v2/`) | Ya renderiza SVG puro (sin imágenes) y re-renderiza en cada tecla, con resaltado del campo activo (`activeField`) |

## 2. Huecos reales frente al PDF (esto sí hay que construirlo/cambiarlo)

1. **Panel de resumen en vivo, editable durante todo el flujo.** No existe. Hoy el resumen de respuestas solo aparece al final (`answersSummary` en `ResultScreen`) o al volver al wizard completo vía "Editar respuestas". El PDF lo pide visible en TODOS los pasos (columna derecha en desktop, tarjeta "Tus respuestas" en el paso de resultado en mobile), con cada línea editable sin reiniciar. **Hay que construirlo como componente genérico nuevo.**

2. **Fotos 16:9 en selección**, hoy son thumbnails cuadrados. Cambio de layout, no de datos.

3. **Cobertura real de fotos: solo 2 de ~57 módulos tienen `imageUrl` en sus opciones** (Radier/uso: 4 fotos, Pintura/superficie: 3 fotos — 7 imágenes de opción en total, de 24 imágenes en todo `public/images/`). El PDF mismo ya anticipa este caso ("Si el módulo aún no tiene foto, el espacio se mantiene con el fondo `#E7EBF2`; la tarjeta nunca cambia de alto") — así que el fallback está definido, pero **el 96% de los módulos van a mostrar el placeholder vacío, no fotos reales**, hasta que se carguen más imágenes (fuera de alcance: no genero imágenes nuevas, per tu instrucción).

4. **Diagram System V2 — 3 gaps concretos**:
   - `circle2d` (piscina circular vista superior, sin profundidad) tiene un bug real: el radio dibujado es **fijo**, no depende del diámetro tipeado. Hoy no lo usa ningún módulo en producción, pero el PDF lo pide explícitamente para "Piscina circular · Vista superior".
   - No existe una figura de **muro** ni de **techo con pendiente**. Hoy ambos se dibujan como `rect2d` genérico (rectángulo plano), sin distinguirse visualmente de un piso o una pared vista de frente.
   - El mapeo `shape → kind` está duplicado en dos lugares de `question-group-step.tsx` en vez de ser una función única — no es un bug, pero si agrego figuras nuevas (muro, techo) es el momento de unificarlo.

5. **Radier: el espesor no está conectado al diagrama.** Esto está documentado como decisión deliberada ("DECISIÓN (confirmada con Jorge): no tocar", `question-group-step.tsx:224-241`) porque el espesor se pregunta en un stepGroup separado y fusionarlo requería tocar el flujo de preguntas. **El PDF pide exactamente lo contrario** (mockup 5b: el diagrama de "¿Qué medidas tiene el radier?" muestra Largo/Ancho/Espesor los tres juntos, con el espesor editable ahí mismo). Esto es un cambio de UX que toca cómo se agrupan los pasos de Radier — no toca la fórmula, pero sí decido si fusiono esos dos pasos. **Te lo marco como punto a decidir explícitamente, porque contradice una decisión tuya anterior.**

6. **Header del wizard**: falta el link "← Inicio" y "← Atrás · Hacer un [módulo]" que el PDF muestra en la fila superior de cada paso.

## 3. Riesgos

- **Blast radius total**: cualquier cambio en `QuestionStep`/`ResultScreen`/`WizardHeader` afecta los 57 módulos a la vez. No hay forma de hacerlo "módulo por módulo" para estos componentes compartidos — hay que probar con varios módulos representativos (no solo Radier) antes de dar por cerrada cada etapa.
- **Datos de imagen desiguales**: como se ve en el punto 3, la experiencia "con foto" solo se ve completa en Radier y Pintura hoy. El resto de los módulos verán el placeholder. Esto es fiel al PDF (que ya contempla el placeholder), pero puede sentirse incompleto visualmente hasta que cargues más fotos.
- **Regularización reutiliza `QuestionStep`/`WizardHeader`** — cualquier cambio a esos componentes también le llega a Regularización automáticamente (ya validado el mismo día que se congeló el Diagram System V2). Hay que revisar Regularización en cada etapa, no solo los módulos de cálculo.
- **No toco la capa de negocio**: `formula-engine`, `Question`/`Variable`/`Formula`/`Material`/`Norm` en Prisma, y todos los valores de DB quedan intactos. Todo lo que sigue es solo componentes de presentación (`src/components/module/`, `src/lib/diagram-v2/`) y, si se aprueba el punto 5, la agrupación de pasos de Radier (sin tocar sus preguntas ni fórmulas).

## 4. Plan de implementación propuesto (por etapas, con aprobación entre cada una — mismo criterio que la Home)

1. **Etapa 1 — Header del wizard**: agregar "← Inicio" / "← Atrás · Hacer un [módulo]" a `WizardHeader`, sin tocar la barra segmentada (ya coincide).
2. **Etapa 2 — Selección con fotos 16:9**: restylear `ImageOptionCard` a formato 16:9 (mobile: miniatura 112×63 a la izquierda en listas de 3+ opciones, o banda superior ancho completo en 2 opciones; desktop: portada ancho completo `aspect-ratio: 16:9`), con el fallback de fondo `#E7EBF2` cuando no hay foto. Validar con Radier (con fotos) y con un módulo sin fotos (placeholder).
3. **Etapa 3 — Panel de resumen en vivo (nuevo componente genérico)**: construir el panel "Tus respuestas"/"Con estos datos calculamos" que persiste en cada paso, editable sin reiniciar, reutilizando el estado `answers` que `ModuleWizard` ya mantiene. Layout: columna derecha en desktop, tarjeta colapsable en mobile (según el mockup).
4. **Etapa 4 — Diagram System V2, cierre de gaps**: arreglar el radio fijo de `circle2d`, agregar figura de muro y de techo con pendiente, unificar el mapeo `shape → kind`.
5. **Etapa 5 — Radier: fusión de pasos para espesor en el diagrama** (requiere tu decisión explícita del punto 5 antes de tocar nada acá).
6. **Etapa 6 — Resultado "dato protagonista"**: restylear la cabecera de `ResultScreen` para destacar el dato principal (ej. "9 bolsas de cemento") antes de la lista de materiales, conectar `RecalculateField` de espesor visualmente al nuevo estilo.
7. **Etapa 7 — QA transversal**: probar el flujo completo en al menos 4-5 módulos distintos (con y sin fotos, con y sin guía, 2D y 3D), Regularización incluida, + mobile/desktop + accesibilidad, antes del primer commit.

Cada etapa se muestra para validación visual antes de seguir, igual que en la Home. Sin commit hasta que la migración completa esté aprobada.

## 5. Preguntas bloqueantes antes de empezar

1. **Punto 5 (espesor de Radier en el diagrama)**: ¿autorizas revertir la decisión "no tocar" y fusionar el paso de espesor con el de largo/ancho para que el diagrama muestre las 3 dimensiones como en el mockup? Esto no cambia preguntas, fórmulas ni resultados — solo en qué paso se piden y cómo se dibujan.
2. **Cobertura de fotos**: ¿seguimos con el placeholder `#E7EBF2` para los ~55 módulos sin fotos por ahora (fiel al PDF), o prefieres que priorice cargar fotos a más módulos antes de esta migración (fuera de alcance de "no generar imágenes nuevas", pero podría afectar qué tan completa se ve la experiencia)?
3. **Alcance de Etapa 5 (muro/techo)**: ¿quieres que to Etapa 4 cubra específicamente los módulos que el PDF menciona (Muros, Pintura, Cerámica, Techo) o el conjunto completo de módulos que hoy caen en `rect2d` genérico?
