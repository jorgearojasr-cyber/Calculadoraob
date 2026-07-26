// Validación suave (no bloqueante) de rangos típicos, inferidos desde el
// helpText de la pregunta cuando trae un patrón parseable con confianza.
// No es un catálogo manual de rangos por pregunta — solo cubre los formatos
// de texto que ya se usan en el contenido real (ver auditoría en el commit
// que introduce este archivo).

export type TypicalRange = { min: number; max: number };

function toNum(raw: string): number {
  return Number(raw.replace(",", "."));
}

export function parseTypicalRange(
  helpText: string | null | undefined,
  questionKey: string
): TypicalRange | null {
  if (!helpText) return null;

  // "Las medidas típicas van de 0,8x0,8m a 1,2x0,9m" — rango de dos
  // dimensiones; se toma el primer número de cada par (mismo eje).
  const dimRange = helpText.match(/([\d.,]+)\s*x\s*[\d.,]+\s*m?\s*a\s*([\d.,]+)\s*x\s*[\d.,]+\s*m/i);
  if (dimRange) {
    const min = toNum(dimRange[1]);
    const max = toNum(dimRange[2]);
    if (Number.isFinite(min) && Number.isFinite(max) && min > 0 && max > min) {
      return { min, max };
    }
  }

  // "Lo típico es entre 0,6 y 1 metro..."
  const between = helpText.match(/entre\s+([\d.,]+)\s*y\s*([\d.,]+)/i);
  if (between) {
    const min = toNum(between[1]);
    const max = toNum(between[2]);
    if (Number.isFinite(min) && Number.isFinite(max) && min > 0 && max > min) {
      return { min, max };
    }
  }

  // "lo típico en una vivienda es huella 28cm y contrahuella 18cm" — el
  // mismo texto se comparte entre las dos preguntas, se elige el número
  // según el key de la pregunta actual.
  const stairMatch = helpText.match(/huella\s*([\d.,]+)\s*cm.*contrahuella\s*([\d.,]+)\s*cm/i);
  if (stairMatch) {
    if (questionKey.includes("contrahuella")) {
      const v = toNum(stairMatch[2]);
      if (Number.isFinite(v) && v > 0) return { min: v, max: v };
    } else if (questionKey.includes("huella")) {
      const v = toNum(stairMatch[1]);
      if (Number.isFinite(v) && v > 0) return { min: v, max: v };
    }
  }

  // "El valor típico es 20cm..." — valor único.
  const singleMatch = helpText.match(/valor típico es\s+([\d.,]+)\s*cm/i);
  if (singleMatch) {
    const v = toNum(singleMatch[1]);
    if (Number.isFinite(v) && v > 0) return { min: v, max: v };
  }

  // "lo estándar es 20x20cm..." (cuadrado, sin rango "a") — valor único.
  const squareMatch = helpText.match(/(\d[\d.,]*)\s*x\s*(\d[\d.,]*)\s*cm/i);
  if (squareMatch) {
    const v = toNum(squareMatch[1]);
    if (Number.isFinite(v) && v > 0) return { min: v, max: v };
  }

  return null;
}

export function checkRangeWarning(value: number, range: TypicalRange): string | null {
  if (value > range.max * 2) {
    return "Eso es inusualmente grande para este dato — ¿es correcto?";
  }
  if (value < range.min / 2) {
    return "Eso es inusualmente chico para este dato — ¿es correcto?";
  }
  return null;
}
