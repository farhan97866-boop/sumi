import { CalculatorPage } from "@/pages/CalculatorPage";
import { renderPage } from "@/test/test-utils";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

describe("CalculatorPage", () => {
  it("computes 12 + 7 × 2 = 26 and records it in history", async () => {
    const user = userEvent.setup();
    renderPage(() => <CalculatorPage />);

    await user.click(await screen.findByRole("button", { name: "1" }));
    await user.click(screen.getByRole("button", { name: "2" }));
    await user.click(screen.getByRole("button", { name: "Add" }));
    await user.click(screen.getByRole("button", { name: "7" }));
    await user.click(screen.getByRole("button", { name: "Multiply" }));
    await user.click(screen.getByRole("button", { name: "2" }));
    await user.click(screen.getByRole("button", { name: "Equals" }));

    expect(screen.getByLabelText("Calculator result")).toHaveTextContent("26");

    const history = screen.getByRole("list");
    expect(within(history).getByText("= 26")).toBeInTheDocument();
    expect(within(history).getByText("12+7×2")).toBeInTheDocument();
  });

  it("supports keyboard input for digits and operators", async () => {
    const user = userEvent.setup();
    renderPage(() => <CalculatorPage />);

    await screen.findByLabelText("Calculator result");
    await user.keyboard("9*3{Enter}");
    expect(screen.getByLabelText("Calculator result")).toHaveTextContent("27");
  });

  it("clears the expression and the history tape", async () => {
    const user = userEvent.setup();
    renderPage(() => <CalculatorPage />);

    await user.click(await screen.findByRole("button", { name: "5" }));
    await user.click(screen.getByRole("button", { name: "Add" }));
    await user.click(screen.getByRole("button", { name: "5" }));
    await user.click(screen.getByRole("button", { name: "Equals" }));
    expect(screen.getByRole("list")).toBeInTheDocument();

    // The keypad C clears the current expression.
    await user.click(
      document.querySelector('[data-ocid="calculator.key.C"]') as HTMLElement,
    );
    expect(screen.getByLabelText("Calculator result")).toHaveTextContent("0");

    // The tape's Clear control empties the history.
    await user.click(
      document.querySelector(
        '[data-ocid="calculator.clear_history_button"]',
      ) as HTMLElement,
    );
    expect(
      screen.getByText(/Results you calculate will stack here/),
    ).toBeInTheDocument();
  });

  it("shows an inline error for division by zero", async () => {
    const user = userEvent.setup();
    renderPage(() => <CalculatorPage />);

    await user.click(await screen.findByRole("button", { name: "8" }));
    await user.click(screen.getByRole("button", { name: "Divide" }));
    await user.click(screen.getByRole("button", { name: "0" }));
    await user.click(screen.getByRole("button", { name: "Equals" }));

    expect(screen.getByRole("alert")).toHaveTextContent(/divide by zero/i);
  });
});
