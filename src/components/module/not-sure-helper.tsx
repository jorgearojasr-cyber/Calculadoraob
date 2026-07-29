import { Home } from "lucide-react";

// Caja informativa opcional debajo de una lista de ImageOptionCard,
// sugiriendo la opción más común para quienes no tienen claro cuál elegir
// — reutilizable, sin ninguna suposición de módulo. QuestionStep la activa
// vía NOT_SURE_HELPERS (keyed por moduleSlug/questionKey), así que un
// módulo futuro solo necesita agregar una entrada ahí, no tocar este
// archivo.
export function NotSureHelper({
  description,
  recommendedLabel,
  onSelectRecommended,
}: {
  description: string;
  recommendedLabel: string;
  onSelectRecommended: () => void;
}) {
  return (
    <div className="mt-4 rounded-2xl p-4 bg-concrete border border-border flex items-start gap-3">
      <div className="w-10 h-10 flex-shrink-0 rounded-full bg-safety-tint flex items-center justify-center">
        <Home className="w-5 h-5 text-safety" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">¿No sabes cuál elegir?</p>
        <p className="mt-0.5 text-sm text-ink-muted">{description}</p>
        <button
          type="button"
          onClick={onSelectRecommended}
          className="mt-2 text-sm font-medium text-safety underline underline-offset-4"
        >
          Usar {recommendedLabel}
        </button>
      </div>
    </div>
  );
}
