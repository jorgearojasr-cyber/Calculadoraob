import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { ROWS } from "./fase19a-referencias-visuales-v1-data";

// Fase 19A (DT-04, docs/FASE19A_DT04_REFERENCIAS_VISUALES_V1.md) —
// regresión estática sobre la matriz de referencias visuales: no
// requiere BD, solo valida la fuente de verdad (ROWS) y los assets en
// disco. Cubre exactamente los riesgos de la sección 26/32 del diseño de
// la fase: asociaciones duplicadas, checks sin par GOOD/BAD, y archivos
// SVG inexistentes o vacíos.

const PUBLIC_DIR = path.join(__dirname, "..", "..", "public");

describe("fase19a ROWS (DT-04)", () => {
  it("never lists the same (elementKey, question) twice", () => {
    const seen = new Set<string>();
    const dupes: string[] = [];
    for (const row of ROWS) {
      const key = `${row.elementKey}::${row.question}`;
      if (seen.has(key)) dupes.push(key);
      seen.add(key);
    }
    expect(dupes).toEqual([]);
  });

  it("every row declares both a GOOD and a BAD text (complete pair)", () => {
    for (const row of ROWS) {
      expect(row.good.alt.length).toBeGreaterThan(0);
      expect(row.good.caption.length).toBeGreaterThan(0);
      expect(row.bad.alt.length).toBeGreaterThan(0);
      expect(row.bad.caption.length).toBeGreaterThan(0);
    }
  });

  it("no alt text uses the vague 'imagen buena/mala' wording", () => {
    for (const row of ROWS) {
      expect(row.good.alt.toLowerCase()).not.toMatch(/imagen (buena|correcta)$/);
      expect(row.bad.alt.toLowerCase()).not.toMatch(/imagen (mala|incorrecta)$/);
    }
  });

  it("every referenced SVG asset exists on disk and is non-empty, for both GOOD and BAD", () => {
    const missing: string[] = [];
    for (const row of ROWS) {
      for (const kind of ["good", "bad"] as const) {
        const filePath = path.join(PUBLIC_DIR, "inspecciones", "referencias", `${row.assetKey}-${kind}.svg`);
        if (!fs.existsSync(filePath) || fs.statSync(filePath).size === 0) {
          missing.push(filePath);
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it("every SVG asset is well-formed (starts with <svg, ends with </svg>, balanced self-closing tags)", () => {
    const assetKeys = Array.from(new Set(ROWS.map((r) => r.assetKey)));
    const malformed: string[] = [];
    for (const assetKey of assetKeys) {
      for (const kind of ["good", "bad"] as const) {
        const filePath = path.join(PUBLIC_DIR, "inspecciones", "referencias", `${assetKey}-${kind}.svg`);
        const content = fs.readFileSync(filePath, "utf-8");
        const startsOk = content.trimStart().startsWith("<svg");
        const endsOk = content.trimEnd().endsWith("</svg>");
        const openTags = (content.match(/<(rect|line|path|ellipse|circle)/g) ?? []).length;
        const selfClosed = (content.match(/\/>/g) ?? []).length;
        if (!startsOk || !endsOk || openTags !== selfClosed) malformed.push(filePath);
      }
    }
    expect(malformed).toEqual([]);
  });

  it("has no orphan assets on disk unreferenced by any row (every generated SVG is actually used)", () => {
    const dir = path.join(PUBLIC_DIR, "inspecciones", "referencias");
    const filesOnDisk = fs.readdirSync(dir).filter((f) => f.endsWith(".svg"));
    const expectedFiles = new Set<string>();
    for (const row of ROWS) {
      expectedFiles.add(`${row.assetKey}-good.svg`);
      expectedFiles.add(`${row.assetKey}-bad.svg`);
    }
    const orphans = filesOnDisk.filter((f) => !expectedFiles.has(f));
    expect(orphans).toEqual([]);
  });
});
