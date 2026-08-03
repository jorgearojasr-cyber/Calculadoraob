// Formateo/redondeo de texto y números — pertenece al framework: distintos
// componentes de campo necesitan la misma capitalización de labels (los
// labels vienen en minúscula desde la DB, ej. "largo") y el mismo
// redondeo a 2 decimales al guardar un valor derivado (ej. el lado de un
// cuadrado equivalente en modo "m² directo"). Antes "capitalize" vivía
// duplicado en QuestionGroupStep/VolumeStep y en AreaInputToggle.
export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
