export const STOCK_TIME_ZONE = "America/Argentina/Buenos_Aires";

export function getStockLocalDate(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: STOCK_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function toNullableNumber(value: string | number | null): number | null {
  return value === null ? null : Number(value);
}
