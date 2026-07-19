# ObraBien Calcula — Decisiones Técnicas

Este documento resume las decisiones de arquitectura ya tomadas junto con Claude
(chat), con su justificación. Claude Code debe seguir estas decisiones salvo que
detecte un problema concreto — en ese caso, debe explicarlo antes de desviarse.

## Stack

| Capa | Elección | Por qué |
|---|---|---|
| Frontend | Next.js 14+ (App Router), TypeScript, Tailwind CSS | SSR/SSG para SEO (clave para posicionar cada categoría en Google), Server Components para no exponer lógica de negocio en el cliente, permite organizar 15+ módulos como rutas independientes. |
| Backend | API routes de Next.js para empezar; migrar a NestJS si la lógica de negocio crece mucho | Evita dividir el stack en dos lenguajes sin necesidad real al inicio. NestJS queda como opción si el motor de reglas necesita aislarse en su propio servicio. |
| Base de datos | PostgreSQL | El dominio es altamente relacional (materiales, fórmulas, normas, factores de pérdida, preguntas, todo interrelacionado). Soporta JSONB para partes semi-estructuradas (árboles de preguntas condicionales) sin sacrificar integridad referencial. |
| ORM | Prisma | Schema declarativo, migraciones versionadas (el admin panel evoluciona la base de conocimiento sin deploy de código), tipado end-to-end con TypeScript. |
| Motor de reglas/fórmulas | DSL propio en JSON almacenado en base de datos, interpretado en runtime | Es el corazón real del producto. Debe poder editarse desde el admin sin tocar código. Debe diseñarse desacoplado del resto para reutilizarse a futuro en presupuestos, checklists, etc. |
| Panel de administración | Admin a medida (no CMS genérico tipo Strapi) | Las estructuras (fórmulas, factores de pérdida condicionales, árboles de preguntas) son demasiado específicas para forzarlas al modelo de un CMS genérico. |
| Autenticación | Auth.js (NextAuth) o Clerk | NextAuth si se prioriza costo cero a escala y control total; Clerk si se prioriza velocidad inicial. |
| Hosting | Vercel (frontend) + Railway/Render o AWS RDS (Postgres) para empezar | No sobre-invertir en infraestructura antes de tener tráfico real. Migrable a AWS completo después. |
| Caché | Redis | Resultados de cálculo frecuentes y sesiones del flujo de preguntas. |

## Modelo de datos conceptual (Base de Conocimiento)

Entidades separadas, normalizadas, cada una editable desde el admin panel:

- `categories` — categorías visibles en Home (Hormigón, Cerámica, etc.)
- `modules` — módulos de cálculo, pertenecen a una categoría, versionados
- `questions` — preguntas de un módulo, con orden y lógica condicional
- `question_options` — opciones de respuesta para preguntas de selección
- `variables` — variables derivadas de las respuestas, usadas en fórmulas
- `formulas` — expresiones del DSL de cálculo, ligadas a un módulo
- `materials` — materiales de construcción (nombre, unidad, categoría)
- `loss_factors` — factores de pérdida por material/contexto
- `norms` — normas chilenas de referencia
- `tools` — herramientas recomendadas por módulo
- `tips` — consejos y recomendaciones
- `module_versions` — historial de versiones de un módulo

Un módulo nuevo se crea agregando filas a estas tablas — **nunca modificando código**.

## Plan de fases (desarrollo iterativo)

1. **Fase 1 — Shell general (Home)**: layout, navegación, categorías como tarjetas,
   sección "Cómo funciona". Diseño ya aprobado en `docs/diseño/obrabien-home.jsx`
   (referencia visual — paleta, tipografía, estructura — no copiar literal, reconstruir
   consumiendo datos reales desde Postgres vía `categories`/`modules`).
2. **Fase 2 — Módulo piloto end-to-end**: un módulo real (a definir) con flujo completo
   de preguntas → cálculo → resultado → generador de prompt, navegado desde el Home
   real. Sirve para validar que el modelo de datos soporta la complejidad real.
3. **Fase 3 — Admin panel**: CRUD gráfico sobre todas las entidades de la base de
   conocimiento, para que los módulos futuros se agreguen sin código.
4. **Fase 4 — Escalar**: resto de los módulos/categorías usando el admin panel.

## Sistema de diseño (de `docs/diseño/obrabien-home.jsx`)

- **Paleta**: base gris "concreto" `#F5F4F1`, texto tinta `#1C1B19`, acento primario
  azul "blueprint" `#2451B0`, acento secundario naranja "seguridad" `#E8622C`,
  texto secundario `#6B6862`, bordes `#E4E1D8`.
- **Tipografía**: Space Grotesk (títulos), IBM Plex Sans (cuerpo), IBM Plex Mono
  (números, etiquetas técnicas).
- **Elemento de firma**: grid tipo papel milimetrado de fondo en el hero + ticks de
  plano (líneas de cota) — referencia al mundo de la construcción sin iconografía
  obvia (cascos, ladrillos genéricos).

## Reglas para Claude Code

- No implementar el motor de fórmulas ni módulos de cálculo hasta que la Fase 1 esté
  aprobada.
- No modificar código para agregar contenido (categorías, preguntas, materiales) —
  todo debe vivir en la base de datos desde el día 1, aunque el admin panel llegue
  después (se puede poblar por seed/migración mientras tanto).
- Antes de escribir código en cada sesión: confirmar alcance, proponer alternativas
  si hay ambigüedad, y avisar si detecta una forma más simple de lograr el mismo
  resultado para el usuario final.
