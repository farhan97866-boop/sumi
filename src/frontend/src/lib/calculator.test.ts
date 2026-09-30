import {
  appendDigit,
  appendOperator,
  applyPercent,
  backspace,
  endsWithOperator,
  evaluateExpression,
  formatResult,
  toggleSign,
} from "@/lib/calculator";
import { describe, expect, it } from "vitest";

describe("calculator engine", () => {
  it("evaluates chained operations with standard precedence", () => {
    expect(evaluateExpression("12+7*2")).toBe(26);
    expect(evaluateExpression("2+3*4-6/2")).toBe(11);
    expect(evaluateExpression("100/4/5")).toBe(5);
  });

  it("folds a leading unary minus into the number", () => {
    expect(evaluateExpression("-5+2")).toBe(-3);
    expect(evaluateExpression("3*-2")).toBe(-6);
  });

  it("rejects malformed expressions and division by zero", () => {
    expect(() => evaluateExpression("")).toThrow();
    expect(() => evaluateExpression("5+")).toThrow();
    expect(() => evaluateExpression("5/0")).toThrow();
  });

  it("trims floating-point noise when formatting", () => {
    expect(formatResult(0.1 + 0.2)).toBe("0.3");
    expect(formatResult(0)).toBe("0");
  });

  it("guards digit entry against a second decimal point and leading zeros", () => {
    expect(appendDigit("1.5", ".")).toBe("1.5");
    expect(appendDigit("", ".")).toBe("0.");
    expect(appendDigit("0", "7")).toBe("7");
    expect(appendDigit("12", "3")).toBe("123");
  });

  it("replaces a trailing operator instead of stacking two", () => {
    expect(appendOperator("12+", "*")).toBe("12*");
    expect(appendOperator("", "-")).toBe("-");
    expect(appendOperator("", "+")).toBe("");
    expect(endsWithOperator("12+")).toBe(true);
  });

  it("applies percent, sign toggle, and backspace", () => {
    expect(applyPercent("50")).toBe("0.5");
    expect(toggleSign("5")).toBe("-5");
    expect(toggleSign("-5")).toBe("5");
    expect(backspace("123")).toBe("12");
  });
});
