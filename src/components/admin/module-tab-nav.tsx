"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function ModuleTabNav({ moduleId }: { moduleId: string }) {
  const pathname = usePathname();
  const base = `/admin/modulos/${moduleId}`;

  const tabs = [
    { href: base, label: "General" },
    { href: `${base}/preguntas`, label: "Preguntas" },
    { href: `${base}/variables`, label: "Variables" },
    { href: `${base}/formulas`, label: "Fórmulas" },
    { href: `${base}/materiales`, label: "Materiales" },
    { href: `${base}/preview`, label: "Vista previa" },
  ];

  return (
    <nav className="flex items-center gap-1 border-b border-border">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`text-sm px-3 py-2.5 border-b-2 -mb-px transition-colors ${
              active
                ? "border-navy text-ink font-medium"
                : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
