"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HelpCircle, X, ChevronRight, Plus } from "lucide-react";
import { getCategoryIcon } from "@/lib/category-icons";

export type AssistantGroup = {
  id: string;
  name: string;
  icon: string;
  tasks: { id: string; slug: string; name: string }[];
};

// Asistente basado en reglas fijas (sin IA): dos pasos de selección sobre
// los ProjectGroup/ProjectTask reales ya sembrados, que terminan navegando
// a /empezar/[slug] — la misma ruta que ya resuelve el caso de un solo
// módulo (redirección directa) o varios (selector), sin duplicar esa lógica.
export function AssistantWidget({ groups, variant }: { groups: AssistantGroup[]; variant: "sidebar" | "fab" }) {
  const [open, setOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<AssistantGroup | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const close = () => {
    setOpen(false);
    setSelectedGroup(null);
  };

  const goToTask = (slug: string) => {
    close();
    router.push(`/empezar/${slug}`);
  };

  return (
    <>
      {variant === "sidebar" ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full text-left rounded-2xl p-3.5 bg-navy-light border border-navy-border hover:border-white/30 transition-colors mb-3"
        >
          <div className="flex items-center gap-2 mb-1">
            <HelpCircle className="w-4 h-4 text-safety" />
            <p className="text-xs font-semibold text-white">¿Necesitas ayuda?</p>
          </div>
          <p className="text-[11px] text-white/60 mb-2">Te ayudamos a encontrar el proyecto correcto.</p>
          <span className="inline-block text-xs font-semibold px-3 py-1.5 rounded-full bg-safety text-white">
            Preguntar ahora
          </span>
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          aria-label="Preguntar ahora"
          className="w-12 h-12 -mt-6 rounded-full bg-safety text-white flex items-center justify-center shadow-lg border-4 border-concrete"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {open && (
        <button
          aria-label="Cerrar asistente"
          onClick={close}
          className="fixed inset-0 z-40 bg-ink/40"
        />
      )}

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Asistente para encontrar tu proyecto"
          className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-md mx-auto rounded-2xl bg-white border border-border shadow-lg p-6 max-h-[80vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-4">
            <p className="font-display text-lg font-semibold tracking-tight">
              {selectedGroup ? selectedGroup.name : "¿Qué quieres hacer?"}
            </p>
            <button onClick={close} aria-label="Cerrar" className="text-ink-faint hover:text-ink">
              <X className="w-5 h-5" />
            </button>
          </div>

          {!selectedGroup ? (
            <div className="grid gap-2">
              {groups.map((group) => {
                const Icon = getCategoryIcon(group.icon);
                return (
                  <button
                    key={group.id}
                    onClick={() => {
                      if (group.tasks.length === 1) {
                        goToTask(group.tasks[0].slug);
                        return;
                      }
                      setSelectedGroup(group);
                    }}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-left hover:bg-concrete transition-colors"
                  >
                    <Icon className="w-4 h-4 text-navy shrink-0" />
                    <span className="flex-1">{group.name}</span>
                    <ChevronRight className="w-4 h-4 text-ink-faint shrink-0" />
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="grid gap-2">
              <p className="text-xs text-ink-muted mb-1">Elige el que más se parece a tu proyecto:</p>
              {selectedGroup.tasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => goToTask(task.slug)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-left hover:bg-concrete transition-colors"
                >
                  <span className="flex-1">{task.name}</span>
                  <ChevronRight className="w-4 h-4 text-ink-faint shrink-0" />
                </button>
              ))}
              <button
                onClick={() => setSelectedGroup(null)}
                className="text-xs text-ink-muted hover:text-ink mt-2 text-left"
              >
                ← Volver
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
