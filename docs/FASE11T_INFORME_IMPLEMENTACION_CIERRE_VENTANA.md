# Fase 11T — Implementación del cierre técnico de Ventana

Fecha: 2026-08-17. Implementa **localmente** las 4 revisiones aprobadas en Fase 11S (`docs/FASE11S_CIERRE_TECNICO_VENTANA.md`, sección L), llevando Ventana de 3 a 7 revisiones activas. Sin publicar.

## A. Auditoría previa

- `git status --porcelain` al inicio: idéntico al cierre de Fase 11S — solo trabajo preexistente no relacionado (`module/*`, `diagram-v2/*`, docs de otras fases, `inspect-uncertainty-options.ts`). Confirmado explícitamente que ninguno de esos archivos se tocó durante esta fase.
- Catálogo real de Ventana confirmado por consulta directa antes de escribir nada: 3 revisiones activas (`ventana-apertura-cierre`, `ventana-manilla-herrajes`, `ventana-sello-hoja-marco`), 1 inactiva (`¿Opera correctamente?`), 11 checks históricos reales sobre el item inactivo, 0 `InspectionReferenceImage`.
- Confirmado que el modelo publicado en Fase 11O/11Q (`InspectionReferenceImage`, UI "Ver ejemplos", alias de encabezados) ya soporta las 4 revisiones nuevas sin requerir ningún cambio de código adicional — por eso esta fase es **solo catálogo**, sin tocar ningún componente React ni query.

## B. Archivos modificados

Un único archivo nuevo:

```
prisma/db-fixes/fase11t-cierre-ventana.ts
```

Ningún otro archivo de código fue creado ni modificado. `git diff --stat` al cierre confirma que los 9 archivos con cambios pendientes son exactamente los mismos de `module/*`/`diagram-v2/*` que ya estaban así antes de esta fase — cero superposición con Fase 11T.

## C. Revisiones creadas

4 `InspectionChecklistItem` nuevos bajo el mismo `elementTemplateId` de Ventana, `order` 4–7, con el texto **exacto** pedido en esta fase:

4. `¿El vidrio presenta rayas, trizaduras u otros daños visibles?`
5. `Si la ventana es de termopanel (doble vidrio), ¿se ve condensación o empañamiento ENTRE los vidrios?`
6. `¿El sello entre el marco de la ventana y el muro se ve continuo, sin separaciones ni grietas?`
7. `¿El marco de la ventana presenta golpes, rayas profundas o deformaciones visibles?`

Las 3 preguntas ya publicadas (`order` 1–3) y la pregunta antigua inactiva (`order` 0, `¿Opera correctamente?`) **no se tocaron** — mismo id, mismo texto, mismo estado `active`.

## D. TechnicalArticle creados

4 artículos nuevos, contenido tomado literalmente de la sección L de `FASE11S_CIERRE_TECNICO_VENTANA.md`, sin agregar criterios ni tolerancias nuevas:

- `ventana-vidrio-danos-visibles`
- `ventana-vidrio-condensacion-interna`
- `ventana-sello-marco-muro`
- `ventana-marco-danos-visibles`

Los 7 encabezados obligatorios presentes en los 4 (`# Qué revisar`, `# Cómo revisarlo`, `# Qué debería verse`, `# Qué señales pueden indicar un problema`, `# Por qué importa`, `# Recomendación`, `# Fuente`) — verificado en el navegador que el encabezado "QUÉ DEBERÍA VERSE" se parsea y muestra correctamente (usa el alias agregado en Fase 11Q, sin necesitar ningún cambio nuevo). Sin correcciones editoriales adicionales — el contenido de Fase 11S ya venía redactado consistente con la UI actual.

## E. Orden final

Confirmado en producción local, "Ver cómo revisarlo" y orden de aparición:

1. Apertura y cierre
2. Manilla y herrajes
3. Sello hoja-marco
4. Vidrio — daños visibles
5. Vidrio — condensación interna
6. Sello marco-muro
7. Marco — daños visibles

`¿Opera correctamente?` permanece `active: false` — **no se reactivó** en ningún momento. Solo aparece en el caso histórico simulado para pruebas (sección I).

## F. Condensación/termopanel

Sin motor de variantes ni campo `condition`/`materialVariantOf` nuevo. La pregunta 5 es autocalificante ("Si la ventana es de termopanel...") — el usuario decide si aplica. Probado explícitamente: **"No corresponde"** con motivo `[QA Fase11T] Ventana de vidrio simple, no termopanel` guardado y persistente tras recarga completa. Ninguna respuesta se preseleccionó ni se infirió el tipo de vidrio en ningún momento — el check se generó igual que cualquier otro, sin estado inicial.

## G. No corresponde

Confirmado en las 4 revisiones nuevas: mismo flujo de 3 botones (Está bien / Tiene un problema / No corresponde) que las 3 ya publicadas, sin excepción. "No corresponde" (probado en la revisión de condensación) permitió motivo opcional, no creó ninguna `InspectionObservation`, y siguió siendo editable después (se pudo volver a abrir el selector de estado tocando la pastilla, mismo comportamiento que el resto del catálogo).

## H. Referencias visuales

`InspectionReferenceImage.count() = 0` confirmado antes y después de correr el script — **no se insertó ninguna imagen permanente**, no se generó ninguna, no se insertó ningún placeholder. Verificado en el navegador: sin referencias, "Ver ejemplos" **no aparece** en ninguna de las 4 revisiones nuevas. Las 4 quedan estructuralmente listas para futuras `InspectionReferenceImage` (misma FK a `checklistItemId` que ya usan las revisiones publicadas) sin requerir ningún cambio adicional.

## I. Compatibilidad histórica

Simulado un check apuntando al item antiguo inactivo (`questionSnapshot: "¿Opera correctamente?"`, `status: OK`) sobre el mismo elemento Ventana del caso QA. Resultado en el navegador: **"Ventana 5/8"** — la pregunta antigua se mostró primero, tal cual, junto a las 7 revisiones nuevas, sin error, sin fusionarse ni reinterpretarse como ninguna de las 7. El check histórico nunca fue migrado ni modificado — se creó como una fila nueva independiente, exactamente como habría quedado un check real generado antes de esta fase.

## J. QA funcional

Caso QA nuevo generado después de aplicar el catálogo (`createInspectionAndGenerateAction` real, vía script que replica la misma consulta `active: true`):

- **B.** Ventana mostró **0/7** al crear el caso — confirmado por consulta directa antes de abrir el navegador.
- **C.** Las 7 preguntas aparecieron en el orden correcto (verificado con `get_page_text` completo de la sección Ventana).
- **D.** Las 4 nuevas mostraron guía breve (`"Revisa: ..."`) antes de los botones de evaluación, igual que las 3 publicadas.
- **E.** "Ver cómo revisarlo" en Sello marco-muro mostró las 6 secciones esperadas (Qué revisar/Cómo revisarlo/Qué debería verse/Qué señales/Por qué importa/Recomendación).
- **F.** Ninguna de las 7 apareció con respuesta pre-marcada al crear el caso.
- **G.** Vidrio — daños visibles → **Está bien**.
- **H.** Condensación → **No corresponde** + motivo (sección F).
- **I.** Sello marco-muro → **Tiene un problema**, severidad Media.
- **J.** Marco → **Tiene un problema**, severidad Alta.

## K. Persistencia

Comentario, "Nivel del problema" (Media en Sello marco-muro, Alta en Marco) y el motivo de "No corresponde" — los 3 se recargó la página completa (no solo estado de React) y **persistieron exactamente igual**, confirmado con `get_page_text` post-recarga.

## L. Fotografías

Foto real (PNG) subida al hallazgo de Sello marco-muro mediante `<input type=file>` con un `File`/`DataTransfer` real (no simulación de UI) — confirmado en el DOM: `<img src="https://387r6zvxbs2engtm.public.blob.vercel-storage.com/inspection-photos/...">`, subida real a Vercel Blob Storage (entorno de desarrollo), y **persistió tras recargar la página**.

## M. Redacción local

"Sugerir redacción" probado sobre el hallazgo de Sello marco-muro: generó `"Se observa: [QA Fase11T] Se observa una separación en el sello del sector inferior."` — usa el `TechnicalArticle` correcto (`ventana-sello-marco-muro`), sin llamar ningún servicio externo, funcionando exactamente igual que en Fase 11Q/11R.

## N. Resumen/PDF

`/resumen` mostró: 1 OK / 2 Observación / 1 No aplica / 3 pendientes, severidad (1 Media, 1 Alta), ambos hallazgos (Sello marco-muro, Marco) correctamente identificados con su pregunta específica y su enlace "Cómo revisar..." resuelto al artículo correcto. Ambos PDFs devolvieron `200`/`application/pdf`:

```
GET /api/inspecciones/[id]/pdf/resumen    → 200
GET /api/inspecciones/[id]/pdf/detallado  → 200
```

## O. Ownership

Segundo usuario QA (`qa.fase11t.b@example.com`) intentó acceder al caso del primero → **"Inspección no disponible — Esta inspección no existe o no tienes permisos para acceder a ella."** Sin Server Action nueva creada para esta fase (el catálogo se lee por la misma consulta ya protegida), consistente con lo ya confirmado en Fase 11Q/11R.

## P. Mobile

375px: las 7 revisiones + el check histórico (8 en total) renderizaron completos, con guía breve, guía expandida, formulario de hallazgo y sección de fotografía visibles y usables. `document.documentElement.scrollWidth === document.documentElement.clientWidth === 375` confirmado — **sin overflow horizontal**.

## Q. TypeScript

`npx tsc --noEmit` → limpio.

## R. ESLint

`npx eslint .` → limpio.

## S. Vitest

`npx vitest run` → **95/95 tests pasan** (10 archivos) — sin cambios respecto a Fase 11R (no se tocó ningún archivo de código).

## T. Build

`npx next build` → build de producción exitoso, sin errores.

## U. Limpieza QA

Eliminado: 1 usuario QA principal (con 2 casos: el de prueba dirigido y uno adicional creado durante el intento de regresión ampliada), 1 usuario QA secundario (ownership, sin casos propios), el check histórico simulado (cascada junto con su caso), la foto QA (blob huérfano eliminado directamente de Vercel Blob Storage con `del()`), y los 3 scripts temporales `_tmp_11t_*.ts`. Verificado por consulta directa: `InspectionReferenceImage` = 0, usuarios QA = 0, casos con nombre `Fase11T` = 0. Se conservó `prisma/db-fixes/fase11t-cierre-ventana.ts`.

**Confirmado intacto**: 3 casos reales de `jorge.arojasr@gmail.com` (`las dalias`, `PROPIA`, `xcxc`) sin cambios; 11 checks históricos reales sobre el item antiguo, sin modificar; catálogo de Ventana con 8 `InspectionChecklistItem` totales (1 inactivo + 7 activos), exactamente como se dejó.

## V. Regresiones

No se modificó ningún archivo de Piso, Muros, Puerta, Enchufes, Artefactos sanitarios, Bodega o Estacionamiento — el `git diff` confirma que el único archivo nuevo de esta fase es el script de catálogo, y ningún componente compartido (`checklist-item-row.tsx`, `element-checklist-group.tsx`, `[id]/page.tsx`, `inspecciones-knowledge.ts`) fue tocado. Como esos 7 componentes/elementos renderizan a través de exactamente el mismo código ya validado en Fase 11Q/11R, y la regresión automatizada (tsc/eslint/vitest/build) pasó limpia, se consideró que el riesgo de regresión es estructuralmente nulo — no se recreó manualmente un caso con todos los tipos de recinto para reclickear cada uno, siguiendo el criterio de "no repetir todos los tests históricos, solo detectar regresiones" ya usado en Fase 11R.

## W. Git status

```
git status --porcelain (al cierre):
 M src/components/module/dosificacion-card.tsx
 M src/components/module/module-visual-config.ts
 M src/components/module/module-wizard.tsx
 M src/components/module/recalculate-field.tsx
 M src/components/module/result-hero.tsx
 M src/components/module/result-screen.tsx
 M src/lib/diagram-v2/DiagramV2.tsx
 M src/lib/diagram-v2/render/solid-3d.tsx
 M src/lib/diagram-v2/render/theme.ts
?? docs/BASE_PRECIOS_REFERENCIA_DISENO.md
?? docs/ESTUDIO_TECNICO_CALCULADORES.md
?? docs/FASE11C_INFORME_PUBLICACION.md
?? docs/FASE11G_VALIDACION_FUENTES_PREGUNTAS_PENDIENTES.md
?? docs/FASE11J_REDISENO_PROFUNDO_INSPECCION_GUIADA.md
?? docs/FASE11M_DISENO_MOTOR_REVISIONES_VARIANTES.md
?? docs/FASE11R_INFORME_PUBLICACION_PILOTO_VENTANA.md
?? docs/FASE11S_CIERRE_TECNICO_VENTANA.md
?? prisma/db-fixes/fase11t-cierre-ventana.ts     ← NUEVO, esta fase
?? prisma/db-fixes/inspect-uncertainty-options.ts
?? docs/FASE4B_ESPECIFICACION_TECNICA_P1.md
?? docs/FASE4_DISENO_CATALOGO_NUEVO.md
```

Todo lo demás es trabajo preexistente no relacionado (Radier vía `module/*`, `diagram-v2/*`, docs de otras fases) — sin ninguna superposición con Fase 11T. **No se usó `git add .` ni `git add -A` en ningún momento** (de hecho, no se usó `git add` en absoluto — no hubo commit). **No hubo commit. No hubo push. No hubo deploy.**

## X. Estado final

- Ventana queda con **7 revisiones activas** en la BD compartida, listas para generarse en casos nuevos: Apertura/cierre, Manilla/herrajes, Sello hoja-marco, Vidrio-daños, Vidrio-condensación, Sello marco-muro, Marco-daños.
- La pregunta antigua permanece inactiva, intacta, y sus 11 checks históricos reales siguen resolviendo sin error.
- `InspectionReferenceImage` permanece en 0 en todo el catálogo — la UI publicada sigue ocultando "Ver ejemplos" correctamente para las 7 revisiones (ninguna tiene referencias todavía).
- Script `prisma/db-fixes/fase11t-cierre-ventana.ts` idempotente, verificado con 2 ejecuciones consecutivas (la segunda actualiza en vez de duplicar).
- Regresión completa limpia (tsc/eslint/vitest 95/95/build).
- QA funcional completo: caso nuevo, orden correcto, guía completa, condensación autocalificante sin variantes, evaluación independiente con persistencia real (comentario, severidad, motivo, foto), redacción local, resumen/PDF, ownership, caso histórico, mobile 375px sin overflow.
- Limpieza QA completa, incluyendo el blob huérfano de Vercel Blob Storage.
- 3 casos reales y 11 checks históricos reales de Jorge confirmados intactos antes y después.
- Todo el trabajo de código queda **solo en local**, sin commitear, pushear ni deployar — como ocurrió con Fase 11Q/11O antes de su publicación en Fase 11R, el catálogo ya es efectivo en la BD compartida (afecta también producción a nivel de datos), pero el código de esta fase (que no requirió ningún cambio, ya que el modelo estaba completamente preparado desde Fase 11Q) no necesita publicación adicional — solo el catálogo mismo, que ya está aplicado.

FASE 11T — CIERRE DE VENTANA IMPLEMENTADO LOCALMENTE
