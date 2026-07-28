// Marca "Huincha" (dirección visual 2026-07-28): una cinta de medir
// reducida a una barra con marcas + un gancho naranjo en el extremo — el
// gancho es un acento de marca fijo (no sigue `currentColor`, siempre es
// el mismo naranjo) mientras que la barra/marcas heredan el color que le
// pase el contenedor (ver Logo, que la usa sobre un chip azul obra).
export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <rect x="5" y="10" width="15" height="4" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 10V14M13 10V14M17 10V14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path
        d="M5 8.5C3.6 8.5 2.5 9.6 2.5 11C2.5 12.2 3.3 13.2 4.4 13.4"
        stroke="#E8622C"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
