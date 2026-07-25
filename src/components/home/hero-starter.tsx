"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Wrench, Hammer, Calculator } from "lucide-react";
import { getCategoryIcon } from "@/lib/category-icons";
import type { AssistantGroup } from "@/components/assistant/assistant-widget";

// Punto de entrada conversacional del Hero: mismo patrón de árbol de reglas
// fijas (sin IA) ya usado en el asistente "Preguntar ahora" — misma data
// ProjectGroup/ProjectTask, mismo destino de navegación (/empezar/[slug],
// que ya resuelve 1 módulo vs. selector de ambigüedad). Se reimplementa la
// interacción en vez de embeber el widget modal porque el paso 1 (intención)
// y la ubicación (tarjeta inline en el Hero, no modal flotante) son
// distintos — la lógica de ruteo y los datos no se duplican.
export function HeroStarter({ groups }: { groups: AssistantGroup[] }) {
  const [step, setStep] = useState<"intent" | "tasks">("intent");
  const [selectedGroup, setSelectedGroup] = useState<AssistantGroup | null>(null);
  const router = useRouter();

  const goToTask = (slug: string) => {
    router.push(`/empezar/${slug}`);
  };

  const startTaskPicker = () => {
    setSelectedGroup(null);
    setStep("tasks");
  };

  return (
    <div className="rounded-2xl bg-white border border-border p-5 md:p-6">
      {step === "intent" && (
        <>
          <p className="font-semibold text-[15px] mb-4">¿Qué quieres hacer?</p>
          <div className="grid gap-2.5">
            <button
              onClick={startTaskPicker}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-left border border-border hover:border-safety/40 hover:bg-concrete transition-colors"
            >
              <Hammer className="w-4 h-4 text-navy shrink-0" />
              <span className="flex-1">Construir algo nuevo</span>
              <ChevronRight className="w-4 h-4 text-ink-faint shrink-0" />
            </button>
            <button
              onClick={startTaskPicker}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-left border border-border hover:border-safety/40 hover:bg-concrete transition-colors"
            >
              <Wrench className="w-4 h-4 text-navy shrink-0" />
              <span className="flex-1">Remodelar o reparar algo que ya tengo</span>
              <ChevronRight className="w-4 h-4 text-ink-faint shrink-0" />
            </button>
            <a
              href="/?vista=material#empezar"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-left border border-border hover:border-safety/40 hover:bg-concrete transition-colors"
            >
              <Calculator className="w-4 h-4 text-navy shrink-0" />
              <span className="flex-1">Solo quiero calcular materiales de algo puntual</span>
              <ChevronRight className="w-4 h-4 text-ink-faint shrink-0" />
            </a>
          </div>
        </>
      )}

      {step === "tasks" && !selectedGroup && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="font-semibold text-[15px]">¿Qué quieres hacer específicamente?</p>
            <button
              onClick={() => setStep("intent")}
              className="text-xs text-ink-muted hover:text-ink"
            >
              ← Volver
            </button>
          </div>
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
        </>
      )}

      {step === "tasks" && selectedGroup && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="font-semibold text-[15px]">{selectedGroup.name}</p>
            <button
              onClick={() => setSelectedGroup(null)}
              className="text-xs text-ink-muted hover:text-ink"
            >
              ← Volver
            </button>
          </div>
          <p className="text-xs text-ink-muted mb-2">Elige el que más se parece a tu proyecto:</p>
          <div className="grid gap-2">
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
          </div>
        </>
      )}
    </div>
  );
}
