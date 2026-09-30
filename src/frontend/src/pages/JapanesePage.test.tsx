import { getScriptSet } from "@/lib/japanese-data";
import { JapanesePage } from "@/pages/JapanesePage";
import { createMockActor, renderPage } from "@/test/test-utils";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const actor = createMockActor();

vi.mock("@caffeineai/core-infrastructure", () => ({
  useActor: () => ({ actor, isFetching: false }),
  useInternetIdentity: () => ({
    identity: undefined,
    login: vi.fn(),
    clear: vi.fn(),
    loginStatus: "idle",
    isInitializing: false,
    isLoginIdle: true,
    isLoggingIn: false,
    isLoginSuccess: false,
    isLoginError: false,
    isAuthenticated: true,
    loginError: undefined,
  }),
}));

const hiragana = getScriptSet("hiragana");

/** The chart container is keyed by `data-ocid`, not `data-testid`. */
async function findChart(script: string): Promise<HTMLElement> {
  let chart: HTMLElement | null = null;
  await waitFor(() => {
    chart = document.querySelector<HTMLElement>(
      `[data-ocid="japanese.chart.${script}"]`,
    );
    expect(chart).not.toBeNull();
  });
  return chart as unknown as HTMLElement;
}

describe("JapanesePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    actor.getJapaneseLearned.mockResolvedValue([]);
    actor.getJapaneseProgress.mockResolvedValue(0n);
    actor.markJapaneseLearned.mockResolvedValue(undefined);
  });

  it("renders the hiragana chart with every character", async () => {
    renderPage(() => <JapanesePage />);
    const chart = await findChart("hiragana");
    for (const entry of hiragana.entries) {
      expect(
        within(chart).getByRole("button", {
          name: new RegExp(`^${entry.character} —`),
        }),
      ).toBeInTheDocument();
    }
  });

  it("marks a character learned through the backend", async () => {
    const user = userEvent.setup();
    renderPage(() => <JapanesePage />);

    const first = hiragana.entries[0];
    const cell = await screen.findByRole("button", {
      name: new RegExp(`^${first.character} —`),
    });
    await user.click(cell);

    await waitFor(() =>
      expect(actor.markJapaneseLearned).toHaveBeenCalledWith(
        "hiragana",
        first.character,
        true,
      ),
    );
  });

  it("switches to katakana and loads that script's progress", async () => {
    const user = userEvent.setup();
    renderPage(() => <JapanesePage />);

    await user.click(await screen.findByRole("tab", { name: /Katakana/ }));
    expect(await findChart("katakana")).toBeInTheDocument();
    await waitFor(() =>
      expect(actor.getJapaneseLearned).toHaveBeenCalledWith("katakana"),
    );
  });

  it("grades a flashcard in practice mode and advances the deck", async () => {
    const user = userEvent.setup();
    renderPage(() => <JapanesePage />);

    await user.click(await screen.findByRole("button", { name: /Practice/ }));
    expect(screen.getByText(/Card 01 \//)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Correct/ }));
    expect(screen.getByText(/Card 02 \//)).toBeInTheDocument();
    await waitFor(() =>
      expect(actor.markJapaneseLearned).toHaveBeenCalledWith(
        "hiragana",
        hiragana.entries[0].character,
        true,
      ),
    );
  });
});
