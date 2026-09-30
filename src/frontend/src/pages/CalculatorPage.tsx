import { Button } from "@/components/ui/button";
import {
  type HistoryEntry,
  OPERATOR_GLYPH,
  type Operator,
  appendDigit,
  appendOperator,
  applyPercent,
  backspace,
  endsWithOperator,
  evaluateExpression,
  formatExpression,
  formatResult,
  toggleSign,
} from "@/lib/calculator";
import { cn } from "@/lib/utils";
import { Delete, Eraser, History, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/** Keypad layout — data-driven so the grid and keyboard share one source. */
interface KeyDef {
  label: string;
  /** Keyboard keys that trigger this button. */
  keys: string[];
  variant: "digit" | "operator" | "function" | "equals";
  action:
    | "digit"
    | "operator"
    | "equals"
    | "clear"
    | "backspace"
    | "percent"
    | "sign";
  value?: string;
  ariaLabel?: string;
}

const KEYS: KeyDef[] = [
  {
    label: "C",
    keys: ["Escape"],
    variant: "function",
    action: "clear",
    ariaLabel: "Clear",
  },
  {
    label: "±",
    keys: [],
    variant: "function",
    action: "sign",
    ariaLabel: "Toggle sign",
  },
  {
    label: "%",
    keys: ["%"],
    variant: "function",
    action: "percent",
    ariaLabel: "Percent",
  },
  {
    label: "÷",
    keys: ["/"],
    variant: "operator",
    action: "operator",
    value: "/",
    ariaLabel: "Divide",
  },

  { label: "7", keys: ["7"], variant: "digit", action: "digit", value: "7" },
  { label: "8", keys: ["8"], variant: "digit", action: "digit", value: "8" },
  { label: "9", keys: ["9"], variant: "digit", action: "digit", value: "9" },
  {
    label: "×",
    keys: ["*", "x"],
    variant: "operator",
    action: "operator",
    value: "*",
    ariaLabel: "Multiply",
  },

  { label: "4", keys: ["4"], variant: "digit", action: "digit", value: "4" },
  { label: "5", keys: ["5"], variant: "digit", action: "digit", value: "5" },
  { label: "6", keys: ["6"], variant: "digit", action: "digit", value: "6" },
  {
    label: "−",
    keys: ["-"],
    variant: "operator",
    action: "operator",
    value: "-",
    ariaLabel: "Subtract",
  },

  { label: "1", keys: ["1"], variant: "digit", action: "digit", value: "1" },
  { label: "2", keys: ["2"], variant: "digit", action: "digit", value: "2" },
  { label: "3", keys: ["3"], variant: "digit", action: "digit", value: "3" },
  {
    label: "+",
    keys: ["+"],
    variant: "operator",
    action: "operator",
    value: "+",
    ariaLabel: "Add",
  },

  { label: "0", keys: ["0"], variant: "digit", action: "digit", value: "0" },
  { label: ".", keys: ["."], variant: "digit", action: "digit", value: "." },
  {
    label: "⌫",
    keys: ["Backspace"],
    variant: "function",
    action: "backspace",
    ariaLabel: "Backspace",
  },
  {
    label: "=",
    keys: ["Enter", "="],
    variant: "equals",
    action: "equals",
    ariaLabel: "Equals",
  },
];

const KEY_BY_KEY = new Map<string, KeyDef>();
for (const key of KEYS) {
  for (const binding of key.keys) {
    KEY_BY_KEY.set(binding, key);
  }
}

const VARIANT_CLASS: Record<KeyDef["variant"], string> = {
  digit: "bg-card text-foreground hover:bg-secondary border border-border",
  operator:
    "bg-secondary text-foreground hover:bg-secondary/70 border border-border font-display text-lg",
  function:
    "bg-muted text-muted-foreground hover:bg-muted/70 border border-border",
  equals: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-stamp",
};

export function CalculatorPage() {
  const [expression, setExpression] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const historyId = useRef(0);

  const display = useMemo(() => {
    if (expression.length === 0) return "0";
    return formatExpression(expression);
  }, [expression]);

  const commit = useCallback((nextExpression: string) => {
    try {
      const value = evaluateExpression(nextExpression);
      const formatted = formatResult(value);
      setResult(formatted);
      setError(null);
      historyId.current += 1;
      setHistory((entries) => [
        {
          id: `calc-${historyId.current}`,
          expression: formatExpression(nextExpression),
          result: formatted,
        },
        ...entries,
      ]);
      setExpression(formatted);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Invalid expression");
      setResult(null);
    }
  }, []);

  const press = useCallback(
    (key: KeyDef) => {
      setError(null);
      switch (key.action) {
        case "digit":
          setExpression((current) => appendDigit(current, key.value ?? ""));
          break;
        case "operator":
          setExpression((current) =>
            appendOperator(current, (key.value ?? "+") as Operator),
          );
          break;
        case "percent":
          setExpression((current) => applyPercent(current));
          break;
        case "sign":
          setExpression((current) => toggleSign(current));
          break;
        case "backspace":
          setExpression((current) => backspace(current));
          break;
        case "clear":
          setExpression("");
          setResult(null);
          break;
        case "equals":
          setExpression((current) => {
            if (current.length === 0 || endsWithOperator(current))
              return current;
            commit(current);
            return current;
          });
          break;
      }
    },
    [commit],
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const key = KEY_BY_KEY.get(event.key);
      if (!key) return;
      event.preventDefault();
      press(key);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [press]);

  const clearHistory = useCallback(() => setHistory([]), []);

  return (
    <div className="rule-grid-fine min-h-full">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8">
        <header className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Compute
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Calculator
            </h1>
          </div>
          <p className="font-mono text-xs text-muted-foreground">
            Keyboard ready · digits, + − × ÷, Enter, Esc
          </p>
        </header>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          {/* ---- Keypad + display ---- */}
          <section
            data-ocid="calculator.panel"
            className="border border-border bg-card p-4 shadow-subtle sm:p-5"
          >
            <div
              data-ocid="calculator.display"
              className="bg-ink-wash border border-border px-4 py-4 text-right"
            >
              <div
                className="min-h-6 truncate font-mono text-sm text-muted-foreground"
                aria-hidden="true"
              >
                {expression.length > 0 ? display : "\u00a0"}
              </div>
              <output
                aria-live="polite"
                aria-label="Calculator result"
                className={cn(
                  "mt-1 block truncate font-mono text-3xl font-semibold tabular-nums sm:text-4xl",
                  error ? "text-destructive" : "text-foreground",
                )}
              >
                {error ?? result ?? (expression.length > 0 ? display : "0")}
              </output>
            </div>

            {error ? (
              <p
                data-ocid="calculator.error_state"
                role="alert"
                className="mt-2 text-xs text-destructive"
              >
                {error}
              </p>
            ) : null}

            <div className="mt-4 grid grid-cols-4 gap-2">
              {KEYS.map((key) => (
                <Button
                  key={key.label}
                  type="button"
                  variant="ghost"
                  aria-label={key.ariaLabel ?? key.label}
                  data-ocid={`calculator.key.${key.label}`}
                  onClick={() => press(key)}
                  className={cn(
                    "h-14 rounded-sm text-base font-medium transition-smooth active:translate-y-px sm:h-16",
                    VARIANT_CLASS[key.variant],
                  )}
                >
                  {key.label}
                </Button>
              ))}
            </div>
          </section>

          {/* ---- History tape ---- */}
          <aside
            data-ocid="calculator.history_panel"
            className="flex max-h-[32rem] flex-col border border-border bg-card shadow-subtle"
          >
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <History className="size-4 text-muted-foreground" />
              <h2 className="font-display text-sm font-semibold tracking-tight">
                Tape
              </h2>
              <span className="ml-auto font-mono text-xs text-muted-foreground">
                {history.length.toString().padStart(2, "0")}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearHistory}
                disabled={history.length === 0}
                data-ocid="calculator.clear_history_button"
                className="rounded-sm text-muted-foreground hover:text-foreground"
              >
                <Eraser className="size-3.5" />
                Clear
              </Button>
            </div>

            {history.length === 0 ? (
              <div
                data-ocid="calculator.history_empty_state"
                className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-12 text-center"
              >
                <RotateCcw className="size-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground text-pretty">
                  Results you calculate will stack here, newest first.
                </p>
              </div>
            ) : (
              <ul
                data-ocid="calculator.history_list"
                className="flex-1 divide-y divide-border overflow-y-auto"
              >
                {history.map((entry, index) => (
                  <li
                    key={entry.id}
                    data-ocid={`calculator.history_item.${index + 1}`}
                    className="px-4 py-2.5"
                  >
                    <p className="truncate font-mono text-xs text-muted-foreground">
                      {entry.expression}
                    </p>
                    <p className="truncate font-mono text-base font-semibold tabular-nums">
                      = {entry.result}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>

        <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Delete className="size-3.5" />
          Backspace deletes the last entry; Esc clears the current expression.
        </p>
      </div>
    </div>
  );
}
