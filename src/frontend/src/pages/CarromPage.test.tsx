import { CarromPage } from "@/pages/CarromPage";
import { renderPage } from "@/test/test-utils";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * jsdom has no canvas 2d context, so the board renderer is stubbed. The
 * physics and turn logic under test do not depend on it.
 */
function stubCanvas() {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    setLineDash: vi.fn(),
  } as unknown as CanvasRenderingContext2D);
}

describe("CarromPage", () => {
  beforeEach(() => {
    stubCanvas();
    // Run the animation loop synchronously so a shot settles within the click.
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("starts a new game with coins racked and Player 1 to break", async () => {
    renderPage(() => <CarromPage />);
    expect(await screen.findByText("Player 1 to break.")).toBeInTheDocument();
    const playerOne = document.querySelector(
      '[data-ocid="carrom.player_card.1"]',
    ) as HTMLElement;
    expect(playerOne).toHaveTextContent("0/9");
    expect(playerOne).toHaveTextContent("9 left");
    const playerTwo = document.querySelector(
      '[data-ocid="carrom.player_card.2"]',
    ) as HTMLElement;
    expect(playerTwo).toHaveTextContent("9 left");
  });

  it("moves pieces and alternates the turn after a striker shot", async () => {
    const user = userEvent.setup();
    renderPage(() => <CarromPage />);

    await user.click(
      await screen.findByRole("button", { name: /Flick striker/ }),
    );

    await waitFor(() =>
      expect(screen.getByText("Player 2's turn.")).toBeInTheDocument(),
    );
  });

  it("resets the board with the New game control", async () => {
    const user = userEvent.setup();
    renderPage(() => <CarromPage />);

    await user.click(
      await screen.findByRole("button", { name: /Flick striker/ }),
    );
    await waitFor(() =>
      expect(screen.getByText("Player 2's turn.")).toBeInTheDocument(),
    );

    await user.click(screen.getByRole("button", { name: /New game/ }));
    expect(screen.getByText("Player 1 to break.")).toBeInTheDocument();
  });
});
