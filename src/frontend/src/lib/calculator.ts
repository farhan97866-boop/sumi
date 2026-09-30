/**
 * Sumi calculator engine.
 *
 * A small, dependency-free expression evaluator with standard operator
 * precedence. The UI builds an expression string from key presses and this
 * module turns it into a number. Keeping the parser here (rather than in the
 * component) means the same rules drive the display, the history tape, and
 * keyboard input.
 */

export type Operator = "+" | "-" | "*" | "/";

export interface HistoryEntry {
  id: string;
  expression: string;
  result: string;
}

/** Human-readable glyphs for the operator buttons and the history tape. */
export const OPERATOR_GLYPH: Record<Operator, string> = {
  "+": "+",
  "-": "−",
  "*": "×",
  "/": "÷",
};

/** True when the character is a digit or a decimal point. */
export function isDigit(ch: string): boolean {
  return (ch >= "0" && ch <= "9") || ch === ".";
}

/** True when the character is one of the four arithmetic operators. */
export function isOperator(ch: string): boolean {
  return ch === "+" || ch === "-" || ch === "*" || ch === "/";
}

/**
 * Tokenise an expression into numbers and operators. A leading unary minus is
 * folded into the number that follows it so "-5+2" parses as (-5) + 2.
 */
function tokenize(expression: string): Array<number | Operator> {
  const tokens: Array<number | Operator> = [];
  let index = 0;

  while (index < expression.length) {
    const ch = expression[index];

    if (ch === " ") {
      index += 1;
      continue;
    }

    // Unary minus: at the start, or right after another operator.
    const isUnary =
      ch === "-" &&
      (tokens.length === 0 ||
        (typeof tokens[tokens.length - 1] === "string" &&
          isOperator(tokens[tokens.length - 1] as string)));

    if (isDigit(ch) || isUnary) {
      let literal = isUnary ? "-" : "";
      if (isUnary) index += 1;
      while (index < expression.length && isDigit(expression[index])) {
        literal += expression[index];
        index += 1;
      }
      const value = Number(literal);
      if (Number.isNaN(value)) {
        throw new Error("Invalid number");
      }
      tokens.push(value);
      continue;
    }

    if (isOperator(ch)) {
      tokens.push(ch as Operator);
      index += 1;
      continue;
    }

    throw new Error(`Unexpected character: ${ch}`);
  }

  return tokens;
}

/**
 * Evaluate an expression with standard precedence: × and ÷ bind tighter than
 * + and −, and equal-precedence operators associate left to right.
 *
 * @throws when the expression is malformed (trailing operator, divide by zero).
 */
export function evaluateExpression(expression: string): number {
  const tokens = tokenize(expression);
  if (tokens.length === 0) {
    throw new Error("Empty expression");
  }

  // First pass: resolve × and ÷.
  const reduced: Array<number | Operator> = [];
  let cursor = 0;
  while (cursor < tokens.length) {
    const token = tokens[cursor];
    if (token === "*" || token === "/") {
      const left = reduced.pop();
      const right = tokens[cursor + 1];
      if (typeof left !== "number" || typeof right !== "number") {
        throw new Error("Malformed expression");
      }
      if (token === "/" && right === 0) {
        throw new Error("Cannot divide by zero");
      }
      reduced.push(token === "*" ? left * right : left / right);
      cursor += 2;
      continue;
    }
    reduced.push(token);
    cursor += 1;
  }

  // Second pass: resolve + and − left to right.
  let total = reduced[0];
  if (typeof total !== "number") {
    throw new Error("Malformed expression");
  }
  let step = 1;
  while (step < reduced.length) {
    const operator = reduced[step];
    const operand = reduced[step + 1];
    if (typeof operator !== "string" || typeof operand !== "number") {
      throw new Error("Malformed expression");
    }
    total = operator === "+" ? total + operand : total - operand;
    step += 2;
  }

  if (!Number.isFinite(total)) {
    throw new Error("Result is not a finite number");
  }

  return total;
}

/**
 * Format a result for the display and the history tape. Trims floating-point
 * noise (0.1 + 0.2 → 0.3) and switches to exponential notation for very large
 * or very small magnitudes so the display never overflows.
 */
export function formatResult(value: number): string {
  if (!Number.isFinite(value)) return "Error";
  if (value === 0) return "0";

  const magnitude = Math.abs(value);
  if (magnitude >= 1e12 || magnitude < 1e-9) {
    return value.toExponential(6).replace(/\.?0+e/, "e");
  }

  const rounded = Number(value.toPrecision(12));
  return String(rounded);
}

/** Render an expression string with typographic operator glyphs. */
export function formatExpression(expression: string): string {
  return expression
    .replace(/\*/g, OPERATOR_GLYPH["*"])
    .replace(/\//g, OPERATOR_GLYPH["/"])
    .replace(/-/g, OPERATOR_GLYPH["-"]);
}

/** True when the expression ends with an operator (so a result is pending). */
export function endsWithOperator(expression: string): boolean {
  if (expression.length === 0) return false;
  return isOperator(expression[expression.length - 1]);
}

/**
 * Append a digit to the expression, guarding against malformed input:
 * a second decimal point in the same number is ignored, and a leading zero is
 * replaced rather than extended.
 */
export function appendDigit(expression: string, digit: string): string {
  if (digit === ".") {
    const currentNumber = expression.split(/[+\-*/]/).pop() ?? "";
    if (currentNumber.includes(".")) return expression;
    if (currentNumber === "") return `${expression}0.`;
    return `${expression}.`;
  }

  const currentNumber = expression.split(/[+\-*/]/).pop() ?? "";
  if (currentNumber === "0") {
    return `${expression.slice(0, -1)}${digit}`;
  }
  return expression + digit;
}

/**
 * Append an operator, replacing a trailing operator instead of stacking two.
 * A leading minus is allowed so the user can start with a negative number.
 */
export function appendOperator(expression: string, operator: Operator): string {
  if (expression.length === 0) {
    return operator === "-" ? "-" : expression;
  }
  if (endsWithOperator(expression)) {
    return `${expression.slice(0, -1)}${operator}`;
  }
  return expression + operator;
}

/** Toggle the sign of the number currently being typed. */
export function toggleSign(expression: string): string {
  if (expression.length === 0) return "-";

  const match = expression.match(/(\d*\.?\d+)$/);
  if (!match) return expression;

  const number = match[1];
  const start = expression.length - number.length;
  const before = expression.slice(0, start);

  if (before.endsWith("-")) {
    const prior = before.slice(0, -1);
    // Only strip the minus when it is a unary sign, not a subtraction.
    if (prior.length === 0 || isOperator(prior[prior.length - 1])) {
      return prior + number;
    }
  }

  if (before.length === 0 || isOperator(before[before.length - 1])) {
    return `${before}-${number}`;
  }

  return expression;
}

/** Apply the percent key: divide the current number by 100. */
export function applyPercent(expression: string): string {
  const match = expression.match(/(\d*\.?\d+)$/);
  if (!match) return expression;

  const number = match[1];
  const start = expression.length - match[0].length;
  const before = expression.slice(0, start);
  const value = Number(number) / 100;
  return before + formatResult(value);
}

/** Remove the last character of the expression. */
export function backspace(expression: string): string {
  return expression.slice(0, -1);
}
