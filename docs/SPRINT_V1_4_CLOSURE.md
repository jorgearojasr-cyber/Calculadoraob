# Cierre de Sprint — Producto V1.4

**Fecha de cierre:** 07-ago-2026
**Estado:** Sprint oficialmente cerrado. Las 4 fases aprobadas quedan implementadas y validadas.

---

## Resumen ejecutivo

El Sprint Producto V1.4 continuó el trabajo de calidad y consistencia iniciado en V1.3, con un criterio de trabajo distinto al de fases anteriores: en vez de partir de un documento de auditoría fijo, cada fase se definió mediante **auditoría fresca contra el estado real de la BD y el código**, agrupando hallazgos por **mecanismo técnico común** (no por categoría funcional), y priorizando siempre bajo riesgo / alto impacto para el usuario dueño de casa.

Se cerraron 4 fases, todas de **contenido y consistencia de datos** — ningún cambio tocó el motor de fórmulas, el framework visual congelado, ni introdujo preguntas o resultados nuevos.

## Fases cerradas

### Fase 1 — Inconsistencias de rendimiento y "aviso como material" (origen)
- **Pintar fachada exterior**: el rendimiento de sellador (35 m²/gal, sin fuente) se corrigió a 20 m²/gal, alineado con la fuente ya citada del módulo hermano `pintura` (ficha técnica Soquina Fijador Plus).
- **Cambiar o instalar un WC**: se identificó el primer caso de un patrón que luego se generalizó — una `Formula` puramente informativa (`aviso-instalacion-nueva`) se mostraba como si fuera una cantidad de material. Se migró a `Norm` + `NormsDisclaimer` (mecanismo ya existente en la app), `isResult:false`.

### Fase 2 — Extensión del patrón "aviso como material"
Se extendió la corrección de Fase 1 a los 4 casos restantes del mismo patrón, encontrados por auditoría explícita: `cubierta` (aviso siempre visible, sin condición), `instalar-un-calefon-a-gas`, y ambas Piscinas (`aviso-tamano-fuera-de-rango`, con `reinforcedWarning:true` por decisión explícita — a diferencia de los otros 3 casos, que mantuvieron severidad normal). Se verificó explícitamente, con medición programática, que ninguna Norm migrada aparece duplicada cuando el módulo ya tenía otras advertencias activas.

### Fase 3 — `Question.helpText` faltante en datos no obvios
Se agregó `helpText` en 4 módulos (Pintura, Jardineras, Cubierta, ambas Piscinas) donde el dato pedido no era evidente para un dueño de casa. Un hallazgo (`consumo-electrico`) se descartó tras verificar en código que ese campo nunca se renderiza como pregunta editable — evitando escribir contenido muerto.

### Fase 4 — Mecanismo A: `Formula.note` faltante en materiales con rendimiento oculto
33 notas agregadas en 13 módulos (Radier, Cerámica, Porcelanato, Revestimiento de muro, Pintura, Piscinas, Techo bajo teja/zinc, Aislación térmica, Electricidad, Baño, Paisajismo, Yeso Cartón, Impermeabilización), siguiendo el patrón de interpolación ya establecido (`"Cada X cubre/rinde Y → ... {value} {unit}."`). Antes de cada nota se verificó que la explicación no existiera ya en `helpText`/`ModuleGuide`/`Norm` del mismo módulo. Cierre validado con: verificación estructural de las 33 interpolaciones (referencias resuelven, sin placeholders huérfanos, sin notas duplicadas) y revisión de legibilidad en desktop/móvil (medición de líneas renderizadas, sin overflow horizontal, todas por debajo del precedente ya aceptado en producción).

## Hallazgos evaluados y descartados (sin implementación)

- **`Variable.isResult` como "eco literal"** (documentado como **UX-002** en `BACKLOG_MASTER.md`): auditoría fresca mostró que el caso de mayor volumen (espesor de muro/losa en ambas Piscinas) corresponde a una **decisión de diseño ya evaluada y documentada en el propio código** (`result-screen.tsx`), no a un descuido — se probó ocultarlo en una fase anterior y se descartó por generar asimetría visual. El único caso restante (`tabiques-y-cielos`) es aislado y sin volumen suficiente para una fase propia.
- **`Material.referencePrice` inconsistente entre módulos hermanos**: mecanismo real y verificado (solo 7 de 127 materiales tienen precio de referencia, con cobertura desigual dentro de la misma categoría), pero de naturaleza distinta a todo lo demás del sprint — requiere investigación externa de precios de mercado, no extracción de datos ya existentes en el código. Se desglosa como proyecto independiente, ver `BASE_PRECIOS_REFERENCIA_DISENO.md`.

## Cambios arquitectónicos relevantes

Ninguno. Todas las fases fueron correcciones de datos vía `prisma/db-fixes/` (scripts permanentes, conservados por trazabilidad) — cero cambios en componentes de framework, motor de fórmulas, o esquema de Prisma.

## Riesgos pendientes

- Ninguno bloqueante. El mismo patrón de corrupción de `.next` al mezclar `next build` con el servidor de desarrollo activo (ya documentado en `AUDIT_V1_1_CLOSURE.md`) se repitió durante este sprint — se resolvió con la misma rutina (`preview_stop` → `rm -rf .next` → `preview_start`), sigue pendiente de una solución de infraestructura si se repite en el próximo ciclo.

## Lecciones aprendidas

- **Verificar antes de reabrir, no solo antes de implementar.** El hallazgo de `Variable.isResult` casi se convirtió en una Fase 5 de este sprint hasta que la auditoría previa reveló que ya había sido evaluado y descartado deliberadamente en una fase anterior (evidencia: comentario explícito en el código). Reabrir sin ese chequeo habría revertido una decisión de UX ya probada en producción.
- **No todo hallazgo real pertenece al mismo tipo de sprint.** `Material.referencePrice` es un mecanismo genuino con evidencia sólida, pero completar sus datos es un problema de curación de contenido externo (proveedores, vigencia, mantenimiento), no de consistencia de código/UX — mezclar ambos tipos de trabajo en el mismo sprint habría distorsionado tanto el alcance como el criterio de riesgo usado hasta ahora.
- **Agrupar por mecanismo (no por categoría) sostuvo bajo riesgo con alto volumen.** Las 4 fases cubrieron entre todas ~15 módulos distintos sin un solo cambio de cálculo, porque cada fase atacó una única causa raíz repetida (rendimiento sin fuente, aviso mal modelado, helpText faltante, nota faltante) en vez de "arreglar el módulo X" de punta a punta.

---

Con este documento se da por terminado formalmente el Sprint Producto V1.4. El hallazgo de precios de referencia queda registrado como proyecto independiente para revisión de producto — ver `BASE_PRECIOS_REFERENCIA_DISENO.md`.
