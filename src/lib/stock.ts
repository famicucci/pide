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

export function stockDateBoundaryUtc(date: string, endExclusive = false): string {
  // Argentina currently uses UTC-03:00 year-round. Parsing with the explicit
  // offset keeps database filtering independent from the server's timezone.
  const boundary = new Date(`${date}T00:00:00-03:00`);
  if (endExclusive) boundary.setUTCDate(boundary.getUTCDate() + 1);
  return boundary.toISOString().slice(0, 19).replace("T", " ");
}

export function toNullableNumber(value: string | number | null): number | null {
  return value === null ? null : Number(value);
}
