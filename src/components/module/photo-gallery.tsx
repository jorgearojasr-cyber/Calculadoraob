// Galería simple de fotos de obra aprobadas para un módulo. Si no hay
// ninguna foto aprobada todavía, no renderiza nada — no es un estado vacío,
// es una sección que directamente no aplica todavía.
export function PhotoGallery({ photos }: { photos: { id: string; url: string }[] }) {
  if (photos.length === 0) return null;

  return (
    <div className="mt-8">
      <p className="text-xs font-mono uppercase tracking-wider text-ink-muted mb-3">
        Fotos de otros usuarios
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {photos.map((photo) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={photo.id}
            src={photo.url}
            alt="Foto de una obra real compartida por otro usuario"
            className="w-full aspect-square object-cover rounded-xl border border-border"
          />
        ))}
      </div>
    </div>
  );
}
