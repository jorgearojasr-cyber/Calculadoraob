export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path
        d="M12 2.5 L20.5 7.5 L20.5 16.5 L12 21.5 L3.5 16.5 L3.5 7.5 Z"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <path d="M12 9V15M9 12H15" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
    </svg>
  );
}
