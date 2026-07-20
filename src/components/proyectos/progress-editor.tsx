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
    <div className="flex items-center gap-2 w-full" onClick={(e) => e.stopPropagation()}>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={value}
        onChange={(e) => commit(Number(e.target.value))}
        disabled={isPending}
        className="h-1.5 flex-1 rounded-full appearance-none cursor-pointer accent-safety"
        style={{
          background: `linear-gradient(to right, #E8622C ${value}%, #E4E1D8 ${value}%)`,
        }}
      />
      <span className="font-mono text-xs text-ink-muted w-9 text-right flex-shrink-0">{value}%</span>
    </div>
  );
}
