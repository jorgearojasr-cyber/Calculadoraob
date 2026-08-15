import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

// Fase 11E (15-ago-2026) — Lote 1 de biblioteca técnica guiada
// (docs/FASE11D_DISENO_BIBLIOTECA_TECNICA_GUIADA.md, sección H/O).
//
// Dos operaciones distintas, ambas idempotentes:
//
// 1) EXTIENDE los 3 TechnicalArticle ya existentes de Fase 5B (Muros,
//    Ventana, Puerta) al formato guiado completo — mismo patrón ya
//    validado en producción con Piso (Fase 11B). Se reescribe el
//    `content` completo de estos 3 artículos para adoptar la plantilla
//    canónica de 7 encabezados (docs/FASE11E, sección 3); todo el
//    contenido verificado de Fase 5B se conserva (fuente, criterios,
//    defaultSeverity de Muros=MEDIUM sin reinterpretar), solo se
//    reorganiza bajo los encabezados nuevos y se agregan las 2
//    secciones nuevas (Cómo revisarlo, Por qué importa) más las
//    reglas de lenguaje prudente de Fase 11D (Observación → Posible
//    signo → Recomendación, nunca diagnóstico).
//
// 2) CREA 4 TechnicalArticle nuevos (3 para Artefactos sanitarios, 1
//    para Enchufes e interruptores) y los vincula a sus
//    InspectionChecklistItem YA EXISTENTES (ids confirmados por
//    consulta directa antes de escribir este script — no se crea
//    ninguna pregunta nueva, no se toca el catálogo). Fuente: la ya
//    identificada en Fase 6A (catálogo educativo ITO 265 puntos,
//    sección Artefactos sanitarios/Grifería/Artefactos eléctricos;
//    Manual de Tolerancias CDT ficha 26 para enchufes).
//
// Ningún artículo ajeno (Piso) se toca. Idempotente vía upsert por
// slug + update de technicalArticleSlug por id ya confirmado.
async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  // --- 1) Extender Muros / Ventana / Puerta ---
  const extendedArticles = [
    {
      slug: "muros-como-revisar-fisuras",
      title: "Cómo revisar fisuras en muros",
      content: `# Qué revisar

Si el muro presenta fisuras (grietas) visibles, y de qué tipo: superficiales/cosméticas o con indicios de ser más profundas.

# Cómo revisarlo

Recorre el muro completo con buena luz, mirando en ángulo — la luz rasante ayuda a notar fisuras finas que a simple vista pasan desapercibidas. Presta especial atención a las esquinas, el encuentro entre muro y cielo, y los bordes de puertas y ventanas, que es donde suelen aparecer primero. Si encuentras una fisura, apoya una tarjeta o una moneda al lado para tener una referencia de tamaño en la foto.

# Qué debería observarse

Distinguir entre:
- **Fisura de retracción**: fina, superficial, típica de las primeras semanas de secado del estuco — generalmente sin riesgo.
- **Fisura capilar**: superficial, delgada, sin espesor perceptible — bajo riesgo.
- **Fisura con indicios estructurales**: tiene espesor perceptible al tacto, cruza una esquina o un vano (puerta/ventana), o supera aproximadamente 0,3 mm de ancho.

# Qué señales pueden indicar un problema

- Una fisura de más de 0,3 mm de ancho.
- Una fisura que cruza una esquina o el borde de una puerta o ventana.
- Una fisura con espesor perceptible al pasar el dedo (no solo visual).

Ninguna de estas señales determina por sí sola la causa — conviene documentarlas igual y, si tienes dudas, consultarlas con un profesional.

# Por qué importa

El tamaño y la ubicación de la fisura son justamente el criterio que hace que esta partida sugiera severidad media por defecto, siempre ajustable según lo que realmente observes. Documentarla bien ahora facilita compararla más adelante (si crece o no) y le da a un profesional información concreta si decides consultarlo.

# Recomendación

Mide o estima el ancho de la fisura (una tarjeta o moneda como referencia visual sirve para la foto). Si es delgada y no cruza esquinas/vanos, regístrala igual como observación menor. Si tiene espesor visible o cruza una esquina, márcala como observación de mayor severidad y considera evaluación por un profesional — ObraBien no realiza diagnóstico estructural.

# Fuente

- **Manual técnico de referencia**: Manual de Tolerancias CDT — tolerancia de unidades con fisuras en albañilería (2% máx. por paño).
- **Criterio interno adaptado**: catálogo educativo ITO (265 puntos), elemento Muros — distinción fisura capilar/estructural, umbral de 0,3 mm, criterio "cruza esquina = riesgo mayor".
- **Biblioteca técnica**: contenido ITO sobre pintura de muros — grietas finas cerca de esquinas, criterio de documentar igual ante duda.

Sin referencia normativa verificada en esta fuente (no se citó OGUC/LGUC/NCh).`,
    },
    {
      slug: "ventana-como-revisar-funcionamiento",
      title: "Cómo revisar el funcionamiento de una ventana",
      content: `# Qué revisar

Si la ventana abre, cierra y traba correctamente, y si sus manillas/mecanismos funcionan sin forzar.

# Cómo revisarlo

Abre y cierra la ventana completa varias veces, probando también la traba. Prueba la manilla por separado, sintiendo si se mueve suave o con resistencia. Con la ventana cerrada, mira los bordes con buena luz buscando si se ve luz del día pasando entre el marco y la hoja.

# Qué debería observarse

- La ventana abre, cierra y traba sin dificultad, sin necesidad de forzarla.
- La manilla se mueve suave, sin resistencia excesiva.
- Con la ventana cerrada, no debería verse luz del día pasando entre el marco y la hoja.
- Referencia dimensional: paralelismo entre hoja y marco dentro de aproximadamente ±2 mm.

# Qué señales pueden indicar un problema

- La ventana se traba o cuesta abrir/cerrar.
- La manilla está dura o con resistencia excesiva.
- Se ve luz del día con la ventana cerrada.
- El paralelismo entre hoja y marco se ve claramente disparejo.

Ninguna de estas señales indica por sí sola la causa exacta — conviene registrarla con foto y, si hay dudas, revisarla con más detalle.

# Por qué importa

Una ventana que no cierra bien o deja pasar luz puede representar filtraciones de agua o aire más adelante — detectarlo ahora, durante la inspección, suele ser más simple que después de estar viviendo en el lugar.

# Recomendación

Prueba abrir y cerrar la ventana completa varias veces, y revisa la manilla por separado. Con la ventana cerrada, mira los bordes buscando luz o corrientes de aire. Si detectas cualquiera de estos problemas, regístralo como observación — no es necesariamente grave, pero conviene resolverlo antes de dar por terminada esa partida.

# Fuente

- **Manual técnico de referencia**: Manual de Tolerancias CDT (Ficha 13, Ventanas) — paralelismo ±2 mm, sin luz visible con ventana cerrada.
- **Criterio interno adaptado**: catálogo educativo ITO (265 puntos), elemento Ventanas — criterios de apertura/cierre/manilla.
- **Biblioteca técnica**: contenido ITO sobre silicona perimetral — prueba visual de luz con ventana cerrada.

Sin referencia normativa verificada en esta fuente.`,
    },
    {
      slug: "puerta-como-revisar-cierre",
      title: "Cómo revisar el cierre de una puerta",
      content: `# Qué revisar

Si la puerta cierra correctamente: sin rozar el marco ni el piso, con la cerradura/pestillo funcionando sin forzar, y con bisagras firmes.

# Cómo revisarlo

Cierra la puerta varias veces desde distintas posiciones (medio abierta, casi cerrada), prestando atención a si roza en algún punto del contorno. Revisa el pestillo por separado, viendo si entra al cerradero sin forzar. Observa también las bisagras: si hacen ruido o se ven con holgura.

# Qué debería observarse

- La puerta cierra con un solo movimiento suave, sin rozar el marco ni el piso.
- El pestillo entra en el cerradero sin necesidad de forzar.
- La separación (holgura) entre la hoja y el marco es pareja en todo el contorno.
- Las bisagras están firmes, sin ruido ni holgura excesiva.
- Referencia dimensional: paralelismo entre hoja y marco dentro de aproximadamente 3 mm.

# Qué señales pueden indicar un problema

- La puerta roza el marco o el piso en algún punto.
- El pestillo hay que forzarlo para que entre al cerradero.
- Las bisagras hacen ruido o se sienten con holgura.
- La holgura entre la hoja y el marco es despareja en el contorno.

Puede convenir revisarlo con más detalle, especialmente si varias de estas señales aparecen juntas — esto no determina por sí solo la causa.

# Por qué importa

Una puerta que no cierra bien es, además de una molestia diaria, una señal que conviene documentar temprano — suele ser más fácil de resolver mientras la vivienda todavía está en garantía o en proceso de entrega.

# Recomendación

Cierra la puerta varias veces desde distintas posiciones (medio abierta, casi cerrada) y observa si roza en algún punto del contorno. Revisa el pestillo por separado. Si notas roce, ruido en las bisagras, o que hay que forzar el pestillo, regístralo como observación.

# Fuente

- **Manual técnico de referencia**: Manual de Tolerancias CDT (Ficha 12, Puertas) — paralelismo hoja/marco ~3 mm, planeidad de hoja ±3 mm.
- **Biblioteca técnica**: contenido ITO sobre alineación y cierre de puertas — criterio de cierre en un solo movimiento.
- **Criterio interno adaptado**: catálogo educativo ITO (265 puntos), elemento Puertas — cierre sin roce, cerradura/pestillo, holguras, bisagras.

Sin referencia normativa verificada en esta fuente.`,
    },
  ];

  for (const a of extendedArticles) {
    await prisma.technicalArticle.update({
      where: { slug: a.slug },
      data: { title: a.title, content: a.content },
    });
    console.log(`OK (extendido): ${a.slug}`);
  }

  // --- 2) Crear artículos nuevos de Artefactos sanitarios / Enchufes ---
  // Ids de InspectionChecklistItem confirmados por consulta directa
  // antes de escribir este script (ver informe de Fase 11E, sección
  // "Auditoría previa") — ninguno se inventa.
  const newArticles = [
    {
      slug: "artefactos-sanitarios-como-revisar-descarga-inodoro",
      title: "Cómo revisar la descarga del inodoro",
      checklistItemId: "cmstimfnd003c14sezw1huu81", // "¿Después de descargar el inodoro, el agua deja de correr con normalidad?"
      content: `# Qué revisar

Si después de accionar la descarga del inodoro, el agua deja de correr con normalidad.

# Cómo revisarlo

Acciona la descarga del inodoro y observa el estanque y la taza durante unos segundos después de que termine el ciclo. Confirma que el agua deja de correr y no queda un hilo de agua constante ni un ruido de agua corriendo de fondo.

# Qué debería observarse

Después de la descarga, el agua se detiene por completo en un tiempo razonable, sin quedar corriendo de forma continua ni goteando dentro del estanque.

# Qué señales pueden indicar un problema

- El agua sigue corriendo varios segundos después de terminado el ciclo normal.
- Se escucha un ruido de agua corriendo de forma intermitente sin que nadie haya accionado la descarga.

Conviene registrar la observación aunque no sea necesariamente grave.

# Por qué importa

Un mecanismo de descarga que no se detiene bien puede representar un gasto de agua sostenido en el tiempo — vale la pena dejarlo registrado antes de dar por recibido el baño.

# Recomendación

Si notas que el agua no se detiene con normalidad, regístralo como observación con foto o video corto, indicando cuánto tiempo sigue corriendo. No es necesario abrir el estanque ni manipular el mecanismo interno — con la observación visual/auditiva alcanza para dejar constancia.

# Fuente

- **Criterio interno adaptado**: catálogo educativo ITO (265 puntos), sección Artefactos sanitarios — verificación de firmeza y funcionamiento básico de artefactos.

Sin referencia normativa verificada en esta fuente.`,
    },
    {
      slug: "artefactos-sanitarios-como-revisar-fugas-base",
      title: "Cómo revisar fugas en la base de los artefactos sanitarios",
      checklistItemId: "cmstimfsd003d14semjsfqlze", // "¿No hay fugas visibles en la base de los artefactos?"
      content: `# Qué revisar

Si hay fugas visibles de agua en la base de los artefactos sanitarios (inodoro, lavamanos, tina/receptáculo de ducha si corresponde).

# Cómo revisarlo

Observa la base de cada artefacto sanitario con buena luz, buscando manchas de humedad, agua acumulada o goteo activo. Puedes pasar la mano (seca) cerca de la base, sin tocar directamente conexiones de agua, para sentir si hay humedad.

# Qué debería observarse

La base de cada artefacto seca, sin manchas de humedad ni agua acumulada alrededor, y sin goteo visible mientras se usa normalmente.

# Qué señales pueden indicar un problema

- Manchas de humedad o agua acumulada en el piso junto a la base del artefacto.
- Goteo visible mientras se usa el artefacto.
- El artefacto se ve o se siente inestable al apoyarse levemente sobre él.

Cualquiera de estas señales conviene documentarla, aunque el origen exacto no se pueda determinar solo con la observación visual.

# Por qué importa

Una fuga en la base, aunque parezca menor, puede afectar el piso o generar humedad sostenida si no se corrige a tiempo — por eso conviene dejarla registrada apenas se detecta.

# Recomendación

Si ves humedad o goteo, regístralo como observación con foto, indicando el artefacto exacto (inodoro, lavamanos, tina/ducha). No es necesario desmontar el artefacto ni abrir sus conexiones de agua — la observación visual es suficiente para dejar constancia.

# Fuente

- **Criterio interno adaptado**: catálogo educativo ITO (265 puntos), sección Artefactos sanitarios — verificación de fugas visibles en la base de artefactos.

Sin referencia normativa verificada en esta fuente.`,
    },
    {
      slug: "artefactos-sanitarios-como-revisar-goteras-llaves",
      title: "Cómo revisar goteras y filtraciones en llaves",
      checklistItemId: "cmstimfxk003e14segun5l8ux", // "¿No hay goteras ni filtraciones en las llaves?"
      content: `# Qué revisar

Si hay goteras o filtraciones visibles en las llaves (grifería) de lavamanos, cocina, ducha/tina.

# Cómo revisarlo

Abre y cierra cada llave por separado, observando si queda goteando después de cerrarla completamente. Revisa también la base de la llave (donde se conecta a la superficie) buscando humedad o filtración mientras está en uso.

# Qué debería observarse

La llave cierra por completo sin goteo posterior, y no hay humedad ni filtración visible en la base mientras está en uso.

# Qué señales pueden indicar un problema

- La llave sigue goteando después de cerrada por completo.
- Hay humedad o filtración visible en la base de la llave mientras corre el agua.

Conviene registrar la observación con foto, indicando en qué llave específica se detectó.

# Por qué importa

Una llave que gotea, aunque sea poco, representa un gasto de agua sostenido en el tiempo y suele ser más fácil de resolver mientras la vivienda todavía está en garantía o en proceso de entrega.

# Recomendación

Si detectas goteo o filtración, regístralo como observación con foto. No es necesario desarmar la llave ni intervenir sus conexiones internas — con probar abrir/cerrar y observar alcanza para dejar constancia.

# Fuente

- **Criterio interno adaptado**: catálogo educativo ITO (265 puntos), sección Grifería — verificación de ausencia de goteras y filtraciones visibles.

Sin referencia normativa verificada en esta fuente.`,
    },
    {
      slug: "enchufes-interruptores-como-revisar-funcionamiento",
      title: "Cómo revisar enchufes e interruptores",
      checklistItemId: "cmstimg2g003f14seohik08ib", // "¿Cada enchufe probado funciona con un artefacto real?"
      content: `# Qué revisar

Si cada enchufe del recinto funciona correctamente al probarlo con un artefacto real (por ejemplo, un cargador de celular o una lámpara portátil), y si los interruptores encienden y apagan correctamente su luz.

# Cómo revisarlo

Prueba cada enchufe conectando un artefacto simple que sepas que funciona (cargador, lámpara, secador de pelo). Enciende también los interruptores del recinto y confirma que la luz correspondiente enciende y apaga sin problema. Esta revisión es solo funcional y visual — no requiere abrir ni tocar ningún componente eléctrico.

# Qué debería observarse

Cada enchufe entrega corriente al artefacto de prueba, y cada interruptor enciende y apaga la luz que le corresponde, sin chispas, ruido ni olor extraño.

# Qué señales pueden indicar un problema

- El enchufe no entrega corriente al artefacto de prueba.
- El interruptor no enciende o no apaga la luz correspondiente.
- Se nota calor, chispa, olor a quemado o ruido inusual al usar un enchufe o interruptor.

Cualquiera de estas señales conviene registrarla como observación, indicando la ubicación exacta.

# Por qué importa

Confirmar que cada enchufe e interruptor funciona antes de recibir la vivienda evita sorpresas al usarlos en el día a día, y deja constancia temprana de cualquier punto que necesite revisión.

# Recomendación

Si un enchufe o interruptor no funciona como se espera, regístralo como observación indicando su ubicación exacta (por ejemplo, "enchufe junto a la ventana del dormitorio 1"). Si observas daño, calor, olor extraño, chispa o partes expuestas, no manipules el elemento y solicita revisión de un profesional competente.

# Fuente

- **Manual técnico de referencia**: Manual de Tolerancias CDT (ficha 26) — verificación funcional de enchufes.
- **Criterio interno adaptado**: catálogo educativo ITO (265 puntos), sección Artefactos eléctricos/Iluminación — prueba de enchufes con artefacto real.

Sin referencia normativa verificada en esta fuente (no se citó normativa eléctrica SEC ni NCh).`,
    },
  ];

  for (const a of newArticles) {
    await prisma.technicalArticle.upsert({
      where: { slug: a.slug },
      update: { title: a.title, content: a.content },
      create: { slug: a.slug, title: a.title, content: a.content },
    });
    await prisma.inspectionChecklistItem.update({
      where: { id: a.checklistItemId },
      data: { technicalArticleSlug: a.slug },
    });
    console.log(`OK (nuevo): ${a.slug} <- vinculado a checklistItemId ${a.checklistItemId}`);
  }

  console.log(
    `Fase 11E, Lote 1: ${extendedArticles.length} artículos extendidos, ${newArticles.length} artículos nuevos creados/vinculados.`
  );
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
