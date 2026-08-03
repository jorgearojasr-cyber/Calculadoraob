# Estado del Proyecto — ObraBien Calcula

_Última actualización: 03-ago-2026. Documento ejecutivo — pensado para entender el estado del proyecto en menos de un minuto. Para detalle técnico ver `BACKLOG_MASTER.md`, `RELEASE_NOTES.md`, `ROADMAP.md` y `AUDIT_V1_1_CLOSURE.md`._

---

## Versión actual

**V1.1 — Estabilización: CERRADA OFICIALMENTE (03-ago-2026).** Los 11 hallazgos de la auditoría funcional (02-ago-2026) quedan todos resueltos o descartados — no queda ningún ítem pendiente del backlog original. Ver `AUDIT_V1_1_CLOSURE.md` para el informe de cierre completo (resumen ejecutivo, lecciones aprendidas, riesgos pendientes, recomendaciones). Base: V1.0 "Base funcional auditada" (auditoría completa del 02-ago-2026, sin bugs críticos).

**Próxima etapa: V2.0**, enfocada en evolución del producto y experiencia de usuario (ver `ROADMAP.md`).

**Trabajo post-cierre (03-ago-2026):** Sprint UX sobre el proyecto "Construir una piscina" (análisis previo en `docs/piscina-fases-ux-analisis.md`) — 4 mejoras implementadas y cerradas, ver detalle abajo y en `RELEASE_NOTES.md`.

## Grupos completados

| Grupo | Contenido | Cerrado |
|---|---|---|
| Grupo 1 | BUG-001, BUG-002, BUG-010, BUG-011 | 02-ago-2026 |
| Grupo 2 | BUG-009, BUG-006, BUG-008 | 02-ago-2026 |
| Grupo 3 | BUG-005 | 03-ago-2026 |
| Grupo 5 | Cierre BUG-004 + UX-001 | 03-ago-2026 |
| Grupo 4A | BUG-003 | 03-ago-2026 |
| Grupo 4B | BUG-007 | 03-ago-2026 |

## Grupos pendientes

Ninguno — la auditoría V1.1 está oficialmente cerrada. Próximo trabajo corresponde a V2.0 (evolución de producto y experiencia de usuario), a definir con el usuario.

## Bugs encontrados (auditoría 02-ago-2026)

11 hallazgos totales: 0 críticos, 3 importantes (BUG-001, 002, 003), 5 de mejora UX (BUG-004, 005, 006, 010, 011), 3 de mejora funcional (BUG-007, 008, 009).

## Bugs resueltos

BUG-001, BUG-002, BUG-003, BUG-005, BUG-006, BUG-007, BUG-008, BUG-009, BUG-010, BUG-011 (10 de 11).

## Bugs descartados

BUG-004 — **Hipótesis descartada tras verificación**: la auditoría original concluyó erróneamente que `?tipo=` no preseleccionaba nada, por una limitación del método de inspección (texto plano, no detecta estado visual/ARIA). Dio origen a UX-001.

## Bugs pendientes

Ninguno.

## Mejoras UX implementadas

- **UX-001** (Grupo 5): confirmación contextual cuando una opción SELECT llega preseleccionada por query param, en vez del helper genérico "¿No sabes cuál elegir?" — patrón reutilizable, no específico de un módulo.
- **Sprint "Construir una piscina"** (03-ago-2026): (1) helpText explicando el efecto real del tipo de terreno en Excavación; (2) aclaración consistente hoyo-vs-piscina en ambas variantes de excavación; (3) supuesto de capacidad de camión (6 m³) visible en el resultado + paridad entre variantes (la circular no tenía este cálculo); (4) botón principal "Continuar con: [fase siguiente]" al terminar una fase de un plan, con "Guardar proyecto" como acción secundaria — salta directo al módulo de la fase siguiente cuando es resoluble, o cae al flujo de siempre si es ambiguo (2+ módulos posibles).

## Mejoras funcionales implementadas

- **BUG-007 / persistencia de progreso** (Grupo 4B): autoguardado local (localStorage, solo mismo dispositivo) contra pérdida accidental de progreso por recarga o "atrás" — siempre pide confirmación antes de restaurar, nunca automático. Expira a los 30 días. Unificado con el mecanismo ya existente de "Guardar y seguir después" (que mantiene su comportamiento sin cambios: restaura sin preguntar).

## Próximo grupo planificado

Ninguno asignado. Con el sprint de "Construir una piscina" cerrado, el trabajo siguiente pertenece a **V2.0** (evolución de producto y experiencia de usuario), aún sin desglosar en grupos. El análisis `docs/piscina-fases-ux-analisis.md` dejó 4 ítems adicionales evaluados y no implementados en este sprint (selección de tipo de camión, método de excavación + tiempo aproximado, costo de excavación en dinero, guía activa de holgura sugerida) — candidatos para un sprint futuro si se decide continuar en esta línea.
