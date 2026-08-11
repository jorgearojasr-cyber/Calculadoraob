// Puente editorial con la seguridad (Fase 10D, 10-ago-2026): "manual" es
// la única opción donde el usuario mismo entra físicamente al hoyo
// excavado (a diferencia de operar/contratar una máquina desde afuera),
// así que es la única donde tiene sentido recordar la advertencia de
// derrumbe/entibado que ya vive, sin cambios, en
// Module.guide.safetyRecommendations (otra sección de la misma pantalla,
// fuera de este componente). Deliberadamente NO es una regla del Advisor
// ni agrega ningún umbral de profundidad — es solo una referencia
// cruzada de texto, condicionada por metodoKey, no por ningún cálculo.
//
// Vive en un archivo .ts aparte (no dentro de execution-advisor-panel.tsx)
// para poder testearla sin necesitar parsear JSX — este proyecto no tiene
// configurado un plugin de React para vitest (ni jsdom/@testing-library),
// así que cualquier import desde un .tsx falla al transformar el archivo
// completo, JSX incluido.
export function debeMostrarPuenteSeguridad(metodoKey: string | null | undefined): boolean {
  return metodoKey === "manual";
}
