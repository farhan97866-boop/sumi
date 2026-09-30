/**
 * Currency data + live exchange-rate access.
 *
 * Rates come from ExchangeRate-API's Open Access endpoint
 * (https://open.er-api.com/v6/latest/{BASE}) — a public, no-key source that
 * publishes once-daily rates and requires attribution back to
 * exchangerate-api.com. The endpoint returns every supported currency in a
 * single response, so one fetch per base currency is enough.
 */

export interface Currency {
  /** ISO 4217 three-letter code, e.g. "USD". */
  code: string;
  /** Human-readable currency name. */
  name: string;
  /** Currency symbol used in the amount field. */
  symbol: string;
}

/** Curated set of major world currencies, ordered by trading prominence. */
export const CURRENCIES: Currency[] = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "CHF", name: "Swiss Franc", symbol: "Fr" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
  { code: "KRW", name: "South Korean Won", symbol: "₩" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "SEK", name: "Swedish Krona", symbol: "kr" },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr" },
  { code: "DKK", name: "Danish Krone", symbol: "kr" },
  { code: "PLN", name: "Polish Złoty", symbol: "zł" },
  { code: "CZK", name: "Czech Koruna", symbol: "Kč" },
  { code: "MXN", name: "Mexican Peso", symbol: "Mex$" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$" },
  { code: "ZAR", name: "South African Rand", symbol: "R" },
  { code: "TRY", name: "Turkish Lira", symbol: "₺" },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ" },
  { code: "SAR", name: "Saudi Riyal", symbol: "﷼" },
  { code: "THB", name: "Thai Baht", symbol: "฿" },
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp" },
  { code: "PHP", name: "Philippine Peso", symbol: "₱" },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM" },
  { code: "VND", name: "Vietnamese Đồng", symbol: "₫" },
  { code: "ILS", name: "Israeli New Shekel", symbol: "₪" },
];

const CURRENCY_BY_CODE = new Map(CURRENCIES.map((c) => [c.code, c]));

export function getCurrency(code: string): Currency | undefined {
  return CURRENCY_BY_CODE.get(code);
}

export function currencyName(code: string): string {
  return CURRENCY_BY_CODE.get(code)?.name ?? code;
}

export function currencySymbol(code: string): string {
  return CURRENCY_BY_CODE.get(code)?.symbol ?? code;
}

/** Raw shape returned by the Open Access endpoint. */
interface OpenAccessResponse {
  result?: string;
  base_code?: string;
  time_last_update_unix?: number;
  time_last_update_utc?: string;
  rates?: Record<string, number>;
  "error-type"?: string;
}

export interface ExchangeRates {
  /** Base currency the rates are expressed against. */
  base: string;
  /** Map of ISO 4217 code → units of that currency per one unit of base. */
  rates: Record<string, number>;
  /** When the provider last refreshed the rates. */
  lastUpdated: Date | null;
}

/**
 * Fetch the latest rates for a base currency from the no-key Open Access
 * endpoint. Throws a readable error when the provider reports a failure.
 */
export async function fetchRates(
  base: string,
  signal?: AbortSignal,
): Promise<ExchangeRates> {
  const response = await fetch(
    `https://open.er-api.com/v6/latest/${encodeURIComponent(base)}`,
    { signal },
  );

  if (!response.ok) {
    throw new Error(`Rate service responded with ${response.status}`);
  }

  const data = (await response.json()) as OpenAccessResponse;

  if (data.result !== "success" || !data.rates) {
    throw new Error(
      data["error-type"]
        ? `Rate service error: ${data["error-type"]}`
        : "Rate service returned an unexpected response",
    );
  }

  const lastUpdated =
    typeof data.time_last_update_unix === "number"
      ? new Date(data.time_last_update_unix * 1000)
      : null;

  return {
    base: data.base_code ?? base,
    rates: data.rates,
    lastUpdated:
      lastUpdated && !Number.isNaN(lastUpdated.getTime()) ? lastUpdated : null,
  };
}

/**
 * Convert `amount` from one currency to another using a rates map expressed
 * against `base`. Returns null when either currency is missing from the map.
 */
export function convert(
  amount: number,
  from: string,
  to: string,
  rates: Record<string, number>,
): number | null {
  const fromRate = rates[from];
  const toRate = rates[to];
  if (typeof fromRate !== "number" || typeof toRate !== "number") return null;
  if (fromRate === 0) return null;
  return (amount / fromRate) * toRate;
}

/** Format a converted amount with sensible precision for its magnitude. */
export function formatAmount(value: number, code: string): string {
  const abs = Math.abs(value);
  const maximumFractionDigits = abs >= 1000 ? 2 : abs >= 1 ? 2 : 4;
  try {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits,
    }).format(value);
  } catch {
    return `${value.toFixed(maximumFractionDigits)} ${code}`;
  }
}

/** Format a unit rate (1 base = X quote) with enough precision to be useful. */
export function formatRate(value: number): string {
  const abs = Math.abs(value);
  const maximumFractionDigits = abs >= 100 ? 2 : abs >= 1 ? 4 : 6;
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits,
  }).format(value);
}

/** Parse a user-entered amount, tolerating thousands separators and spaces. */
export function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/[\s,]/g, "");
  if (cleaned === "") return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value)) return null;
  return value;
}
