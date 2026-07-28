// Tinte del ícono de cada ProjectGroup en Home y en /grupos/[slug].
//
// Decisión: un solo tinte de marca (marino) para todos los grupos, en vez
// de un color distinto por grupo. La paleta definitiva solo tiene 2 colores
// decorativos seguros para uso repetido (marino y verde) — el resto está
// reservado: naranjo es exclusivo de CTAs/botones, y ámbar/carmín son
// exclusivos de los 3 estados de disclaimer (si un grupo cualquiera como
// "Pintar" usara ámbar o carmín decorativamente, se leería como una
// advertencia real y le quitaría fuerza a la señal de "Agua y Gas", que sí
// necesita ser inequívoca). Con solo 2 tonos seguros para 11 grupos, variar
// por grupo se sentiría arbitrario — así que todos comparten el mismo
// tinte de marca y se diferencian por su ícono, no por su color.
export const GROUP_ICON_CHIP_CLASS = "bg-navy/[0.07] text-navy";
