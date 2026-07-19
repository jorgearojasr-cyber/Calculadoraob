"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";

export function DeleteButton({
  confirmMessage,
  onDelete,
  label = "Eliminar",
}: {
  confirmMessage: string;
  onDelete: () => Promise<{ error?: string }>;
  label?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    if (!window.confirm(confirmMessage)) return;
    setError(null);
    startTransition(async () => {
      const result = await onDelete();
      if (result?.error) setError(result.error);
    });
  };

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={isPending}
        className="text-xs font-medium text-safety hover:underline disabled:opacity-50 inline-flex items-center gap-1"
      >
        <Trash2 className="w-3.5 h-3.5" />
        {isPending ? "Eliminando…" : label}
      </button>
      {error && <p className="mt-1 text-xs text-safety max-w-xs">{error}</p>}
    </div>
  );
}
