"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  createRoomAction,
  updateRoomAction,
  deleteRoomAction,
  type RoomInput,
} from "@/app/(app)/regularizacion/[id]/actions";
import { STALE_SESSION_ERROR, STALE_SESSION_MESSAGE } from "@/lib/stale-session";
import type { RegularizationRoomType } from "@/generated/prisma/client";

export type RegularizationRoomItem = {
  id: string;
  roomType: RegularizationRoomType;
  label: string | null;
  largo: number;
  ancho: number;
  m2Calculado: number;
};

const ROOM_TYPE_LABELS: Record<RegularizationRoomType, string> = {
  DORMITORIO: "Dormitorio",
  COCINA: "Cocina",
  BANO: "Baño",
  LIVING_COMEDOR: "Living-comedor",
  LAVANDERIA: "Lavandería",
  BODEGA: "Bodega",
  OTRO: "Otro",
};

// Total del caso NUNCA se persiste (decisión de arquitectura confirmada
// 2026-08-02) — se suma siempre acá, a partir de los recintos actuales
// en memoria, para que jamás pueda desincronizarse.
function sumM2(rooms: RegularizationRoomItem[]): number {
  return Math.round(rooms.reduce((acc, r) => acc + r.m2Calculado, 0) * 100) / 100;
}

export function RegularizationRoomList({
  caseId,
  initialRooms,
}: {
  caseId: string;
  initialRooms: RegularizationRoomItem[];
}) {
  const [rooms, setRooms] = useState(initialRooms);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<{ roomType: RegularizationRoomType; label: string; largo: string; ancho: string }>({
    roomType: "DORMITORIO",
    label: "",
    largo: "",
    ancho: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const resetForm = () => {
    setForm({ roomType: "DORMITORIO", label: "", largo: "", ancho: "" });
    setEditingId(null);
    setError(null);
  };

  const startEdit = (room: RegularizationRoomItem) => {
    setEditingId(room.id);
    setForm({
      roomType: room.roomType,
      label: room.label ?? "",
      largo: String(room.largo),
      ancho: String(room.ancho),
    });
    setError(null);
  };

  const handleSubmit = () => {
    const largo = Number(form.largo);
    const ancho = Number(form.ancho);
    if (!Number.isFinite(largo) || largo <= 0) return setError("El largo debe ser mayor a 0.");
    if (!Number.isFinite(ancho) || ancho <= 0) return setError("El ancho debe ser mayor a 0.");
    setError(null);

    const input: RoomInput = { roomType: form.roomType, label: form.label.trim() || null, largo, ancho };

    startTransition(async () => {
      const result = editingId
        ? await updateRoomAction(caseId, editingId, input)
        : await createRoomAction(caseId, input);

      if (result.error) {
        if (result.error === STALE_SESSION_ERROR) setSessionError(STALE_SESSION_MESSAGE);
        else setError(result.error);
        return;
      }

      const m2Calculado = Math.round(largo * ancho * 100) / 100;
      if (editingId) {
        setRooms((prev) => prev.map((r) => (r.id === editingId ? { ...r, ...input, m2Calculado } : r)));
      } else if (result.id) {
        setRooms((prev) => [...prev, { id: result.id!, ...input, m2Calculado }]);
      }
      resetForm();
    });
  };

  const handleDelete = (roomId: string) => {
    const prevRooms = rooms;
    setRooms((prev) => prev.filter((r) => r.id !== roomId));
    startTransition(async () => {
      const result = await deleteRoomAction(caseId, roomId);
      if (result.error) {
        setRooms(prevRooms);
        if (result.error === STALE_SESSION_ERROR) setSessionError(STALE_SESSION_MESSAGE);
      }
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm p-5 sm:p-8">
      <h2 className="font-display text-lg font-semibold tracking-tight mb-4">Recintos</h2>

      {sessionError && (
        <div className="rounded-2xl p-4 mb-4 bg-safety-tint border border-safety/30 text-sm text-safety">
          {sessionError}{" "}
          <Link href={`/login?callbackUrl=%2Fregularizacion%2F${caseId}`} className="font-semibold underline">
            Iniciar sesión
          </Link>
        </div>
      )}

      {rooms.length > 0 && (
        <div className="rounded-xl px-4 py-3 bg-concrete mb-4">
          <p className="text-xs font-mono uppercase tracking-wider text-ink-muted mb-1">Superficie total</p>
          <p className="text-2xl font-semibold text-ink">{sumM2(rooms)} m²</p>
        </div>
      )}

      <div className="grid gap-3 mb-5">
        {rooms.map((room) => (
          <div key={room.id} className="rounded-xl p-4 border border-border flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink">
                {ROOM_TYPE_LABELS[room.roomType]}
                {room.label ? ` — ${room.label}` : ""}
              </p>
              <p className="text-xs text-ink-muted mt-0.5">
                {room.largo}m × {room.ancho}m = {room.m2Calculado} m²
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => startEdit(room)}
                disabled={isPending}
                className="text-xs font-medium text-action underline disabled:opacity-50"
              >
                Editar
              </button>
              <button
                onClick={() => handleDelete(room.id)}
                disabled={isPending}
                className="text-xs font-medium text-safety underline disabled:opacity-50"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl p-4 bg-concrete grid gap-3">
        <p className="text-xs font-mono uppercase tracking-wider text-ink-muted">
          {editingId ? "Editar recinto" : "Agregar recinto"}
        </p>
        <select
          value={form.roomType}
          onChange={(e) => setForm((f) => ({ ...f, roomType: e.target.value as RegularizationRoomType }))}
          className="rounded-lg border border-border px-3 py-2 text-sm bg-white"
        >
          {Object.entries(ROOM_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Etiqueta (opcional)"
          value={form.label}
          onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
          className="rounded-lg border border-border px-3 py-2 text-sm"
        />
        <div className="flex gap-3">
          <input
            type="number"
            placeholder="Largo (m)"
            value={form.largo}
            onChange={(e) => setForm((f) => ({ ...f, largo: e.target.value }))}
            className="rounded-lg border border-border px-3 py-2 text-sm flex-1 min-w-0"
          />
          <input
            type="number"
            placeholder="Ancho (m)"
            value={form.ancho}
            onChange={(e) => setForm((f) => ({ ...f, ancho: e.target.value }))}
            className="rounded-lg border border-border px-3 py-2 text-sm flex-1 min-w-0"
          />
        </div>
        {error && <p className="text-sm text-safety">{error}</p>}
        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="rounded-full px-5 py-2 text-sm font-semibold text-white bg-action disabled:opacity-50"
          >
            {editingId ? "Guardar cambios" : "Agregar"}
          </button>
          {editingId && (
            <button onClick={resetForm} disabled={isPending} className="text-sm text-ink-muted underline">
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
