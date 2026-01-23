export function formatMoney(
  value: number | null | undefined,
  locale = "es-CO",
  currency?: string
) {
  const safe = typeof value === "number" && !isNaN(value) ? value : 0;

  return currency
    ? safe.toLocaleString(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
      })
    : safe.toLocaleString(locale);
}