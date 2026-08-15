# FASE 11E — INFORME: LOTE 1 DE BIBLIOTECA TÉCNICA GUIADA

**Estado**: implementado localmente. Sin commit, sin push, sin deploy —
tal como exigió explícitamente el alcance de esta fase.

## A. Archivos modificados

- `src/lib/inspecciones-knowledge.ts` — alias nuevo `porQueImporta` (+ alias `"qué revisar"`/`"que revisar"` agregado a `queRevisar`, sin quitar `"qué se revisa"` que sigue usando Piso).
- `src/components/inspecciones/checklist-item-row.tsx` — `GuideBlock` ahora acepta y muestra `porQueImporta` (solo si el artículo lo tiene).
- `src/components/inspecciones/element-checklist-group.tsx` — tipo `technicalArticle` extendido con `porQueImporta`.
- `prisma/db-fixes/fase11e-biblioteca-guiada-lote1.ts` — **nuevo**, script permanente/idempotente (se conserva).

`src/app/(app)/inspecciones/[id]/page.tsx` no necesitó cambios: ya usaba `...parseKnowledgeContent(a.content)` (spread), así que `porQueImporta` se propaga automáticamente. Ningún cambio de Prisma/schema/migración. Ningún archivo de Radier/módulo/diagram-v2 tocado (confirmado por `git status`).

## B. TechnicalArticle modificados (3)

- `muros-como-revisar-fisuras`
- `ventana-como-revisar-funcionamiento`
- `puerta-como-revisar-cierre`

Los 3 conservan su fuente original y (Muros) su `defaultSeverity=MEDIUM` sin reinterpretar — solo se reorganizó el contenido bajo la plantilla de 7 encabezados y se agregaron "Cómo revisarlo" y "Por qué importa".

## C. TechnicalArticle creados (4)

- `artefactos-sanitarios-como-revisar-descarga-inodoro`
- `artefactos-sanitarios-como-revisar-fugas-base`
- `artefactos-sanitarios-como-revisar-goteras-llaves`
- `enchufes-interruptores-como-revisar-funcionamiento`

## D. Preguntas vinculadas

Ninguna pregunta nueva creada. Se vinculó `technicalArticleSlug` en 4 `InspectionChecklistItem` **ya existentes** (ids confirmados por consulta directa antes de escribir el script): las 3 de Artefactos sanitarios y la de Enchufes e interruptores. Muros/Ventana/Puerta ya estaban vinculadas desde Fase 5B, sin cambios de vínculo.

**Total: 9 preguntas activas con experiencia guiada** (2 Piso + 3 Muros/Ventana/Puerta + 3 Artefactos sanitarios + 1 Enchufes) — exactamente lo previsto en el alcance.

## E. Muros

Extendido sin alterar el criterio existente (fisura de retracción/capilar/con indicios estructurales, umbral 0,3 mm, `defaultSeverity=MEDIUM`). "Qué señales pueden indicar un problema" lista únicamente señales observables (ancho, ubicación, espesor al tacto) sin atribuir causa ("es estructural", "es asentamiento", "es falla de construcción" — ninguna aparece). "Por qué importa" explica el criterio de severidad sugerida sin reinterpretarlo.

## F. Ventana

Extendida cubriendo apertura/cierre/desplazamiento/traba/holguras/luz visible, tal como pedía el alcance. No se distinguió PVC/aluminio (la fuente original no los distingue). Ninguna atribución de causa — la antigua frase "puede indicar un problema de alineación del marco o de la instalación" (de "Cuando existe una observación", Fase 5B) **no se copió** a la nueva sección de señales.

## G. Puerta

Extendida cubriendo abrir/cerrar, roce, pestillo, holgura, bisagras. Misma decisión que Ventana: la frase original "suele indicar una bisagra floja o un problema de alineación del marco" **no se trasladó** a la nueva sección — se reemplazó por "puede convenir revisarlo con más detalle... esto no determina por sí solo la causa".

## H. Artefactos sanitarios

3 artículos nuevos, uno por pregunta (descarga del inodoro, fugas en la base, goteras/filtraciones en llaves), usando solo la fuente ya identificada en Fase 6A. Ninguno pide desmontar artefactos, abrir conexiones ni usar herramientas — todas las acciones son observación visual/auditiva o accionar la descarga normalmente.

## I. Enchufes e interruptores

1 artículo nuevo. Revisión estrictamente funcional/visual (probar con un artefacto real, encender/apagar interruptores) — no pide abrir enchufes, retirar tapas, manipular conductores ni tocar partes energizadas. Incluye, en la sección Recomendación, la advertencia de seguridad exacta pedida: *"Si observas daño, calor, olor extraño, chispa o partes expuestas, no manipules el elemento y solicita revisión de un profesional competente."*

## J. Campo "Por qué importa"

Implementado en `inspecciones-knowledge.ts` como alias aditivo (`# por qué importa` / `# por que importa`), mismo patrón que `comoRevisarlo`/`senalesDeProblema` de Fase 11B. Sin cambio de schema. Propagado hasta `GuideBlock`, que solo lo pinta si el artículo lo tiene — verificado que Piso (que no tiene esta sección) sigue mostrando su guía sin el bloque "Por qué importa" y sin error.

## K. Fuentes utilizadas

Todas ya citadas en Fase 5B/6A, ninguna nueva. Cada artículo clasifica su fuente por tipo (**Manual técnico de referencia** / **Criterio interno adaptado** / **Biblioteca técnica**), según la regla de Fase 11D. Cero citas OGUC/LGUC/NCh. El Manual de Tolerancias CDT se presenta siempre como manual técnico de referencia, nunca como norma legal.

## L. Seguridad de redacción

Búsqueda automatizada en el script completo (`grep -i`) de: *"significa que", "demuestra que", "falla estructural", "no cumple", "cumple normativa", "debe estar mal instalado", "está mal instalado", "esto indica que", "esto significa"* — **0 coincidencias**. Búsqueda adicional de atribución causal indirecta (*"indicar un problema de alineación", "suele indicar"*) — **0 coincidencias**. Las 2 frases causales que sí existían en el contenido original de Fase 5B (Ventana y Puerta, dentro de "Cuando existe una observación") se dejaron intactas en esa sección heredada (no se pidió reescribirla) pero **deliberadamente no se replicaron** en las nuevas secciones "Qué señales pueden indicar un problema"/"Por qué importa".

## M. QA funcional

Probado en navegador local con una inspección Casa nueva (Dormitorio 1 + Baño 1):
- Dormitorio: Piso (×2), Muros, Puerta, Ventana, Enchufes — las 6 preguntas guiadas se ven correctamente, guía siempre antes de los botones, ninguna respuesta pre-marcada (todas partieron en 0 revisados).
- Baño: Piso, Muros, y las 3 preguntas de Artefactos sanitarios — mismo resultado.
- Se marcó "Tiene un problema" en Muros, se agregó comentario y severidad (Media, por defecto pero editable — confirmado como `<select>` no bloqueado), se guardó, y se confirmó persistencia (1/6 revisados).
- Se subió una foto de prueba a la observación — confirmada en BD con blob real de Vercel Blob.
- "Sugerir redacción" (motor 100% local) probado sobre un segundo hallazgo: generó `"Se observa: Fisura cerca de la esquina superior."` correctamente, sin llamar a ningún servicio externo.
- Piso se verificó sin cambios de comportamiento.

## N. Mobile

Verificado a 375px: página de Dormitorio (Muros/Ventana/Puerta/Enchufes) y página de Baño (Artefactos sanitarios) — `scrollWidth === clientWidth === 375` en ambas, sin overflow horizontal.

## O. TypeScript

`npx tsc --noEmit` — sin errores.

## P. ESLint

`npx eslint .` — sin errores.

## Q. Vitest

`npx vitest run` — 88/88 tests, 9/9 archivos.

## R. Build

`npx next build` — exitoso, 29 páginas generadas, sin warnings nuevos.

## S. Compatibilidad V1

Piso (Fase 11B) sigue funcionando exactamente igual — no se tocó su artículo ni su lógica. El resto del catálogo sin artículo (Bodega, Estacionamiento, Fachada, Reja, Portón — explícitamente fuera de este lote) sigue mostrando el checklist V1 plano, sin cambios. El wizard Motivo→Tipo→Ficha→Datos, Casa/Departamento/Ampliación, resumen web, PDF y fotografías no se tocaron en esta fase — no se re-probaron exhaustivamente porque ningún archivo de esos flujos cambió (confirmado por el diff acotado de la sección A).

## T. Limpieza QA

Usuario `qa-fase11e@example.com`, su único caso y su única foto (con blob real) eliminados de la base compartida. Verificación final: `usuarios QA restantes=0, casos "Fase11E" restantes=0`. Los 2 scripts `_tmp_*` creados durante esta fase (`_tmp_11e_audit.ts`, `_tmp_11e_check_photo.ts`, `_tmp_qa_cleanup_fase11e.ts`) fueron eliminados. Se conservó únicamente `fase11e-biblioteca-guiada-lote1.ts`.

## U. Problemas encontrados

Ninguno funcional. Una falsa alarma de automatización: el primer intento de "Sugerir redacción" no mostró resultado en la captura de texto del script de QA (por una condición de carrera del propio script, no del producto) — reintentado inmediatamente y confirmado que funciona correctamente.

## V. Estado final

Las 9 preguntas previstas quedaron con experiencia guiada completa (guía antes de botones, botones 🟢/🔴/⚪, lenguaje Observación→Posible signo→Recomendación, sin diagnóstico automático). Cero regresiones detectadas en regresión automatizada ni en QA manual. Cero elementos fuera de alcance implementados (Bodega, Estacionamiento, Fachada, Reja, Portón, Grifería nueva, gravedad Urgente/A revisar/Estético, imágenes de referencia, IA nueva — todos permanecen sin tocar, tal como exigió el enunciado).

---

FASE 11E — LOTE 1 DE BIBLIOTECA TÉCNICA GUIADA COMPLETADO
