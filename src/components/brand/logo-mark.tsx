// Marca real "ObraBien" (sistema de marca definitivo 2026-07-28): casa +
// check. La casa hereda el color que le pase el contenedor (marino sobre
// fondo claro, blanco sobre el chrome oscuro del sidebar — ver Logo), el
// check es un acento de marca fijo, siempre naranjo #FF4E00, sin importar
// el contexto. Icono/wordmark no se modifican — solo el color de la casa
// se adapta para mantener contraste en fondos oscuros.
export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 60" className={className} fill="none">
      <path
        d="M10,55 L10,25 L28,8 L34,13 L34,8 L40,8 L40,15 L48,25 L48,55 Z"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d="M18,34 L29,45 L58,2"
        stroke="#FF4E00"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
