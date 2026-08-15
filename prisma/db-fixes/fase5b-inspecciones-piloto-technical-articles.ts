import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

// Fase 5B (14-ago-2026) — piloto de contenido técnico para Inspecciones.
//
// Crea 5 TechnicalArticle (uno por cada InspectionChecklistItem REAL que
// ya existe en el catálogo de Calculadora — ver prisma/seed-inspecciones.ts,
// Fase 1) y los vincula vía InspectionChecklistItem.technicalArticleSlug
// (referencia débil por slug, no FK — diseño aprobado en Fase 1).
//
// NO se crearon ChecklistItemTemplate/InspectionChecklistItem nuevos para
// este piloto (regla absoluta de Fase 5B) — por eso son exactamente 5
// artículos, no 10-15: "Artefactos sanitarios" no tiene ninguna pregunta
// en el catálogo real hoy, así que queda fuera del piloto (documentado en
// el informe de Fase 5B, decisión confirmada con el usuario).
//
// Fuente del contenido: proyecto ITO ("Inspector ObraBien",
// C:\Users\jorge\OneDrive\Escritorio\INSPECTOR OBRABIEN) — catálogo
// educativo de 265 puntos (src/lib/library/inspection-points-data.ts),
// LibraryArticle de seed.ts, y Manual de Tolerancias CDT
// (tolerances-manual.ts). Todo el contenido de abajo fue LEÍDO de esas
// fuentes y luego resumido/adaptado a mano para este proyecto — nunca
// copiado literal en bloques largos, y nunca se inventó normativa
// (OGUC/LGUC/NCh) que no existe en la fuente consultada.
//
// Idempotente vía upsert por slug, mismo patrón que seedInspeccionesModule.
async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const articles = [
    {
      slug: "piso-como-revisar-danos-visibles",
      title: "Cómo revisar daños visibles en el piso",
      checklistItemId: "cmst4ypw3002x1csem5w9kf9j", // Piso / "¿Presenta daños visibles?"
      content: `# Qué se revisa

Si la superficie del piso presenta daños físicos visibles: piezas trisadas, picadas, astilladas o quebradas (cerámica/porcelanato), o —en radier/hormigón a la vista— fisuras y desprendimiento superficial.

# Qué debería observarse

- Piezas sin trizaduras, picaduras ni bordes astillados, bien adheridas — un sonido hueco al golpear suavemente indica que la pieza no quedó bien pegada.
- En piso de hormigón/radier a la vista: sin fisuras mayores a 0,3 mm y sin fisuras que crucen de un extremo a otro.
- Sin desprendimiento superficial (polvo suelto o descascarado al pasar la mano — indica mal curado).

# Cuando existe una observación

Una pieza suelta, trisada o con sonido hueco es un defecto que empeora con el tiempo si no se corrige. Una fisura de más de 0,3 mm en hormigón, o que cruce toda la superficie, es más relevante que una fisura fina superficial.

# Recomendación

Si detectas piezas sueltas, trisadas o fisuras mayores a 0,3 mm, regístralo como observación con foto — no es necesariamente urgente, pero conviene documentarlo antes de que empeore. Ante dudas sobre si una fisura es solo superficial, es preferible marcarla como observación para evaluarla con más detalle.

# Fuente

- Manual de Tolerancias CDT (Ficha 10, Revestimientos Cerámicos): tolerancia "No se aceptan" piezas quebradas/despuntadas/con grietas.
- Biblioteca técnica ITO (contenido sobre terminaciones cerámicas y porcelanato — resumido y adaptado, no copiado literal).
- Catálogo educativo ITO (265 puntos), elemento Pisos de hormigón: umbral de 0,3 mm.

Sin referencia normativa verificada en esta fuente (no se citó OGUC/LGUC/NCh para este punto).`,
    },
    {
      slug: "piso-como-revisar-desniveles",
      title: "Cómo revisar desniveles en el piso",
      checklistItemId: "cmst4yq10002y1cselinz2e2f", // Piso / "¿Presenta desniveles?"
      content: `# Qué se revisa

Si existen diferencias de altura entre piezas del piso, tablas, o zonas hundidas/levantadas respecto al resto de la superficie.

# Qué debería observarse

- Entre piezas de piso (cerámica/porcelanato): desnivel de referencia de hasta 1 mm entre piezas contiguas.
- Piso de madera: tablas niveladas entre sí, sin "escalón" perceptible al pasar la mano o el pie.
- Radier/hormigón a la vista o pavimento exterior: superficie pareja, sin zonas hundidas ni levantadas.

# Cuando existe una observación

Un desnivel perceptible al tacto (por sobre 1-2 mm entre piezas) puede ser motivo de tropiezo y suele indicar un problema de instalación (base mal preparada, pegado irregular). Zonas hundidas en hormigón pueden acumular agua.

# Recomendación

Verifica pasando la mano o una regla apoyada sobre varias piezas/tablas — si sientes un "escalón" o la regla no queda pareja, regístralo como observación. Si el desnivel es amplio (varios metros cuadrados hundidos), puede requerir revisión de la base antes de continuar con la terminación.

# Fuente

- Manual de Tolerancias CDT (Ficha 10): desnivel entre palmetas — referencia de 1 mm (pisos) / 2 mm (otras superficies).
- Catálogo educativo ITO (265 puntos): pavimentos exteriores, pisos de hormigón, pisos de madera — criterios de nivelación (adaptado y resumido).

Sin referencia normativa verificada en esta fuente.`,
    },
    {
      slug: "muros-como-revisar-fisuras",
      title: "Cómo revisar fisuras en muros",
      checklistItemId: "cmst4yq5r002z1csex0q84c8o", // Muros / "¿Presenta fisuras visibles?"
      defaultSeverity: "MEDIUM" as const,
      content: `# Qué se revisa

Si el muro presenta fisuras (grietas) visibles, y de qué tipo: superficiales/cosméticas o con indicios de ser más profundas.

# Qué debería observarse

Distinguir entre:
- **Fisura de retracción**: fina, superficial, típica de las primeras semanas de secado del estuco — generalmente sin riesgo.
- **Fisura capilar**: superficial, delgada, sin espesor perceptible — bajo riesgo.
- **Fisura con indicios estructurales**: tiene espesor perceptible al tacto, cruza una esquina o un vano (puerta/ventana), o supera aproximadamente 0,3 mm de ancho.

# Cuando existe una observación

Una fisura fina cerca de una esquina o del encuentro muro-cielo puede ser solo estética, pero si hay dudas conviene documentarla igual. Una fisura de más de 0,3 mm de ancho, o que atraviese una esquina o vano, se considera de mayor riesgo y amerita una observación más detallada — por eso este ítem sugiere severidad media por defecto, ajustable según lo que realmente se observe.

# Recomendación

Mide o estima el ancho de la fisura (una tarjeta o moneda como referencia visual sirve para la foto). Si es delgada y no cruza esquinas/vanos, regístrala igual como observación menor. Si tiene espesor visible o cruza una esquina, márcala como observación de mayor severidad y sugiere evaluación por un profesional — ObraBien no realiza diagnóstico estructural.

# Fuente

- Catálogo educativo ITO (265 puntos), elemento Muros: distinción fisura capilar/estructural, umbral de 0,3 mm y criterio "cruza esquina = riesgo mayor" (adaptado, no copiado literal).
- Biblioteca técnica ITO (contenido sobre pintura de muros): grietas finas cerca de esquinas, criterio de "documentar igual ante duda" (adaptado).
- Manual de Tolerancias CDT: tolerancia de unidades con fisuras en albañilería (2% máx. por paño) — referencia técnica complementaria.

Sin referencia normativa verificada en esta fuente (no se citó OGUC/LGUC/NCh).`,
    },
    {
      slug: "ventana-como-revisar-funcionamiento",
      title: "Cómo revisar el funcionamiento de una ventana",
      checklistItemId: "cmst4yqam00301cse9xafa7lp", // Ventana / "¿Opera correctamente?"
      content: `# Qué se revisa

Si la ventana abre, cierra y traba correctamente, y si sus manillas/mecanismos funcionan sin forzar.

# Qué debería observarse

- La ventana abre, cierra y traba sin dificultad, sin necesidad de forzarla.
- La manilla se mueve suave, sin resistencia excesiva.
- Con la ventana cerrada, no debería verse luz del día pasando entre el marco y la hoja (indicaría que el cierre no queda hermético).
- Referencia dimensional: paralelismo entre hoja y marco dentro de aproximadamente ±2 mm.

# Cuando existe una observación

Si la ventana se traba, cuesta abrir/cerrar, o la manilla está dura, puede indicar un problema de alineación del marco o de la instalación. Si se ve luz con la ventana cerrada, hay riesgo de filtración de agua o aire.

# Recomendación

Prueba abrir y cerrar la ventana completa varias veces, y revisa la manilla por separado. Con la ventana cerrada, mira los bordes buscando luz o corrientes de aire. Si detectas cualquiera de estos problemas, regístralo como observación — no es necesariamente grave, pero conviene resolverlo antes de dar por terminada esa partida.

# Fuente

- Catálogo educativo ITO (265 puntos), elemento Ventanas: criterios de apertura/cierre/manilla (adaptado).
- Biblioteca técnica ITO (contenido sobre silicona perimetral): prueba visual de luz con ventana cerrada (adaptado).
- Manual de Tolerancias CDT (Ficha 13, Ventanas): paralelismo ±2 mm, sin luz visible con ventana cerrada.

Sin referencia normativa verificada en esta fuente.`,
    },
    {
      slug: "puerta-como-revisar-cierre",
      title: "Cómo revisar el cierre de una puerta",
      checklistItemId: "cmst4yqfe00311cserbj1a64u", // Puerta / "¿Cierra correctamente?"
      content: `# Qué se revisa

Si la puerta cierra correctamente: sin rozar el marco ni el piso, con la cerradura/pestillo funcionando sin forzar, y con bisagras firmes.

# Qué debería observarse

- La puerta cierra con un solo movimiento suave, sin rozar el marco ni el piso.
- El pestillo entra en el cerradero sin necesidad de forzar.
- La separación (holgura) entre la hoja y el marco es pareja en todo el contorno.
- Las bisagras están firmes, sin ruido ni holgura excesiva.
- Referencia dimensional: paralelismo entre hoja y marco dentro de aproximadamente 3 mm.

# Cuando existe una observación

Una puerta que roza el marco o el piso, o un pestillo que hay que forzar, suele indicar una bisagra floja o un problema de alineación del marco — es un defecto típico y fácil de detectar a simple vista/tacto.

# Recomendación

Cierra la puerta varias veces desde distintas posiciones (medio abierta, casi cerrada) y observa si roza en algún punto del contorno. Revisa el pestillo por separado. Si notas roce, ruido en las bisagras, o que hay que forzar el pestillo, regístralo como observación — suele ser un ajuste menor (regular la bisagra) más que un problema estructural.

# Fuente

- Biblioteca técnica ITO (contenido sobre alineación y cierre de puertas): criterio de cierre en un solo movimiento (adaptado, resumido).
- Catálogo educativo ITO (265 puntos), elemento Puertas: cierre sin roce, cerradura/pestillo, holguras, bisagras (adaptado).
- Manual de Tolerancias CDT (Ficha 12, Puertas): paralelismo hoja/marco ~3 mm, planeidad de hoja ±3 mm.

Sin referencia normativa verificada en esta fuente.`,
    },
  ];

  for (let i = 0; i < articles.length; i++) {
    const a = articles[i];
    await prisma.technicalArticle.upsert({
      where: { slug: a.slug },
      update: { title: a.title, content: a.content, order: i },
      create: { slug: a.slug, title: a.title, content: a.content, order: i },
    });

    await prisma.inspectionChecklistItem.update({
      where: { id: a.checklistItemId },
      data: {
        technicalArticleSlug: a.slug,
        ...("defaultSeverity" in a ? { defaultSeverity: a.defaultSeverity } : {}),
      },
    });

    console.log(`OK: ${a.slug} <- vinculado a checklistItemId ${a.checklistItemId}`);
  }

  console.log(`Fase 5B: ${articles.length} TechnicalArticle creados/actualizados y vinculados.`);
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
