# FASE 6A — DISEÑO DEL CATÁLOGO V2 DE INSPECCIONES

**Estado del documento**: propuesta de diseño únicamente. No se modificó código, schema, seeds ni datos. No hay commit asociado.

**Fecha**: 2026-08-14

---

## A. Catálogo actual de Calculadora

Confirmado por lectura directa de `prisma/schema.prisma` y `prisma/seed-inspecciones.ts` (no se asume nada de memoria de fases previas).

**Dato clave que cambia el punto de partida de este diseño**: el enum `InspectionPropertyType` (schema.prisma:1214-1218) **ya tiene** `CASA`, `DEPARTAMENTO`, `AMPLIACION` como valores reales y validados (`VALID_PROPERTY_TYPES` en `src/app/(app)/inspecciones/actions.ts:8`). El selector de tipo de inmueble en el wizard ya los ofrece. Lo que falta no es soporte estructural — ya existe, incluyendo el campo `appliesTo InspectionPropertyType[]` tanto en `InspectionSpaceTemplate` como en `InspectionElementTemplate` — sino **contenido de catálogo** para Departamento y Ampliación, que hoy es cero.

**Espacios (`InspectionSpaceTemplate`) — 4, todos `appliesTo: [CASA]`:**

| key | label | repeatable | order |
|---|---|---|---|
| cocina | Cocina | no | 0 |
| living | Living | no | 1 |
| dormitorio | Dormitorio | sí | 2 |
| bano | Baño | sí | 3 |

**Elementos (`InspectionElementTemplate`) — 5, todos `appliesTo: [CASA]`:**

| key | label | order |
|---|---|---|
| piso | Piso | 0 |
| muros | Muros | 1 |
| ventana | Ventana | 2 |
| puerta | Puerta | 3 |
| artefactos-sanitarios | Artefactos sanitarios | 4 |

**Vínculos espacio↔elemento (N:N, `InspectionElementTemplateSpace`) — 13:**
cocina→piso,muros,ventana · dormitorio→piso,muros,puerta,ventana · bano→piso,muros,artefactos-sanitarios · living→piso,muros,ventana

**Preguntas (`InspectionChecklistItem`) — 5, ninguna con `defaultSeverity` ni `technicalArticleSlug` en el seed** (los 5 vínculos y la 1 severidad del piloto Fase 5B se hicieron aparte, vía script, no en el seed):
piso: "¿Presenta daños visibles?", "¿Presenta desniveles?" · muros: "¿Presenta fisuras visibles?" · ventana: "¿Opera correctamente?" · puerta: "¿Cierra correctamente?"

**Gap ya existente y heredado, no introducido por este diseño**: el elemento `artefactos-sanitarios` está vinculado a Baño pero tiene **cero preguntas** — es una laguna real del catálogo actual, anterior a esta fase.

---

## B. Catálogo propuesto para CASA

Casa ya tiene la base más sólida. La propuesta es **no tocar lo existente** y cerrar la laguna de Artefactos sanitarios, más agregar Grifería y Enchufes/interruptores (elementos transversales de alto valor, bien documentados en ITO). Techumbre, Escalera y Exterior/Fachada quedan documentados como candidatos de V2, no de V1 — para no inflar el piloto.

## C. Catálogo propuesto para DEPARTAMENTO

Reutiliza íntegramente los 4 espacios y los elementos de Casa (mismo `appliesTo` extendido a `[CASA, DEPARTAMENTO]` — no se duplica nada). Se agregan 2 espacios exclusivos de Departamento con respaldo real en ITO: **Bodega** y **Estacionamiento**. Se documenta explícitamente que contenido de medianeros, aislación acústica entre unidades y áreas comunes **no existe en ninguna fuente disponible** (ni ITO ni Calculadora) — no se propone para V1 ni V2 por falta de fuente, no por decisión arbitraria.

## D. Catálogo propuesto para AMPLIACIÓN

Es el tipo con menos respaldo real en las fuentes. La propuesta es **honesta y deliberadamente acotada**: reutilizar los elementos ya validados (Piso, Muros, Ventana, Puerta) dentro de un espacio genérico repetible ("Recinto ampliado"), y **no** construir un elemento "Estructura" para V1 — la única fuente encontrada es una línea de checklist suelta dentro de Quincho en ITO ("¿La estructura (pilares, vigas) se ve firme y sin grietas visibles?", `seed.ts:1409`), insuficiente para sostener un elemento completo con contenido técnico honesto. Se documenta como 🔴 en la sección K/L.

---

## E. Espacios propuestos

| Tipo | Espacio | Fuente ITO | Repetible | Prioridad |
|---|---|---|---|---|
| Casa | Cocina *(ya existe)* | seed-inspecciones.ts (Calculadora) | no | V1 (ya en prod) |
| Casa | Living *(ya existe)* | seed-inspecciones.ts | no | V1 (ya en prod) |
| Casa | Dormitorio *(ya existe)* | seed-inspecciones.ts | sí | V1 (ya en prod) |
| Casa | Baño *(ya existe)* | seed-inspecciones.ts | sí | V1 (ya en prod) |
| Casa | Techumbre | ITO RoomTemplate `Techumbre` (seed.ts:1166, casa-only) | no | V2 |
| Casa | Exterior/Fachada | ITO RoomTemplate `Exterior` (seed.ts:646) | no | V2 |
| Casa | Escalera | ITO RoomTemplate `Escalera` (seed.ts:1284, casa-only) | no | V2 (solo si aplica al inmueble) |
| Departamento | Cocina/Living/Dormitorio/Baño *(reutilizados de Casa)* | mismos templates, `appliesTo` ampliado | según corresponda | V1 |
| Departamento | Bodega | ITO RoomTemplate `Bodega` (seed.ts:1306, `appliesToCasa:false, appliesToDepto:true`) | no | V1 |
| Departamento | Estacionamiento | ITO RoomTemplate `Estacionamiento` (seed.ts:1328, depto-only) | no | V1 |
| Ampliación | Recinto ampliado (genérico) | sin equivalente directo en ITO — construido reutilizando elementos ya validados de Casa | sí | V1 |
| Ampliación | Techumbre (si la ampliación incluye cubierta nueva) | ITO RoomTemplate `Techumbre` | no | V2 |

No se proponen: Comedor, Logia, Closets, Terraza/Patio, Instalaciones, Equipamiento, Piscina, Quincho — existen en ITO pero no se justifican para V1/V2 cercano por alcance (piscina/quincho son casos de borde, no núcleo de una inspección de recepción de obra) o por redundancia con espacios ya cubiertos (Instalaciones/Equipamiento se reparten mejor como elementos transversales, ver sección F).

---

## F. Elementos propuestos

| Elemento | Espacios | Fuente ITO | Nuevo/Existente | Prioridad |
|---|---|---|---|---|
| Piso, Muros, Ventana, Puerta | *(ya existen)* | — | Existente | V1 (prod) |
| Artefactos sanitarios | *(ya existe, sin preguntas)* | seed.ts:1002 | Existente, incompleto | **V1 — cerrar gap** |
| Grifería | Baño, Cocina | seed.ts:1013 | Nuevo | V1 |
| Enchufes e interruptores | Cocina, Living, Dormitorio | seed.ts:806-810 | Nuevo | V1 |
| Cubierta | Techumbre | seed.ts:1175 | Nuevo | V2 |
| Fachada | Exterior | seed.ts:659 | Nuevo | V2 |
| Peldaños y pasamanos | Escalera | seed.ts:1293 | Nuevo | V2 |
| Tablero eléctrico | Instalaciones (transversal, no space-bound) | seed.ts:1204 | Nuevo | V2 |
| Estructura (pilares/vigas) | Ampliación | seed.ts:1409 (única mención, dentro de Quincho) | Nuevo | 🔴 excluido de V1, ver sección L |
| Bodega (puerta/candado/humedad) | Bodega | seed.ts:1306-1325 | Nuevo | V1 |
| Estacionamiento (demarcación/pavimento/iluminación) | Estacionamiento | seed.ts:1328-1348 | Nuevo | V1 |

**Reutilización N:N** (sección 11 del pedido): Piso, Muros, Ventana y Puerta ya se reutilizan hoy entre Cocina/Living/Dormitorio/Baño vía `InspectionElementTemplateSpace` — el mecanismo N:N ya funciona y no requiere cambios. Grifería y Enchufes/interruptores se diseñan igual, para reutilizarse entre varios espacios sin duplicar el `ElementTemplate`.

---

## G. Preguntas propuestas (clasificadas 🟢 V1 / 🟡 V2 / 🔴 excluir)

**Artefactos sanitarios** (cierra el gap existente):
- 🟢 "¿Después de descargar el inodoro, el agua deja de correr con normalidad?" — adaptado de seed.ts:1009
- 🟢 "¿No hay fugas visibles en la base de los artefactos?" — adaptado del mismo elemento ITO

**Grifería**:
- 🟢 "¿No hay goteras ni filtraciones en las llaves?" — adaptado de seed.ts:1017
- 🟡 "¿La presión de agua caliente y fría es pareja, sin cambios bruscos?" — adaptado de seed.ts:1019 (útil pero requiere que el inspector abra ambas llaves a la vez, más fricción en terreno → V2)

**Enchufes e interruptores**:
- 🟢 "¿Cada enchufe probado funciona con un artefacto real?" — adaptado de seed.ts:806-810
- 🟡 "¿Los interruptores encienden y apagan sin chispazo ni ruido?" — V2, requiere criterio más subjetivo

**Bodega**:
- 🟢 "¿La puerta cierra y el candado/cerradura funciona?"
- 🟡 "¿El espacio está seco, sin humedad ni filtraciones?" — V2, depende de estación/clima al inspeccionar

**Estacionamiento**:
- 🟢 "¿La demarcación del espacio es clara y el pavimento está en buen estado?"
- 🟡 "¿La iluminación y la maniobra de acceso son adecuadas?" — V2, más subjetivo

**Techumbre/Cubierta** (V2 completo, no V1):
- 🟡 "¿No se ve luz del día filtrándose entre las piezas de cubierta?" — adaptado de seed.ts:1178-1181

**Estructura (Ampliación)**:
- 🔴 excluir de V1 y V2 hasta tener fuente suficiente — ver sección L. La única frase disponible ("¿La estructura se ve firme y sin grietas visibles?") es demasiado débil y riesgosa para presentarse como pregunta de inspección estructural sin respaldo técnico ni profesional detrás.

---

## H. Preguntas reutilizables entre Casa / Departamento / Ampliación
Piso, Muros, Ventana, Puerta (ya reutilizadas hoy), Grifería y Enchufes/interruptores (nuevas, aplicables a los tres tipos sin cambios de texto).

## I. Preguntas específicas de un tipo
Bodega y Estacionamiento → exclusivas de Departamento. "Recinto ampliado" reutiliza preguntas de Piso/Muros/Ventana/Puerta ya existentes — no se identificó ninguna pregunta que deba redactarse solo para Ampliación en V1 (razón adicional para no forzar un elemento "Estructura" débil).

---

## J. Fuentes ITO utilizadas
`seed.ts` (RoomTemplate/ElementTemplate/ChecklistItemTemplate reales, líneas citadas arriba), `src/lib/library/inspection-points-data.ts` (265 puntos educativos), `src/lib/library/tolerances-manual.ts` (Manual de Tolerancias CDT). Confirmado por grep completo del código fuente de ITO: **cero citas OGUC/LGUC/NCh en todo el proyecto**, para cualquiera de los temas nuevos revisados — el hallazgo de Fase 5B se sostiene también acá. Único estándar externo real citado en ITO: ASTM 1036-01 (defectos de vidrio, tolerances-manual.ts:30), y el propio Manual de Tolerancias CDT.

Dos temas de ITO están además auto-marcados por el propio proyecto como `lacksNormativeBacking: true`: instalación de gas (seed.ts:1230) y piscina (seed.ts:1364, 1380) — un patrón de honestidad que este diseño adopta también para Estructura/Ampliación.

## K. Contenido técnico disponible (por pregunta candidata V1)

| Pregunta | LibraryArticle ITO | Punto 265 | Manual CDT | Clasificación |
|---|---|---|---|---|
| Artefactos sanitarios (2) | `firmeza-de-artefactos-sanitarios` | sí (§Artefactos sanitarios) | no | 🟢 |
| Grifería — goteras | `filtraciones-y-presion-de-agua` | no | no | 🟡 requiere adaptación |
| Enchufes e interruptores | `prueba-de-enchufes` | sí (§Artefactos eléctricos/Iluminación) | ficha 26 | 🟢 |
| Bodega | ninguno específico | no | no | 🟡 |
| Estacionamiento | ninguno específico | no | no | 🟡 |
| Cubierta (V2) | `estado-de-la-cubierta` | sí (§Techumbre y cubiertas) | no | 🟢 |
| Estructura (Ampliación) | ninguno | no (1 línea suelta en Quincho) | no | 🔴 |

## L. Contenido faltante
- **Estructura para Ampliación**: prácticamente sin fuente. No se recomienda construir este elemento hasta contar con contenido revisado por un profesional — riesgo de que un usuario no capacitado interprete "se ve firme" como validación estructural.
- **Aislación térmica**: una sola línea en todo ITO (`inspection-points-data.ts:169`), insuficiente para un elemento propio.
- **Departamento — medianeros, aislación acústica, áreas comunes**: ausentes en ambas fuentes (ITO y Calculadora). No se propone contenido inventado; se documenta como vacío real.

## M. Cantidad total V1 propuesta
- Espacios V1 (incluyendo los 4 ya en producción): **7** — 4 Casa (sin cambio) + Bodega + Estacionamiento (Departamento) + Recinto ampliado (Ampliación).
- Elementos V1 (incluyendo los 5 ya en producción): **8** — 5 existentes + Artefactos sanitarios (completado) + Grifería + Enchufes/interruptores. (Bodega/Estacionamiento se modelan como elementos propios de su espacio, ya contados dentro del total si se prefiere contarlos aparte: +2 → 10.)
- Preguntas V1 (incluyendo las 5 ya en producción): **11** — 5 existentes + 6 nuevas 🟢 (2 Artefactos sanitarios, 1 Grifería, 1 Enchufes, 1 Bodega, 1 Estacionamiento).

No se acerca ni de lejos a las 348 preguntas de ITO — deliberado.

## N. Priorización P0/P1/P2

- **P0 — imprescindible**: cerrar el gap de Artefactos sanitarios (ya vinculado, sin preguntas — es el único bug de catálogo heredado); Grifería y Enchufes/interruptores (alto valor, buena fuente, bajo esfuerzo).
- **P1 — importante**: Bodega y Estacionamiento (habilitan Departamento como tipo usable por primera vez); Recinto ampliado con elementos reutilizados (habilita Ampliación de forma honesta, sin inventar Estructura).
- **P2 — complementario**: Techumbre/Cubierta, Fachada/Exterior, Escalera — todos con buena fuente pero de menor frecuencia de uso (no todas las casas tienen escalera; techumbre requiere acceso que no siempre es seguro en terreno).
- **Excluido explícitamente**: Estructura (Ampliación), Piscina, Quincho, Instalación de gas — todos con contenido débil o auto-marcado sin respaldo normativo en la propia fuente.

## O. Estimación de extensión de una inspección V1

- Casa (sin cambios): 4 espacios × ~3-4 elementos × 1-2 preguntas ≈ igual que hoy → 🟢 razonable (ya validado en Fase 5B).
- Casa + gap cerrado (Artefactos sanitarios +2, Grifería +1, Enchufes +1 en los espacios que correspondan): incremento marginal, sigue 🟢 razonable.
- Departamento V1 (4 espacios reutilizados + Bodega + Estacionamiento, ~13 preguntas totales): 🟢 razonable — comparable en tamaño a Casa.
- Ampliación V1 (1 espacio repetible con 4 elementos reutilizados, ~5 preguntas por recinto ampliado): 🟢 razonable si es una ampliación de 1-2 recintos; 🟡 extensa si el usuario marca muchos recintos repetidos — vale la pena un límite de UX razonable (no impuesto por este diseño, solo señalado como riesgo de UX).

Ninguna combinación V1 propuesta cae en 🔴 excesiva.

## P. Riesgos

- **Riesgo de alcance**: la tentación natural al ver 348 preguntas disponibles en ITO es importar de más — este diseño se resiste activamente a eso y lo dice explícito.
- **Riesgo de falsa autoridad estructural**: cualquier pregunta sobre "Estructura" sin respaldo real puede hacer que un usuario no profesional crea que validó algo que no validó — motivo principal para excluirla de V1/V2 hasta tener mejor fuente.
- **Riesgo de contenido huérfano**: Bodega y Estacionamiento no tienen `LibraryArticle` ni punto 265 asociado en ITO — si se implementan, sus futuros `TechnicalArticle` de Fase 6B+ tendrán que redactarse desde cero (marcado 🟡 en K), no migrarse.
- **Riesgo de inconsistencia entre tipos**: al compartir `appliesTo` en Piso/Muros/Ventana/Puerta entre Casa y Departamento, cualquier cambio futuro a esas preguntas afecta a ambos tipos simultáneamente — ya es así hoy entre Cocina/Living/Dormitorio/Baño, así que no es un riesgo nuevo, solo se documenta que se extiende.

## Q. Recomendación final

Priorizar P0 primero (cerrar el gap de Artefactos sanitarios — es honestamente un bug de catálogo, no una expansión) y luego P1 (Bodega/Estacionamiento para Departamento, Recinto ampliado para Ampliación) en una futura Fase 6B de implementación acotada, replicando el mismo patrón validado en Fase 5B: pocos ítems, cada uno con fuente real citada, sin inventar normativa, con clasificación 🟢/🟡/🔴 explícita antes de escribir una sola línea de contenido. No tocar Estructura/Ampliación hasta que exista una fuente técnica real (revisión de un profesional, o un ITO más maduro en ese tema) — forzarlo ahora repetiría el mismo error que este proyecto ya decidió evitar en Fase 5B.

## R. Estado

DISEÑO CATÁLOGO V2 COMPLETADO
