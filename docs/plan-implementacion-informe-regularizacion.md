# Plan de Implementación por Fases — Informe de Evaluación Preliminar

## Regularización de Vivienda (Ley 20.898)

**Estado:** las 6 fases están implementadas y aprobadas. Este documento se conserva como registro histórico de alcance y de la deuda técnica pendiente — ver "Estado final" al pie.

Este plan traduce `diseno-informe-regularizacion.md` y `clasificacion-documentos-ley-20898.md` (ambos cerrados) en un orden de ejecución. El objetivo del orden es evitar rediseñar el mismo componente dos veces: primero estructura, después el modelo de datos que la alimenta, después los bloques de mayor valor percibido, y solo al final el pulido visual.

## Fase 1 — Nueva estructura del informe (sin cambiar contenido)

Objetivo: que el informe tenga las secciones y el orden definidos en el diseño, usando el contenido que ya existe hoy, sin tocar todavía el modelo de documentos ni el checklist.

- Reordenar/crear los bloques del PDF según la estructura de la sección 1 del diseño (portada, resumen ejecutivo, datos del inmueble, metodología, elegibilidad, croquis, fotos, observaciones, checklist, próximos pasos, qué ocurre después, glosario, marco normativo, aviso legal, firmas, historial).
- Insertar placeholders donde el contenido definitivo aún no existe (ej. sección "¿Qué Puede Hacer ObraBien por Ti?" puede ir con datos estáticos de ejemplo en esta fase).
- Criterio de salida: el PDF generado tiene las 15 secciones en el orden correcto, aunque el contenido de varias todavía no sea dinámico.

## Fase 2 — Modelo de tres ejes para documentos

Objetivo: reemplazar el checklist actual (con su semántica ambigua y el error de la inscripción CBR) por el modelo verificado.

- Migrar el checklist de documentos al esquema `obligatoriedad / origen / momento / soporteObraBien / citaNormativa / estadoValidacion` definido en `clasificacion-documentos-ley-20898.md`.
- Cargar los datos verificados del Tramo 1 (Formulario 12.1). El Tramo 2 (Formulario 12.4) queda pendiente de verificación — no bloquea esta fase, pero debe completarse antes de dar por cerrado el Tramo 2 en producción.
- Mover "Pago de derechos municipales" e "Inscripción CBR" fuera del checklist hacia la nueva sección "¿Qué Ocurre Después?".
- Aplicar el lenguaje prudente exacto a los documentos sin respaldo confirmado (CIP, copia de escritura).
- Criterio de salida: ningún documento se muestra pre-marcado como "Aportado" sin un dato real detrás; la inscripción CBR y el pago de derechos ya no aparecen en el checklist de entrada.

## Fase 3 — Resumen Ejecutivo, semáforo y avance del expediente

Objetivo: implementar el bloque de mayor impacto en la primera lectura.

- Semáforo de elegibilidad (🟢/🟡/🔴) con ícono + texto, nunca solo color.
- Tabla de cifras clave, incluyendo el nuevo indicador de avance del expediente.
- Barra de avance calculada solo sobre documentos `obligatoriedad: minimo` aplicables al caso (según la regla de cálculo definida en el diseño).
- Bloque "¿Qué Puede Hacer ObraBien por Ti?" con datos reales del caso (no estático) — depende de que la Fase 2 ya esté disponible, porque su contenido de la derecha ("aún necesitarás") se deriva del mismo modelo de documentos.
- Criterio de salida: un usuario puede entender el resultado del caso mirando solo esta sección, sin leer el resto del informe.

## Fase 4 — Integración de croquis y fotografías en el PDF

Objetivo: que el croquis (Diagram System V2) y el registro fotográfico se rendericen correctamente dentro del documento exportado, en las ubicaciones ya definidas (secciones 5 y 6, inmediatamente después del panel de elegibilidad).

- Resolver la inserción del SVG del croquis en el flujo de `@react-pdf/renderer`.
- Grid de fotografías con placeholder honesto cuando no hay fotos cargadas.
- Criterio de salida: el PDF exportado muestra croquis y fotos reales del caso, no solo texto descriptivo.

## Fase 5 — Validación profesional y firmas

Objetivo: implementar la sección que convierte el informe en documento vivo — el diferenciador principal del producto.

- Recuadros de firma (profesional + propietario) según el diseño.
- Historial y trazabilidad del documento (versión, fechas, motor normativo, fuentes) — depende de tener ya un número de versión real del motor de reglas.
- Criterio de salida: el documento impreso tiene espacio físico utilizable para que un profesional lo firme y feche.

## Fase 6 — Diseño visual fino

Objetivo: pulir lo que ya funciona funcionalmente, no antes.

- Tipografía, espaciados, jerarquía H1/H2/H3 definitiva.
- Paleta de color y verificación de legibilidad en blanco y negro (impresión doméstica).
- Iconografía definitiva (set de línea, no ilustrativo).
- Ajustes de paginación e impresión (saltos de página forzados, encabezados de tabla repetidos).
- Criterio de salida: el informe impreso en A4 se ve como un documento técnico profesional, no como un reporte generado automáticamente.

## Deuda técnica registrada (no bloqueante, no se implementa en este plan)

- Moderación de fotografías (detectado en Fase 4): el modelo `RegularizationPhoto` no tiene campo de moderación, mientras que el diseño (sección 6) exige excluir fotos pendientes de moderación del informe final. Pendiente decidir si este módulo reutiliza la cola de moderación existente en otros módulos de la plataforma o si necesita su propio mecanismo.
- Limitación de caracteres Unicode en Helvetica (detectado en Fase 4): mientras `@react-pdf/renderer` use Helvetica como fuente, evitar emoji, números circulados, ⚠ y ≤ en cualquier contenido nuevo del informe — no renderizan y aparecen como bytes ilegibles. Ver la nota de implementación agregada en `diseno-informe-regularizacion.md`, sección 18.
- Confirmación pendiente desde Fase 3: comportamiento de `computeSemaforo` cuando ningún label de regla matchea (fallback honesto vs. riesgo de mostrar un estado incorrecto por defecto). Pedido tres veces, aún sin confirmación con evidencia — bloquea el inicio de Fase 6 hasta resolverse.
- Versionado del informe: manual, no automático (detectado en Fase 5): el diseño (sección 14/15-bis) asume que la versión se incrementa automáticamente cada vez que el informe se regenera con datos nuevos. La implementación real usa `REPORT_VERSION` como constante de bump manual, porque el sistema genera el PDF on-demand en cada descarga sin una entidad de "reporte" persistida que trackear regeneraciones. Es una adaptación razonable al modelo real del sistema, pero requiere una decisión de producto: ¿el versionado manual es aceptable de forma permanente, o en algún momento se justifica un modelo de versionado automático real (lo que implicaría persistir el informe como entidad, no solo generarlo on-demand)?

## Por qué este orden y no otro

Cada fase depende de que la anterior ya exista como estructura de datos, no solo como idea:

- La Fase 3 (Resumen Ejecutivo + "qué puede hacer ObraBien") necesita el modelo de tres ejes de la Fase 2, porque su contenido se deriva de esos mismos datos — implementarla antes significaría hacerla dos veces.
- La Fase 5 (firmas + historial) tiene sentido solo cuando el resto del documento ya es confiable — firmar algo que todavía va a cambiar de estructura no aporta valor de prueba.
- La Fase 6 se deja al final a propósito: pulir tipografía y color sobre una estructura que todavía puede cambiar es trabajo que se descarta.

## Pendientes que cruzan todas las fases (no bloquean, pero no se olvidan)

- Verificación del Formulario 12.4 (Tramo 2) contra el modelo de documentos.
- Validación profesional de los documentos marcados `pendiente_validacion_profesional`.
- Ninguna fase de este plan habilita la publicación del enlace de navegación pública — esa decisión (Option C, ya acordada) sigue condicionada a la validación normativa completa, independiente del avance de implementación del informe.

## Estado final

Las 6 fases quedaron implementadas, verificadas (`tsc`, `eslint`, `next build`, pruebas E2E contra datos reales, e inspección visual del PDF completo) y aprobadas. El informe de Regularización cumple el diseño cerrado en `diseno-informe-regularizacion.md`.

Lo que sigue no es implementación de este plan — es trabajo de validación de negocio/normativo, ya identificado antes de empezar a programar:

1. Verificar el Formulario 12.4 (Tramo 2) contra `clasificacion-documentos-ley-20898.md` — hoy la clasificación solo cubre el Tramo 1 (Formulario 12.1).
2. Validación profesional de los cinco documentos marcados `pendiente_validacion_profesional` (CIP, copia de escritura, informe de revisor independiente, certificado de dominio vigente, memoria explicativa).
3. Decisión de producto sobre moderación de fotografías (`RegularizationPhoto` sin campo de moderación) — detectado en Fase 4.
4. Decisión de producto sobre versionado automático vs. manual del informe (`REPORT_VERSION`) — detectado en Fase 5, aceptado como adecuado para la arquitectura actual (generación on-demand sin entidad de reporte persistida).
5. La limitación de caracteres Unicode con Helvetica queda como restricción permanente mientras no se embeba una fuente distinta — no es una tarea pendiente, es una regla a respetar en cualquier contenido nuevo del informe.
6. La publicación del enlace de navegación pública a "Regulariza tu Vivienda" (Option C) sigue condicionada a que los puntos 1 y 2 se resuelvan — la calidad de la implementación no cambia esa dependencia.
