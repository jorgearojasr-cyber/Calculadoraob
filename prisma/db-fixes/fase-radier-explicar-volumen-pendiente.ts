import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// RADIER — explica el salto de "volumen geométrico" a "volumen a comprar"
// cuando hay pendiente + pérdida de vaciado, usando el motor de
// interpolación de `note` YA EXISTENTE (`{ref:formulaKey}`,
// `{lossFactor:key}`, `{value}`, `{unit}` — ver interpolateTemplate en
// src/lib/formula-engine/index.ts), sin agregar ninguna fórmula/Variable
// nueva ni cambiar ningún cálculo.
//
// Se usa {ref:volumen_con_pendiente} (una Formula, SIEMPRE calculada, con
// o sin pendiente — su valor es igual a volumen_bruto cuando no hay
// pendiente porque el extra se suma con coalesce a 0) en vez de la
// Variable {porcentaje-de-pendiente} (que no existe en absoluto para
// antepiso_interior/bodega_industrial, y el interpolador dejaría el
// placeholder sin resolver literalmente en el texto si se usara ahí).
// Por eso el mismo texto sirve para los 4 "uso" sin bifurcar en 2 notas
// distintas: para interior, "volumen geométrico" y "con el efecto de la
// pendiente" muestran el MISMO número (la pendiente no sumó nada), lo
// cual es honesto, no un texto roto.

const VOLUMEN_EXPLICACION =
  "Volumen geométrico (largo × ancho × espesor): {ref:volumen_bruto} m³. " +
  "Con el efecto de la pendiente de escurrimiento, si tu radier es exterior: {ref:volumen_con_pendiente} m³. " +
  "Con {lossFactor:perdida_hormigon}% de margen por pérdida de vaciado: {value} {unit}. " +
  "Este es el volumen recomendado a comprar, no el volumen \"limpio\" del molde.";

async function main() {
  const mod = await prisma.module.findUniqueOrThrow({ where: { slug: "radier" }, include: { formulas: true } });

  const volumenTotal = mod.formulas.find((f) => f.key === "volumen_total");
  const volumenPremezclado = mod.formulas.find((f) => f.key === "volumen_premezclado");
  if (!volumenTotal || !volumenPremezclado) throw new Error("No se encontraron volumen_total/volumen_premezclado.");

  await prisma.formula.update({
    where: { id: volumenTotal.id },
    data: { note: VOLUMEN_EXPLICACION },
  });
  console.log("OK: nota de 'volumen_total' actualizada con la explicación de pendiente/pérdida.");

  await prisma.formula.update({
    where: { id: volumenPremezclado.id },
    data: {
      // Se conserva íntegro el texto comercial de despacho ya existente,
      // solo se antepone la explicación técnica del volumen.
      note: `${VOLUMEN_EXPLICACION} ${volumenPremezclado.note ?? ""}`.trim(),
    },
  });
  console.log("OK: nota de 'volumen_premezclado' actualizada (explicación de volumen + texto de despacho ya existente, intacto).");
}

main()
  .catch((e) => {
    console.error("FALLÓ:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
