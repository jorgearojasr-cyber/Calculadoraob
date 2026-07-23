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

function GuideList({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5 text-sm text-ink">
          <span className="mt-1.5 w-1 h-1 rounded-full bg-ink-faint shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function GuideDetails({ title, icon: Icon, children }: { title: string; icon: typeof Wrench; children: ReactNode }) {
  return (
    <details className="group rounded-2xl bg-white border border-border overflow-hidden">
      <summary className="flex items-center gap-2.5 p-5 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
        <Icon className="w-4 h-4 text-ink-muted shrink-0" />
        <span className="font-semibold text-[15px] flex-1">{title}</span>
        <span className="text-ink-faint text-xs font-mono transition-transform group-open:rotate-180">▾</span>
      </summary>
      <div className="px-5 pb-5">{children}</div>
    </details>
  );
}

export function GuideSection({ guide }: { guide: ModuleGuideData }) {
  return (
    <div className="mt-8">
      <p className="font-mono text-xs uppercase tracking-wider mb-2 text-safety">Guía práctica</p>
      <h3 className="font-display text-xl font-semibold tracking-tight mb-4">Antes de empezar</h3>

      <div className="rounded-2xl p-5 bg-white border border-border mb-3">
        <p className="text-sm text-ink leading-relaxed mb-4">{guide.summary}</p>
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
        <GuideDetails title="Herramientas necesarias" icon={Wrench}>
          <GuideList items={guide.tools} />
        </GuideDetails>

        <GuideDetails title="Paso a paso resumido" icon={ListChecks}>
          <ol className="grid gap-2">
            {guide.stepByStepSummary.map((step, i) => (
              <li key={i} className="flex gap-2.5 text-sm text-ink">
                <span className="font-mono text-xs text-ink-faint shrink-0 mt-0.5">{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </GuideDetails>

        <GuideDetails title="Consejos antes de empezar" icon={Lightbulb}>
          <GuideList items={guide.tipsBeforeStart} />
        </GuideDetails>

        <GuideDetails title="Errores comunes" icon={AlertTriangle}>
          <GuideList items={guide.commonMistakes} />
        </GuideDetails>

        <GuideDetails title="Seguridad" icon={ShieldAlert}>
          <GuideList items={guide.safetyRecommendations} />
        </GuideDetails>

        <GuideDetails title="Preguntas frecuentes" icon={HelpCircle}>
          <div className="grid gap-4">
            {guide.faqs.map((faq, i) => (
              <div key={i}>
                <p className="text-sm font-semibold mb-1">{faq.question}</p>
                <p className="text-sm text-ink-muted">{faq.answer}</p>
              </div>
            ))}
          </div>
        </GuideDetails>
      </div>

      <div className="grid gap-3 mt-3">
        <div className="rounded-2xl p-5 bg-safety-tint border border-safety/20">
          <p className="text-xs font-mono uppercase tracking-wider text-safety mb-2">Buena práctica</p>
          <p className="text-sm text-ink leading-relaxed">{guide.bestPractice}</p>
        </div>
        <div className="rounded-2xl p-5 bg-navy/[0.04] border border-navy/20">
          <div className="flex items-start gap-2.5">
            <MessageSquareQuote className="w-4 h-4 text-navy shrink-0 mt-0.5" />
            <p className="text-sm text-ink leading-relaxed italic">&ldquo;{guide.masterTip}&rdquo;</p>
          </div>
        </div>
      </div>
    </div>
  );
}
