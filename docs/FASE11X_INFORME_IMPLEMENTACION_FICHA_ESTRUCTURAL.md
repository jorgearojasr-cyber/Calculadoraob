# FASE 11X — Informe de implementación: ficha estructural de inspección (NIVEL 1)

Fecha: 17-ago-2026
Fuente de diseño: [docs/FASE11W_CIERRE_ARQUITECTURA_FICHA_INSPECCION.md](FASE11W_CIERRE_ARQUITECTURA_FICHA_INSPECCION.md)
Alcance: **solo NIVEL 1** (recintos). Nada de Nivel 2, materiales, variantes, revisiones nuevas o referencias visuales.

## A. Baseline (antes de escribir nada)

Capturado antes de cualquier cambio, vía script de solo lectura contra la BD compartida:

- Recintos activos (`InspectionSpaceTemplate.active = true`): **13**.
- Template histórico "Terraza/Logia": `key = "terraza-logia"`, `active = true`, `appliesTo = [DEPARTAMENTO]`, `repeatable = false`.
- Casos reales de Jorge (`jorge.arojasr@gmail.com`, 4 casos): **PROPIA**, **xcxc**, **las dalias**, **casa**.
- Ningún caso real usaba `terraza-logia` en el momento del baseline (verificado por query directa).
- Usuarios reales, `InspectionCase`, `InspectionSpace`, `InspectionChecklistCheck` totales: contados en el script `_tmp_11x_baseline.ts` (temporal, eliminado al cierre) — sirvieron solo para la comparación de la sección M, no se requiere conservarlos.

## B. Archivos modificados

- [src/components/inspecciones/casa-ficha-step.tsx](../src/components/inspecciones/casa-ficha-step.tsx) — +36/-3 líneas.
- [src/components/inspecciones/departamento-ficha-step.tsx](../src/components/inspecciones/departamento-ficha-step.tsx) — +26/-8 líneas.

## C. Archivos creados

- [prisma/db-fixes/fase11x-ficha-estructural-recintos.ts](../prisma/db-fixes/fase11x-ficha-estructural-recintos.ts) — script permanente e idempotente.
- Este informe.

Ningún otro archivo del repositorio fue tocado. `new-inspection-form.tsx`, `ficha-fields.tsx`, `ampliacion-ficha-step.tsx`, `actions.ts` y el schema de Prisma se auditaron pero **no requirieron cambios**.

## D. Catálogo agregado (BD compartida — dev y producción)

Ejecutado dos veces contra la BD compartida (Neon), segunda ejecución confirmó idempotencia total (mismos ids, "actualizado" en vez de "creado", sin duplicados).

Tres `InspectionSpaceTemplate` nuevos:

| key | label | appliesTo | repeatable | order |
|---|---|---|---|---|
| `patio-trasero` | Patio trasero | CASA | false | 13 |
| `terraza` | Terraza | CASA, DEPARTAMENTO | false | 14 |
| `logia-lavanderia` | Logia / Lavandería | CASA, DEPARTAMENTO | false | 15 |

Vínculos `InspectionElementTemplateSpace` creados:

| recinto | componente | order |
|---|---|---|
| `patio-trasero` | Piso | 0 |
| `terraza` | Piso | 0 |
| `terraza` | Muros | 1 |
| `terraza` | Ventana | 2 |
| `logia-lavanderia` | *(ninguno — solo recinto en esta fase)* | — |

## E. Compatibilidad histórica de "Terraza/Logia" (crítico)

**No se tocó** el template `terraza-logia`: no se borró, no se cambió su `key`, sigue `active = true`. El script solo lo lee (`findUniqueOrThrow`) para confirmar que sigue intacto — no ejecuta ningún `update` sobre él en `main()`.

**Análisis de seguridad (BD compartida)**: producción todavía tenía desplegado el wizard viejo (checkbox combinado "Terraza/Logia") en el momento de escribir el catálogo. Desactivar `terraza-logia` ahora habría hecho que ese checkbox, ya en producción, dejara de generar el espacio silenciosamente (el Server Action filtra por `active: true` sin error visible si al menos otra selección de la misma solicitud es válida). Por eso la desactivación **se pospuso deliberadamente**: el script define una función separada y NO invocada, `deactivateOldTerrazaLogia(prisma)`, documentada para ejecutarse manualmente solo en la misma ventana en que se publique el código de este wizard nuevo (futura Fase de publicación).

Deuda transitoria explícita: hasta esa publicación, `terraza-logia` sigue **activo y disponible en el catálogo**, pero ya no se ofrece desde ningún formulario del código local (Casa y Departamento fueron editados para dejar de generarlo).

## F. Casa — cambios de Nivel 1

Se agregaron 3 checkboxes independientes, mismo patrón que Bodega/Antejardín/Acceso vehicular: **Patio trasero**, **Terraza**, **Logia / Lavandería**. Orden final del formulario: Dormitorios, Baños, Living y comedor, Bodega, Antejardín, Patio trasero, Terraza, Logia / Lavandería, Acceso vehicular — exactamente el orden sugerido por la Fase 11W. Reja/Portón **no se agregaron** (deuda documentada en sección V).

## G. Departamento — cambios de Nivel 1

El checkbox combinado "Terraza o logia" fue reemplazado por dos checkboxes independientes y no excluyentes: **Terraza** y **Logia / Lavandería** (ninguna, una, o ambas). El template histórico `terraza-logia` deja de ofrecerse en este formulario mas sigue en catálogo por compatibilidad (sección E). Orden final: Dormitorios, Baños, Living y comedor, Bodega, Estacionamiento, Terraza, Logia / Lavandería.

## H. Ampliación — verificación de no-regresión

`ampliacion-ficha-step.tsx` y `InspectionTipoAmpliacion` **no se tocaron**. Probado en navegador: tipo **Terraza cerrada** (genera correctamente `terraza-cerrada`, sin confundirse con el nuevo recinto "Terraza" de Casa) y tipo **Cocina** (genera correctamente solo el espacio "Cocina", 11 revisiones). Ambos casos QA verificados en BD, cero regresión.

## I. Patio trasero — decisión de componente inicial

Antes de vincular Piso, se auditó el contenido real de los artículos técnicos `piso-como-revisar-danos-visibles` y `piso-como-revisar-desniveles`: ambos ya mencionan explícitamente contextos de exterior ("radier/hormigón a la vista o pavimento exterior", "pisos de hormigón"), por lo que reutilizar Piso es válido sin forzar contenido pensado solo para interior. No se inventó ninguna revisión nueva de exterior. Componente vinculado: **Piso** únicamente.

## J. Terraza (Casa) — decisión de componentes

Se auditaron los componentes ya vinculados al template histórico `terraza-logia`. Se reutilizaron únicamente los claramente válidos para un espacio exterior tipo terraza: **Piso**, **Muros**, **Ventana**. No se inventaron componentes sin contenido/fuente suficiente (baranda, evacuación de aguas, impermeabilización, cubierta quedan fuera de esta fase).

## K. Logia / Lavandería — decisión de componentes

Se dejó **sin ningún componente vinculado** en esta fase, interpretando la instrucción "solo debe existir correctamente como RECINTO" de forma conservadora: a diferencia de Patio trasero y Terraza, la instrucción no whitelisteaba ningún componente reutilizable para Logia. Revisiones de lavadora/lavadero/grifería/desagüe/ventilación/calefón quedan para Nivel 2/3 futuro.

## L. Resultado de generación de casos (QA en navegador + verificación BD)

Todos los casos se crearon a través del wizard real (no inserciones directas) y se verificaron vía query BD:

| Caso | Espacios generados |
|---|---|
| Casa A (Patio trasero=Sí, resto=No) | Cocina, Dormitorio 1, Baño 1, Living-comedor, **Patio trasero** |
| Casa B (los 3=Sí) | Cocina, Dormitorio 1, Baño 1, Living-comedor, **Patio trasero, Terraza, Logia / Lavandería** |
| Casa C (los 3=No) | Cocina, Dormitorio 1, Baño 1, Living-comedor *(ninguno de los 3 nuevos)* |
| Departamento A (Terraza=Sí, Logia=No) | ...+ **Terraza** (sin Logia, sin terraza-logia) |
| Departamento B (Terraza=No, Logia=Sí) | ...+ **Logia / Lavandería** (sin Terraza) |
| Departamento C (ambos=Sí) | ...+ **Terraza, Logia / Lavandería** |
| Departamento D (ambos=No) | ...*(ninguno de los 2)* |
| Ampliación Terraza cerrada | **Terraza cerrada** únicamente |
| Ampliación Cocina | **Cocina** únicamente |

Los 9 combos requeridos por la fase se probaron exitosamente, sin excepciones ni comportamiento inesperado.

## M. Compatibilidad histórica — verificación

Se creó un caso simulado (Departamento) replicando exactamente la lógica de `createInspectionAndGenerateAction` pero seleccionando el template histórico `terraza-logia` directamente (como lo haría un caso real generado antes de esta fase). Verificado en navegador:

- La página del caso muestra correctamente el espacio **"Terraza/Logia"** (no se dividió ni migró a Terraza/Logia-Lavandería).
- Los 10 checks (Piso ×2, Muros ×1, Ventana ×7) se abren y muestran las preguntas completas con normalidad.
- El **resumen** (`/inspecciones/[id]/resumen`) calcula correctamente puntos revisados/pendientes y muestra el espacio "Terraza/Logia".
- Los links de **PDF** ("Descargar resumen", "Descargar informe detallado") están presentes y funcionales.
- Ningún dato se modificó automáticamente hacia los nuevos templates.

Adicionalmente, se hizo una comparación directa antes/después sobre los 4 casos reales de Jorge (PROPIA, xcxc, las dalias, casa): mismos ids, mismos espacios, mismo conteo de checks, 0 observaciones y 0 fotos alteradas en los 4 — coherente con que el script de catálogo solo hizo `upsert`/`create` sobre templates nuevos y jamás tocó `InspectionCase`/`InspectionSpace` existentes.

## N. Mobile (375px)

Verificado con `document.documentElement.scrollWidth === clientWidth` (sin overflow horizontal) en los 4 puntos requeridos:

- Ficha Casa completa (con Patio trasero/Terraza/Logia/Lavandería visibles): **375 = 375**.
- Ficha Departamento completa (con Terraza/Logia independientes): **375 = 375**.
- Paso "Datos de la inspección" (paso siguiente): **375 = 375**.
- Página de caso creado (detalle con espacios generados): **375 = 375**.

## O. TypeScript

`npx tsc --noEmit` → sin errores.

## P. ESLint

`npx eslint .` → sin errores ni warnings.

## Q. Vitest

`npx vitest run` → 10 archivos de test, 95 tests, todos pasan.

## R. Build

`npx next build` → compilación exitosa, 29 páginas generadas, sin errores.

## S. Limpieza QA

- Usuario QA `qa.fase11x@example.com`: **eliminado**.
- 10 `InspectionCase` QA (Casa A/B/C, Departamento A/B/C/D, Ampliación Terraza cerrada/Cocina, Histórico Terraza-Logia simulado): **eliminados** (cascade a spaces/elements/checks).
- Fotos/blobs QA: **0** (no se subió ninguna foto durante el testing de esta fase).
- Scripts temporales `_tmp_11x_*.ts` (6 en total, incluyendo baseline y auditoría de contenido de fases previas de esta misma sesión): **todos eliminados**.
- Script permanente conservado: `prisma/db-fixes/fase11x-ficha-estructural-recintos.ts`.

## T. Estado de casos reales

Confirmado en la sección M: los 4 casos reales de Jorge quedaron exactamente iguales (ids, espacios, checks, observaciones, fotos) antes y después de esta fase. Ningún caso real fue leído por error como QA ni modificado.

## U. Diff final

```
 M src/components/inspecciones/casa-ficha-step.tsx           | 36 ++++++++++++++++++++--
 M src/components/inspecciones/departamento-ficha-step.tsx   | 26 ++++++++++----
?? prisma/db-fixes/fase11x-ficha-estructural-recintos.ts
?? docs/FASE11X_INFORME_IMPLEMENTACION_FICHA_ESTRUCTURAL.md
```

Explícitamente **fuera** de este diff (trabajo preexistente no relacionado, no tocado): `src/components/module/*`, `src/lib/diagram-v2/*`, `prisma/db-fixes/inspect-uncertainty-options.ts`, y los demás `docs/FASE*.md` sin prefijo 11X ya presentes como untracked antes de esta fase.

## V. Riesgos y deudas transitorias

1. **Reja/Portón siguen temporalmente acoplados** a Puerta/Muros hasta la futura Fase 11Y (Configuración por recinto, Nivel 2) — no se agregaron como checkboxes independientes en esta fase, tal como exigía la instrucción.
2. **`terraza-logia` sigue activo en catálogo** aunque ningún formulario nuevo lo ofrezca. Debe desactivarse (`deactivateOldTerrazaLogia()`, ya escrita y lista en el script) **únicamente** en el mismo momento en que se despliegue el código de este wizard a producción — nunca antes, para no crear una ventana donde producción (todavía con el checkbox viejo desplegado) genere selecciones silenciosamente vacías.
3. **Logia / Lavandería sin componentes**: existe correctamente como recinto pero no tiene ningún elemento/checklist vinculado todavía — se completará en una fase de Nivel 2/3 futura.
4. El catálogo ya es efectivo en la BD compartida (por lo tanto también visible para producción vía queries directas o futuras herramientas admin), aunque el código de UI que lo consume no está desplegado todavía — esto es intencional y documentado, no es un efecto colateral no controlado.

## W. Estado final

- Código modificado: **SÍ** (2 archivos de wizard).
- Prisma (schema): **NO modificado** — no se requirió ninguna migración, se usaron los campos ya existentes de `InspectionSpaceTemplate`/`InspectionElementTemplateSpace`.
- BD modificada: **SÍ** — solo catálogo (3 `InspectionSpaceTemplate` nuevos + 4 vínculos `InspectionElementTemplateSpace`), aplicado de forma aditiva e idempotente contra la BD compartida. Cero filas de `InspectionCase`/`InspectionSpace`/`InspectionChecklistCheck` reales fueron tocadas.
- Commit: **NO**.
- Push: **NO**.
- Deploy: **NO**.

---

## CONTROL FINAL

- **Archivos creados**: `prisma/db-fixes/fase11x-ficha-estructural-recintos.ts`, `docs/FASE11X_INFORME_IMPLEMENTACION_FICHA_ESTRUCTURAL.md`.
- **Archivos modificados**: `src/components/inspecciones/casa-ficha-step.tsx`, `src/components/inspecciones/departamento-ficha-step.tsx`.
- **Código modificado** = SÍ
- **Prisma modificado** = NO
- **BD modificada** = SÍ (solo catálogo, aditivo, idempotente, sin tocar datos reales)
- **Commit** = NO
- **Push** = NO
- **Deploy** = NO

**FASE 11X — FICHA ESTRUCTURAL DE INSPECCIÓN IMPLEMENTADA LOCALMENTE**
