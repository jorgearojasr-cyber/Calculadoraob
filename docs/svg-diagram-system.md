# Sistema de diagramas de medidas (SVG)

Especificación definitiva — 2026-07-30. Reemplaza cualquier instrucción parcial anterior sobre estos componentes. Leer esto ANTES de tocar `measure-diagram.tsx`, `question-group-step.tsx` o `area-input-toggle.tsx`.

## Objetivo

Las ilustraciones NO son imágenes generadas por IA. Cada ilustración es un componente SVG que cambia únicamente su geometría según los datos ingresados por el usuario. El estilo gráfico permanece siempre idéntico.

## Estilo gráfico obligatorio

- Contorno azul oscuro, grosor de línea uniforme.
- Cara superior gris muy claro cuando corresponda.
- Caras laterales blancas.
- Fondo transparente.
- Flechas naranjas.
- Etiquetas: fondo blanco, borde azul, texto azul oscuro, bordes redondeados.
- Diseño limpio y amigable, apariencia educativa, no técnica.

## Prohibido siempre

Wireframes, transparencias, líneas ocultas, líneas punteadas, sombras, perspectivas distintas entre figuras, ilustraciones nuevas por figura, estilos diferentes entre módulos. El usuario debe reconocer inmediatamente que pertenece a la misma familia gráfica de ObraBien en cualquier módulo.

## Figuras paramétricas

Las dimensiones ingresadas (ancho, largo, alto, diámetro, radio, espesor, profundidad) modifican proporcionalmente el dibujo. El sistema nunca deforma el estilo, solo las proporciones.

- **2D (superficie):** Rectángulo (largo/ancho), Cuadrado (tamaño), Círculo (diámetro), Triángulo (base/altura). Las flechas crecen junto con la figura; las etiquetas permanecen legibles.
- **3D (volumen):** Prisma rectangular, Cubo, Cilindro, Excavación, Radier, Losa, Fundación, Piscina. Sólidos siempre, nunca líneas internas, nunca transparencia, perspectiva siempre igual.

Escalado proporcional: largo=10/ancho=2 → se ve largo y angosto; largo=3/ancho=3 → se ve cuadrado; profundidad=3 → el bloque se ve más alto. Nunca cambia el estilo, solo las proporciones.

Flechas de medida: ancladas a la geometría — crecen o disminuyen con la figura, nunca quedan flotando sueltas.

Etiquetas: siempre fuera de la figura, conectadas con línea fina, nunca tapan el dibujo.

Responsive: desktop, la ilustración ocupa ~70% del panel; mobile, escala automáticamente manteniendo proporción, nunca pierde legibilidad.

## Arquitectura esperada

Biblioteca reutilizable de componentes, cada uno recibiendo SOLO dimensiones como props (largo, ancho, profundidad, diámetro, espesor, etc.), recalculando internamente las coordenadas SVG:

```
<Rectangle2D />
<Circle2D />
<RectangularPrism3D />
<Cylinder3D />
<ExcavationRectangular />
<ExcavationCircular />
<SlabDiagram />
<FoundationDiagram />
```

No usar imágenes PNG/JPG ni generación por IA para estos diagramas, nunca.
