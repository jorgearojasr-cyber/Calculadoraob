# Registro central de features de producto (`src/lib/product-features.ts`)

Fase "Cimientos de la nueva arquitectura ObraBien" (2026-09-14). Documento breve pensado para quien retome esta arquitectura después — humano o Claude Code.

## Qué es

La fuente única de verdad para las **features de producto standalone** — secciones del sitio que NO son una calculadora (`Module`), pero que igual necesitan aparecer en el buscador, en el menú (TopNav/drawer mobile) y, más adelante, en el Home.

Hoy son 4: **Inspecciones, Regularización, Guías y consejos, Biblioteca**. Cada una vive en su propia tabla de Prisma (`InspectionCase`, `RegularizationCase`, `ModuleGuide`, `ProjectShowcase`) sin fila equivalente en `Module`/`Category`/`ProjectGroup`/`ProjectTask` — por eso, antes de este registro, cada superficie (buscador, TopNav, drawer mobile) las declaraba a mano por separado, y era fácil que una quedara afuera de alguna (así fue detectado en la auditoría: Inspecciones no aparecía en ningún lado alcanzable en mobile sin sesión).

Con el registro, agregar una feature standalone nueva implica, idealmente, solo 2 pasos:

1. Construir su implementación real (página, ruta, protección de acceso si corresponde).
2. Agregar una entrada a `PRODUCT_FEATURES` en `src/lib/product-features.ts`.

Desde ahí, el buscador y el menú la descubren solos — no hay un tercer ni cuarto lugar que tocar.

## Qué NO es

- **No es un CMS.** No hay UI de administración para editarlo — se edita a mano en el archivo, exactamente igual que `module-visual-config.ts` (el registro equivalente para módulos de cálculo).
- **No reemplaza ni duplica `Module`.** Los 61 módulos de cálculo siguen siendo 100% Prisma + `module-visual-config.ts` + el wizard genérico. Este registro nunca los migra ni les agrega columnas.
- **No reemplaza la protección real de rutas.** Ver la sección "`requiresAuth` no es seguridad" más abajo — es la advertencia más importante de este documento.
- **No es (todavía) lo que consume el Home.** El Home sigue exactamente igual que antes de esta fase — existe un helper (`getHomeFeatures()`) listo para cuando la fase visual futura lo necesite, pero ningún componente de Home lo llama todavía.

## Diferencia entre `Module` y `Feature`

| | `Module` | `FeatureEntry` |
|---|---|---|
| Dónde vive | Prisma (tabla `Module`, con `Question`/`Formula`/etc.) | Array estático en código (`product-features.ts`) |
| Qué representa | Una calculadora de materiales | Una sección del producto sin cálculo (Inspecciones, Guías, etc.) |
| Se publica/oculta con | `Module.published: Boolean` | `FeatureEntry.status: "available" \| "planned"` |
| Cuántos hay | 61 (46 publicados) | 4 hoy |
| Se migra en esta fase? | No — sigue igual | Es lo que este registro sí resuelve |

Si mañana aparece una nueva sección de producto que **calcula algo**, probablemente debería ser un `Module` nuevo, no una entrada acá. Este registro es para secciones sin cálculo — Inspecciones no calcula materiales, evalúa el estado de una obra; Regularización no calcula una cantidad, tramita un permiso.

## Áreas conceptuales (`ProductAreaId`)

7 áreas, declaradas en `PRODUCT_AREAS`, cada una con `status: "operational" | "future"`:

| Área | Estado | Quién la representa hoy |
|---|---|---|
| `calcula` | operational | Los 61 `Module` (no tienen `FeatureEntry`, ya tienen su propio sistema) |
| `planifica` | operational | `ProjectPlan` (piloto: `/plan/construir-una-piscina`) — tampoco tiene `FeatureEntry` |
| `revisa` | operational | Inspecciones |
| `regulariza` | operational | Regularización |
| `aprende` | operational | Guías y Biblioteca |
| `profesionales` | **future** | Nada — sin ruta, sin página, ver `PLANNED_FEATURES` |
| `documentos` | **future** | Nada — ídem |

**`calcula` y `planifica` no tienen entradas en `PRODUCT_FEATURES`** a propósito: ya tienen su propio modelo Prisma real (`Module`, `ProjectPlan`) que sigue siendo su fuente de verdad. El registro central solo cubre lo que NO tiene un modelo así.

### Piscina — nota específica

Existen dos caminos para "construir una piscina", y son intencionalmente distintos, no se fusionan:

- **`piscina-integral`** (`Module`, hoy `published:false`, en revisión) → área **CALCULA**. Configurador de una sola pasada.
- **`/plan/construir-una-piscina`** (`ProjectPlan`, 3 fases, todos sus módulos publicados, pero sin ninguna superficie que enlace a él hoy) → área **PLANIFICA**. Construcción por etapas.

Ninguno de los dos se tocó en esta fase (ni rutas, ni `published`, ni fórmulas, ni tarjetas).

## Flags de visibilidad

Cada `FeatureEntry` tiene:

- `status: "available" | "planned"` — `"planned"` es la clave para "existe en el roadmap, no en el sitio": nunca aparece en búsqueda, menú, ni Home, sin importar los demás flags. Las features `"planned"` viven en un array **separado** (`PLANNED_FEATURES`), no dentro de `PRODUCT_FEATURES`, justamente para que un consumidor que solo itera `PRODUCT_FEATURES` ni se entere de que existen — no hace falta que recuerde filtrarlas.
- `showInSearch` / `showInMenu` / `showInHome` — booleanos independientes. Ej.: Regularización tiene `showInSearch:true` pero `showInMenu:false` (decisión de producto ya tomada antes de este registro: no está en el menú, solo en su tarjeta destacada del Home).
- `order` — orden de aparición dentro de una misma superficie (hoy usado por `getMenuFeatures()`; refleja el orden visual que YA existía en TopNav antes de esta fase, no un orden nuevo).

Los helpers (`getSearchableFeatures()`, `getMenuFeatures()`, `getHomeFeatures()`) ya aplican estos filtros — ninguna superficie debería iterar `PRODUCT_FEATURES` directamente.

## Cómo agregar una nueva feature standalone

1. Construye la funcionalidad real primero (ruta, página, protección de acceso si corresponde) — o, si todavía no existe, decide si de verdad necesitas declararla ya (ver "features futuras" abajo).
2. Agrega una entrada a `PRODUCT_FEATURES` en `product-features.ts`, con `status: "available"` y su `href` real.
3. Elige sus flags (`showInSearch`, `showInMenu`, `showInHome`, `requiresAuth`, `order`).
4. Nada más — TopNav, MobileTopBar y el buscador ya la van a mostrar solos.

### Si la feature todavía NO tiene ruta real (planificación interna)

Agrégala a `PLANNED_FEATURES` con `status: "planned"`, sin `href`. Nunca va a aparecer en ninguna superficie pública mientras esté ahí. El día que tenga una ruta real, **muévela** (no la copies) a `PRODUCT_FEATURES`.

## `requiresAuth` NO es seguridad — advertencia importante

`FeatureEntry.requiresAuth` es **metadata descriptiva para la UI** (por ejemplo, un futuro badge "requiere cuenta" en una tarjeta). Cambiar este valor **no protege ni desprotege ninguna ruta**.

La protección real de una ruta sigue siendo, según el caso:

- `middleware.ts` (matcher explícito — hoy cubre `/admin`, `/proyectos`, `/lista-compras`, `/galeria/nueva`), o
- un `getServerSession(authOptions)` + `redirect("/login?callbackUrl=...")` dentro de la propia página (patrón usado hoy por `/inspecciones` y `/regularizacion`).

Si agregas una feature nueva que requiere sesión, **tienes que protegerla tú mismo** con uno de esos dos mecanismos — poner `requiresAuth: true` en el registro no hace nada por sí solo. Este registro describe la feature; no reemplaza ni unifica los mecanismos de autenticación existentes (eso quedó explícitamente fuera de alcance de esta fase).

## Qué se evaluó y no se migró en esta fase

- **Mis proyectos** (`/proyectos`) y **Lista de compras** (`/lista-compras`): son herramientas personales ligadas a una sesión activa, con su propio tratamiento de navegación (pestaña fija en BottomNav / entradas en `UserMenu`), distinto al de una "tarjeta de feature descubrible" como Inspecciones. Se evaluaron y se decidió no forzarlas al registro en esta fase — su rol de navegación es estructural, no de descubribilidad.
- **Acerca de ObraBien** (`/acerca-de`): página estática informativa, no una feature de producto. Se queda hardcodeada en TopNav/MobileTopBar, igual que "Calculadoras" (que es un ancla al Home, no una ruta propia).
