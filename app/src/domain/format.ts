export function formatNumber(value: number, maximumFractionDigits = 0): string {
  return new Intl.NumberFormat('es-ES', {
    maximumFractionDigits,
  }).format(value);
}

export function formatKcal(value: number): string {
  return `${formatNumber(Math.max(0, Math.round(value)))} kcal`;
}

export function formatMacro(value: number): string {
  return `${formatNumber(Math.max(0, value), value < 10 ? 1 : 0)} g`;
}
