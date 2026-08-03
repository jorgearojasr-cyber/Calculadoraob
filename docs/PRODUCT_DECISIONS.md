# Product Decisions — ObraBien Calcula

Registro de decisiones importantes del proyecto — qué se decidió, por qué, y qué impacto tuvo. Cada decisión relevante (de producto, alcance, arquitectura de negocio, o priorización) debe agregarse aquí en el momento en que se toma.

**Plantilla para cada entrada:**

```
## Fecha

Versión:
Decisión:
Motivo:
Impacto:
Estado:
```

**Estados posibles:** Vigente / Revisada / Revertida

---

## 02-ago-2026

**Versión:** V1.0
**Decisión:** Adoptar un backlog centralizado (`BACKLOG_MASTER.md`) y documentación técnica permanente (`ROADMAP.md`, `CHANGELOG.md`, este documento) como proceso estándar del proyecto a partir de ahora.
**Motivo:** La aplicación alcanzó una base funcional sólida (validada por auditoría funcional completa) y se busca profesionalizar el proceso de desarrollo antes de comenzar a corregir errores o construir nuevas funcionalidades.
**Impacto:** Toda tarea futura (corrección, mejora o nueva funcionalidad) debe registrarse en el backlog antes de implementarse. No se modificó ninguna funcionalidad, pantalla, componente, lógica de negocio ni estilo existente para crear esta infraestructura.
**Estado:** Vigente
