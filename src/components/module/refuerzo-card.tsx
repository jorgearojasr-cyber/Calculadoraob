// Fase 5 (Radier) — tarjeta de "refuerzo recomendado": estado (OPCIONAL/
// RECOMENDADA/etc.) + explicación contextual + nota fija de que ObraBien
// no reemplaza un dimensionamiento estructural. Genérico (sin nada de
// Radier hardcodeado salvo lo que el caller pasa) para que cualquier
// futuro módulo con el mismo patrón lo reutilice.
//
// La advertencia de "esto no es un cálculo estructural" vive ACÁ, dentro
// de la propia tarjeta con contexto — a propósito NO se usa el mecanismo
// genérico de NormsDisclaimer (bloque rojo "Riesgo estructural o de
// seguridad"): esa ubicación, separada del contenido que explica, se
// leyó como ruido/duplicado (ver feedback de esta fase). Blanco (no
// ámbar ni rojo) porque es información, no una estimación práctica como
// la dosificación ni una alerta crítica.
export function RefuerzoCard({
  title,
  materialLabel,
  estado,
  explicacion,
  nota,
}: {
  title: string;
  materialLabel: string;
  estado: string;
  explicacion: string;
  nota: string;
}) {
  return (
    <div className="rounded-ds-card p-5 mb-3 bg-white border border-ds-border">
      <p className="font-body text-xs font-semibold uppercase tracking-wider text-ds-text-tertiary mb-2">{title}</p>
      <p className="font-body text-[15px] mb-2 text-ds-navy-900">
        <span className="font-medium">{materialLabel}:</span>{" "}
        <span className="font-bold text-ds-orange-700">{estado}</span>
      </p>
      <p className="font-body text-sm text-ds-text-secondary">{explicacion}</p>
      <p className="mt-3 pt-3 border-t border-ds-border/70 font-body text-[11px] text-ds-text-tertiary">{nota}</p>
    </div>
  );
}
