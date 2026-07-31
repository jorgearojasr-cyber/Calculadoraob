# Sistema de diagramas de medidas (SVG)

**ESTÁNDAR FINAL Y OFICIAL — v1, 2026-08-01.** Esta es la especificación
definitiva del sistema de diagramas SVG de ObraBien. Reemplaza cualquier
decisión parcial de vueltas anteriores (exploraciones de perspectiva,
ajustes puntuales de una sesión, etc.) — a partir de acá, todo módulo
nuevo debe reutilizar exactamente este lenguaje visual, sin variaciones.
Leer esto ANTES de tocar `measure-diagram.tsx`, `isometric-diagram.ts`,
`question-group-step.tsx` o `area-input-toggle.tsx`.

## Objetivo

El diagrama no decora la interfaz — permite al usuario validar
visualmente las medidas antes de continuar. Debe ser extremadamente
claro, simple y consistente. No es una ilustración por módulo: es un
componente de Design System, reutilizable y predecible.

## Regla principal — diferenciar 2D de 3D

**Diagramas de superficie (m²)** — para cualquier cálculo cuyo resultado
final es una superficie (ej. Pintura, Radier de superficie, Piso
flotante, Cerámica, Pasto, Papel mural, Revestimientos, Techumbres, y
cualquier otro módulo de área):

- Vista ORTOGONAL frontal — nunca perspectiva isométrica, nunca
  profundidad.
- Rectángulo limpio y perfectamente proporcional a las medidas reales.
- Cotas por fuera del objeto, separadas unos pocos píxeles, nunca sobre
  la figura, nunca cruzando el dibujo.
- La figura ocupa ~75-80% del espacio disponible del panel.

**Diagramas de volumen (m³)** — para cualquier cálculo cuyo resultado
final es un volumen (ej. Excavaciones, Piscinas, Fundaciones, Hormigón,
Rellenos, Fosas, Bases, cualquier prisma o cilindro):

- Perspectiva isométrica ÚNICA — misma cámara/ángulo en TODA la app, sin
  variar entre módulos.
- Cara superior gris claro, caras laterales blancas, contornos azul
  oscuro, flechas naranjas, texto azul oscuro.
- Cotas siempre fuera del volumen, nunca cruzan la geometría, nunca
  quedan encima del dibujo.

Un módulo se clasifica por su **resultado real** (m² vs. m³), no por el
número de campos que pide este diagrama específico — un grupo que solo
pide 2 de 3 dimensiones (ej. una sección transversal que luego se
multiplica por un largo ingresado en otro paso) igual puede ser
volumétrico si el resultado final del módulo es m³.

## Jerarquía visual

1. La figura (lo primero que se nota).
2. Las flechas.
3. Las medidas.

Nunca al revés — el usuario reconoce la forma antes de leer un número.

## Escalado

Proporcional a las medidas reales, con escala visual amortiguada (ver
`compressedRatios` en `isometric-diagram.ts`) para que casos extremos
(ej. largo=12, ancho=6, profundidad=1,5) no colapsen el dibujo en una
franja ilegible — se mantiene la relación entre dimensiones (el eje más
grande siempre se ve más grande), priorizando legibilidad sobre fidelidad
matemática exacta en los casos extremos.

## Responsive

- **Desktop:** la figura ocupa ~75-80% del panel disponible.
- **Mobile:** mismo lenguaje visual, misma perspectiva — solo se reduce
  la escala. Nunca cambia el tipo de diagrama (2D sigue siendo 2D, 3D
  sigue siendo 3D) ni el estilo entre breakpoints.

## Estilo gráfico obligatorio (ambos tipos)

- Contorno azul oscuro (`#002152`), grosor de línea uniforme.
- Cara superior gris muy claro (`#EEF2F6`) cuando corresponda (solo 3D).
- Caras laterales blancas (`#FFFFFF`).
- Fondo transparente.
- Flechas naranjas (`#FF4E00`).
- Texto de cota azul oscuro, tipografía monoespaciada, sin cajita (fondo
  blanco/borde azul) — ver "Regla de las etiquetas" abajo.
- Diseño limpio y amigable, apariencia educativa, no técnica.

## Regla de las etiquetas

Las cajas/chips (fondo blanco, borde azul) SOLO se justifican cuando la
etiqueta combina una PALABRA descriptiva + el valor en un mismo rótulo
(ej. "Largo" + "4,50 m" en 2 líneas). En el sistema actual, ningún
diagrama combina palabra + valor — antes de escribir se muestra la
etiqueta genérica ("Largo"), después se muestra el valor ("4,50 m"),
nunca las 2 juntas — así que la cajita nunca se justifica: siempre texto
simple estilo cota técnica (AutoCAD/Revit/SketchUp), pegado a su flecha.

## Prohibido siempre

Wireframes, transparencias, líneas ocultas, líneas punteadas, sombras,
perspectivas distintas entre figuras 3D, ilustraciones nuevas por figura,
estilos diferentes entre módulos, cajitas de etiqueta (ver regla arriba),
cotas que crucen la geometría del objeto. El usuario debe reconocer
inmediatamente que pertenece a la misma familia gráfica de ObraBien en
cualquier módulo.

## Filosofía

Componentes de un Design System, no ilustraciones puntuales. Cada
diagrama es un elemento reutilizable, consistente y predecible — el
usuario reconoce el estilo de ObraBien sin importar qué esté calculando.
**La consistencia visual pesa más que hacer "bonito" un dibujo puntual.**

## Arquitectura

Biblioteca reutilizable en `src/lib/isometric-diagram.ts` (geometría
pura, sin JSX) + `src/components/module/measure-diagram.tsx`
(componentes React), cada uno recibiendo SOLO dimensiones como props
(largo, ancho, profundidad, diámetro, etc.), recalculando internamente
las coordenadas SVG:

```
<MeasureDiagram shape="rectangle" ... />              // 2D — superficie
<MeasureDiagram shape="rectangle-with-depth" ... />    // 3D — volumen (prisma)
<MeasureDiagram shape="circle" ... />                  // 2D — superficie circular
<MeasureDiagram shape="circle-with-depth" ... />       // 3D — volumen (cilindro)
```

`shape` se asigna por módulo en `DIMENSION_DIAGRAMS`
(`question-group-step.tsx`), según el resultado real del módulo (m² →
`rectangle`/`circle`, m³ → `rectangle-with-depth`/`circle-with-depth`).

No usar imágenes PNG/JPG ni generación por IA para estos diagramas,
nunca.
