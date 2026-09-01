// Pluralización centralizada para unidades de resultado (Formula.unit /
// Question.unit / Material.unit). Antes de esto, cada punto de la app que
// mostraba "cantidad + unidad" usaba el string de unidad tal cual venía de
// la base de datos, sin ajustar por número — de ahí bugs como "1 tramos" o
// "68 unidad" documentados en la auditoría de usabilidad (39 casos).
//
// Reglas del español que cubre este set cerrado de unidades (ver
// scratch-e3-units.ts durante el desarrollo para el listado completo):
//   - termina en vocal -> agrega "s" (caja -> cajas, rollo -> rollos)
//   - termina en "z" -> cambia a "c" + "es" (no hay casos actuales, por si acaso)
//   - termina en consonante -> agrega "es" (unidad -> unidades)
//   - excepciones irregulares (acento que se pierde al pluralizar) -> mapa manual
// Solo se pluraliza la PRIMERA palabra de unidades compuestas ("pieza de 6m"
// -> "piezas de 6m"), y las unidades simbólicas/abreviadas (m², kg, cm...)
// nunca se tocan.
const IRREGULAR: Record<string, string> = {
  galón: "galones",
  camión: "camiones",
};

// Unidades que nunca deben pluralizarse: abreviaturas/símbolos (m², kg, cm),
// o strings descriptivos donde forzar un plural sería incorrecto o extraño.
// Incluye "capa"/"capas": ese caso ya se resuelve con dos Formula separadas
// (una para el singular, otra para el plural) en vez de con esta función —
// tocarlas acá las rompería.
const INVARIANT = new Set([
  "a",
  "w",
  "$",
  "cm",
  "kg",
  "l",
  "m",
  "m2",
  "m3",
  "m²",
  "m³",
  "m³/h",
  "m²/l",
  "m lineal",
  "ml",
  "%",
  "kwh/mes",
  "$/kwh",
  "capa",
  "capas",
  "advertencia",
  "conexión (requiere gasfitería)",
  "trabajo adicional (requiere instalador certificado)",
  "m de profundidad — fuera del rango típico residencial",
]);

function pluralizeWord(word: string): string {
  const lower = word.toLowerCase();
  const irregular = IRREGULAR[lower];
  if (irregular) return irregular;
  if (/[aeiouáéíóú]$/i.test(word)) return `${word}s`;
  if (/z$/i.test(word)) return `${word.slice(0, -1)}ces`;
  return `${word}es`;
}

/**
 * Devuelve `unit` en singular o plural según `quantity`. Solo la primera
 * palabra se pluraliza — el resto de una unidad compuesta ("de 6m", "de
 * 1000") queda intacto.
 */
export function pluralizeUnit(quantity: number, unit: string): string {
  if (!unit) return unit;
  if (INVARIANT.has(unit.toLowerCase())) return unit;
  if (quantity === 1) return unit;

  const [firstWord, ...rest] = unit.split(" ");
  const pluralFirstWord = pluralizeWord(firstWord);
  return [pluralFirstWord, ...rest].join(" ");
}
