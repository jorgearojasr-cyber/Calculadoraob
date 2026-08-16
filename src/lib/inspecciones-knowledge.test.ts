import { describe, it, expect, vi } from "vitest";

// El alias "@/" no está configurado para vitest en este proyecto (mismo
// motivo documentado en execution-advisor/loader.test.ts) — se mockea
// para poder importar el módulo sin resolver el specifier real. `vi.mock`
// se hoistea automáticamente por encima de los imports estáticos, así
// que el import de abajo ya ve el módulo mockeado. Los tests de acá no
// tocan `loadKnowledgeEntry` (la única función que usa `prisma`), solo
// las funciones puras.
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import { deriveGuiaBreve, parseKnowledgeContent } from "./inspecciones-knowledge";

describe("deriveGuiaBreve", () => {
  it("returns the first sentence when it already fits", () => {
    expect(deriveGuiaBreve("Si el muro presenta fisuras visibles.")).toBe("Si el muro presenta fisuras visibles.");
  });

  it("takes only the first sentence when there are more after it", () => {
    expect(deriveGuiaBreve("Revisa el piso. Anota cualquier daño visible.")).toBe("Revisa el piso.");
  });

  it("truncates at a word boundary and appends an ellipsis when the first sentence is too long", () => {
    const long =
      "Si la superficie del piso presenta daños físicos visibles como piezas trisadas, picadas, astilladas o quebradas, especialmente en zonas de alto tránsito del recinto revisado.";
    const result = deriveGuiaBreve(long);
    expect(result.endsWith("…")).toBe(true);
    expect(result.length).toBeLessThanOrEqual(161);
    expect(long.startsWith(result.slice(0, -1).trim())).toBe(true);
  });

  it("never invents words not present in the source text", () => {
    const source = "Revisa cuidadosamente cada enchufe del recinto con un artefacto real antes de continuar con la siguiente pregunta de la lista.";
    const result = deriveGuiaBreve(source);
    const words = result.replace(/…$/, "").trim().split(/\s+/);
    const sourceWords = source.split(/\s+/);
    for (const word of words) {
      expect(sourceWords).toContain(word);
    }
  });
});

describe("parseKnowledgeContent — guiaBreve resolution", () => {
  it("uses an explicit '# Guía breve' heading when present", () => {
    const content = "# Qué revisar\n\nTexto largo de qué revisar.\n\n# Guía breve\n\nTexto breve explícito.";
    const result = parseKnowledgeContent(content);
    expect(result.guiaBreve).toBe("Texto breve explícito.");
  });

  it("derives from queRevisar when no explicit heading exists", () => {
    const content = "# Qué revisar\n\nSi la ventana abre y cierra correctamente.";
    const result = parseKnowledgeContent(content);
    expect(result.guiaBreve).toBe("Si la ventana abre y cierra correctamente.");
  });

  it("stays null when there is no queRevisar and no explicit heading", () => {
    const content = "# Cómo revisarlo\n\nAlgo de contenido.";
    const result = parseKnowledgeContent(content);
    expect(result.guiaBreve).toBeNull();
  });
});
