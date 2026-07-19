export function BlueprintTick({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none">
      <path d="M1 8H5M11 8H15M8 1V5M8 11V15" stroke="currentColor" strokeWidth={1} />
    </svg>
  );
}
