"use client";

import { useState, useTransition } from "react";
import { updateProgressAction } from "@/app/(app)/proyectos/actions";

export function ProgressEditor({ id, initialValue }: { id: string; initialValue: number }) {
  const [value, setValue] = useState(initialValue);
  const [isPending, startTransition] = useTransition();

  const commit = (next: number) => {
    const clamped = Math.max(0, Math.min(100, next));
    setValue(clamped);
    startTransition(() => {
      updateProgressAction(id, clamped);
    });
  };

  return (
    <div className="flex items-center gap-3 w-full" onClick={(e) => e.stopPropagation()}>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={value}
        onChange={(e) => commit(Number(e.target.value))}
        disabled={isPending}
        className="h-1.5 flex-1 rounded-full appearance-none cursor-pointer accent-ds-orange-600"
        style={{
          background: `linear-gradient(to right, oklch(64% .19 42) ${value}%, oklch(90% .008 255) ${value}%)`,
        }}
      />
      <span className="font-body text-xs font-semibold text-ds-text-secondary w-9 text-right flex-shrink-0">{value}%</span>
    </div>
  );
}
