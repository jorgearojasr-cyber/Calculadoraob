# Backlog Master — ObraBien Calcula

Backlog centralizado del proyecto. Toda tarea de corrección, mejora o nueva funcionalidad debe registrarse aquí antes de implementarse.

**Formato de cada tarea:**

```
ID:
Título:
Prioridad:
Estado:
Versión objetivo:
Descripción:
Dependencias:
Notas:
```

**Estados posibles:** Pendiente / En progreso / Bloqueado / Resuelto / Descartado
**Prioridades posibles:** Crítica / Alta / Media / Baja

---

# Bugs críticos

_Ninguno detectado en la auditoría funcional de ObraBien Calcula V1 (02-ago-2026)._

---

# Bugs importantes

## BUG-001
**Título:** Enlaces de ancla `#empezar` llevan a una sección tapada por el header fijo
**Prioridad:** Alta
**Estado:** Resuelto (Grupo 1, 02-ago-2026)
**Versión objetivo:** V1.1
**Descripción:** Al hacer click en "Calculadoras" (desktop) o "Proyectos" (nav secundaria) desde cualquier página que no sea el home, la navegación llega a `/#empezar` y hace scroll, pero se detiene con el título "¿Qué quieres construir?" oculto detrás del header fijo (73.5px de alto) por falta de `scroll-margin-top` en el elemento ancla.
**Dependencias:** Ninguna.
**Notas:** Hallazgo de la auditoría funcional (02-ago-2026). Verificado con JS: `elTop: 0.3px`, `headingTop: 45.3px` vs header de `73.5px`. Reproducible 100% de las veces. Corregido en Grupo 1 (`scroll-mt-16 md:scroll-mt-20` en `exploration-toggle.tsx`).

## BUG-002
**Título:** Pilar/Columna — "Alto" y "Profundidad" quedan intercambiados en el resumen, el proyecto guardado y el prompt de IA
**Prioridad:** Alta
**Estado:** Resuelto (Grupo 1, 02-ago-2026)
**Versión objetivo:** V1.1
**Descripción:** En la calculadora Pilar/Columna, el panel lateral "TU PROYECTO", la pantalla de resultado, el proyecto guardado en "Mis proyectos" y el texto generado por "Generar prompt para IA" muestran el valor ingresado como Alto bajo la etiqueta "Profundidad del pilar (cm)" y viceversa. El cálculo del volumen de hormigón en sí es correcto (usa los valores en el orden físico correcto) — el bug es de etiquetado en la capa de resumen/reporte, no de cálculo.
**Dependencias:** Ninguna.
**Notas:** Pendiente conocido, confirmado con evidencia durante el cierre de Regularización (ver `regularizacion-informe-plan-cerrado.md` para el proceso de confirmación usado como referencia metodológica). Confirmado aislado a Pilar/Columna — verificado explícitamente que Losa, Muro de hormigón armado y Escalera NO tienen el mismo problema. Causa probable: componente de resumen/etiquetado de la pregunta, no el diagrama (`module-visual-config.ts` está correcto). Corregido en Grupo 1 mediante corrección de dato en BD (script conservado en `prisma/db-fixes/`).

## BUG-003
**Título:** El botón "Cambiar" de un campo específico no enfoca ese campo — enfoca siempre el primero del grupo
**Prioridad:** Alta
**Estado:** Resuelto (Grupo 4A, 03-ago-2026)
**Versión objetivo:** V1.1
**Descripción:** En Pilar/Columna, al hacer click en "Cambiar" junto a un campo específico (ej. "Alto del pilar"), la app vuelve al paso correcto pero el foco (`activeField`) queda siempre en el primer input del paso (Ancho), no en el campo que el usuario quiso editar.
**Dependencias:** Ninguna.
**Notas:** Pendiente conocido ("comportamiento de `activeField` con campos precargados"), confirmado con evidencia. Verificado que el mismo patrón (`autoFocus` fijo al primer campo) existía en los 3 componentes de paso con múltiples campos: `QuestionGroupStep`, `VolumeStep` y `FoundationStep` — no específico de Pilar/Columna. Corregido en Grupo 4A: `ModuleWizard` ahora recuerda qué `questionKey` se pidió editar (`focusFieldKey`, limpiado en cualquier otra navegación) y lo propaga a los 3 componentes, que enfocan ese campo puntual en vez del primero por defecto.

---

# Mejoras UX

## BUG-004
**Título:** "Construir un estacionamiento" no preselecciona el uso "Estacionamiento"
**Prioridad:** Media
**Estado:** Hipótesis descartada tras verificación
**Versión objetivo:** V1.1
**Descripción:** El acceso rápido "Construir un estacionamiento" redirige a `/categorias/hormigon/radier?tipo=estacionamiento`, pero la página ignora el parámetro `tipo` y muestra el selector genérico con "Patio o terraza" como sugerencia principal, no "Estacionamiento".
**Dependencias:** Ninguna.
**Motivo del cierre:** Error de interpretación durante la auditoría inicial. La auditoría original concluyó incorrectamente que el parámetro `?tipo=` era ignorado, basándose únicamente en extracción de texto plano (`get_page_text`), que no puede detectar el estado de selección visual/ARIA. La verificación visual posterior (atributo `aria-pressed` y clases CSS) confirmó que la opción sí queda correctamente preseleccionada y resaltada.
**Notas:** Hallazgo de la auditoría funcional (02-ago-2026). Cerrado en Grupo 5 (03-ago-2026) tras verificación visual directa. Dio origen a UX-001.

## BUG-005
**Título:** Módulos circulares (Piscina, Excavación) muestran una fórmula visual incorrecta en la vista previa
**Prioridad:** Media
**Estado:** Resuelto (Grupo 3, 03-ago-2026)
**Versión objetivo:** V1.1
**Descripción:** En Piscina circular y Excavación circular, la leyenda bajo el volumen calculado del paso 1 muestra una fórmula de multiplicación simple estilo rectangular (ej. "4 × 1,5 m") en vez de reflejar la fórmula circular real (π × radio² × altura) que efectivamente se usa para calcular el número mostrado (el número sí es correcto). Adicionalmente, en Piscina circular el paso 1 etiqueta ese número como "Volumen de hormigón" cuando en realidad es volumen de agua (el resultado final sí separa correctamente agua y hormigón).
**Dependencias:** Ninguna.
**Notas:** Hallazgo de la auditoría funcional (02-ago-2026). Bug compartido entre ambos módulos — probable componente de vista previa reutilizado del caso rectangular sin adaptar. Corregido en Grupo 3 (`useVolumePreview.ts` con fórmula circular; etiqueta también corregida en Piscina rectangular, mismo defecto detectado durante la implementación).

## BUG-006
**Título:** Mensaje de validación no se limpia aunque los datos ya sean válidos
**Prioridad:** Media
**Estado:** Resuelto (Grupo 2, 02-ago-2026)
**Versión objetivo:** V1.1
**Descripción:** En Radier, tras disparar el mensaje "Completa todos los campos con un número mayor que 0" (por dejar un campo en 0 o vacío), si luego se completan los 3 campos con valores válidos sin recargar, el mensaje permanece visible en pantalla aunque el botón "Siguiente" ya funciona correctamente.
**Dependencias:** Ninguna.
**Notas:** Hallazgo de la auditoría funcional (02-ago-2026). Reproducido dos veces. Corregido en Grupo 2 (`setValue` limpia el error en `question-group-step/index.tsx`).

## BUG-010
**Título:** Texto de advertencia copiado de otra guía sin adaptar
**Prioridad:** Baja
**Estado:** Resuelto (Grupo 1, 02-ago-2026)
**Versión objetivo:** V1.1
**Descripción:** La guía "Instalar una lámpara o plafón de techo" muestra una advertencia que menciona "el interruptor" en vez de referirse a la lámpara/plafón — texto aparentemente copiado sin adaptar desde la guía "Cambiar un interruptor de luz".
**Dependencias:** Ninguna.
**Notas:** Hallazgo de la auditoría funcional (02-ago-2026). Contenido estático, corrección de texto simple. Corregido en Grupo 1 (corrección de dato en BD).

## BUG-011
**Título:** Resultado de búsqueda con separador vacío
**Prioridad:** Baja
**Estado:** Resuelto (Grupo 1, 02-ago-2026)
**Versión objetivo:** V1.1
**Descripción:** El resultado de búsqueda "Construir una piscina" muestra "Piscinas ·" con un separador seguido de nada, mientras las demás tarjetas de resultado sí muestran una descripción después del separador.
**Dependencias:** Ninguna.
**Notas:** Hallazgo de la auditoría funcional (02-ago-2026). Corregido en Grupo 1 (render condicional en `search-bar.tsx`).

## UX-001
**Título:** Confirmación contextual cuando una opción llega preseleccionada por query param
**Prioridad:** Media
**Estado:** Resuelto (Grupo 5, 03-ago-2026)
**Versión objetivo:** V1.1
**Descripción:** Cuando una pregunta de tipo SELECT llega con una opción ya preseleccionada mediante query param (ej. `?tipo=estacionamiento`), la app mostraba igualmente el helper genérico "¿No sabes cuál elegir?" con una recomendación distinta a la ya seleccionada — señal contradictoria para el usuario. Ahora se muestra un mensaje de confirmación contextual (ej. "Detectamos que quieres construir este radier para: Estacionamiento. Puedes cambiar esta selección si lo deseas."), manteniendo la opción totalmente editable.
**Dependencias:** Ninguna.
**Notas:** Se originó como corrección a la conclusión errónea de BUG-004. Antes de implementar se investigaron todos los módulos con preselección por query param (`presetQuery` en `ProjectTaskModule`/`ProjectPlanPhaseModule`): solo 2 casos en toda la BD (Radier `tipo=estacionamiento`, Pintura `tipo=muro-interior`), ambos ya cubiertos por el patrón reutilizable `NOT_SURE_HELPERS` en `question-step.tsx` — la solución se implementó a ese nivel compartido, no específica de Radier. Nuevo componente `preselected-confirmation.tsx`.

---

# Mejoras funcionales

## BUG-007
**Título:** Ninguna calculadora conserva el progreso al recargar la página o volver con "atrás"
**Prioridad:** Media
**Estado:** Resuelto (Grupo 4B, 03-ago-2026)
**Versión objetivo:** V1.2
**Descripción:** Al recargar la página o navegar hacia otra página y volver con el botón "atrás" del navegador durante un asistente en progreso, se pierde toda la selección y los valores ingresados, sin ningún aviso previo — incluso con sesión iniciada y sin haber usado "Guardar y seguir después". Verificado en Radier con ambos escenarios (recarga y atrás); por el patrón de implementación (estado de componente sin persistencia), es esperable en el resto de las calculadoras.
**Dependencias:** Requiere definir mecanismo de persistencia (ej. `sessionStorage`/`localStorage` o borrador server-side) — ver ROADMAP V1.2 "Persistencia automática de progreso".
**Notas:** Hallazgo de la auditoría funcional (02-ago-2026). Coincide directamente con el ítem de roadmap V1.2 ya planificado. Decisión de arquitectura (usuario, 03-ago-2026): localStorage únicamente (sin sessionStorage ni server-side), resuelve solo pérdida accidental en el mismo dispositivo, sin restauración automática (siempre pide confirmación), expiración de 30 días. Se detectó y consultó un conflicto real antes de implementar: ya existía un mecanismo de localStorage para "Guardar y seguir después", con clave y forma de datos distintas. Se unificó en una sola estructura por módulo (`wizard-draft.ts`); "Guardar y seguir después" mantiene su comportamiento aprobado (restaura sin preguntar) — solo el autoguardado nuevo (por recarga/"atrás" accidental) pide confirmación.

## BUG-008
**Título:** Sin validación de rango razonable en medidas — acepta valores físicamente absurdos sin aviso
**Prioridad:** Baja
**Estado:** Resuelto (Grupo 2, 02-ago-2026)
**Versión objetivo:** V1.2
**Descripción:** Los campos numéricos de dimensiones (ej. Largo de un radier) aceptan valores extremos (ej. 999.999 m) sin ningún aviso de "¿seguro?", produciendo resultados como "428.000 m³ de hormigón a pedir" sin señal de posible error de tipeo. No es un bug de cálculo (la app es matemáticamente estable a esa escala) — es una oportunidad de UX/confianza.
**Dependencias:** Ninguna.
**Notas:** Hallazgo de la auditoría funcional (02-ago-2026). Corregido anticipadamente en Grupo 2 para Radier (Largo/Ancho) mediante advertencia suave no bloqueante basada en `range-hint.ts`. Requirió backfill de `helpText` en BD (decisión consultada con el usuario — ver `prisma/db-fixes/fix-radier-helptext-rango.ts`). Extender a otros módulos/campos queda para V1.2.

## BUG-009
**Título:** Valor "0" en un campo numérico se ve como "sin responder" en la vista previa
**Prioridad:** Baja
**Estado:** Resuelto (Grupo 2, 02-ago-2026)
**Versión objetivo:** V1.2
**Descripción:** Al escribir "0" en un campo numérico (ej. Largo en Radier), la vista previa del diagrama y el panel lateral muestran "Pendiente"/placeholder en vez de "0 m" — probablemente por un chequeo que trata 0 como valor falso en JS. La validación real de negocio sí funciona correctamente y bloquea el avance con un mensaje claro; el problema es solo de la vista previa en vivo.
**Dependencias:** Ninguna.
**Notas:** Hallazgo de la auditoría funcional (02-ago-2026). Severidad baja: no afecta el resultado final ni permite un cálculo incorrecto. Corregido anticipadamente en Grupo 2 (`toNum` en `dimension-utils/parsing.ts`), transversal a todas las calculadoras con campos de medida.

---

# Nuevas funcionalidades

_Sin ítems registrados aún. Ver ROADMAP.md V2.0/V3.0 para dirección propuesta a nivel de producto._

---

# Ideas futuras

_Sin ítems registrados aún._
