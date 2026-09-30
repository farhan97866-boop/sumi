import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CURRENCIES,
  convert,
  currencyName,
  currencySymbol,
  fetchRates,
  formatAmount,
  formatRate,
  parseAmount,
} from "@/lib/currency";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownUp, RefreshCw, TriangleAlert } from "lucide-react";
import { useMemo, useState } from "react";

const QUICK_AMOUNTS = [1, 10, 100, 1000];

function CurrencySelect({
  value,
  onChange,
  label,
  ocid,
}: {
  value: string;
  onChange: (code: string) => void;
  label: string;
  ocid: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        aria-label={label}
        data-ocid={ocid}
        className="h-11 w-full rounded-sm border-input bg-ink-wash font-mono text-sm"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="max-h-72 rounded-sm">
        {CURRENCIES.map((currency) => (
          <SelectItem
            key={currency.code}
            value={currency.code}
            className="font-mono text-sm"
          >
            <span className="font-semibold">{currency.code}</span>
            <span className="ml-2 text-muted-foreground">{currency.name}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function CurrencyPage() {
  const [amount, setAmount] = useState("100");
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("JPY");

  const { data, isPending, isFetching, isError, error, refetch } = useQuery({
    queryKey: ["rates", from],
    queryFn: ({ signal }) => fetchRates(from, signal),
    staleTime: 1000 * 60 * 30,
    retry: 1,
  });

  const parsed = parseAmount(amount);
  const amountError =
    amount.trim() === ""
      ? "Enter an amount to convert."
      : parsed === null
        ? "That doesn't look like a number."
        : parsed < 0
          ? "Amount can't be negative."
          : null;

  const converted = useMemo(() => {
    if (parsed === null || parsed < 0 || !data) return null;
    return convert(parsed, from, to, data.rates);
  }, [parsed, data, from, to]);

  const unitRate = useMemo(() => {
    if (!data) return null;
    return convert(1, from, to, data.rates);
  }, [data, from, to]);

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  const lastUpdatedLabel = data?.lastUpdated
    ? data.lastUpdated.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;

  return (
    <div className="min-h-full">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6 sm:py-10">
        <section className="animate-fade-in">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Compute
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Currency Converter
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground text-pretty sm:text-base">
            Convert between major world currencies at live exchange rates.
          </p>
        </section>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* Work surface */}
          <section
            data-ocid="currency.panel"
            className="border border-border bg-card shadow-subtle"
          >
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
              <h2 className="font-display text-sm font-semibold tracking-tight">
                Convert
              </h2>
              <span className="inline-flex items-center gap-1.5 font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                <span
                  className={
                    isError
                      ? "size-1.5 rounded-full bg-destructive"
                      : "size-1.5 animate-seal-pulse rounded-full bg-success"
                  }
                  aria-hidden="true"
                />
                {isError ? "Offline" : "Live rates"}
              </span>
            </div>

            <div className="p-4 sm:p-5">
              {/* Amount */}
              <label
                htmlFor="currency-amount"
                className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"
              >
                Amount
              </label>
              <div className="mt-2 flex items-stretch gap-2">
                <div className="relative flex-1">
                  <span
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-lg text-muted-foreground"
                    aria-hidden="true"
                  >
                    {currencySymbol(from)}
                  </span>
                  <input
                    id="currency-amount"
                    data-ocid="currency.amount_input"
                    inputMode="decimal"
                    autoComplete="off"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    aria-invalid={amountError !== null}
                    aria-describedby={
                      amountError ? "currency-amount-error" : undefined
                    }
                    className="h-14 w-full rounded-sm border border-input bg-ink-wash pl-9 pr-3 font-mono text-2xl tabular-nums text-foreground outline-none transition-smooth focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 aria-invalid:border-destructive"
                  />
                </div>
                <div className="w-36 shrink-0 sm:w-44">
                  <CurrencySelect
                    value={from}
                    onChange={setFrom}
                    label="Convert from currency"
                    ocid="currency.from_select"
                  />
                </div>
              </div>

              {amountError ? (
                <p
                  id="currency-amount-error"
                  data-ocid="currency.amount_error"
                  className="mt-2 inline-flex items-center gap-1.5 text-xs text-destructive"
                >
                  <TriangleAlert className="size-3.5" />
                  {amountError}
                </p>
              ) : null}

              <div className="mt-2 flex flex-wrap items-center gap-2">
                {QUICK_AMOUNTS.map((quick) => (
                  <button
                    key={quick}
                    type="button"
                    onClick={() => setAmount(String(quick))}
                    data-ocid={`currency.quick.${quick}`}
                    className="rounded-sm border border-border bg-secondary px-2.5 py-1 font-mono text-xs text-secondary-foreground transition-smooth hover:border-ring/40 hover:bg-secondary/70"
                  >
                    {quick.toLocaleString()}
                  </button>
                ))}
              </div>

              {/* Swap */}
              <div className="my-4 flex items-center gap-3">
                <span className="h-px flex-1 bg-border" aria-hidden="true" />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={swap}
                  aria-label="Swap currencies"
                  data-ocid="currency.swap_button"
                  className="rounded-sm border-border bg-card hover:border-ring/40"
                >
                  <ArrowDownUp className="size-4" />
                </Button>
                <span className="h-px flex-1 bg-border" aria-hidden="true" />
              </div>

              {/* Result */}
              <label
                htmlFor="currency-result"
                className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"
              >
                Converted amount
              </label>
              <div className="mt-2 flex items-stretch gap-2">
                <div className="relative flex-1">
                  <span
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-lg text-muted-foreground"
                    aria-hidden="true"
                  >
                    {currencySymbol(to)}
                  </span>
                  <output
                    id="currency-result"
                    data-ocid="currency.result"
                    className="flex h-14 w-full items-center rounded-sm border border-border bg-ink-wash pl-9 pr-3 font-mono text-2xl tabular-nums text-foreground"
                  >
                    {isPending ? (
                      <span className="text-muted-foreground">…</span>
                    ) : converted === null ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      formatAmount(converted, to)
                    )}
                  </output>
                </div>
                <div className="w-36 shrink-0 sm:w-44">
                  <CurrencySelect
                    value={to}
                    onChange={setTo}
                    label="Convert to currency"
                    ocid="currency.to_select"
                  />
                </div>
              </div>

              {/* Rate line */}
              <div className="mt-4 border-t border-border pt-3">
                {isError ? (
                  <div
                    data-ocid="currency.error_state"
                    className="flex flex-wrap items-center justify-between gap-2 text-sm text-destructive"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <TriangleAlert className="size-4" />
                      {error instanceof Error
                        ? error.message
                        : "Couldn't load exchange rates."}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void refetch()}
                      data-ocid="currency.retry_button"
                      className="rounded-sm"
                    >
                      <RefreshCw className="size-3.5" />
                      Retry
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 font-mono text-xs text-muted-foreground">
                    <span data-ocid="currency.rate_line">
                      {isPending || unitRate === null
                        ? "Fetching rate…"
                        : `1 ${from} = ${formatRate(unitRate)} ${to}`}
                    </span>
                    <span data-ocid="currency.updated_at">
                      {isFetching && !isPending
                        ? "Updating…"
                        : lastUpdatedLabel
                          ? `Updated ${lastUpdatedLabel}`
                          : "—"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Side rail */}
          <aside className="flex flex-col gap-4">
            <section
              data-ocid="currency.pair_card"
              className="border border-border bg-card p-4 shadow-subtle"
            >
              <h2 className="font-display text-sm font-semibold tracking-tight">
                Pair
              </h2>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">From</dt>
                  <dd className="text-right">
                    <span className="font-mono font-semibold">{from}</span>
                    <span className="ml-2 text-muted-foreground">
                      {currencyName(from)}
                    </span>
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">To</dt>
                  <dd className="text-right">
                    <span className="font-mono font-semibold">{to}</span>
                    <span className="ml-2 text-muted-foreground">
                      {currencyName(to)}
                    </span>
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-border pt-2">
                  <dt className="text-muted-foreground">Inverse</dt>
                  <dd className="font-mono tabular-nums">
                    {unitRate && unitRate !== 0
                      ? `1 ${to} = ${formatRate(1 / unitRate)} ${from}`
                      : "—"}
                  </dd>
                </div>
              </dl>
            </section>

            <section
              data-ocid="currency.rates_card"
              className="border border-border bg-card p-4 shadow-subtle"
            >
              <h2 className="font-display text-sm font-semibold tracking-tight">
                {from} against
              </h2>
              <ul className="mt-3 space-y-1.5">
                {CURRENCIES.filter((c) => c.code !== from)
                  .slice(0, 8)
                  .map((currency) => {
                    const rate = data?.rates[currency.code];
                    return (
                      <li
                        key={currency.code}
                        className="flex items-center justify-between gap-3 text-sm"
                      >
                        <span className="font-mono text-muted-foreground">
                          {currency.code}
                        </span>
                        <span className="font-mono tabular-nums">
                          {typeof rate === "number" ? formatRate(rate) : "—"}
                        </span>
                      </li>
                    );
                  })}
              </ul>
            </section>

            <p className="px-1 text-xs text-muted-foreground">
              Rates by{" "}
              <a
                href="https://www.exchangerate-api.com"
                target="_blank"
                rel="noreferrer"
                className="text-accent underline-offset-4 hover:underline"
              >
                ExchangeRate-API
              </a>{" "}
              · updated once daily.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}
