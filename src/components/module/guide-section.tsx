import type { ReactNode } from "react";
import { Clock, Users, Gauge, Wrench, ListChecks, ShieldAlert, AlertTriangle, Lightbulb, MessageSquareQuote, HelpCircle } from "lucide-react";

export type ModuleGuideData = {
  summary: string;
  tools: string[];
  estimatedTime: string;
  difficulty: string;
  recommendedPeople: string;
  tipsBeforeStart: string[];
  commonMistakes: string[];
  safetyRecommendations: string[];
  bestPractice: string;
  masterTip: string;
  faqs: { question: string; answer: string }[];
  stepByStepSummary: string[];
};

// Dirección visual 2026-07-28: "Guía práctica" es el único lugar de la app
// donde el cuerpo de texto crece por sobre el resto del wizard (16px/1.65
// mobile, 17px/1.65 desktop) — se centraliza acá en vez de repetir la clase
// en cada párrafo/lista.
const GUIDE_BODY_TEXT = "text-base lg:text-[17px] leading-[1.65]";

// Secciones que aparecen en el índice sticky de desktop — mismo orden que
// se renderizan abajo. "Buena práctica" y la cita no son <GuideDetails>
// colapsables (siempre están abiertas), pero igual se listan para que el
// índice cubra toda la guía.
const TOC_SECTIONS = [
  { id: "guia-herramientas", label: "Herramientas" },
  { id: "guia-paso-a-paso", label: "Paso a paso" },
  { id: "guia-consejos", label: "Consejos" },
  { id: "guia-errores", label: "Errores comunes" },
  { id: "guia-seguridad", label: "Seguridad" },
  { id: "guia-faq", label: "Preguntas frecuentes" },
  { id: "guia-buena-practica", label: "Buena práctica" },
];

function GuideList({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-2">
      {items.map((item, i) => (
        <li key={i} className={`flex gap-2.5 text-ink ${GUIDE_BODY_TEXT}`}>
          <span className="mt-2.5 w-1 h-1 rounded-full bg-ink-faint shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function GuideDetails({
  id,
  title,
  icon: Icon,
  children,
  defaultOpen = true,
}: {
  id: string;
  title: string;
  icon: typeof Wrench;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      id={id}
      open={defaultOpen}
      className="group scroll-mt-6 rounded-2xl bg-white border border-border overflow-hidden"
    >
      <summary className="flex items-center gap-2.5 p-5 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
        <Icon className="w-4 h-4 text-ink-muted shrink-0" />
        <span className="font-semibold text-[15px] flex-1">{title}</span>
        <span className="text-ink-faint text-xs font-mono transition-transform group-open:rotate-180">▾</span>
      </summary>
      <div className="px-5 pb-5">{children}</div>
    </details>
  );
}

function GuideIndex() {
  return (
    <nav
      aria-label="Contenido de la guía"
      className="hidden lg:block sticky top-8 self-start w-[180px] shrink-0"
    >
      <p className="font-mono text-[11px] uppercase tracking-wider text-ink-faint mb-3">En esta guía</p>
      <ul className="grid gap-2.5 border-l border-border pl-3">
        {TOC_SECTIONS.map((s) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              className="text-sm text-ink-muted hover:text-safety transition-colors"
            >
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function GuideSection({ guide }: { guide: ModuleGuideData }) {
  return (
    <div className="mt-8">
      <p className="font-mono text-xs uppercase tracking-wider mb-2 text-safety">Guía práctica</p>
      <h3 className="font-display text-[22px] font-semibold tracking-tight mb-4">Antes de empezar</h3>

      <div className="lg:flex lg:gap-8 lg:items-start">
        <GuideIndex />

        <div className="min-w-0 flex-1">
          <div className="rounded-2xl p-5 bg-white border border-border mb-3">
            <p className={`text-ink mb-4 ${GUIDE_BODY_TEXT}`}>{guide.summary}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-ink-faint shrink-0" />
                <span className="text-ink-muted">{guide.estimatedTime}</span>
              </div>
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-ink-faint shrink-0" />
                <span className="text-ink-muted">Dificultad: {guide.difficulty}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-ink-faint shrink-0" />
                <span className="text-ink-muted">{guide.recommendedPeople}</span>
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            <GuideDetails id="guia-herramientas" title="Herramientas necesarias" icon={Wrench}>
              <GuideList items={guide.tools} />
            </GuideDetails>

            <GuideDetails id="guia-paso-a-paso" title="Paso a paso resumido" icon={ListChecks}>
              <ol className="grid gap-2">
                {guide.stepByStepSummary.map((step, i) => (
                  <li key={i} className={`flex gap-2.5 text-ink ${GUIDE_BODY_TEXT}`}>
                    <span className="font-mono text-xs text-ink-faint shrink-0 mt-1">{i + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </GuideDetails>

            <GuideDetails id="guia-consejos" title="Consejos antes de empezar" icon={Lightbulb}>
              <GuideList items={guide.tipsBeforeStart} />
            </GuideDetails>

            <GuideDetails id="guia-errores" title="Errores comunes" icon={AlertTriangle}>
              <GuideList items={guide.commonMistakes} />
            </GuideDetails>

            <GuideDetails id="guia-seguridad" title="Seguridad" icon={ShieldAlert}>
              <GuideList items={guide.safetyRecommendations} />
            </GuideDetails>

            <GuideDetails id="guia-faq" title="Preguntas frecuentes" icon={HelpCircle} defaultOpen={false}>
              <div className="grid gap-4">
                {guide.faqs.map((faq, i) => (
                  <div key={i}>
                    <p className="text-sm font-semibold mb-1">{faq.question}</p>
                    <p className={`text-ink-muted ${GUIDE_BODY_TEXT}`}>{faq.answer}</p>
                  </div>
                ))}
              </div>
            </GuideDetails>
          </div>

          <div className="grid gap-3 mt-3">
            <div id="guia-buena-practica" className="scroll-mt-6 rounded-2xl p-5 bg-safety-tint border border-safety-border">
              <p className="text-xs font-mono uppercase tracking-wider text-safety mb-2">Buena práctica</p>
              <p className={`text-ink ${GUIDE_BODY_TEXT}`}>{guide.bestPractice}</p>
            </div>
            <div className="rounded-2xl p-5 bg-navy/[0.04] border border-navy/20">
              <div className="flex items-start gap-2.5">
                <MessageSquareQuote className="w-4 h-4 text-navy shrink-0 mt-0.5" />
                <p className={`text-ink italic ${GUIDE_BODY_TEXT}`}>&ldquo;{guide.masterTip}&rdquo;</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
