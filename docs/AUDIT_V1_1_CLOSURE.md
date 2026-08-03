# Cierre de Auditoría — V1.1 (Estabilización)

**Fecha de cierre:** 03-ago-2026
**Estado:** Auditoría oficialmente cerrada. Fase de estabilización terminada.

---

## Resumen ejecutivo

El 02-ago-2026 se realizó una auditoría funcional completa de ObraBien Calcula V1: 11 categorías, ~53 calculadoras/guías, navegación global, casos límite transversales y responsive mobile (Regularización Ley 20.898 excluida, auditada y cerrada por separado). La auditoría no encontró ningún bug crítico — la base de cálculo (fórmulas, normas, motor de resultados) resultó sólida en toda la superficie revisada.

A partir de esos hallazgos se estableció un proceso de trabajo por grupos: cada grupo se implementó de forma acotada, se validó con `tsc`/`eslint`/`next build`/pruebas manuales en navegador, y se documentó con el mismo nivel de detalle antes de avanzar al siguiente. Un hallazgo (BUG-004) resultó ser un error de la propia auditoría, no un bug real — se corrigió la conclusión y se generó una mejora UX genuina a partir de esa corrección (UX-001).

Con el cierre de BUG-007 (Grupo 4B, 03-ago-2026), los 11 hallazgos originales quedan todos resueltos o descartados. No queda ningún ítem pendiente del backlog de la auditoría.

## Hallazgos y resultado

| Métrica | Cantidad |
|---|---|
| Hallazgos totales | 11 |
| Bugs corregidos | 10 (BUG-001, 002, 003, 005, 006, 007, 008, 009, 010, 011) |
| Hallazgos descartados (error de auditoría) | 1 (BUG-004) |
| Bugs críticos | 0 |
| Mejoras UX generadas durante el proceso (no en el backlog original) | 1 (UX-001) |

Todos los 5 grupos de trabajo (1, 2, 3, 4A, 4B, 5 — 6 grupos en total con la numeración usada) se cerraron con `tsc` limpio, `eslint` limpio, `next build` exitoso y pruebas manuales verificadas en navegador, sin excepción.

## Mejoras UX implementadas

- **UX-001** (Grupo 5): cuando una opción SELECT llega preseleccionada por query param (ej. `?tipo=estacionamiento`), se muestra un mensaje de confirmación contextual en vez del helper genérico "¿No sabes cuál elegir?" — implementado a nivel de patrón compartido (`NOT_SURE_HELPERS`), no específico de un módulo, tras investigar toda la base de datos por otros casos similares (solo 2 existían: Radier y Pintura).

## Cambios arquitectónicos relevantes

- **`prisma/db-fixes/`**: nueva convención para conservar (no eliminar) scripts puntuales de corrección de base de datos, con trazabilidad histórica — adoptada a mitad de la auditoría (Grupo 1) y aplicada de ahí en adelante.
- **`wizard-draft.ts`** (Grupo 4B): mecanismo unificado de persistencia local del progreso del asistente. Reemplazó y unificó un mecanismo de localStorage que ya existía de forma independiente para "Guardar y seguir después" — evitando dos claves/formas de datos distintas conviviendo sin coordinación.
- **`focusFieldKey`** (Grupo 4A): patrón de foco explícito propagado desde `ModuleWizard` a los 3 componentes de paso con campos agrupados (`QuestionGroupStep`, `VolumeStep`, `FoundationStep`) — corrigió BUG-003 una sola vez a nivel de framework en vez de por módulo.
- Ningún cambio arquitectónico de esta auditoría tocó el motor de cálculo (fórmulas, normas, `calculateModuleAction`) — todos los cambios fueron de presentación, validación en vivo, o persistencia de UI.

## Riesgos pendientes

No se identificaron riesgos bloqueantes al cierre. Puntos a tener en cuenta hacia adelante:

- **BUG-003 solo se corrigió en los 3 componentes de paso agrupado conocidos** (`QuestionGroupStep`, `VolumeStep`, `FoundationStep`). Si se agrega un cuarto tipo de paso con campos agrupados en el futuro, debe replicar el patrón `focusFieldKey` explícitamente — no hay una garantía estructural que lo fuerce.
- **El autoguardado de BUG-007 es por dispositivo/navegador** (decisión de arquitectura explícita) — un usuario que cambia de dispositivo o navegador a mitad de un cálculo no tiene continuidad. Documentado como alcance intencional, no como deuda.
- **`next build` corrompe de forma sistemática el `.next` del servidor de desarrollo activo**, obligando a `preview_stop` → `rm -rf .next` → `preview_start` después de cada build de validación — patrón de la toolchain (Next.js/entorno), no del código de la app; se volvió una rutina estable durante toda la auditoría, pero vale la pena resolverlo con una configuración de build separada si se repite en V2.0.

## Lecciones aprendidas

- **La extracción de texto plano no es suficiente para verificar estado visual.** El error de auditoría en BUG-004 se originó porque la verificación inicial usó `get_page_text` (texto plano), que no puede detectar `aria-pressed` ni clases CSS de selección. Cualquier verificación de "¿quedó seleccionado/resaltado?" requiere inspección de atributos/DOM, no solo de texto.
- **Un bug reportado para un módulo puede ser un defecto de framework compartido.** BUG-002, BUG-003, BUG-008 y BUG-009 se reportaron inicialmente sobre un solo módulo (Pilar/Columna o Radier) y en cada caso se verificó explícitamente si el mismo patrón afectaba a otros módulos con la misma estructura antes de decidir el alcance de la corrección — en 3 de los 4 casos, sí afectaba a más de un módulo, y la corrección se aplicó una sola vez a nivel compartido.
- **Antes de reutilizar un patrón, hay que buscar si ya existe algo similar en el código.** BUG-007 estuvo a punto de introducir una segunda persistencia de localStorage en paralelo a una que ya existía ("Guardar y seguir después") — se detectó a tiempo revisando el código existente antes de escribir, no después.
- **Consultar antes de decidir, no antes de preguntar en general.** El proceso funcionó mejor cuando las pausas de consulta fueron específicas y acotadas (una pregunta de arquitectura concreta, con opciones y una recomendación) en vez de genéricas — permitió resolver conflictos reales (BUG-008/helpText, BUG-007/unificación de persistencia) sin frenar el resto del trabajo ya aprobado.
- **Los self-catches durante la implementación son señal de que vale la pena revisar el propio trabajo antes de darlo por bueno**, no solo confiar en el plan inicial (ej. el bug de `toNum` con "0"/negativos en BUG-009, corregido por el mismo implementador antes de pasar a pruebas).

## Recomendaciones para futuras auditorías

1. Verificar estado visual/ARIA con inspección de DOM real, no solo texto extraído, para cualquier hallazgo relacionado con selección, resaltado o estado activo de un elemento.
2. Antes de reportar un bug como específico de un módulo, revisar si el componente involucrado es compartido por otros módulos con la misma estructura (mismo `stepGroup`/mismo tipo de paso) — evita reabrir el mismo bug módulo por módulo.
3. Antes de implementar una nueva persistencia, caché o mecanismo de estado, buscar explícitamente si ya existe uno similar en el código (`grep` por la clave/patrón esperado) para evitar dos mecanismos paralelos no coordinados.
4. Mantener el patrón de "detente y consulta" acotado a decisiones reales de arquitectura/UX/producto — no a cada paso — para no perder velocidad en el resto del trabajo ya aprobado.
5. Documentar la infraestructura de build/dev-server (ej. el patrón de corrupción de `.next`) como parte del runbook del proyecto si se vuelve a repetir en la próxima fase, en vez de solo repetirlo de memoria cada vez.

---

Con este documento se da por terminada formalmente la fase de estabilización (V1.1). La siguiente etapa del proyecto es **V2.0**, enfocada en evolución del producto y experiencia de usuario (ver `ROADMAP.md`).
