import { slugify } from "./slugify";

export function uniqueSlug(label: string, existing: string[]): string {
  const base = slugify(label) || "item";
  if (!existing.includes(base)) return base;

  let n = 2;
  while (existing.includes(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}
