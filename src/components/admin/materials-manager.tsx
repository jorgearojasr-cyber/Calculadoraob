"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus, Unlink } from "lucide-react";
import {
  linkMaterialAction,
  unlinkMaterialAction,
  updateMaterialAction,
} from "@/app/admin/modulos/[id]/materiales/actions";

type Formula = { id: string; label: string; unit: string; materialId: string | null };
type Material = { id: string; name: string; unit: string };

export function MaterialsManager({
  moduleId,
  formulas,
  materials,
}: {
  moduleId: string;
  formulas: Formula[];
  materials: Material[];
}) {
  const [isPending, startTransition] = useTransition();
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editUnit, setEditUnit] = useState("");

  const [linking, setLinking] = useState(false);
  const [linkFormulaId, setLinkFormulaId] = useState("");
  const [linkMode, setLinkMode] = useState<"existing" | "new">("new");
  const [linkMaterialId, setLinkMaterialId] = useState("");
  const [newName, setNewName] = useState("");
  const [newUnit, setNewUnit] = useState("");
  const [error, setError] = useState<string | null>(null);

  const materialsById = Object.fromEntries(materials.map((m) => [m.id, m]));
  const linkedFormulas = formulas.filter((f) => f.materialId);
  const unlinkedFormulas = formulas.filter((f) => !f.materialId);

  const handleUnlink = (formulaId: string, materialName: string) => {
    if (!window.confirm(`¿Quitar el vínculo de "${materialName}" con esta fórmula?`)) return;
    startTransition(async () => {
      await unlinkMaterialAction(moduleId, formulaId);
    });
  };

  const startEditMaterial = (material: Material) => {
    setEditingMaterialId(material.id);
    setEditName(material.name);
    setEditUnit(material.unit);
  };

  const handleSaveMaterial = () => {
    if (!editingMaterialId) return;
    setError(null);
    startTransition(async () => {
      const result = await updateMaterialAction(moduleId, editingMaterialId, {
        name: editName,
        unit: editUnit,
      });
      if (result?.error) setError(result.error);
      else setEditingMaterialId(null);
    });
  };

  const handleLink = () => {
    setError(null);
    startTransition(async () => {
      const result = await linkMaterialAction(moduleId, {
        formulaId: linkFormulaId,
        materialId: linkMode === "existing" ? linkMaterialId : undefined,
        newMaterial: linkMode === "new" ? { name: newName, unit: newUnit } : undefined,
      });
      if (result?.error) setError(result.error);
      else {
        setLinking(false);
        setLinkFormulaId("");
        setLinkMaterialId("");
        setNewName("");
        setNewUnit("");
      }
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-display text-xl font-semibold tracking-tight">Materiales</h2>
        {!linking && unlinkedFormulas.length > 0 && (
          <button
            onClick={() => setLinking(true)}
            className="rounded-full px-4 py-2 text-sm font-medium text-white flex items-center gap-1.5 bg-ink"
          >
            <Plus className="w-4 h-4" />
            Vincular material
          </button>
        )}
      </div>
      <p className="text-xs text-ink-muted mb-4">
        Cada material se asocia a la fórmula que calcula su cantidad. El catálogo de materiales es
        global — si editas el nombre o la unidad, cambia también en otros módulos que lo usen.
      </p>

      {linking && (
        <div className="rounded-xl p-5 bg-white border border-border grid gap-3 mb-4 max-w-md">
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">Fórmula que calcula la cantidad</span>
            <select
              value={linkFormulaId}
              onChange={(e) => setLinkFormulaId(e.target.value)}
              className="rounded-lg px-3 py-2 bg-white border border-border outline-none focus:border-ink"
            >
              <option value="">Elige una fórmula</option>
              {unlinkedFormulas.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label} ({f.unit})
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-center gap-4 text-sm">
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                checked={linkMode === "new"}
                onChange={() => setLinkMode("new")}
              />
              Material nuevo
            </label>
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                checked={linkMode === "existing"}
                onChange={() => setLinkMode("existing")}
                disabled={materials.length === 0}
              />
              Material existente
            </label>
          </div>

          {linkMode === "new" ? (
            <div className="flex items-center gap-3">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder='Nombre, ej: "Cemento"'
                className="rounded-lg px-3 py-2 bg-white border border-border outline-none focus:border-ink flex-1"
              />
              <input
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
                placeholder='Unidad, ej: "bolsa"'
                className="rounded-lg px-3 py-2 bg-white border border-border outline-none focus:border-ink w-32"
              />
            </div>
          ) : (
            <select
              value={linkMaterialId}
              onChange={(e) => setLinkMaterialId(e.target.value)}
              className="rounded-lg px-3 py-2 bg-white border border-border outline-none focus:border-ink"
            >
              <option value="">Elige un material</option>
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.unit})
                </option>
              ))}
            </select>
          )}

          {error && <p className="text-sm text-safety">{error}</p>}

          <div className="flex items-center gap-3">
            <button
              onClick={handleLink}
              disabled={isPending}
              className="rounded-full px-5 py-2 text-sm font-semibold text-white bg-ink disabled:opacity-50"
            >
              {isPending ? "Guardando…" : "Vincular"}
            </button>
            <button onClick={() => setLinking(false)} className="text-sm text-ink-muted hover:text-ink">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {linkedFormulas.length === 0 ? (
        <p className="text-sm text-ink-muted rounded-xl p-5 bg-white border border-border">
          Todavía no hay materiales vinculados a una fórmula.
        </p>
      ) : (
        <div className="rounded-xl border border-border bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-ink-muted font-mono uppercase tracking-wider">
                <th className="px-4 py-2 font-medium">Material</th>
                <th className="px-4 py-2 font-medium">Unidad</th>
                <th className="px-4 py-2 font-medium">Fórmula de cantidad</th>
                <th className="px-4 py-2 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {linkedFormulas.map((f) => {
                const material = materialsById[f.materialId!];
                if (!material) return null;
                const isEditing = editingMaterialId === material.id;
                return (
                  <tr key={f.id} className="border-b border-border last:border-0">
                    {isEditing ? (
                      <>
                        <td className="px-4 py-2">
                          <input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="rounded-md px-2 py-1 text-sm bg-white border border-border outline-none w-full"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            value={editUnit}
                            onChange={(e) => setEditUnit(e.target.value)}
                            className="rounded-md px-2 py-1 text-sm bg-white border border-border outline-none w-24"
                          />
                        </td>
                        <td className="px-4 py-2 text-ink-muted">{f.label}</td>
                        <td className="px-4 py-2 text-right">
                          <button
                            onClick={handleSaveMaterial}
                            disabled={isPending}
                            className="text-xs font-medium text-blueprint hover:underline mr-3"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={() => setEditingMaterialId(null)}
                            className="text-xs text-ink-muted hover:text-ink"
                          >
                            Cancelar
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-2 font-medium">{material.name}</td>
                        <td className="px-4 py-2 text-ink-muted">{material.unit}</td>
                        <td className="px-4 py-2 text-ink-muted">{f.label}</td>
                        <td className="px-4 py-2 text-right">
                          <button
                            onClick={() => startEditMaterial(material)}
                            className="text-xs font-medium text-blueprint hover:underline inline-flex items-center gap-1 mr-3"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Editar
                          </button>
                          <button
                            onClick={() => handleUnlink(f.id, material.name)}
                            className="text-xs font-medium text-safety hover:underline inline-flex items-center gap-1"
                          >
                            <Unlink className="w-3.5 h-3.5" />
                            Desvincular
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
