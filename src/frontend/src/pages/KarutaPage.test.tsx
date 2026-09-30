import { KARUTA_CARDS, type KarutaCard } from "@/lib/karuta";
import { KarutaPage } from "@/pages/KarutaPage";
import { renderPage } from "@/test/test-utils";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const reading: KarutaCard = KARUTA_CARDS[0];
const decoys: KarutaCard[] = [KARUTA_CARDS[1], KARUTA_CARDS[2]];

// `vi.mock` is hoisted above the imports, so the factory cannot close over
// module-scope `reading`/`decoys` (they are still undefined when it runs).
// Derive the fixed round from the real module inside the factory instead.
vi.mock("@/lib/karuta", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/karuta")>();
  const fixedReading = actual.KARUTA_CARDS[0];
  const fixedDecoys = [actual.KARUTA_CARDS[1], actual.KARUTA_CARDS[2]];
  return {
    ...actual,
    buildRound: () => ({
      reading: fixedReading,
      choices: [fixedReading, ...fixedDecoys],
    }),
  };
});

describe("KarutaPage practice mode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows a reading and increments the score when the correct card is picked", async () => {
    const user = userEvent.setup();
    renderPage(() => <KarutaPage />);

    expect(await screen.findByText(reading.reading)).toBeInTheDocument();

    const correctCard = screen.getByRole("button", {
      name: `Card ${reading.number}: ${reading.match}`,
    });
    await user.click(correctCard);

    expect(screen.getByText(/Correct —/)).toBeInTheDocument();
    const scoreTile = screen.getByText("Score").closest("div");
    expect(within(scoreTile as HTMLElement).getByText("1")).toBeInTheDocument();
  });

  it("gives incorrect feedback and leaves the score at zero for a wrong pick", async () => {
    const user = userEvent.setup();
    renderPage(() => <KarutaPage />);

    const wrongCard = await screen.findByRole("button", {
      name: `Card ${decoys[0].number}: ${decoys[0].match}`,
    });
    await user.click(wrongCard);

    expect(screen.getByText(/Not quite/)).toBeInTheDocument();
    const scoreTile = screen.getByText("Score").closest("div");
    expect(within(scoreTile as HTMLElement).getByText("0")).toBeInTheDocument();
  });

  it("browses the deck and filters by search", async () => {
    const user = userEvent.setup();
    renderPage(() => <KarutaPage />);

    await user.click(await screen.findByRole("tab", { name: "Browse deck" }));
    expect(screen.getByText(/cards$/)).toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText(/Search verse, poet, or romaji/),
      "zzzz-no-match",
    );
    expect(screen.getByText(/No cards match/)).toBeInTheDocument();
  });
});
