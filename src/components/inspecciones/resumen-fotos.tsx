import { Camera } from "lucide-react";

export type ResumenFotoGrupo = { label: string; photos: { id: string; url: string }[] };

// Fase 8, sección 8 — agrupa SOLO fotos generales/de espacio/de elemento
// (nunca de nivel "case" técnico expuesto como id). Las fotos de
// observación se muestran junto a su hallazgo (ResumenHallazgoCard), no
// acá, para no duplicarlas en dos lugares del mismo resumen.
export function ResumenFotos({ grupos }: { grupos: ResumenFotoGrupo[] }) {
  const conFotos = grupos.filter((g) => g.photos.length > 0);
  if (conFotos.length === 0) return null;

  return (
    <div className="rounded-2xl p-6 bg-white border border-border">
      <p className="text-xs font-mono uppercase tracking-wider text-ink-muted mb-3 flex items-center gap-1.5">
        <Camera className="w-3.5 h-3.5" />
        Fotografías
      </p>
      <div className="grid gap-4">
        {conFotos.map((grupo) => (
          <div key={grupo.label}>
            <p className="text-xs font-medium text-ink-muted mb-2">{grupo.label}</p>
            <div className="flex flex-wrap gap-2">
              {grupo.photos.map((p) => (
                // eslint-disable-next-line @next/next/no-img-element -- URL de Vercel Blob, mismo patrón que photo-upload.tsx
                <img key={p.id} src={p.url} alt="" className="w-16 h-16 rounded-lg object-cover border border-border" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
