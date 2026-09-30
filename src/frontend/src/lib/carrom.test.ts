import {
  BOARD_SIZE,
  type Disc,
  baselineFor,
  createInitialDiscs,
  isSettled,
  launchStriker,
  placeStriker,
  scoreFor,
  step,
  strikerBounds,
  strikerOverlapsCoin,
} from "@/lib/carrom";
import { describe, expect, it } from "vitest";

function strikerOf(discs: Disc[]): Disc {
  return discs.find((disc) => disc.kind === "striker") as Disc;
}

describe("carrom physics", () => {
  it("racks a full opening board: 9 white, 9 black, 1 queen, 1 striker", () => {
    const discs = createInitialDiscs();
    expect(discs.filter((d) => d.kind === "white")).toHaveLength(9);
    expect(discs.filter((d) => d.kind === "black")).toHaveLength(9);
    expect(discs.filter((d) => d.kind === "queen")).toHaveLength(1);
    expect(discs.filter((d) => d.kind === "striker")).toHaveLength(1);
    expect(discs.every((d) => !d.pocketed)).toBe(true);
  });

  it("starts each player with zero pocketed and nine remaining", () => {
    const discs = createInitialDiscs();
    expect(scoreFor(discs, 1)).toEqual({ pocketed: 0, remaining: 9 });
    expect(scoreFor(discs, 2)).toEqual({ pocketed: 0, remaining: 9 });
  });

  it("places the striker on the active player's baseline within bounds", () => {
    const discs = createInitialDiscs();
    const striker = strikerOf(discs);
    const bounds = strikerBounds();
    placeStriker(striker, 2, 0);
    expect(striker.y).toBe(baselineFor(2));
    expect(striker.x).toBe(bounds.min);
    placeStriker(striker, 1, BOARD_SIZE * 2);
    expect(striker.y).toBe(baselineFor(1));
    expect(striker.x).toBe(bounds.max);
  });

  it("moves the striker and settles after a launched shot", () => {
    const discs = createInitialDiscs();
    const striker = strikerOf(discs);
    const startX = striker.x;
    const startY = striker.y;
    // Aim up-and-right so the striker travels on both axes; a purely
    // horizontal launch would leave y unchanged by construction.
    launchStriker(striker, -Math.PI / 4, 100);
    expect(striker.vx).toBeGreaterThan(0);
    expect(striker.vy).toBeLessThan(0);

    let guard = 0;
    while (!isSettled(discs) && guard < 5000) {
      step(discs);
      guard += 1;
    }
    expect(isSettled(discs)).toBe(true);
    expect(striker.x).not.toBe(startX);
    expect(striker.y).not.toBe(startY);
  });

  it("detects a striker overlapping a coin", () => {
    const discs = createInitialDiscs();
    const striker = strikerOf(discs);
    const coin = discs.find((d) => d.kind === "white") as Disc;
    striker.x = coin.x;
    striker.y = coin.y;
    expect(strikerOverlapsCoin(discs, striker)).toBe(true);
    striker.x = 0;
    striker.y = 0;
    expect(strikerOverlapsCoin(discs, striker)).toBe(false);
  });

  it("pockets a coin that reaches a corner pocket", () => {
    const discs = createInitialDiscs();
    const coin = discs.find((d) => d.kind === "white") as Disc;
    // Park the coin on the top-left pocket and let a step resolve it.
    coin.x = 6.8;
    coin.y = 6.8;
    coin.vx = 0;
    coin.vy = 0;
    const result = step(discs);
    expect(coin.pocketed).toBe(true);
    expect(result.pocketed).toContain("white");
    expect(scoreFor(discs, 1).pocketed).toBe(1);
  });
});
