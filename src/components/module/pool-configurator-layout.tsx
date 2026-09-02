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
// C1 tenía 2 bloques (Medidas, Estructura); C2 agregó "Interior"; Fase C3
// (2026-09-01) agrega "Excavación" como cuarto bloque -- el arreglo sigue
// admitiendo más adelante (Entorno/Equipamiento, fases C4+) sin cambiar
// esta firma, basta con extender `BLOCKS` cuando existan.
//
// Fase C3 -- bug real encontrado al verificar mobile a 390px: con 4
// bloques la fila `flex` (sin wrap) ya no cabía y desbordaba la página
// completa en horizontal (confirmado con scrollWidth > innerWidth). Se
// agrega `flex-wrap` + `gap-y-2` para que en pantallas angostas pase a 2
// líneas en vez de desbordar.
//
// Fase C3.1 -- medido: la columna real de este tracker en desktop
// (grid `md:grid-cols-[1fr_1.4fr]` + sidebar "Tu proyecto" de 260px, ver
// module-wizard.tsx) queda angosta (~240px incluso a 1280px de ventana),
// así que 4 bloques envuelven a 2 líneas TAMBIÉN en desktop, no solo en
// mobile -- sin overflow/corte/superposición, pero no "una sola línea
// cuando hay espacio" porque en esta columna específica no lo hay.
//
// Fase C4 -- 5º bloque ("Entorno"), el disparador que C3.1 ya anticipaba.
// Ajuste EXCLUSIVO de este componente (no una refactorización general):
// pills más compactos (padding/tipografía reducidos, gap más chico) para
// que 5 bloques sigan siendo legibles en 2 líneas en vez de 3+ -- sigue
// siendo el mismo patrón visual (pills + flechas + flex-wrap), no un
// rediseño del tracker.
const BLOCKS = ["Medidas", "Estructura", "Interior", "Excavación", "Entorno"] as const;

export function PoolConfiguratorLayout({ activeBlock }: { activeBlock: string }) {
  return (
    <div className="mb-4">
      <p className="font-mono text-xs uppercase tracking-wider text-safety mb-2">Configura tu piscina</p>
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1.5 mb-3">
        {BLOCKS.map((block, i) => {
          const isActive = block === activeBlock;
          return (
            <div key={block} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-ink-faint text-[10px]">→</span>}
              <span
                className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full whitespace-nowrap ${
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
