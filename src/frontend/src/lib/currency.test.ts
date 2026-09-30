import {
  CURRENCIES,
  convert,
  currencyName,
  currencySymbol,
  formatAmount,
  formatRate,
  getCurrency,
  parseAmount,
} from "@/lib/currency";
import { describe, expect, it } from "vitest";

describe("currency helpers", () => {
  it("converts an amount through a rates map expressed against a base", () => {
    const rates = { USD: 1, EUR: 0.9, JPY: 150 };
    expect(convert(100, "USD", "EUR", rates)).toBeCloseTo(90);
    expect(convert(100, "USD", "JPY", rates)).toBeCloseTo(15000);
    expect(convert(150, "JPY", "USD", rates)).toBeCloseTo(1);
  });

  it("returns null when a currency is missing or the base rate is zero", () => {
    expect(convert(10, "USD", "XXX", { USD: 1 })).toBeNull();
    expect(convert(10, "USD", "EUR", { USD: 0, EUR: 1 })).toBeNull();
  });

  it("parses user-entered amounts tolerating separators and spaces", () => {
    expect(parseAmount("1,234.5")).toBe(1234.5);
    expect(parseAmount(" 42 ")).toBe(42);
    expect(parseAmount("")).toBeNull();
    expect(parseAmount("abc")).toBeNull();
  });

  it("formats amounts and rates with sensible precision", () => {
    expect(formatAmount(1234.567, "USD")).toBe("1,234.57");
    expect(formatRate(1.234567)).toBe("1.2346");
  });

  it("exposes a curated currency catalogue with lookups", () => {
    expect(CURRENCIES.length).toBeGreaterThan(10);
    expect(getCurrency("USD")?.name).toBe("US Dollar");
    expect(currencyName("EUR")).toBe("Euro");
    expect(currencySymbol("JPY")).toBe("¥");
    expect(currencyName("ZZZ")).toBe("ZZZ");
  });
});
