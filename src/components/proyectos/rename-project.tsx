"use client";

import { useState, useTransition } from "react";
import { Check, Pencil } from "lucide-react";
import { renameProjectAction } from "@/app/(app)/proyectos/actions";

export function RenameProject({ id, initialName }: { id: string; initialName: string }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [isPending, startTransition] = useTransition();

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="group flex items-center gap-2 font-display text-2xl md:text-3xl font-extrabold tracking-tight text-ds-navy-900"
      >
        {name}
        <Pencil className="w-4 h-4 text-ds-text-tertiary opacity-0 group-hover:opacity-100" />
      </button>
    );
  }

  const commit = () => {
    setEditing(false);
    if (!name.trim() || name === initialName) {
      setName(initialName);
      return;
    }
    startTransition(() => {
      renameProjectAction(id, name);
    });
  };

  return (
    <div className="flex items-center gap-2">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && commit()}
        disabled={isPending}
        className="font-display text-2xl md:text-3xl font-extrabold tracking-tight text-ds-navy-900 bg-transparent border-b-2 border-ds-orange-600 outline-none"
      />
      <button onClick={commit} aria-label="Guardar nombre">
        <Check className="w-5 h-5 text-ds-orange-600" />
      </button>
    </div>
  );
}
