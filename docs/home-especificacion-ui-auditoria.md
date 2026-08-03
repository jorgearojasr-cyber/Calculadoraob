# Auditoría: Especificación UI Home vs. código actual

Basado en `ObraBien Calcula_ Paleta y tipografía.pdf` (especificación, 7 páginas) y `ObraBien Calcula_ 1111.pdf` (mockups 5a/5b, referencia visual). No se ha modificado ningún archivo — este documento es solo análisis.

---

## 0. Resumen ejecutivo

La especificación describe una **reconstrucción del Hero** que fusiona escena + buscador + accesos rápidos + "Proyectos más buscados" en un solo bloque con degradado, seguido de "Todas las categorías" y una tarjeta de Regularización reposicionada dentro de esa misma sección. Es un diseño nuevo, no una descripción del estado actual.

Tres cosas necesitan tu decisión antes de que pueda empezar a implementar (detalladas en la sección 5):

1. **La paleta de color y la tipografía de la especificación no coinciden con los tokens de marca ya usados en toda la app** (calculadoras, wizards, admin). Son sistemas de color distintos, no una variación del mismo.
2. **La especificación no menciona en ningún lugar** las secciones "Aprende" (LearnSection), "Confianza" (TrustSection) ni "Tus proyectos" (RecentProjects), que hoy existen en la Home.
3. El carrusel de "Proyectos más buscados" con scroll-snap, flechas, indicador y teclado **no existe hoy en ningún lugar del código** — es un componente nuevo de cero.

---

## 1. Auditoría del código actual (línea base)

**`src/app/(app)/page.tsx`** — orden actual de secciones:
```
Hero → ExplorationSection (toggle Por proyecto/Por material,
  con "Proyectos más buscados" y "Todas las categorías" ANIDADOS
  adentro del toggle) → RegularizationFeaturedCard → LearnSection
  ("Aprende") → TrustSection ("Confianza") → RecentProjects
  ("Tus proyectos", solo con sesión) → SiteFooter
```

**Hero (`hero.tsx`)** — grid `lg:grid-cols-2`, columna izquierda con badges/H1/bajada/buscador/accesos rápidos, columna derecha con el personaje (`maestro-obrabien.png`, `mix-blend-mode` NO aplicado hoy, sin casa de fondo, sin degradado de banda, sin retícula). No contiene el carrusel de destacados — ese vive más abajo, dentro de `ExplorationToggle`.

**"Proyectos más buscados" y "Todas las categorías"** — ambos viven hoy dentro de `ExplorationToggle` (`exploration-toggle.tsx`), solo visibles en la pestaña "Por proyecto":
- Proyectos más buscados: grid estático `grid-cols-2 md:grid-cols-6` (no carrusel), 6 tarjetas curadas a mano (`CURATED_TASK_SLUGS` en `exploration-section.tsx`, incluye "construir-una-piscina").
- Todas las categorías: lista de filas (`GroupCard`) con ícono de color + nombre + contador + chevron, `grid sm:grid-cols-2`.
- Existe además un toggle "Por proyecto / Por material" que decide si se muestra esto o `CategoryGrid` (rubros técnicos).

**Regularización (`regularization-featured-card.tsx`)** — sección propia entre ExplorationSection y LearnSection, banda `bg-safety-tint`, escudo a la izquierda, botón sólido marino ("Ir a Regularización").

**Topbar (`top-nav.tsx` desktop / `mobile-top-bar.tsx` móvil)** — `header` con `position: fixed`, `h-16` (desktop) / `h-14` (mobile), `px-6` (desktop) / `px-4` (mobile). Nav items con borde inferior 2px en el activo (color `safety`).

**Tokens de color (`tailwind.config.ts`)** — sistema de marca "definitivo" fechado 2026-07-28: `safety` #002152 (marino), `action` #FF4E00 (naranjo), `ink` #1A1917, `ink-muted` #5E5850, `ink-faint` #8C8579, `border` #E4DED4, `success` #185C3D / `success-tint` #B9D4C7, `concrete` #F9F9F9 (fondo app).

**Tipografía (`layout.tsx`)** — Figtree vía `next/font/google`, cargada con pesos `400/500/600/800` para `--font-display` y `400/500/600` para `--font-body`. IBM Plex Mono cargada solo con peso `500` para `--font-mono`.

---

## 2. Diferencias detectadas (por sección)

### 2.1 Paleta de color — **conflicto real**

| Rol | Token actual | Valor actual | Token especificación | Valor spec |
|---|---|---|---|---|
| Marca/marino | `safety` | `#002152` | `--marino` | `#002152` ✅ igual |
| CTA/naranjo | `action` | `#FF4E00` | `--naranjo` | `#FF4E00` ✅ igual |
| Texto principal | `ink` | `#1A1917` (cálido, casi negro) | `--tinta` | `#10203A` (frío, azulado) ❌ distinto |
| Texto secundario | `ink-muted` | `#5E5850` (cálido) | `--texto` | `#4A5568` (frío) ❌ distinto |
| Texto terciario | `ink-faint` | `#8C8579` (cálido) | `--texto-suave` / `--meta` / `--placeholder` | `#5B6577` / `#7A8496` / `#8A93A2` (fríos, 3 niveles nuevos) ❌ distinto y sin equivalencia 1:1 |
| Borde | `border` | `#E4DED4` (cálido) | `--borde` / `--borde-card` / `--borde-input` | `#E3E8EF` / `#EEF1F6` / `#D5DCE7` (fríos, 3 variantes) ❌ distinto |
| Chip "100% GRATIS" | `success` / `success-tint` | `#185C3D` / `#B9D4C7` | (color inline en spec) | `#1F6B4A` sobre `#E4F2E9` ❌ distinto |

Los tokens de marca/CTA (marino y naranjo) coinciden exactamente. Todo el resto de la paleta neutra (texto, bordes, fondos secundarios) es un sistema **frío** (azulado) nuevo que reemplaza al sistema **cálido** actual, usado hoy en calculadoras, wizards y admin, no solo en Home.

### 2.2 Tipografía

- Peso 800 en H1: ya cargado (`figtree` incluye 800). ✅
- Peso 700 para "Título de sección"/"Título de tarjeta"/botones: **no está cargado** — `figtree` (`--font-display`) solo trae `400/500/600/800`. Falta el 700.
- IBM Plex Mono peso 400: **no está cargado** — solo se cargó `500`. La especificación pide "400/500" para mono.
- H1 desktop: spec pide `62px / line-height 1.02 / tracking -0.032em / weight 800`. Hoy es `text-6xl` (60px) `font-semibold` (600). Tamaño y peso distintos.
- Bajada, título de sección, etc.: la spec da tamaños en px exactos (19, 22, 18...) que no siempre calzan con la escala de Tailwind (`text-lg`=18px, `text-xl`=20px...) — varios necesitarán `text-[Npx]` arbitrario para ser fieles.

### 2.3 Estructura del Hero

- Fondo: degradado `linear-gradient(180deg, #F1F5FB 0%, #F7F9FC 58%, #FFFFFF 100%)` + retícula de líneas 56×56 opacidad .045 + halo naranja radial decorativo. Hoy: `blueprint-bg` con máscara radial, sin el degradado ni el halo naranja descritos.
- Escena maestro + casa: la spec pide una **imagen de fondo de casa** detrás del personaje (`mix-blend-mode: multiply`, con velo lineal encima) — hoy solo se muestra el personaje solo, sin casa de fondo. Necesito un asset de "casa" nuevo (no confundir con el escudo de Regularización) o confirmar si `maestro-obrabien.png` ya incluye la casa integrada en el mismo PNG (los mockups 5a/5b sugieren que sí — el personaje aparece con una casa detrás en la misma imagen). **Necesito que confirmes esto: ¿el PNG actual ya trae la casa integrada, o hace falta un asset nuevo?**
- Buscador: sombra, radios y paddings específicos no exactamente los actuales (hoy `rounded-2xl` = 16px; spec pide r24 desktop / r18 mobile).
- Accesos rápidos: spec pide iconos por chip (Radier, Pintar, Cerámica, Electricidad, Baño, Más) — hoy son 3 chips de texto plano sin ícono (Radier, Pintar, Piscina), y sin el chip "Más".

### 2.4 "Proyectos más buscados" → pasa a ser un carrusel dentro del Hero

- Hoy es un grid estático de 6 tarjetas, ubicado fuera del Hero, dentro del toggle "Por proyecto". La spec lo mueve **dentro del bloque del Hero** (visualmente, con `margin-top: -4` pegándolo a la banda), lo convierte en **carrusel horizontal con scroll-snap**, con 5 tarjetas en el dataset (sin piscina), flecha derecha/izquierda solo desktop, degradado de corte, indicador de 3 barras, soporte de teclado (`←`/`→`), y `role="region"`.
- Esto es un **componente nuevo** — no hay ningún carrusel similar en el código hoy (confirmado por búsqueda de `scroll-snap`/`snap-x` en todo `src/`).
- Diseño de tarjeta también cambia: hoy 4:3 con overlay de categoría; spec pide 16:10, ancho fijo 288px (desktop) / 186px (mobile), chip de categoría absoluto arriba-izquierda sobre la foto, pie con "Calcular →" a la derecha.

### 2.5 "Todas las categorías"

- Hoy: filas con ícono de color + nombre + contador + chevron, en `grid sm:grid-cols-2`, viven dentro del toggle "Por proyecto".
- Spec: grid `repeat(4, 1fr)` (desktop) / `repeat(2, 1fr)` (mobile), cada ítem es solo nombre + contador mono alineado a la derecha (sin ícono, sin chevron), fuera de cualquier toggle, siempre visible.
- **El toggle "Por proyecto / Por material" no aparece en ningún lugar de la especificación.** No indica si se elimina o si queda fuera de alcance de este rediseño de Home.

### 2.6 Regularización

- Hoy: sección propia (`RegularizationFeaturedCard`) entre ExplorationSection y LearnSection, banda ancha, escudo grande a la izquierda, 4 bullets, botón marino sólido.
- Spec: banda **dentro** de la sección "Todas las categorías" (después de la grilla, `margin-top: 14`), fondo `#EDF3FA` (no `safety-tint` actual, otro azul), sin bullets, botón **secundario** (borde marino sobre blanco, nunca naranjo — hoy el botón es sólido marino, no bordeado), escudo más chico (168px) a la derecha en vez de a la izquierda.
- Mensaje de texto también cambia: spec usa "¿Necesitas regularizar tu vivienda? Ley del Mono (20.898)" como título; hoy es "Regulariza tu Vivienda" con párrafo largo mencionando Ley 20.898 y disclaimer de "no reemplaza a un profesional". **La spec no incluye ningún disclaimer legal en la tarjeta** — dado que ese disclaimer fue una decisión de producto explícita en una conversación anterior de esta sesión, marco esto como algo a confirmar, no a eliminar por mi cuenta.

### 2.7 Secciones no cubiertas por la especificación

"Aprende" (`LearnSection`), "Confianza" (`TrustSection`) y "Tus proyectos" (`RecentProjects`) no aparecen ni en el listado de 6 secciones (`Hero → Proyectos más buscados → Todas las categorías → Regularización → Guías → Biblioteca`) ni en ningún otro lugar del documento. Tampoco hay una especificación visual para "Guías" ni "Biblioteca" — se nombran en el breadcrumb pero el documento nunca detalla su diseño (termina en `§7 Notas de implementación` sin volver a mencionarlas).

### 2.8 Mobile

- Composición del Hero mobile "NO es responsive del desktop" (cita textual) — es un layout distinto a propósito: personaje a la derecha, mensaje de texto a la izquierda con máscara de degradado. Hoy el Hero mobile apila personaje arriba, centrado, sin mensaje de texto propio (el H1 cumple ese rol).
- Tab bar inferior: spec especifica colores/paddings exactos que coinciden a grandes rasgos con el `BottomNav` actual (no revisado en detalle en esta pasada, pendiente en la etapa mobile del plan).

---

## 3. Riesgos

1. **Fractura del sistema de diseño**: si los tokens nuevos (`--tinta`, `--texto`, `--borde`, etc.) se aplican solo a Home con valores hardcodeados, Home quedará visualmente inconsistente con el resto de la app (calculadoras, wizards, admin) que siguen usando `ink`/`border`/`success`. Si en cambio se reemplazan los tokens globales, cambia el color de texto de toda la aplicación, no solo la Home — impacto mucho mayor al alcance pedido ("la Home").
2. **Asset de la casa de fondo**: si `maestro-obrabien.png` no trae la casa integrada, hace falta un asset nuevo y confirmar sus proporciones antes de maquetar la escena.
3. **`mix-blend-mode: multiply`**: la especificación advierte que requiere fondo claro constante detrás y que se rompe si algún ancestro tiene `isolation: isolate`. Hay que auditar que ningún contenedor padre del Hero use `isolate` antes de aplicarlo (no se detectó ninguno en la revisión de hoy, pero se debe confirmar en la etapa de implementación).
4. **Carrusel nuevo**: teclado, scroll-snap, indicador, flechas con fade, degradado de corte, "sin JS no se rompe" — es la pieza de mayor esfuerzo técnico del documento. Alto riesgo de desvíos sutiles frente al pixel-spec si no se prueba contra el mockup en cada breakpoint.
5. **Pérdida de affordance en "Todas las categorías"**: quitar el ícono de color y el chevron (que hoy ayudan a escanear la grilla) es una regresión de usabilidad menor, pero está explícitamente en la especificación — lo marco como riesgo aceptado, no como algo que vaya a "mejorar por iniciativa propia".
6. **Dataset de destacados**: pasar de 6 a 5 tareas curadas (quitando "construir-una-piscina") es un cambio de contenido, no solo visual — confirmar antes de tocar `CURATED_TASK_SLUGS`.
7. **Disclaimer legal de Regularización**: la especificación no lo incluye; eliminarlo sin confirmación explícita contradice una decisión de producto tomada en una sesión anterior.

---

## 4. Preguntas bloqueantes — necesito tu respuesta antes de empezar

1. **Tokens de color/tipografía**: ¿reemplazo los tokens globales (`ink`, `ink-muted`, `ink-faint`, `border`, `success`) en `tailwind.config.ts` con los valores de la especificación (afecta toda la app), o creo un set de tokens nuevo exclusivo para Home (Home queda visualmente distinta al resto de la app)?
2. **Aprende / Confianza / Tus proyectos**: ¿se eliminan de la Home, se mantienen sin cambios al final (después de Biblioteca), o hay una especificación para ellas que no llegó en estos documentos?
3. **Toggle "Por proyecto / Por material"**: ¿se elimina (ya que no aparece en la especificación) o se mantiene aunque no esté documentado?
4. **"Proyectos más buscados"**: ¿5 tarjetas curadas (sin piscina, como el mockup) o mantenemos las 6 actuales agregando el carrusel?
5. **Escena del Hero**: ¿el PNG del maestro ya incluye la casa de fondo, o hace falta un asset nuevo?
6. **Regularización — disclaimer legal**: ¿lo quito de la tarjeta de Home (como indica la especificación, sin bullets ni disclaimer) o lo mantengo pese a que no esté en el documento?

---

## 5. Plan de implementación propuesto (por etapas, pendiente de aprobación)

**Etapa 0 — Resolver las 6 preguntas bloqueantes de la sección 4.**

**Etapa 1 — Fundamentos**: agregar pesos de fuente faltantes (Figtree 700, IBM Plex Mono 400); agregar/actualizar tokens de color según lo que se decida en la pregunta 1.

**Etapa 2 — Topbar**: ajustar paddings/gaps/tamaños exactos en `top-nav.tsx`.

**Etapa 3 — Hero (desktop)**: fondo degradado + retícula + halo, grilla `1fr 770px`, escena maestro+casa con `mix-blend-mode` y velo, buscador con specs exactas, accesos rápidos con íconos.

**Etapa 4 — Carrusel "Proyectos más buscados"** (componente nuevo): estructura, scroll-snap, flechas, indicador, teclado, degradado de corte, integración dentro del Hero.

**Etapa 5 — "Todas las categorías"**: nuevo grid `repeat(4,1fr)` / `repeat(2,1fr)`, salir del toggle actual (según respuesta a la pregunta 3).

**Etapa 6 — Regularización**: reposicionar dentro de "Todas las categorías", nuevo estilo de banda y botón (según respuesta a la pregunta 6).

**Etapa 7 — Mobile completo**: Hero con composición no-responsive-del-desktop, escena+mensaje del maestro, carrusel mobile, categorías, tab bar.

**Etapa 8 — QA**: comparación visual contra los mockups 5a/5b en cada breakpoint (375 / 640-1023 / 1024-1279 / ≥1280 / ≥1440), accesibilidad (`role`, `aria-label`, foco visible, `prefers-reduced-motion`), verificación con `tsc`/`eslint`/`build` + navegador real.

No voy a tocar ningún archivo hasta que respondas la sección 4 y apruebes (o ajustes) este plan.
