import { ClipboardCheck, ListChecks, Sparkles, UserCheck } from "lucide-react";
import type { InformeEjecucionUI } from "@/lib/execution-advisor/action";
import { debeMostrarPuenteSeguridad } from "./execution-advisor-panel-helpers";

// Asesor de Ejecución — Fase 4 (04-ago-2026). Componente puramente
// presentacional: recibe un InformeEjecucionUI ya evaluado (ver
// src/lib/execution-advisor/action.ts) y solo lo pinta — cero lógica de
// decisión acá (ninguna comparación de respuestas, ningún cálculo de
// confianza). El bloque 1 ("Resultado técnico") vive en result-screen.tsx
// y no cambia — este componente solo cubre los bloques 2-4, cada uno su
// propia tarjeta, visualmente separados a propósito (para que el usuario
// distinga de un vistazo qué es cálculo, qué es sugerencia del sistema, y
// qué fue su propia decisión).
export function ExecutionAdvisorPanel({ informe }: { informe: InformeEjecucionUI }) {
  const { recomendacion, eleccionUsuario, antesDeComenzar } = informe;
  const hayAntesDeComenzar = antesDeComenzar.tips.length > 0 || Boolean(antesDeComenzar.mensajeAclaratorio);

  if (!recomendacion && !eleccionUsuario.metodoKey && !hayAntesDeComenzar) return null;

  return (
    <div className="grid gap-3 mb-3">
      {recomendacion && (
        <section className="rounded-2xl p-5 bg-white border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-safety flex-shrink-0" />
            <p className="font-mono text-xs uppercase tracking-wider text-safety">Nuestra recomendación</p>
          </div>

          {recomendacion.tipo === "sin-cobertura" ? (
            // Caso 2 (decisión 04-ago-2026): método real elegido por el
            // usuario, pero ninguna regla lo cubre todavía — mensaje
            // explícito en vez de dejar el bloque vacío/desaparecido.
            <p className="text-sm text-ink-muted">{recomendacion.mensaje}</p>
          ) : (
            <>
              <p className="font-display text-lg font-semibold text-ink mb-1">{recomendacion.label}</p>
              <p className="text-sm text-ink-muted mb-3">{recomendacion.confianza.textoExplicativo}</p>

              {debeMostrarPuenteSeguridad(recomendacion.metodoKey) && (
                <p className="text-sm text-ink-muted mb-3">
                  Si la excavación es profunda, revisa también las recomendaciones de seguridad más abajo antes de
                  empezar.
                </p>
              )}

              {recomendacion.explicacion.length > 0 && (
                <ul className="text-sm text-ink-muted grid gap-1 mb-3">
                  {recomendacion.explicacion.map((factor) => (
                    <li key={factor.factorQuestionKey} className="flex items-start gap-2">
                      <span className="text-ink-faint mt-0.5">•</span>
                      <span>{factor.fragmentoTexto}</span>
                    </li>
                  ))}
                </ul>
              )}

              {recomendacion.consideraciones.length > 0 && (
                <div className="grid gap-2">
                  {recomendacion.consideraciones.map((consideracion, i) => (
                    <div key={i} className="rounded-xl px-4 py-3 bg-concrete">
                      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        {consideracion.etiqueta}
                      </p>
                      <p className="text-sm text-ink mt-0.5">{consideracion.texto}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      )}

      {eleccionUsuario.metodoKey && (
        <section className="rounded-2xl p-5 bg-white border border-border">
          <div className="flex items-center gap-2 mb-2">
            <UserCheck className="w-4 h-4 text-ink-muted flex-shrink-0" />
            <p className="font-mono text-xs uppercase tracking-wider text-ink-muted">Tu elección</p>
          </div>
          <p className="text-sm text-ink">
            Elegiste: <span className="font-semibold">{eleccionUsuario.label}</span>
          </p>
        </section>
      )}

      {hayAntesDeComenzar && (
        <section className="rounded-2xl p-5 bg-white border border-border">
          <div className="flex items-center gap-2 mb-3">
            {antesDeComenzar.mensajeAclaratorio ? (
              <ClipboardCheck className="w-4 h-4 text-ink-muted flex-shrink-0" />
            ) : (
              <ListChecks className="w-4 h-4 text-ink-muted flex-shrink-0" />
            )}
            <p className="font-mono text-xs uppercase tracking-wider text-ink-muted">Antes de comenzar</p>
          </div>
          {antesDeComenzar.mensajeAclaratorio && (
            <p className="text-sm text-ink-muted mb-3">{antesDeComenzar.mensajeAclaratorio}</p>
          )}
          {antesDeComenzar.tips.length > 0 && (
            <ul className="text-sm text-ink grid gap-1.5">
              {antesDeComenzar.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-ink-faint mt-0.5">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
