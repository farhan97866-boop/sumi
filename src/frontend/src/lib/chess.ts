/**
 * Sumi Chess — a dependency-free chess engine.
 *
 * Board is a 64-length array indexed rank-major from a8 (index 0) to h1
 * (index 63). Pieces are single characters: uppercase = white, lowercase =
 * black. Empty squares are null.
 *
 * The engine implements full legal move generation including castling, en
 * passant, and promotion, plus check, checkmate, and stalemate detection.
 */

export type Color = "w" | "b";
export type PieceType = "p" | "n" | "b" | "r" | "q" | "k";
export type Square = number; // 0..63, a8 = 0, h1 = 63

export interface Piece {
  color: Color;
  type: PieceType;
}

export interface Move {
  from: Square;
  to: Square;
  piece: PieceType;
  color: Color;
  captured?: PieceType;
  promotion?: PieceType;
  /** Rook origin square when this move is a castle. */
  castleRookFrom?: Square;
  /** Rook destination square when this move is a castle. */
  castleRookTo?: Square;
  /** Pawn square captured en passant. */
  enPassantCapture?: Square;
  /** True when this move gives check to the opponent. */
  givesCheck: boolean;
}

export interface GameState {
  board: (Piece | null)[];
  turn: Color;
  castling: { wk: boolean; wq: boolean; bk: boolean; bq: boolean };
  /** Square a pawn may capture onto en passant, or null. */
  enPassant: Square | null;
  halfmoveClock: number;
  fullmove: number;
}

export interface MoveRecord {
  san: string;
  move: Move;
}

export interface GameStatus {
  over: boolean;
  check: boolean;
  checkmate: boolean;
  stalemate: boolean;
  winner: Color | null;
  label: string;
}

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;

const PIECE_LETTER: Record<PieceType, string> = {
  p: "",
  n: "N",
  b: "B",
  r: "R",
  q: "Q",
  k: "K",
};

const PIECE_NAME: Record<PieceType, string> = {
  p: "Pawn",
  n: "Knight",
  b: "Bishop",
  r: "Rook",
  q: "Queen",
  k: "King",
};

export function pieceName(type: PieceType): string {
  return PIECE_NAME[type];
}

export function fileOf(square: Square): number {
  return square % 8;
}

export function rankOf(square: Square): number {
  return Math.floor(square / 8);
}

export function squareName(square: Square): string {
  return `${FILES[fileOf(square)]}${8 - rankOf(square)}`;
}

export function isLightSquare(square: Square): boolean {
  return (fileOf(square) + rankOf(square)) % 2 === 0;
}

export function opposite(color: Color): Color {
  return color === "w" ? "b" : "w";
}

export function pieceGlyph(piece: Piece): string {
  const white: Record<PieceType, string> = {
    k: "♔",
    q: "♕",
    r: "♖",
    b: "♗",
    n: "♘",
    p: "♙",
  };
  const black: Record<PieceType, string> = {
    k: "♚",
    q: "♛",
    r: "♜",
    b: "♝",
    n: "♞",
    p: "♟",
  };
  return piece.color === "w" ? white[piece.type] : black[piece.type];
}

export function createInitialState(): GameState {
  const board: (Piece | null)[] = new Array(64).fill(null);
  const back: PieceType[] = ["r", "n", "b", "q", "k", "b", "n", "r"];
  for (let file = 0; file < 8; file += 1) {
    board[file] = { color: "b", type: back[file] };
    board[8 + file] = { color: "b", type: "p" };
    board[48 + file] = { color: "w", type: "p" };
    board[56 + file] = { color: "w", type: back[file] };
  }
  return {
    board,
    turn: "w",
    castling: { wk: true, wq: true, bk: true, bq: true },
    enPassant: null,
    halfmoveClock: 0,
    fullmove: 1,
  };
}

function cloneState(state: GameState): GameState {
  return {
    board: state.board.map((piece) => (piece ? { ...piece } : null)),
    turn: state.turn,
    castling: { ...state.castling },
    enPassant: state.enPassant,
    halfmoveClock: state.halfmoveClock,
    fullmove: state.fullmove,
  };
}

const KNIGHT_DELTAS: [number, number][] = [
  [-2, -1],
  [-2, 1],
  [-1, -2],
  [-1, 2],
  [1, -2],
  [1, 2],
  [2, -1],
  [2, 1],
];

const KING_DELTAS: [number, number][] = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];

const BISHOP_DIRS: [number, number][] = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
];

const ROOK_DIRS: [number, number][] = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

function onBoard(file: number, rank: number): boolean {
  return file >= 0 && file < 8 && rank >= 0 && rank < 8;
}

function squareAt(file: number, rank: number): Square {
  return rank * 8 + file;
}

function findKing(board: (Piece | null)[], color: Color): Square {
  for (let i = 0; i < 64; i += 1) {
    const piece = board[i];
    if (piece && piece.type === "k" && piece.color === color) return i;
  }
  return -1;
}

/** Is `square` attacked by any piece of `byColor`? */
export function isSquareAttacked(
  board: (Piece | null)[],
  square: Square,
  byColor: Color,
): boolean {
  const file = fileOf(square);
  const rank = rankOf(square);

  // Pawn attacks: a white pawn attacks upward (toward lower rank index).
  const pawnRank = byColor === "w" ? rank + 1 : rank - 1;
  for (const df of [-1, 1]) {
    const f = file + df;
    if (onBoard(f, pawnRank)) {
      const piece = board[squareAt(f, pawnRank)];
      if (piece && piece.color === byColor && piece.type === "p") return true;
    }
  }

  for (const [df, dr] of KNIGHT_DELTAS) {
    const f = file + df;
    const r = rank + dr;
    if (!onBoard(f, r)) continue;
    const piece = board[squareAt(f, r)];
    if (piece && piece.color === byColor && piece.type === "n") return true;
  }

  for (const [df, dr] of KING_DELTAS) {
    const f = file + df;
    const r = rank + dr;
    if (!onBoard(f, r)) continue;
    const piece = board[squareAt(f, r)];
    if (piece && piece.color === byColor && piece.type === "k") return true;
  }

  for (const [df, dr] of BISHOP_DIRS) {
    let f = file + df;
    let r = rank + dr;
    while (onBoard(f, r)) {
      const piece = board[squareAt(f, r)];
      if (piece) {
        if (
          piece.color === byColor &&
          (piece.type === "b" || piece.type === "q")
        )
          return true;
        break;
      }
      f += df;
      r += dr;
    }
  }

  for (const [df, dr] of ROOK_DIRS) {
    let f = file + df;
    let r = rank + dr;
    while (onBoard(f, r)) {
      const piece = board[squareAt(f, r)];
      if (piece) {
        if (
          piece.color === byColor &&
          (piece.type === "r" || piece.type === "q")
        )
          return true;
        break;
      }
      f += df;
      r += dr;
    }
  }

  return false;
}

export function isInCheck(state: GameState, color: Color): boolean {
  const king = findKing(state.board, color);
  if (king < 0) return false;
  return isSquareAttacked(state.board, king, opposite(color));
}

function pushPawnMoves(
  state: GameState,
  from: Square,
  color: Color,
  moves: Move[],
): void {
  const file = fileOf(from);
  const rank = rankOf(from);
  const dir = color === "w" ? -1 : 1;
  const startRank = color === "w" ? 6 : 1;
  const promoRank = color === "w" ? 0 : 7;

  const oneRank = rank + dir;
  if (onBoard(file, oneRank)) {
    const one = squareAt(file, oneRank);
    if (!state.board[one]) {
      addPawnMove(from, one, color, undefined, promoRank, moves);
      const twoRank = rank + dir * 2;
      if (rank === startRank && onBoard(file, twoRank)) {
        const two = squareAt(file, twoRank);
        if (!state.board[two]) {
          moves.push({
            from,
            to: two,
            piece: "p",
            color,
            givesCheck: false,
          });
        }
      }
    }
  }

  for (const df of [-1, 1]) {
    const f = file + df;
    const r = rank + dir;
    if (!onBoard(f, r)) continue;
    const target = squareAt(f, r);
    const occupant = state.board[target];
    if (occupant && occupant.color !== color) {
      addPawnMove(from, target, color, occupant.type, promoRank, moves);
    } else if (!occupant && state.enPassant === target) {
      moves.push({
        from,
        to: target,
        piece: "p",
        color,
        captured: "p",
        enPassantCapture: squareAt(f, rank),
        givesCheck: false,
      });
    }
  }
}

function addPawnMove(
  from: Square,
  to: Square,
  color: Color,
  captured: PieceType | undefined,
  promoRank: number,
  moves: Move[],
): void {
  if (rankOf(to) === promoRank) {
    for (const promotion of ["q", "r", "b", "n"] as PieceType[]) {
      moves.push({
        from,
        to,
        piece: "p",
        color,
        captured,
        promotion,
        givesCheck: false,
      });
    }
  } else {
    moves.push({ from, to, piece: "p", color, captured, givesCheck: false });
  }
}

function pushStepMoves(
  state: GameState,
  from: Square,
  color: Color,
  type: PieceType,
  deltas: [number, number][],
  moves: Move[],
): void {
  const file = fileOf(from);
  const rank = rankOf(from);
  for (const [df, dr] of deltas) {
    const f = file + df;
    const r = rank + dr;
    if (!onBoard(f, r)) continue;
    const to = squareAt(f, r);
    const occupant = state.board[to];
    if (occupant && occupant.color === color) continue;
    moves.push({
      from,
      to,
      piece: type,
      color,
      captured: occupant ? occupant.type : undefined,
      givesCheck: false,
    });
  }
}

function pushSlideMoves(
  state: GameState,
  from: Square,
  color: Color,
  type: PieceType,
  dirs: [number, number][],
  moves: Move[],
): void {
  const file = fileOf(from);
  const rank = rankOf(from);
  for (const [df, dr] of dirs) {
    let f = file + df;
    let r = rank + dr;
    while (onBoard(f, r)) {
      const to = squareAt(f, r);
      const occupant = state.board[to];
      if (occupant && occupant.color === color) break;
      moves.push({
        from,
        to,
        piece: type,
        color,
        captured: occupant ? occupant.type : undefined,
        givesCheck: false,
      });
      if (occupant) break;
      f += df;
      r += dr;
    }
  }
}

function pushCastles(state: GameState, color: Color, moves: Move[]): void {
  const rank = color === "w" ? 7 : 0;
  const kingFrom = squareAt(4, rank);
  const king = state.board[kingFrom];
  if (!king || king.type !== "k" || king.color !== color) return;
  if (isSquareAttacked(state.board, kingFrom, opposite(color))) return;

  const kingSide = color === "w" ? state.castling.wk : state.castling.bk;
  const queenSide = color === "w" ? state.castling.wq : state.castling.bq;

  if (kingSide) {
    const f1 = squareAt(5, rank);
    const g1 = squareAt(6, rank);
    const rook = state.board[squareAt(7, rank)];
    if (
      !state.board[f1] &&
      !state.board[g1] &&
      rook &&
      rook.type === "r" &&
      rook.color === color &&
      !isSquareAttacked(state.board, f1, opposite(color)) &&
      !isSquareAttacked(state.board, g1, opposite(color))
    ) {
      moves.push({
        from: kingFrom,
        to: g1,
        piece: "k",
        color,
        castleRookFrom: squareAt(7, rank),
        castleRookTo: f1,
        givesCheck: false,
      });
    }
  }

  if (queenSide) {
    const d1 = squareAt(3, rank);
    const c1 = squareAt(2, rank);
    const b1 = squareAt(1, rank);
    const rook = state.board[squareAt(0, rank)];
    if (
      !state.board[d1] &&
      !state.board[c1] &&
      !state.board[b1] &&
      rook &&
      rook.type === "r" &&
      rook.color === color &&
      !isSquareAttacked(state.board, d1, opposite(color)) &&
      !isSquareAttacked(state.board, c1, opposite(color))
    ) {
      moves.push({
        from: kingFrom,
        to: c1,
        piece: "k",
        color,
        castleRookFrom: squareAt(0, rank),
        castleRookTo: d1,
        givesCheck: false,
      });
    }
  }
}

/** Pseudo-legal moves for the side to move (may leave own king in check). */
function generatePseudoMoves(state: GameState): Move[] {
  const moves: Move[] = [];
  const color = state.turn;
  for (let square = 0; square < 64; square += 1) {
    const piece = state.board[square];
    if (!piece || piece.color !== color) continue;
    switch (piece.type) {
      case "p":
        pushPawnMoves(state, square, color, moves);
        break;
      case "n":
        pushStepMoves(state, square, color, "n", KNIGHT_DELTAS, moves);
        break;
      case "b":
        pushSlideMoves(state, square, color, "b", BISHOP_DIRS, moves);
        break;
      case "r":
        pushSlideMoves(state, square, color, "r", ROOK_DIRS, moves);
        break;
      case "q":
        pushSlideMoves(
          state,
          square,
          color,
          "q",
          [...BISHOP_DIRS, ...ROOK_DIRS],
          moves,
        );
        break;
      case "k":
        pushStepMoves(state, square, color, "k", KING_DELTAS, moves);
        break;
    }
  }
  pushCastles(state, color, moves);
  return moves;
}

/** Apply a move to a cloned state and return the resulting state. */
export function applyMove(state: GameState, move: Move): GameState {
  const next = cloneState(state);
  const piece = next.board[move.from];
  if (!piece) return next;

  next.board[move.from] = null;

  if (move.enPassantCapture !== undefined) {
    next.board[move.enPassantCapture] = null;
  }

  next.board[move.to] = move.promotion
    ? { color: move.color, type: move.promotion }
    : { ...piece };

  if (move.castleRookFrom !== undefined && move.castleRookTo !== undefined) {
    const rook = next.board[move.castleRookFrom];
    next.board[move.castleRookFrom] = null;
    next.board[move.castleRookTo] = rook ? { ...rook } : null;
  }

  // Castling rights.
  if (piece.type === "k") {
    if (piece.color === "w") {
      next.castling.wk = false;
      next.castling.wq = false;
    } else {
      next.castling.bk = false;
      next.castling.bq = false;
    }
  }
  if (piece.type === "r") {
    if (move.from === 63) next.castling.wk = false;
    if (move.from === 56) next.castling.wq = false;
    if (move.from === 7) next.castling.bk = false;
    if (move.from === 0) next.castling.bq = false;
  }
  // Rook captured on its home square.
  if (move.to === 63) next.castling.wk = false;
  if (move.to === 56) next.castling.wq = false;
  if (move.to === 7) next.castling.bk = false;
  if (move.to === 0) next.castling.bq = false;

  // En passant target.
  if (
    piece.type === "p" &&
    Math.abs(rankOf(move.to) - rankOf(move.from)) === 2
  ) {
    next.enPassant = (move.from + move.to) / 2;
  } else {
    next.enPassant = null;
  }

  // Halfmove clock.
  if (piece.type === "p" || move.captured) {
    next.halfmoveClock = 0;
  } else {
    next.halfmoveClock = state.halfmoveClock + 1;
  }

  if (state.turn === "b") next.fullmove = state.fullmove + 1;
  next.turn = opposite(state.turn);
  return next;
}

/** All fully legal moves for the side to move. */
export function generateLegalMoves(state: GameState): Move[] {
  const legal: Move[] = [];
  for (const move of generatePseudoMoves(state)) {
    const next = applyMove(state, move);
    if (!isInCheck(next, state.turn)) {
      legal.push({ ...move, givesCheck: isInCheck(next, next.turn) });
    }
  }
  return legal;
}

export function getGameStatus(state: GameState): GameStatus {
  const check = isInCheck(state, state.turn);
  const legal = generateLegalMoves(state);
  if (legal.length === 0) {
    if (check) {
      const winner = opposite(state.turn);
      return {
        over: true,
        check: true,
        checkmate: true,
        stalemate: false,
        winner,
        label: `Checkmate — ${winner === "w" ? "White" : "Black"} wins`,
      };
    }
    return {
      over: true,
      check: false,
      checkmate: false,
      stalemate: true,
      winner: null,
      label: "Stalemate — draw",
    };
  }
  return {
    over: false,
    check,
    checkmate: false,
    stalemate: false,
    winner: null,
    label: check
      ? `${state.turn === "w" ? "White" : "Black"} is in check`
      : `${state.turn === "w" ? "White" : "Black"} to move`,
  };
}

/** Standard Algebraic Notation for a move, given the position before it. */
export function moveToSan(state: GameState, move: Move): string {
  if (move.castleRookFrom !== undefined) {
    // King-side castling lands the king on the g-file; queen-side on the c-file.
    const kingSide = fileOf(move.to) === 6;
    const notation = kingSide ? "O-O" : "O-O-O";
    return move.givesCheck ? `${notation}+` : notation;
  }

  const legal = generateLegalMoves(state);
  const target = squareName(move.to);
  let san = "";

  if (move.piece === "p") {
    if (move.captured) {
      san += `${FILES[fileOf(move.from)]}x${target}`;
    } else {
      san += target;
    }
    if (move.promotion) san += `=${PIECE_LETTER[move.promotion]}`;
  } else {
    san += PIECE_LETTER[move.piece];
    const ambiguous = legal.filter(
      (candidate) =>
        candidate.piece === move.piece &&
        candidate.to === move.to &&
        candidate.from !== move.from,
    );
    if (ambiguous.length > 0) {
      const sameFile = ambiguous.some(
        (candidate) => fileOf(candidate.from) === fileOf(move.from),
      );
      const sameRank = ambiguous.some(
        (candidate) => rankOf(candidate.from) === rankOf(move.from),
      );
      if (!sameFile) {
        san += FILES[fileOf(move.from)];
      } else if (!sameRank) {
        san += `${8 - rankOf(move.from)}`;
      } else {
        san += squareName(move.from);
      }
    }
    if (move.captured) san += "x";
    san += target;
  }

  if (move.givesCheck) san += "+";
  return san;
}

export interface CapturedPieces {
  w: PieceType[];
  b: PieceType[];
}

export function capturedFromHistory(history: MoveRecord[]): CapturedPieces {
  const captured: CapturedPieces = { w: [], b: [] };
  for (const record of history) {
    if (record.move.captured) {
      captured[record.move.color].push(record.move.captured);
    }
  }
  return captured;
}
