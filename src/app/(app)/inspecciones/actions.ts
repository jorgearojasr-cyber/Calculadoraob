"use server";

import { del } from "@vercel/blob";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { InspectionMotivo, InspectionPropertyType, InspectionTipoAmpliacion } from "@/generated/prisma/client";

const VALID_PROPERTY_TYPES: InspectionPropertyType[] = ["CASA", "DEPARTAMENTO", "AMPLIACION"];
const VALID_MOTIVOS: InspectionMotivo[] = ["RECEPCION_PRE_FIRMA", "POST_RECEPCION", "REVISION_AMPLIACION"];
const VALID_TIPOS_AMPLIACION: InspectionTipoAmpliacion[] = [
  "COCINA",
  "DORMITORIO",
  "DORMITORIO_BANO",
  "LIVING_COMEDOR",
  "SEGUNDO_PISO",
  "TERRAZA_CERRADA",
  "OTRO",
];
// Tope defensivo para templates repeatable (dormitorios, baños, etc.) —
// evita crear miles de filas por un valor absurdo enviado desde el
// cliente; no es una regla de producto, solo un límite de sanidad.
const MAX_REPEATABLE_COUNT = 20;

// Fase 11Y (docs/FASE11Y_INFORME_PILOTO_CONFIGURACION_NIVEL2.md, sección
// 9) — Reja y Portón dejan de generarse automáticamente al crear el
// caso: ahora se crean solo cuando el usuario confirma "Sí" en la
// configuración Nivel 2 del recinto (saveSpaceLevel2ConfigAction, en
// [id]/actions.ts). El vínculo de catálogo InspectionElementTemplateSpace
// (Reja->Antejardín, Portón->Acceso vehicular, Ventana->Cocina) NO se
// toca todavía — la BD es compartida y producción sigue generándolos
// automáticamente hasta que este código se publique (mismo criterio que
// terraza-logia en Fase 11X-P). Este filtro es lo único que
// efectivamente desacopla la generación para el código local: aunque el
// vínculo de catálogo siga existiendo, esta acción simplemente ignora
// esos pares al generar.
//
// Fase 11AA (docs/FASE11AA_INFORME_COCINA_LOTE_A.md, sección A —
// corrección respecto al diseño original de este set) — el gate ya NO
// puede ser solo por `elementTemplate.key`: Ventana se comparte con
// Dormitorio/Living/Comedor/Living-comedor/Terraza cerrada/Recinto
// ampliado, y gatearla globalmente habría detenido su generación
// automática en TODOS esos recintos, no solo en Cocina (a diferencia de
// Reja/Portón, que solo estaban vinculados a un único recinto cada uno,
// así que un Set por key alcanzaba). El gate ahora es por el PAR
// `spaceTemplate.key:elementTemplate.key`.
// Fase 11AT (docs/FASE11AT_IMPLEMENTACION_LOCAL_BANO_LOTE_A.md) — mismo
// criterio exacto que `cocina:ventana`: el vínculo de catálogo
// `InspectionElementTemplateSpace` (bano<->artefactos-sanitarios) NO se
// toca — permanece intacto para que los Baños históricos que ya lo
// generaron sigan intactos. Este filtro es lo único que efectivamente
// desacopla la generación automática para el código local: un Baño
// nuevo, creado después de este cambio, nunca recibe
// `artefactos-sanitarios` (queda reemplazado por los componentes Nivel 2
// específicos de los lotes B-F); un Baño ya existente conserva el suyo
// sin ningún cambio, porque el gate solo actúa en el momento de
// generación de un caso nuevo, nunca en la lectura de uno ya creado.
const LEVEL2_GATED_LINKS = new Set([
  "antejardin:reja",
  "acceso-vehicular:porton",
  "cocina:ventana",
  "bano:artefactos-sanitarios",
  // Fase 17A (docs/FASE17A_CIERRE_FUNCIONAL_GLOBAL_INSPECCIONES.md) —
  // `terraza` es un espacio exterior abierto; Muros y Ventana pasan de
  // base forzada a Level 2 opcional (sin históricos reales que proteger).
  "terraza:muros",
  "terraza:ventana",
]);

export type CreateInspectionInput = {
  name: string;
  tipoInmueble: string;
  direccion: string | null;
  fecha: string | null;
  // Fase 11B — ambos opcionales: casos creados antes de esta fase (y
  // cualquier llamador que no los envíe) siguen funcionando igual, sin
  // motivo ni tipoAmpliacion (ver docs/FASE11A..., sección 8C).
  motivo?: string | null;
  tipoAmpliacion?: string | null;
  // Una entrada por InspectionSpaceTemplate que el usuario marcó/contó en
  // el paso de características — count=0 significa "no incluir".
  spaceSelections: { templateKey: string; count: number }[];
};

export type CreateInspectionResult = { caseId: string; error?: undefined } | { error: string; caseId?: undefined };

// Mismo patrón de sesión + ownership que createRegularizationCaseAction
// (src/app/(app)/regularizacion/actions.ts) y createSavedProjectAction
// (src/app/(app)/proyectos/actions.ts): sin sesión activa, no se crea
// nada; `userId` SIEMPRE sale de la sesión del servidor, nunca del input
// del cliente (ver Fase 2, punto 7/12 — ownership no confiable desde el
// cliente).
//
// No usa `redirect()` acá dentro (a diferencia de lo que sugiere el
// enunciado de la fase) — sigue el mismo patrón ya establecido en
// RegularizationWizard: la Action devuelve el id creado y el componente
// cliente navega con router.push. `redirect()` lanzado dentro de un
// try/catch (necesario acá para envolver la transacción) se comporta mal
// con el mecanismo interno de Next (NEXT_REDIRECT viaja como un throw),
// así que se evita ese riesgo replicando el patrón que ya funciona en
// Regularización.
export async function createInspectionAndGenerateAction(
  input: CreateInspectionInput
): Promise<CreateInspectionResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "No hay sesión activa." };

  const name = input.name.trim();
  if (!name) return { error: "Ingresa un nombre o referencia para la inspección." };

  if (!VALID_PROPERTY_TYPES.includes(input.tipoInmueble as InspectionPropertyType)) {
    return { error: "Tipo de inmueble inválido." };
  }
  const tipoInmueble = input.tipoInmueble as InspectionPropertyType;

  let fecha: Date | null = null;
  if (input.fecha) {
    const parsed = new Date(input.fecha);
    if (Number.isNaN(parsed.getTime())) return { error: "Fecha inválida." };
    fecha = parsed;
  }

  const direccion = input.direccion?.trim() || null;

  let motivo: InspectionMotivo | null = null;
  if (input.motivo) {
    if (!VALID_MOTIVOS.includes(input.motivo as InspectionMotivo)) return { error: "Motivo inválido." };
    motivo = input.motivo as InspectionMotivo;
  }

  let tipoAmpliacion: InspectionTipoAmpliacion | null = null;
  if (input.tipoAmpliacion) {
    if (!VALID_TIPOS_AMPLIACION.includes(input.tipoAmpliacion as InspectionTipoAmpliacion)) {
      return { error: "Tipo de ampliación inválido." };
    }
    tipoAmpliacion = input.tipoAmpliacion as InspectionTipoAmpliacion;
  }
  // tipoAmpliacion solo tiene sentido junto a tipoInmueble=AMPLIACION —
  // se descarta silenciosamente en cualquier otro caso en vez de fallar,
  // porque no afecta la generación de espacios (solo es metadata).
  if (tipoInmueble !== "AMPLIACION") tipoAmpliacion = null;

  // Nunca confiar en `templateKey`/`count` enviados desde el cliente sin
  // volver a resolverlos contra el catálogo real — filtra automáticamente
  // cualquier key inventada o que no aplique a este tipoInmueble (ver
  // Fase 2, punto 8).
  const requestedKeys = input.spaceSelections.filter((s) => s.count > 0).map((s) => s.templateKey);
  if (requestedKeys.length === 0) {
    return { error: "Selecciona al menos un espacio para continuar." };
  }

  const templates = await prisma.inspectionSpaceTemplate.findMany({
    where: { active: true, key: { in: requestedKeys }, appliesTo: { has: tipoInmueble } },
  });
  const templateByKey = new Map(templates.map((t) => [t.key, t]));

  const validatedSelections = input.spaceSelections
    .map((s) => {
      const template = templateByKey.get(s.templateKey);
      if (!template) return null;
      const clampedCount = template.repeatable
        ? Math.max(0, Math.min(MAX_REPEATABLE_COUNT, Math.floor(s.count)))
        : s.count > 0
          ? 1
          : 0;
      return clampedCount > 0 ? { template, count: clampedCount } : null;
    })
    .filter((s): s is { template: (typeof templates)[number]; count: number } => s !== null);

  if (validatedSelections.length === 0) {
    return { error: "Selecciona al menos un espacio válido para este tipo de inmueble." };
  }

  const bedroomCount = validatedSelections.find((s) => s.template.key === "dormitorio")?.count ?? null;
  const bathroomCount = validatedSelections.find((s) => s.template.key === "bano")?.count ?? null;

  try {
    const caseId = await prisma.$transaction(
      async (tx) => {
        const createdCase = await tx.inspectionCase.create({
          data: {
            userId: session.user.id,
            name,
            direccion,
            tipoInmueble,
            fecha,
            bedroomCount,
            bathroomCount,
            motivo,
            tipoAmpliacion,
          },
        });

        for (const { template, count } of validatedSelections) {
          for (let i = 1; i <= count; i++) {
            const spaceName = template.repeatable ? `${template.label} ${i}` : template.label;
            const space = await tx.inspectionSpace.create({
              data: { caseId: createdCase.id, spaceTemplateId: template.id, name: spaceName },
            });

            // Elementos: SIEMPRE vía la tabla puente InspectionElementTemplateSpace
            // (nunca una FK directa antigua) — un mismo "Piso" puede
            // aplicar a varios espacios distintos (ver Fase 2, punto 9).
            const elementLinks = await tx.inspectionElementTemplateSpace.findMany({
              where: { spaceTemplateId: template.id, elementTemplate: { active: true } },
              include: { elementTemplate: true },
              orderBy: { order: "asc" },
            });

            for (const link of elementLinks) {
              // Fase 11Y/11AA — ver LEVEL2_GATED_LINKS arriba: Reja,
              // Portón y Ventana-de-Cocina ya no se generan acá, quedan
              // pendientes de la configuración Nivel 2 del recinto. El
              // gate es por par recinto:componente, no solo por
              // componente (Ventana sigue generándose automático en
              // cualquier OTRO recinto que la use).
              if (LEVEL2_GATED_LINKS.has(`${template.key}:${link.elementTemplate.key}`)) continue;

              // Fase 18A (DT-02) — `order` explícito y determinista desde
              // InspectionElementTemplateSpace.order (fuente de verdad del
              // catálogo, sin empates confirmados en ningún recinto activo
              // — ver docs/FASE18A_...): antes quedaba en el default de
              // esquema (0) para todo elemento base, indistinguible entre
              // sí para el `orderBy` de la pantalla/PDF/resumen. No migra
              // ningún elemento histórico ya creado.
              const element = await tx.inspectionElement.create({
                data: {
                  spaceId: space.id,
                  elementTemplateId: link.elementTemplateId,
                  name: link.elementTemplate.label,
                  order: link.order,
                },
              });

              const checklistItems = await tx.inspectionChecklistItem.findMany({
                where: { elementTemplateId: link.elementTemplateId, active: true },
                orderBy: { order: "asc" },
              });

              for (const item of checklistItems) {
                await tx.inspectionChecklistCheck.create({
                  data: { elementId: element.id, checklistItemId: item.id, questionSnapshot: item.question },
                });
              }
            }
          }
        }

        return createdCase.id;
      },
      { timeout: 30000 }
    );

    return { caseId };
  } catch {
    return { error: "No se pudo crear la inspección. Intenta de nuevo." };
  }
}

// Fase 11K (docs/FASE11J_REDISENO_PROFUNDO_INSPECCION_GUIADA.md, sección
// F) — eliminación completa de un caso. Ownership resuelto igual que el
// resto del módulo: `caseId` nunca se confía sin verificar contra la
// sesión. Orden EXACTO ya validado por `deleteObservationAction` (Fase
// 10Q, src/app/(app)/inspecciones/[id]/actions.ts): 1) recolectar TODAS
// las InspectionPhoto.url de este caso (los 4 niveles, porque `caseId`
// es obligatorio en todas — nunca un prefijo ni una búsqueda ambigua),
// 2) borrar los blobs físicos uno por uno, best-effort (un `del()` que
// falla NUNCA bloquea ni revierte nada, ni puede afectar otro caso: cada
// llamada usa la URL exacta ya guardada en BD), 3) recién ahí borrar el
// `InspectionCase` — el cascade ya declarado en el schema
// (Space/Element/Check/Observation/Photo, todos `onDelete: Cascade`
// hacia arriba en la cadena) elimina TODAS las filas dependientes en un
// solo `delete`, sin necesidad de borrarlas una por una a mano.
export async function deleteInspectionCaseAction(
  caseId: string
): Promise<{ success: true; error?: undefined } | { error: string; success?: undefined }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "No hay sesión activa." };

  const insCase = await prisma.inspectionCase.findUnique({ where: { id: caseId } });
  if (!insCase || insCase.userId !== session.user.id) return { error: "Inspección no encontrada." };

  const photos = await prisma.inspectionPhoto.findMany({ where: { caseId }, select: { url: true } });

  for (const photo of photos) {
    try {
      await del(photo.url);
    } catch {
      // Blob ya eliminado o inalcanzable — no bloquea el borrado del
      // caso. Nunca puede afectar otra inspección: cada `del()` usa
      // exclusivamente la URL real de ESTA foto, nunca un prefijo.
    }
  }

  // Cascade real del schema — ver comentario arriba. No se borra ninguna
  // fila hija a mano acá.
  await prisma.inspectionCase.delete({ where: { id: caseId } });

  revalidatePath("/inspecciones");
  return { success: true };
}
