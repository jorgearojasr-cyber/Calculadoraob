import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

// Fase 11H (15-ago-2026) — Lote 2 de biblioteca técnica guiada
// (docs/FASE11G_VALIDACION_FUENTES_PREGUNTAS_PENDIENTES.md, secciones
// 3/4/9). Solo Bodega y Estacionamiento — ambas clasificadas 🟢 en
// Fase 11G por ser controles funcionales/visuales evidentes que no
// requieren fuente técnica externa. Fachada, Reja y Portón quedan
// explícitamente fuera (🟡/🔴, ver informe de Fase 11G) — este script
// NO los toca.
//
// Crea/upsert 2 TechnicalArticle nuevos y los vincula a sus
// InspectionChecklistItem YA EXISTENTES (ids confirmados por consulta
// directa antes de escribir este script). Ninguna pregunta nueva,
// ningún otro artículo tocado, ningún cambio de schema.
async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const articles = [
    {
      slug: "bodega-como-revisar-cierre",
      title: "Cómo revisar el cierre de la bodega",
      checklistItemId: "cmstimg77003g14se4nd3ltll", // "¿La puerta cierra y el candado/cerradura funciona?"
      content: `# Qué revisar

Si la puerta de la bodega cierra correctamente y si el candado o la cerradura funciona con normalidad.

# Cómo revisarlo

Abre y cierra la puerta normalmente. Comprueba si roza, si cuesta cerrarla, o si el mecanismo funciona con normalidad. Si tiene candado, prueba colocarlo, cerrarlo y abrirlo sin forzar. Si tiene cerradura, pruébala normalmente con su llave. No es necesario desmontar, ajustar, lubricar ni forzar nada — solo probar el uso normal.

# Qué debería observarse

La puerta abre y cierra normalmente. El candado o la cerradura puede utilizarse sin necesidad de forzar.

# Qué señales pueden indicar un problema

- La puerta roza.
- Cuesta abrirla o cerrarla.
- No logra cerrar correctamente.
- El candado o la cerradura no abre o no cierra con normalidad.
- El mecanismo requiere fuerza excesiva.

Estas observaciones no determinan automáticamente la causa.

# Por qué importa

Que la bodega cierre con normalidad es lo que le permite cumplir su función práctica de resguardo.

# Recomendación

Registra con fotografía y comentario qué parte presenta el problema. No fuerces ni desmontes el mecanismo. Si el problema impide utilizar normalmente el cierre, considera solicitar revisión.

# Fuente

- **Criterio interno**: comprobación funcional básica de puerta y mecanismo de cierre — no requiere conocimiento técnico especializado.

No existe fuente ITO ni Manual de Tolerancias CDT específica para bodega (confirmado en Fase 6A y reconfirmado en Fase 11G) — no se aplica ningún criterio normativo.`,
    },
    {
      slug: "estacionamiento-como-revisar-demarcacion-pavimento",
      title: "Cómo revisar la demarcación y el pavimento del estacionamiento",
      checklistItemId: "cmstimgcb003h14seysp5b9t5", // "¿La demarcación del espacio es clara y el pavimento está en buen estado?"
      content: `# Qué revisar

Si la demarcación del estacionamiento se distingue con claridad y si el pavimento presenta daños visibles.

# Cómo revisarlo

Observa el estacionamiento con buena luz. Revisa visualmente las líneas o marcas de demarcación, y busca grietas visibles, hoyos, sectores deteriorados o zonas hundidas/desniveladas claramente perceptibles. No es necesario medir dimensiones reglamentarias, evaluar radios de giro ni afirmar accesibilidad normativa — solo una observación visual del estado aparente.

# Qué debería observarse

La demarcación puede identificarse visualmente, y el pavimento permite observar el espacio sin daños evidentes como hoyos o sectores deteriorados.

# Qué señales pueden indicar un problema

- Demarcación muy desgastada o no visible.
- Grietas visibles.
- Hoyos.
- Sectores deteriorados.
- Hundimientos o desniveles perceptibles.

Estas observaciones no establecen una causa.

# Por qué importa

Estas condiciones pueden dificultar el uso cotidiano del espacio o ser importantes de registrar al momento de recibir o revisar la propiedad.

# Recomendación

Registra mediante fotografía la zona específica y describe qué se observa. Si presenta alguna de estas condiciones, déjala registrada para solicitar revisión.

# Fuente

- **Criterio interno**: comprobación visual básica de demarcación y estado aparente del pavimento — no requiere conocimiento técnico especializado.

No existe fuente ITO ni Manual de Tolerancias CDT específica para esta pregunta (confirmado en Fase 6A y reconfirmado en Fase 11G) — no se aplica ningún criterio normativo.`,
    },
  ];

  for (const a of articles) {
    await prisma.technicalArticle.upsert({
      where: { slug: a.slug },
      update: { title: a.title, content: a.content },
      create: { slug: a.slug, title: a.title, content: a.content },
    });
    await prisma.inspectionChecklistItem.update({
      where: { id: a.checklistItemId },
      data: { technicalArticleSlug: a.slug },
    });
    console.log(`OK: ${a.slug} <- vinculado a checklistItemId ${a.checklistItemId}`);
  }

  console.log(`Fase 11H, Lote 2: ${articles.length} artículos creados/actualizados y vinculados (Bodega, Estacionamiento).`);
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
