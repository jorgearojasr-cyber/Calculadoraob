"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SpaceLevel2Panel } from "./space-level2-panel";
import {
  needsLevel2Onboarding,
  type SpaceConfigJson,
  type SpaceConfigurableComponent,
} from "@/lib/inspecciones/space-config";

const FOCUS_RING =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action";

// Fase 11Y — envuelve el resto del contenido del espacio (fotos +
// checklist + navegación). Si el recinto tiene componentes configurables
// Nivel 2 sin responder todavía, BLOQUEA ese contenido y muestra el
// panel de configuración en su lugar (sección 5 de la fase — "debe
// sentirse como preparación rápida del recinto", no un wizard aparte).
// Si ya está configurado (explícito o implícito por compatibilidad
// histórica, sección 15), el contenido se muestra normalmente con un
// botón secundario "Editar configuración" — nunca vuelve a bloquear
// (sección 13).
export function SpaceLevel2Gate({
  spaceId,
  components,
  initialConfig,
  existingElementKeys,
  children,
}: {
  spaceId: string;
  components: SpaceConfigurableComponent[];
  initialConfig: SpaceConfigJson;
  existingElementKeys: string[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [config, setConfig] = useState(initialConfig);
  const [editing, setEditing] = useState(false);

  if (components.length === 0) return <>{children}</>;

  const needsOnboarding = needsLevel2Onboarding(components, config, new Set(existingElementKeys));

  if (needsOnboarding) {
    return (
      <SpaceLevel2Panel
        mode="onboarding"
        spaceId={spaceId}
        components={components}
        config={config}
        existingElementKeys={existingElementKeys}
        onSaved={(next) => {
          setConfig(next);
          router.refresh();
        }}
      />
    );
  }

  return (
    <>
      <div className="flex justify-end -mb-1">
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className={`min-h-11 inline-flex items-center px-2 text-sm font-medium text-ink-muted hover:text-ink ${FOCUS_RING}`}
        >
          {editing ? "Cerrar configuración" : "Editar configuración"}
        </button>
      </div>
      {editing && (
        <SpaceLevel2Panel
          mode="edit"
          spaceId={spaceId}
          components={components}
          config={config}
          existingElementKeys={existingElementKeys}
          onSaved={(next) => {
            setConfig(next);
            setEditing(false);
            router.refresh();
          }}
          onCancel={() => setEditing(false)}
        />
      )}
      {children}
    </>
  );
}
