import {
  type GameState,
  applyMove,
  createInitialState,
  generateLegalMoves,
  getGameStatus,
  moveToSan,
  squareName,
} from "@/lib/chess";
import { describe, expect, it } from "vitest";

/** Find a legal move between two named squares, if one exists. */
function findMove(state: GameState, from: string, to: string) {
  const fromIndex = squareIndex(from);
  const toIndex = squareIndex(to);
  return generateLegalMoves(state).find(
    (move) => move.from === fromIndex && move.to === toIndex,
  );
}

function squareIndex(name: string): number {
  const file = name.charCodeAt(0) - "a".charCodeAt(0);
  const rank = Number(name[1]);
  return (8 - rank) * 8 + file;
}

describe("chess engine", () => {
  it("starts from the standard opening position with White to move", () => {
    const state = createInitialState();
    expect(state.turn).toBe("w");
    expect(state.board[0]).toEqual({ color: "b", type: "r" });
    expect(state.board[4]).toEqual({ color: "b", type: "k" });
    expect(state.board[60]).toEqual({ color: "w", type: "k" });
    expect(state.board[52]).toEqual({ color: "w", type: "p" });
    expect(state.board[27]).toBeNull();
    expect(generateLegalMoves(state)).toHaveLength(20);
  });

  it("rejects an illegal move", () => {
    const state = createInitialState();
    // A rook cannot jump over its own pawn.
    expect(findMove(state, "a1", "a3")).toBeUndefined();
    // A knight cannot move to an occupied friendly square.
    expect(findMove(state, "b1", "d2")).toBeUndefined();
  });

  it("applies a legal move and alternates the turn", () => {
    const state = createInitialState();
    const move = findMove(state, "e2", "e4");
    expect(move).toBeDefined();
    const next = applyMove(state, move!);
    expect(next.turn).toBe("b");
    expect(next.board[squareIndex("e4")]).toEqual({ color: "w", type: "p" });
    expect(next.board[squareIndex("e2")]).toBeNull();
  });

  it("detects checkmate on a back-rank mate", () => {
    const state = createInitialState();
    // Fool's mate: 1. f3 e5 2. g4 Qh4#
    for (const [from, to] of [
      ["f2", "f3"],
      ["e7", "e5"],
      ["g2", "g4"],
      ["d8", "h4"],
    ] as const) {
      const move = findMove(state, from, to);
      expect(move, `${from}${to} should be legal`).toBeDefined();
      Object.assign(state, applyMove(state, move!));
    }
    const status = getGameStatus(state);
    expect(status.checkmate).toBe(true);
    expect(status.over).toBe(true);
    expect(status.winner).toBe("b");
    expect(status.label).toContain("Checkmate");
  });

  it("detects stalemate when the side to move has no legal move and is not in check", () => {
    // Black king on a8, White king on c7, White queen on b6: Black is stalemated.
    const state = createInitialState();
    state.board = new Array(64).fill(null);
    state.board[squareIndex("a8")] = { color: "b", type: "k" };
    state.board[squareIndex("c7")] = { color: "w", type: "k" };
    state.board[squareIndex("b6")] = { color: "w", type: "q" };
    state.turn = "b";
    state.castling = { wk: false, wq: false, bk: false, bq: false };
    state.enPassant = null;

    const status = getGameStatus(state);
    expect(status.stalemate).toBe(true);
    expect(status.check).toBe(false);
    expect(status.over).toBe(true);
    expect(status.label).toContain("Stalemate");
  });

  it("allows king-side castling when the path is clear", () => {
    const state = createInitialState();
    for (const [from, to] of [
      ["e2", "e4"],
      ["e7", "e5"],
      ["g1", "f3"],
      ["b8", "c6"],
      ["f1", "c4"],
      ["g8", "f6"],
    ] as const) {
      const move = findMove(state, from, to);
      expect(move, `${from}${to} should be legal`).toBeDefined();
      Object.assign(state, applyMove(state, move!));
    }
    const castle = findMove(state, "e1", "g1");
    expect(castle).toBeDefined();
    const next = applyMove(state, castle!);
    expect(next.board[squareIndex("g1")]).toEqual({ color: "w", type: "k" });
    expect(next.board[squareIndex("f1")]).toEqual({ color: "w", type: "r" });
    expect(moveToSan(state, castle!)).toBe("O-O");
  });

  it("offers all four promotion choices for a pawn reaching the last rank", () => {
    const state = createInitialState();
    state.board = new Array(64).fill(null);
    state.board[squareIndex("a7")] = { color: "w", type: "p" };
    state.board[squareIndex("e1")] = { color: "w", type: "k" };
    state.board[squareIndex("e8")] = { color: "b", type: "k" };
    state.turn = "w";
    state.castling = { wk: false, wq: false, bk: false, bq: false };
    state.enPassant = null;

    const promotions = generateLegalMoves(state).filter(
      (move) =>
        move.from === squareIndex("a7") && move.to === squareIndex("a8"),
    );
    expect(promotions.map((move) => move.promotion).sort()).toEqual([
      "b",
      "n",
      "q",
      "r",
    ]);
  });

  it("captures en passant after a double pawn push", () => {
    const state = createInitialState();
    for (const [from, to] of [
      ["e2", "e4"],
      ["a7", "a6"],
      ["e4", "e5"],
      ["d7", "d5"],
    ] as const) {
      const move = findMove(state, from, to);
      expect(move, `${from}${to} should be legal`).toBeDefined();
      Object.assign(state, applyMove(state, move!));
    }
    const enPassant = findMove(state, "e5", "d6");
    expect(enPassant).toBeDefined();
    expect(enPassant!.enPassantCapture).toBe(squareIndex("d5"));
    const next = applyMove(state, enPassant!);
    expect(next.board[squareIndex("d5")]).toBeNull();
    expect(next.board[squareIndex("d6")]).toEqual({ color: "w", type: "p" });
  });

  it("names squares from a8 to h1", () => {
    expect(squareName(0)).toBe("a8");
    expect(squareName(63)).toBe("h1");
  });
});
