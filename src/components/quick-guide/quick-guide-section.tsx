import type { ReactNode } from "react";
import { Clock, Users, Gauge, Wrench, ListChecks, AlertTriangle, Lightbulb, MessageSquareQuote, HelpCircle, ShieldAlert } from "lucide-react";

export type QuickGuideData = {
  shortDescription: string;
  tools: string[];
  estimatedTime: string;
  difficulty: string;
  peopleNeeded: string;
  steps: string[];
  tips: string[];
  commonMistakes: string[];
  masterTip: string;
  faqs: { question: string; answer: string }[];
  reinforcedWarning: boolean;
  reinforcedWarningText: string | null;
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

function GuideDetails({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Wrench;
  children: ReactNode;
}) {
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

// Mismo lenguaje visual que GuideSection (módulos con cálculo), adaptado a
// los campos propios de QuickGuide (sin "buena práctica" ni resumen largo,
// con advertencia reforzada opcional en vez de la de Norm).
export function QuickGuideSection({ guide }: { guide: QuickGuideData }) {
  return (
    <div>
      <div className="rounded-2xl p-5 bg-white border border-border mb-3">
        <p className="text-sm text-ink leading-relaxed mb-4">{guide.shortDescription}</p>
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
            <span className="text-ink-muted">{guide.peopleNeeded}</span>
          </div>
        </div>
      </div>

      {guide.reinforcedWarning && guide.reinforcedWarningText && (
        <div className="rounded-2xl p-5 bg-safety-tint border border-safety-border mb-3">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-safety shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-safety mb-1">Advertencia</p>
              <p className="text-sm text-ink leading-relaxed">{guide.reinforcedWarningText}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-3">
        <GuideDetails title="Herramientas necesarias" icon={Wrench}>
          <GuideList items={guide.tools} />
        </GuideDetails>

        <GuideDetails title="Paso a paso" icon={ListChecks}>
          <ol className="grid gap-2">
            {guide.steps.map((step, i) => (
              <li key={i} className="flex gap-2.5 text-sm text-ink">
                <span className="font-mono text-xs text-ink-faint shrink-0 mt-0.5">{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </GuideDetails>

        <GuideDetails title="Consejos" icon={Lightbulb}>
          <GuideList items={guide.tips} />
        </GuideDetails>

        <GuideDetails title="Errores comunes" icon={AlertTriangle}>
          <GuideList items={guide.commonMistakes} />
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

      <div className="rounded-2xl p-5 bg-navy/[0.04] border border-navy/20 mt-3">
        <div className="flex items-start gap-2.5">
          <MessageSquareQuote className="w-4 h-4 text-navy shrink-0 mt-0.5" />
          <p className="text-sm text-ink leading-relaxed italic">&ldquo;{guide.masterTip}&rdquo;</p>
        </div>
      </div>
    </div>
  );
}
