import { ChessPage } from "@/pages/ChessPage";
import { renderPage } from "@/test/test-utils";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

/** The turn label appears both in the status bar and the move-history header. */
function statusRegion() {
  return document.querySelector('[data-ocid="chess.status"]') as HTMLElement;
}

describe("ChessPage", () => {
  it("starts a new game with the standard opening position", async () => {
    renderPage(() => <ChessPage />);
    await screen.findByRole("button", { name: /e1, white King/ });
    expect(
      within(statusRegion()).getByText("White to move"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /e1, white King/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /d8, black Queen/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /e4, empty/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("No moves yet. White opens.")).toBeInTheDocument();
  });

  it("rejects an illegal move and keeps the turn with White", async () => {
    const user = userEvent.setup();
    renderPage(() => <ChessPage />);

    // Select the a1 rook, then click a3 — blocked by its own pawn.
    await user.click(
      await screen.findByRole("button", { name: /a1, white Rook/ }),
    );
    await user.click(screen.getByRole("button", { name: /a3, empty/ }));

    expect(
      within(statusRegion()).getByText("White to move"),
    ).toBeInTheDocument();
    expect(screen.getByText("No moves yet. White opens.")).toBeInTheDocument();
  });

  it("plays a legal move and records it in algebraic notation", async () => {
    const user = userEvent.setup();
    renderPage(() => <ChessPage />);

    await user.click(
      await screen.findByRole("button", { name: /e2, white Pawn/ }),
    );
    await user.click(screen.getByRole("button", { name: /e4, empty/ }));

    expect(
      within(statusRegion()).getByText("Black to move"),
    ).toBeInTheDocument();
    const history = screen.getByRole("list");
    expect(within(history).getByText("e4")).toBeInTheDocument();
  });

  it("resets the board with the New game control", async () => {
    const user = userEvent.setup();
    renderPage(() => <ChessPage />);

    await user.click(
      await screen.findByRole("button", { name: /e2, white Pawn/ }),
    );
    await user.click(screen.getByRole("button", { name: /e4, empty/ }));
    expect(
      within(statusRegion()).getByText("Black to move"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /New game/ }));
    expect(
      within(statusRegion()).getByText("White to move"),
    ).toBeInTheDocument();
    expect(screen.getByText("No moves yet. White opens.")).toBeInTheDocument();
  });
});
