import { History } from "lucide-react";
import type { InspectionSeverity } from "@/generated/prisma/client";
import { TechnicalArticleLink } from "./technical-article-link";

const SEVERITY_LABELS: Record<InspectionSeverity, string> = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
  CRITICAL: "Crítica",
};

const OBSERVATION_TEXT = "text-[#8A620D]";
const SEVERITY_TONE: Record<InspectionSeverity, string> = {
  LOW: `bg-caution-tint ${OBSERVATION_TEXT}`,
  MEDIUM: `bg-caution-tint ${OBSERVATION_TEXT}`,
  HIGH: "bg-danger-tint text-danger",
  CRITICAL: "bg-danger-tint text-danger",
};

export type ResumenHallazgo = {
  id: string;
  spaceName: string;
  elementName: string;
  question: string;
  comment: string;
  severity: InspectionSeverity;
  recommendation: string | null;
  photos: { id: string; url: string }[];
  // true si el check al que pertenece este hallazgo está actualmente en
  // OBSERVACIÓN (vigente); false si volvió a OK/No aplica (histórico) —
  // misma lógica ya implementada en checklist-item-row.tsx (Fase 7B).
  vigente: boolean;
  technicalArticle: { title: string; content: string } | null;
};

// Fase 8, sección 7/9 — una sola tarjeta reutilizada tanto para
// "Hallazgos vigentes" como para "Hallazgos anteriores / no vigentes"
// (la sección que las agrupa decide cuáles pasar, ver [id]/resumen/page.tsx).
// No oculta ni borra nada: siempre trae comentario, severidad y fotos
// completas, sin importar si es histórico.
export function ResumenHallazgoCard({ hallazgo }: { hallazgo: ResumenHallazgo }) {
  return (
    <div className={`rounded-xl p-4 bg-white border ${hallazgo.vigente ? "border-caution-border" : "border-border"}`}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p className="text-xs font-mono uppercase tracking-wider text-ink-faint">
            {hallazgo.spaceName} · {hallazgo.elementName}
          </p>
          <p className="text-sm font-medium mt-0.5">{hallazgo.question}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {!hallazgo.vigente && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-concrete text-ink-muted">
              <History className="w-3 h-3" />
              No vigente
            </span>
          )}
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${SEVERITY_TONE[hallazgo.severity]}`}>
            {SEVERITY_LABELS[hallazgo.severity]}
          </span>
        </div>
      </div>

      <p className="text-sm mt-2">{hallazgo.comment}</p>
      {hallazgo.recommendation && (
        <p className="text-xs text-ink-muted mt-1">Recomendación: {hallazgo.recommendation}</p>
      )}

      {hallazgo.photos.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {hallazgo.photos.map((p) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={p.id} src={p.url} alt="" className="w-16 h-16 rounded-lg object-cover border border-border" />
          ))}
        </div>
      )}

      {hallazgo.technicalArticle && (
        <TechnicalArticleLink title={hallazgo.technicalArticle.title} content={hallazgo.technicalArticle.content} />
      )}
    </div>
  );
}
