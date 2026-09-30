import { CurrencyPage } from "@/pages/CurrencyPage";
import { renderPage } from "@/test/test-utils";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

/** A minimal stand-in for the Open Access endpoint response. */
function ratesResponse(base: string, rates: Record<string, number>) {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      result: "success",
      base_code: base,
      time_last_update_unix: 1_700_000_000,
      rates,
    }),
  } as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("CurrencyPage", () => {
  it("converts an amount and shows the rate and last-updated time", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/USD")) {
        return ratesResponse("USD", { USD: 1, EUR: 0.9, JPY: 150 });
      }
      return ratesResponse("EUR", { EUR: 1, USD: 1.1, JPY: 160 });
    });
    vi.stubGlobal("fetch", fetchMock);

    renderPage(() => <CurrencyPage />);

    // Default pair is USD → JPY with amount 100.
    await waitFor(() =>
      expect(screen.getByText(/1 USD = 150/)).toBeInTheDocument(),
    );
    expect(screen.getByText("15,000.00")).toBeInTheDocument();
    expect(screen.getByText(/Updated/)).toBeInTheDocument();
  });

  it("shows an inline message for empty and invalid amounts", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ratesResponse("USD", { USD: 1, EUR: 0.9 })),
    );
    const user = userEvent.setup();
    renderPage(() => <CurrencyPage />);

    const amount = await screen.findByLabelText("Amount");
    await user.clear(amount);
    expect(
      await screen.findByText("Enter an amount to convert."),
    ).toBeInTheDocument();

    await user.type(amount, "abc");
    expect(
      await screen.findByText("That doesn't look like a number."),
    ).toBeInTheDocument();
  });

  it("swaps the from and to currencies", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ratesResponse("USD", { USD: 1, EUR: 0.9, JPY: 150 })),
    );
    const user = userEvent.setup();
    renderPage(() => <CurrencyPage />);

    await waitFor(() =>
      expect(screen.getByText(/1 USD = 150/)).toBeInTheDocument(),
    );
    await user.click(screen.getByRole("button", { name: "Swap currencies" }));
    await waitFor(() =>
      expect(screen.getByText(/1 JPY = 0.006667 USD/)).toBeInTheDocument(),
    );
  });

  it("surfaces a retry control when the rate service fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 503 }) as Response),
    );
    renderPage(() => <CurrencyPage />);

    expect(
      await screen.findByText(/Rate service responded with 503/, undefined, {
        timeout: 3000,
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Retry/ })).toBeInTheDocument();
  });
});
