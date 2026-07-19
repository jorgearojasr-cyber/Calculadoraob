const formatter = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 2 });

export function formatQuantity(value: number): string {
  return formatter.format(value);
}
