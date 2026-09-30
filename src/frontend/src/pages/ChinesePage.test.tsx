import { CHINESE_CHARACTERS, CHINESE_TOTAL } from "@/lib/chinese-data";
import { ChinesePage } from "@/pages/ChinesePage";
import { createMockActor, renderPage } from "@/test/test-utils";
import { screen, waitFor } from "@testing-library/react";
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

describe("ChinesePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    actor.getChineseLearned.mockResolvedValue([]);
    actor.getChineseProgress.mockResolvedValue(0n);
    actor.markChineseLearned.mockResolvedValue(undefined);
  });

  it("renders the reference table with the first character and total count", async () => {
    renderPage(() => <ChinesePage />);
    const first = CHINESE_CHARACTERS[0];
    expect(await screen.findByText(first.pinyin)).toBeInTheDocument();
    expect(screen.getByText(`/${CHINESE_TOTAL}`)).toBeInTheDocument();
  });

  it("marks a character learned through the backend", async () => {
    const user = userEvent.setup();
    renderPage(() => <ChinesePage />);

    const first = CHINESE_CHARACTERS[0];
    await user.click(
      await screen.findByRole("button", {
        name: `Mark ${first.character} as learned`,
      }),
    );
    await waitFor(() =>
      expect(actor.markChineseLearned).toHaveBeenCalledWith(
        first.character,
        true,
      ),
    );
  });

  it("filters the table by pinyin search", async () => {
    const user = userEvent.setup();
    renderPage(() => <ChinesePage />);

    const target = CHINESE_CHARACTERS[1];
    await user.type(
      await screen.findByLabelText("Search Chinese characters"),
      target.pinyin,
    );
    expect(screen.getByText(target.meaning)).toBeInTheDocument();
  });

  it("shows an empty state when no character matches", async () => {
    const user = userEvent.setup();
    renderPage(() => <ChinesePage />);

    await user.type(
      await screen.findByLabelText("Search Chinese characters"),
      "zzzz-no-match",
    );
    expect(screen.getByText(/No characters match/)).toBeInTheDocument();
  });

  it("grades a flashcard and advances the deck", async () => {
    const user = userEvent.setup();
    renderPage(() => <ChinesePage />);

    await user.click(await screen.findByRole("button", { name: /Flashcards/ }));
    expect(screen.getByText(/Card 01 \//)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /I know it/ }));
    expect(screen.getByText(/Card 02 \//)).toBeInTheDocument();
    await waitFor(() =>
      expect(actor.markChineseLearned).toHaveBeenCalledWith(
        CHINESE_CHARACTERS[0].character,
        true,
      ),
    );
  });
});
