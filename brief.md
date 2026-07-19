# ObraBien Calcula — Brief de Producto

## Rol del equipo a considerar
Product Manager Senior, Arquitecto de Software, Tech Lead Full Stack, UX/UI Designer
Senior, Ingeniero Civil, Constructor Civil, Arquitecto, Maestro de Obras (30+ años),
especialista en normas chilenas de construcción, especialista en UX, especialista en
optimización de bases de datos, especialista en escalabilidad SaaS.

No es una simple calculadora: es una plataforma tecnológica profesional pensada para
convertirse en la referencia en Chile y Latinoamérica para cálculos, cubicaciones,
estimaciones y apoyo técnico en construcción. Pensada para crecer durante muchos años.

## Objetivo principal
Permitir que cualquier persona calcule materiales de construcción de forma extremadamente
sencilla: personas sin experiencia, dueñas de casa, maestros, contratistas, constructoras,
ingenieros, arquitectos, estudiantes. El usuario nunca debe sentirse frente a una
calculadora técnica — debe sentir que la plataforma lo guía paso a paso.

## Filosofía del producto
- **No depende de IA en runtime.** Nada de enviar consultas a ChatGPT ni pagar por
  consulta a una API de LLM.
- Toda la inteligencia proviene de una **Base de Conocimiento propia**: reglas,
  fórmulas, tablas, relaciones, rendimientos, factores de pérdida, recomendaciones,
  normas, experiencia de maestros — todo administrado desde base de datos.
- El sistema interpreta las respuestas del usuario y aplica las reglas correspondientes.

## Visión
No es una colección de calculadoras — es una **Base de Conocimiento Inteligente sobre
construcción**. Las calculadoras son solo una forma de consultarla. A futuro la misma
base debe servir para: presupuestos, listas de compra, fichas técnicas, procedimientos
constructivos, cursos, checklists, inspecciones, mantenimiento, marketplace,
comparadores, manuales, exportaciones, integración con otras plataformas.

La arquitectura completa debe diseñarse pensando en **reutilizar el conocimiento**.

## Experiencia de usuario
Prioridad número uno. Diseñar pensando en alguien que nunca ha construido, no en
ingenieros. Evitar lenguaje técnico cuando exista alternativa simple.

En vez de "Ingrese el volumen", preguntar: ¿Qué desea construir? ¿Para qué será?
¿Cuánto mide? ¿Será para personas o vehículos? ¿Dónde estará ubicado? La plataforma
calcula automáticamente todo lo demás.

## Referencia visual
Diseño moderno, minimalista, limpio, profesional, muy visual, fácil de entender,
mucho espacio en blanco, iconografía simple, navegación intuitiva, tarjetas grandes,
buscador protagonista, categorías visuales, aspecto premium. Inspiración de filosofía
(no de interfaz literal): Apple, Notion, Stripe, Linear, ChatGPT, Arc Browser.

## Pantalla de inicio (Home)
Corazón de la plataforma. Debe incluir:

1. **Hero**: buscador central grande, "¿Qué quieres calcular hoy?", subtítulo sobre
   conocimiento técnico validado, imagen 3D de construcción, botón principal y
   secundario.
2. **Categorías principales** (tarjetas grandes con icono, nombre, descripción corta):
   Hormigón, Cerámica, Albañilería, Pintura, Fierros, Techumbres, Yeso Cartón,
   Excavaciones, Piscinas, Quinchos, Impermeabilización, Electricidad, Gas, Agua,
   Paisajismo, + "Ver todos".
3. **Cómo funciona**: 4 pasos — responder preguntas, calcular automáticamente, obtener
   resultados, descargar o compartir.
4. **Últimos proyectos**: proyectos recientes del usuario.
5. **Información confiable**: normas chilenas, buenas prácticas, experiencia de
   maestros, factores reales de pérdida.
6. **Generador de Prompts**: la plataforma no responde con IA, pero genera prompts
   listos para copiar en ChatGPT/Claude/Gemini/Copilot usando la info del cálculo
   realizado.

## Módulos
Sistema modular. Cada módulo es independiente y contiene: preguntas, variables,
reglas, fórmulas, materiales, resultados, consejos, errores, recomendaciones,
herramientas, pérdidas, documentación. Un módulo nuevo debe poder agregarse **sin
modificar la arquitectura existente**.

## Base de conocimiento
Estructura altamente normalizada, con entidades separadas: materiales, normas, tipos
de obra, fórmulas, factores de pérdida, rendimientos, herramientas, consejos,
preguntas, respuestas, imágenes, categorías, versiones, especialidades. Todo
actualizable desde un Panel de Administración — **nunca modificar código para
actualizar información**.

## Panel de administración
CMS propio. El administrador debe poder crear/editar módulos, preguntas, reglas,
fórmulas, materiales, normas, imágenes, recomendaciones, pérdidas y categorías,
todo desde interfaz gráfica.

## Metodología de trabajo
- Desarrollo iterativo, nunca todo de una sola vez.
- Antes de escribir código: analizar el problema, proponer alternativas, explicar
  ventajas/desventajas, elegir y justificar la mejor opción, luego implementar.
- Priorizar siempre: simplicidad, escalabilidad, mantenibilidad, rendimiento,
  experiencia de usuario, calidad del código.
- Nunca asumir requisitos si existen dudas — preguntar.
- Proponer mejoras y detectar oportunidades de simplificación proactivamente.
- **Principio guía**: antes de desarrollar cualquier pantalla, módulo o
  funcionalidad, evaluar si es la solución más simple posible para un usuario sin
  conocimientos técnicos. Si se puede reducir pasos, eliminar preguntas o automatizar
  decisiones sin perder precisión, proponerlo e implementarlo. El objetivo no es que
  el usuario aprenda ingeniería, sino que obtenga resultados correctos con el mínimo
  esfuerzo posible.
