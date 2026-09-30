import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  type Color,
  type GameState,
  type Move,
  type MoveRecord,
  type PieceType,
  applyMove,
  capturedFromHistory,
  createInitialState,
  fileOf,
  generateLegalMoves,
  getGameStatus,
  isLightSquare,
  moveToSan,
  pieceGlyph,
  pieceName,
  rankOf,
  squareName,
} from "@/lib/chess";
import { cn } from "@/lib/utils";
import { RotateCcw, Undo2 } from "lucide-react";
import { useMemo, useState } from "react";

const PROMOTION_CHOICES: PieceType[] = ["q", "r", "b", "n"];

interface PendingPromotion {
  from: number;
  to: number;
}

function CapturedRow({
  pieces,
  color,
  label,
}: {
  pieces: PieceType[];
  color: Color;
  label: string;
}) {
  const keyed = useMemo(() => {
    const seen = new Map<PieceType, number>();
    return pieces.map((type) => {
      const count = (seen.get(type) ?? 0) + 1;
      seen.set(type, count);
      return { key: `${color}-${type}-${count}`, type };
    });
  }, [pieces, color]);

  return (
    <div className="flex min-h-7 items-center gap-2">
      <span className="w-12 shrink-0 font-mono text-[0.6rem] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-0.5">
        {keyed.length === 0 ? (
          <span className="text-xs text-muted-foreground/70">—</span>
        ) : (
          keyed.map(({ key, type }) => (
            <span
              key={key}
              className={cn(
                "text-lg leading-none",
                color === "w" ? "text-foreground" : "text-foreground/80",
              )}
              title={pieceName(type)}
            >
              {pieceGlyph({ color, type })}
            </span>
          ))
        )}
      </div>
    </div>
  );
}

function MoveHistory({ history }: { history: MoveRecord[] }) {
  const rows = useMemo(() => {
    const pairs: { number: number; white?: string; black?: string }[] = [];
    history.forEach((record, index) => {
      const moveNumber = Math.floor(index / 2) + 1;
      if (index % 2 === 0) {
        pairs.push({ number: moveNumber, white: record.san });
      } else {
        const last = pairs[pairs.length - 1];
        if (last) last.black = record.san;
      }
    });
    return pairs;
  }, [history]);

  if (rows.length === 0) {
    return (
      <p
        data-ocid="chess.history.empty_state"
        className="px-3 py-6 text-center text-xs text-muted-foreground"
      >
        No moves yet. White opens.
      </p>
    );
  }

  return (
    <ol
      data-ocid="chess.history.list"
      className="max-h-[22rem] overflow-y-auto font-mono text-xs"
    >
      {rows.map((row, index) => (
        <li
          key={row.number}
          data-ocid={`chess.history.item.${index + 1}`}
          className="grid grid-cols-[2.5rem_1fr_1fr] items-center gap-1 border-b border-border/60 px-3 py-1.5 last:border-b-0"
        >
          <span className="text-muted-foreground">
            {row.number.toString().padStart(2, "0")}
          </span>
          <span className="truncate">{row.white ?? ""}</span>
          <span className="truncate text-muted-foreground">
            {row.black ?? ""}
          </span>
        </li>
      ))}
    </ol>
  );
}

export function ChessPage() {
  const [state, setState] = useState<GameState>(() => createInitialState());
  const [history, setHistory] = useState<MoveRecord[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [pending, setPending] = useState<PendingPromotion | null>(null);

  const legalMoves = useMemo(() => generateLegalMoves(state), [state]);
  const status = useMemo(() => getGameStatus(state), [state]);
  const captured = useMemo(() => capturedFromHistory(history), [history]);

  const movesFromSelected = useMemo(
    () =>
      selected === null ? [] : legalMoves.filter((m) => m.from === selected),
    [legalMoves, selected],
  );

  const targets = useMemo(
    () => new Set(movesFromSelected.map((m) => m.to)),
    [movesFromSelected],
  );

  const lastMove = history.length > 0 ? history[history.length - 1].move : null;

  function commitMove(move: Move) {
    const san = moveToSan(state, move);
    setState(applyMove(state, move));
    setHistory((prev) => [...prev, { san, move }]);
    setSelected(null);
    setPending(null);
  }

  function handleSquareClick(square: number) {
    if (status.over || pending) return;
    const piece = state.board[square];

    if (selected !== null) {
      const candidates = movesFromSelected.filter((m) => m.to === square);
      if (candidates.length > 0) {
        const promotion = candidates.find((m) => m.promotion);
        if (promotion) {
          setPending({ from: selected, to: square });
          return;
        }
        commitMove(candidates[0]);
        return;
      }
    }

    if (piece && piece.color === state.turn) {
      setSelected(square === selected ? null : square);
      return;
    }
    setSelected(null);
  }

  function choosePromotion(type: PieceType) {
    if (!pending) return;
    const move = legalMoves.find(
      (m) =>
        m.from === pending.from && m.to === pending.to && m.promotion === type,
    );
    if (move) commitMove(move);
    else setPending(null);
  }

  function resetGame() {
    setState(createInitialState());
    setHistory([]);
    setSelected(null);
    setPending(null);
  }

  function undoMove() {
    if (history.length === 0) return;
    const previous = history.slice(0, -1);
    let rebuilt = createInitialState();
    for (const record of previous) {
      rebuilt = applyMove(rebuilt, record.move);
    }
    setState(rebuilt);
    setHistory(previous);
    setSelected(null);
    setPending(null);
  }

  const turnLabel = state.turn === "w" ? "White" : "Black";

  return (
    <div className="rule-grid-fine min-h-full">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Games
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Chess
            </h1>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground text-pretty">
              Two-player local play with full legal moves, castling, en passant,
              and promotion.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={undoMove}
              disabled={history.length === 0}
              data-ocid="chess.undo_button"
              className="rounded-sm"
            >
              <Undo2 className="size-4" />
              Undo
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={resetGame}
              data-ocid="chess.new_game_button"
              className="rounded-sm shadow-stamp"
            >
              <RotateCcw className="size-4" />
              New game
            </Button>
          </div>
        </header>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <section className="min-w-0">
            <div
              data-ocid="chess.status"
              className={cn(
                "flex items-center gap-3 border border-border bg-card px-4 py-3 shadow-subtle",
                status.check && !status.over && "border-primary/50",
              )}
            >
              <span
                className={cn(
                  "size-3 shrink-0 rounded-full border",
                  state.turn === "w"
                    ? "border-border bg-cardface"
                    : "border-border bg-foreground",
                )}
                aria-hidden="true"
              />
              <p
                className={cn(
                  "font-display text-sm font-semibold tracking-tight",
                  status.over && "text-primary",
                )}
              >
                {status.label}
              </p>
              {!status.over ? (
                <span className="ml-auto font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                  Move {state.fullmove}
                </span>
              ) : null}
            </div>

            <div className="mt-4 flex justify-center">
              <div
                data-ocid="chess.board"
                className="grid w-full max-w-[min(88vw,34rem)] grid-cols-8 border-2 border-board-line/70 bg-board shadow-elevated"
              >
                {state.board.map((piece, square) => {
                  const isSelected = selected === square;
                  const isTarget = targets.has(square);
                  const isCaptureTarget = isTarget && !!piece;
                  const isLast =
                    lastMove !== null &&
                    (lastMove.from === square || lastMove.to === square);
                  const showRank = fileOf(square) === 0;
                  const showFile = rankOf(square) === 7;
                  return (
                    <button
                      key={squareName(square)}
                      type="button"
                      onClick={() => handleSquareClick(square)}
                      aria-label={`${squareName(square)}${
                        piece
                          ? `, ${piece.color === "w" ? "white" : "black"} ${pieceName(piece.type)}`
                          : ", empty"
                      }`}
                      data-ocid={`chess.square.${squareName(square)}`}
                      className={cn(
                        "relative flex aspect-square items-center justify-center transition-colors",
                        isLightSquare(square) ? "bg-board" : "bg-board/80",
                        isLast && "bg-primary/15",
                        isSelected && "bg-primary/25",
                        "hover:bg-primary/10",
                      )}
                    >
                      {showRank ? (
                        <span className="pointer-events-none absolute left-0.5 top-0.5 font-mono text-[0.55rem] leading-none text-board-line/70">
                          {8 - rankOf(square)}
                        </span>
                      ) : null}
                      {showFile ? (
                        <span className="pointer-events-none absolute bottom-0.5 right-0.5 font-mono text-[0.55rem] leading-none text-board-line/70">
                          {squareName(square)[0]}
                        </span>
                      ) : null}
                      {piece ? (
                        <span
                          className={cn(
                            "select-none text-[clamp(1.5rem,5.5vw,2.75rem)] leading-none",
                            piece.color === "w"
                              ? "text-cardface drop-shadow-[0_1px_0_rgba(0,0,0,0.35)]"
                              : "text-foreground",
                          )}
                        >
                          {pieceGlyph(piece)}
                        </span>
                      ) : null}
                      {isTarget && !isCaptureTarget ? (
                        <span
                          className="pointer-events-none absolute size-2.5 rounded-full bg-primary/60"
                          aria-hidden="true"
                        />
                      ) : null}
                      {isCaptureTarget ? (
                        <span
                          className="pointer-events-none absolute inset-1 rounded-sm border-2 border-primary/70"
                          aria-hidden="true"
                        />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <aside className="flex min-w-0 flex-col gap-4">
            <div className="border border-border bg-card shadow-subtle">
              <div className="flex items-center justify-between border-b border-border px-3 py-2">
                <h2 className="font-display text-sm font-semibold tracking-tight">
                  Captured
                </h2>
                <span className="font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                  {captured.w.length + captured.b.length} taken
                </span>
              </div>
              <div className="space-y-1 px-3 py-3">
                <CapturedRow pieces={captured.w} color="w" label="White" />
                <CapturedRow pieces={captured.b} color="b" label="Black" />
              </div>
            </div>

            <div className="border border-border bg-card shadow-subtle">
              <div className="flex items-center justify-between border-b border-border px-3 py-2">
                <h2 className="font-display text-sm font-semibold tracking-tight">
                  Move history
                </h2>
                <span className="font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                  {turnLabel} to move
                </span>
              </div>
              <MoveHistory history={history} />
            </div>
          </aside>
        </div>
      </div>

      <Dialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open) setPending(null);
        }}
      >
        <DialogContent data-ocid="chess.promotion.dialog" className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Promote pawn</DialogTitle>
            <DialogDescription>
              Choose the piece your pawn becomes on{" "}
              {pending ? squareName(pending.to) : ""}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-4 gap-2">
            {PROMOTION_CHOICES.map((type) => (
              <Button
                key={type}
                type="button"
                variant="outline"
                onClick={() => choosePromotion(type)}
                data-ocid={`chess.promotion.${type}`}
                className="h-16 flex-col gap-1 rounded-sm"
              >
                <span className="text-2xl leading-none">
                  {pieceGlyph({ color: state.turn, type })}
                </span>
                <span className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                  {pieceName(type)}
                </span>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
