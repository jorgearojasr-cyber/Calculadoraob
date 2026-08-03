# Rediseño de la Home — Análisis UX (sin código todavía)

Basado en el código real actual (`src/app/(app)/page.tsx` y sus 7 secciones), no en supuestos. El mockup adjunto se usó solo como referencia de dirección/jerarquía, no como plantilla a copiar — se señala explícitamente donde me aparto de él y por qué.

## 1. Análisis de la Home actual

Orden real hoy: **Hero → ExplorationSection (toggle proyecto/material) → RecentProjects → HowItWorks → LearnBanner → TrustSection → SiteFooter**.

- **Hero**: título + buscador + 3 chips de acceso rápido + una foto de herramientas + (solo desktop) un mockup de laptop/celular + grid de 4 "beneficios" (100% gratis, rápido, ahorra dinero, confiable). Todo estático, sin personaje.
- **ExplorationSection**: la sección de mayor valor real — toggle "Por proyecto"/"Por material", grilla de "Proyectos más buscados" (6 tareas curadas a mano con foto), "Todas las categorías". Dinámica desde Prisma. Ya es un buen patrón (fusiona lo que antes eran 3 secciones separadas).
- **RecentProjects**: para usuario logueado, sus últimos 3 proyectos guardados. Para usuario sin sesión (el visitante nuevo, el público que más importa ahora mismo), es solo una tarjeta "Inicia sesión para guardar tus cálculos".
- **HowItWorks**: 4 pasos genéricos (Responde / Calcula / Resultado / Comparte).
- **LearnBanner**: banner-link a `/guias` con 4 íconos (guías, errores comunes, consejos, listas de compra).
- **TrustSection**: bloque oscuro (`bg-navy`) con 4 sellos de confianza (normas chilenas, rendimientos reales, etc.).
- **SiteFooter**: una línea, copyright + nota de exportación.

Navegación: `TopNav`/`BottomNav`/`MobileTopBar` no mencionan Regularización en ningún ítem — confirmado en el código, cero enlace.

No existe ningún asset de personaje/mascota en todo el proyecto. El único gráfico dibujado a mano es `LogoMark` (una casa + un check, abstracto/geométrico) — no un personaje. Las imágenes en `/public/images` son todas fotos de materiales/herramientas/tareas, no ilustraciones. Es decir: **el personaje del maestro tiene que incorporarse como un asset nuevo**, no hay nada que reutilizar para eso.

## 2. Problemas detectados

1. **Cero personaje** — la marca no tiene cara. El Hero comunica con una foto de herramientas genérica, no con alguien que "te acompaña".
2. **Regularización invisible** — el módulo está terminado y desplegado, pero no hay ningún punto de entrada. Cero descubrimiento posible.
3. **Mensaje de confianza duplicado** — el grid de "beneficios" del Hero (100% gratis, confiable...) y `TrustSection` (normas chilenas, rendimientos reales...) dicen básicamente lo mismo dos veces en la misma página, diluyendo ambos.
4. **`HowItWorks` y `LearnBanner` compiten por el mismo territorio** — "cómo se usa esto" y "aprende con nosotros" son la misma promesa (pilar #2: "aprender a construir") partida en dos secciones consecutivas y separadas.
5. **`RecentProjects` antepone al usuario recurrente sobre el nuevo** — para el visitante de "los primeros 5 segundos" (el objetivo explícito de este rediseño), esta sección hoy es puro ruido: una tarjeta de login que no ayuda a decidir nada.
6. **La sección de mayor valor real está en tercer lugar** — "¿Qué quieres construir?" (la exploración real, donde ocurre la decisión) llega después del Hero completo, en vez de estar pegada a él.
7. **Tono inconsistente** — `TrustSection` es un bloque oscuro y serio (`bg-navy`), casi corporativo. Contradice el objetivo de sentirse como "un asistente cercano", no como una ficha técnica de ingeniería.
8. **Mobile no está pensado nativo** — son las mismas 7 secciones apiladas que desktop. El único ajuste mobile-específico que existe (`HowItWorks` forzado a 4 columnas siempre) es una solución reactiva para que "no se rompa", no una decisión de diseño mobile-first.

## 3. Oportunidades de mejora

Directamente correlacionadas con los 8 problemas — se detallan como decisiones concretas en la sección 4.

## 4. Nueva arquitectura de la Home (con justificación de cada decisión)

**Orden nuevo:** Hero (rediseñado) → Explora (sin cambios de lógica) → **Regulariza tu Vivienda (nueva, destacada)** → Aprende con nosotros (fusión) → Confianza (aligerada) → Tus proyectos (condicional, más abajo) → Footer.

### a) Hero — el personaje pasa a ser la imagen principal
- **Elimina**: `hero-herramientas.png`, `hero-laptop-celular.png` (mockup de laptop/celular), y el grid de 4 "beneficios" completo.
- **Agrega**: el personaje del maestro, grande, a la derecha en desktop (columna 2, como hoy ocupa el mockup de laptop) — con la frase "Te acompaño paso a paso en tu proyecto." cerca de él.
- Se mantienen sin cambios: los 2 badges (100% gratis / sin registro), el título, el buscador, los 3 chips de acceso rápido.
- **Por qué**: el personaje reemplaza directamente al mockup de laptop en el mismo espacio que ya existe — no agrega una sección nueva, sustituye una imagen genérica por la cara de la marca. El grid de beneficios se elimina de acá (no se pierde el contenido, se fusiona en "Confianza", ver más abajo) porque duplicaba mensaje con `TrustSection`.

### b) Explora — se mantiene exactamente donde está, sin tocar lógica
- Sigue siendo la sección inmediatamente después del Hero. No se propone ningún cambio funcional: el toggle proyecto/material, la grilla de "Proyectos más buscados" y "Todas las categorías" ya son el patrón correcto.
- **Por qué**: es la sección de mayor valor real del producto (pilar #1: calcular). No compite por atención — al contrario, hay que protegerla de que otras secciones la posterguen.

### c) Regulariza tu Vivienda — tarjeta destacada nueva
- Se ubica **inmediatamente después de Explora**, antes de cualquier otra sección.
- Reutiliza la convención visual ya existente en el código para "resultado destacado" (`bg-safety-tint` + `border-safety-border`, usada hoy en `priced-results.tsx` para el primer resultado de una lista) — es el único precedente de "tarjeta que se destaca del resto" que ya existe en la app, así que la extiendo en vez de inventar un estilo nuevo.
- Usa la ilustración casa+escudo (exclusiva para este tema, como indicaste).
- Copy enmarcado como complemento, no como propuesta central: *"Además de ayudarte a construir, también puedo ayudarte a regularizar tu vivienda"* — mismo tono de acompañamiento que el Hero, dicho por el mismo personaje/voz.
- Los 4 bullets (elegibilidad, checklist, carpeta PDF, croquis) corresponden 1:1 a las Fases 2A–2E ya construidas y verificadas — no se promete nada que el módulo no haga hoy.
- **Punto que requiere tu aprobación explícita, separada del resto**: esto significa agregar el primer enlace de navegación pública hacia `/regularizacion`, cambiando la "Opción C" (rutas sin enlazar) que se decidió deliberadamente durante todo el desarrollo del módulo. Es una decisión de producto, no solo visual — la señalo aparte para que la apruebes a propósito, no como efecto colateral de aprobar el rediseño completo.

### d) Aprende con nosotros — fusión de `HowItWorks` + `LearnBanner`
- Una sola sección, no dos. Combina una versión compacta de los 4 pasos (Responde/Calcula/Resultado/Comparte, más chica) con el link a `/guias` y sus 4 íconos, en un mismo bloque.
- **Por qué**: ambas secciones hoy responden la misma pregunta implícita del usuario ("¿cómo uso esto / qué más puedo aprender acá?") de forma redundante y consecutiva. Fusionarlas no quita contenido, libera una sección entera de scroll.

### e) Confianza — aligerada, ya no un bloque oscuro
- Mismo contenido de 4 sellos (normas chilenas, rendimientos reales, factores de pérdida, experiencia de maestros) + los 4 "beneficios" que salieron del Hero, unificados en una sola franja de confianza.
- Cambia de `bg-navy` (oscuro, serio) a un tratamiento claro (`bg-concrete` o `bg-peach`), consistente con el resto de la página.
- **Por qué**: el objetivo es sentirse como un asistente cercano, no como una ficha técnica. Un bloque oscuro y denso de "normas" rompe ese tono justo a mitad de página. Además, unificar acá el mensaje de confianza que hoy vive partido en 2 lugares (Hero + Trust) evita la duplicación del problema #3.

### f) Tus proyectos — se mueve más abajo, y desaparece para el visitante nuevo
- Pasa a la posición justo antes del footer.
- **Para usuario sin sesión, no se muestra ninguna tarjeta** (ni la de login) — ya existe "Iniciar sesión" en el nav, no hace falta un segundo CTA compitiendo con el buscador del Hero.
- Para usuario logueado con proyectos guardados, se mantiene igual que hoy.
- **Por qué**: es contenido 100% para el usuario recurrente. Ponerlo temprano en la página, y encima mostrarle un CTA de login al visitante nuevo, es ruido puro frente al objetivo de "entender en 5 segundos qué hace la app" — que es exactamente lo que pide el brief.

### g) Footer — sin cambios.

## 5. Wireframe — Desktop (texto)

```
┌─────────────────────────────────────────────────────────────────┐
│ [Logo]      Inicio  Calculadoras  Guías  Biblioteca  Acerca de  │
│                                        [Iniciar sesión] [Comenzar]│
├─────────────────────────────────────────────────────────────────┤
│  100% GRATIS  · Sin registros                                    │
│                                                                    │
│  Calcula, aprende y                          "Te acompaño        │
│  construye gratis.                            paso a paso en     │
│                                                 tu proyecto"      │
│  La app gratuita que...                                          │
│                                                    [MAESTRO,      │
│  [ Buscador: ¿Qué proyecto quieres hacer? ] [Buscar]  grande,    │
│                                                 columna derecha]  │
│  Radier · Pintar · Piscina                                       │
├─────────────────────────────────────────────────────────────────┤
│ Explora   ¿Qué quieres construir?         [Por proyecto|Material]│
│ [chips de grupos: Estructuras, Pisos, Pintar, Electricidad...]  │
│ Proyectos más buscados                                           │
│ [foto] [foto] [foto] [foto] [foto] [foto]                       │
│ Todas las categorías                                              │
│ [tarjeta grupo] [tarjeta grupo] [tarjeta grupo] ...              │
├─────────────────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────────────────────┐  │
│ │ [casa+escudo]  Regulariza tu Vivienda                       │  │
│ │                "Además de ayudarte a construir, también     │  │
│ │                 puedo ayudarte a regularizar tu vivienda"   │  │
│ │                ✓ Elegibilidad preliminar  ✓ Checklist        │  │
│ │                ✓ Carpeta PDF   ✓ Croquis                     │  │
│ │                              [Ir a Regularización →]        │  │
│ └───────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│ Aprende con nosotros                                              │
│ 01 Responde  02 Calcula  03 Resultado  04 Comparte               │
│ Guías paso a paso · Errores comunes · Consejos · Listas  [→guías]│
├─────────────────────────────────────────────────────────────────┤
│ Cálculos basados en información real de obra                     │
│ Normas chilenas · Rendimientos reales · Pérdidas · Maestros      │
│ 100% gratis · Rápido · Ahorra dinero · Confiable                 │
├─────────────────────────────────────────────────────────────────┤
│ (solo si hay sesión con proyectos) Retoma donde quedaste          │
│ [proyecto] [proyecto] [proyecto]                                  │
├─────────────────────────────────────────────────────────────────┤
│ © ObraBien Calcula          Exporta tus resultados en cualquier..│
└─────────────────────────────────────────────────────────────────┘
```

**Divergencia deliberada del mockup de referencia**: el mockup mostraba un layout de 2 columnas con una barra lateral derecha persistente (personaje, buscador, destacados y Regularización todos apilados en un rail angosto). No lo adopto: sería el único lugar de toda la app con ese patrón (todas las demás páginas — categorías, guías, proyectos — usan una columna centrada `max-w-6xl`), y agregarlo aquí rompería la consistencia de layout del resto del sitio por una sola pantalla. En cambio, tomo del mockup la **jerarquía** (personaje protagonista arriba, "Regularización" enmarcada como algo adicional, no como el foco) y la aplico dentro de la estructura de secciones apiladas que ya usa toda la app.

## 6. Wireframe — Mobile (texto)

```
┌───────────────────────┐
│ [Logo]            [≡] │
├───────────────────────┤
│  [MAESTRO, más chico,  │
│   centrado, arriba]    │
│  "Te acompaño paso a   │
│   paso en tu proyecto" │
│                        │
│  Calcula, aprende y    │
│  construye gratis.     │
│                        │
│  [Buscador]   [Buscar] │
│  Radier · Pintar · Piscina │
├───────────────────────┤
│ ¿Qué quieres construir?│
│ [Por proyecto|Material]│
│ [chips, scroll horiz.] │
│ Más buscados            │
│ [foto][foto]            │
│ [foto][foto]            │
│ Categorías               │
│ [tarjeta] [tarjeta]      │
├───────────────────────┤
│ [casa+escudo pequeña]   │
│ Regulariza tu Vivienda  │
│ Además de ayudarte a    │
│ construir, también...   │
│ ✓ ✓ ✓ ✓ (compacto)      │
│ [Ir a Regularización →] │
├───────────────────────┤
│ Aprende con nosotros    │
│ (2x2, iconos + texto    │
│  corto)                 │
├───────────────────────┤
│ Confianza (franja clara,│
│ 2x2, sin bloque oscuro) │
├───────────────────────┤
│ (solo con sesión)       │
│ Retoma donde quedaste   │
│ [proyecto]               │
│ [proyecto]                │
├───────────────────────┤
│ © ObraBien               │
├───────────────────────┤
│ [Inicio][Proyectos][FAB]│
│      [Mis proy.][Perfil]│
└───────────────────────┘
```

**Qué cambia de verdad, no solo se adapta**: el personaje pasa de "columna derecha, solo desktop" (hoy el mockup de laptop directamente no se muestra en mobile) a protagonista centrado arriba del título en mobile — hoy no existe ningún equivalente mobile del hero visual, esto es net-new, no un reflow. La grilla de "más buscados" baja de 6 a 2 columnas (ya es así hoy). La tarjeta de Regularización se vuelve más compacta (bullets en vez de párrafo). "Aprende" y "Confianza" pasan de layouts de 4 columnas forzadas a 2x2 reales, sin el hack de "achicar todo para que quepan 4" que tiene `HowItWorks` hoy.

## 7. Plan de implementación por etapas

**Etapa 1 — Personaje en el Hero.** Agregar el asset del maestro a `/public/images`, modificar `hero.tsx` (reemplaza las 2 imágenes actuales, quita el grid de beneficios). Sin tocar `SearchBar`, chips ni lógica. Riesgo bajo, impacto visual inmediato y es la pieza que más pide el brief.

**Etapa 2 — Tarjeta "Regulariza tu Vivienda" + su enlace de navegación.** Nuevo componente, reutilizando la convención `bg-safety-tint`/`border-safety-border`. **Requiere tu aprobación explícita separada** por el cambio de política de descubrimiento del módulo (fin de la Opción C).

**Etapa 3 — Fusión y reordenamiento**: `HowItWorks`+`LearnBanner` → "Aprende con nosotros"; aligerar `TrustSection`; mover/condicionar `RecentProjects`. Riesgo medio — reescribe varios componentes existentes, pero ninguno cambia su contrato de datos (mismas queries a Prisma, mismas props).

**Etapa 4 — Pase mobile-específico.** Ajustar tamaños reales del personaje, grillas 2x2 genuinas (no el hack de 4-columnas-comprimidas), spacing propio de mobile sobre la base ya reordenada en la Etapa 3.

**Etapa 5 (opcional, limpieza)**: si `hero-herramientas.png`/`hero-laptop-celular*.png` quedan sin ninguna referencia tras la Etapa 1, confirmar contigo antes de borrarlos de `/public/images` (no asumo que no se usan en otro lado sin verificarlo primero).

Cada etapa reutiliza el layout/tokens existentes (`rounded-2xl`/`rounded-3xl`, `max-w-6xl`, paleta de `tailwind.config.ts`) y no toca rutas, backend ni lógica de negocio, tal como pediste.

---

Quedo a la espera de tu revisión antes de implementar cualquier etapa. El único punto que pido aprobar por separado, explícitamente, es el de la Etapa 2 (el enlace público a `/regularizacion`).
