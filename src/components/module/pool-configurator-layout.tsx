// Encabezado de bloque del configurador integral de Piscina (Fase C1,
// Module NUEVO "piscina-integral") -- EXCLUSIVO de este Module, gateado
// por `diagram.poolConfiguratorBlockLabel` en VolumeStep. Reemplaza el
// <h2> genérico de `groupLabel` con un tracker de bloques ("MEDIDAS" /
// "ESTRUCTURA", el activo resaltado) -- es lo que hace que
// `piscina-integral` se sienta como "configura tu piscina" en vez de un
// wizard genérico de preguntas sueltas, sin tocar ModuleWizard ni
// QuestionGroupStep: es puramente el header de la MISMA tarjeta que
// VolumeStep ya arma (mismo grid, mismos campos, mismo mecanismo de
// guardado/draft/recálculo -- MOTOR/PERSISTENCIA genérica, UI específica).
//
// C1 tenía 2 bloques (Medidas, Estructura); Fase C2 (2026-09-01) agrega
// "Interior" (terminación de muros/fondo) como tercer bloque -- el arreglo
// sigue admitiendo más adelante (Excavación/Entorno, fases C3+) sin
// cambiar esta firma, basta con extender `BLOCKS` cuando existan.
const BLOCKS = ["Medidas", "Estructura", "Interior"] as const;

export function PoolConfiguratorLayout({ activeBlock }: { activeBlock: string }) {
  return (
    <div className="mb-4">
      <p className="font-mono text-xs uppercase tracking-wider text-safety mb-2">Configura tu piscina</p>
      <div className="flex items-center gap-2 mb-3">
        {BLOCKS.map((block, i) => {
          const isActive = block === activeBlock;
          return (
            <div key={block} className="flex items-center gap-2">
              {i > 0 && <span className="text-ink-faint text-xs">→</span>}
              <span
                className={`text-xs font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full ${
                  isActive ? "bg-action text-white" : "bg-concrete text-ink-faint"
                }`}
              >
                {block}
              </span>
            </div>
          );
        })}
      </div>
      <h2 className="font-display text-xl md:text-2xl font-semibold tracking-tight">{activeBlock}</h2>
    </div>
  );
}
