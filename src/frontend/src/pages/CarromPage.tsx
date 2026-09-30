import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  BOARD_SIZE,
  COIN_RADIUS,
  type Disc,
  POCKETS,
  POCKET_RADIUS,
  type PlayerId,
  STRIKER_RADIUS,
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
import { RotateCcw, Target } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const CANVAS_SIZE = 640;
const SCALE = CANVAS_SIZE / BOARD_SIZE;

interface TurnState {
  player: PlayerId;
  message: string;
}

function drawBoard(ctx: CanvasRenderingContext2D, discs: Disc[]): void {
  const styles = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: string) =>
    styles.getPropertyValue(name).trim() || fallback;

  const board = read("--board", "oklch(0.86 0.052 74)");
  const boardLine = read("--board-line", "oklch(0.42 0.03 60)");
  const primary = read("--primary", "oklch(0.575 0.216 32)");
  const cardface = read("--cardface", "oklch(0.985 0.012 84)");
  const foreground = read("--foreground", "oklch(0.185 0.02 50)");

  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  // Board bed.
  ctx.fillStyle = board;
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  // Outer frame.
  ctx.strokeStyle = boardLine;
  ctx.lineWidth = 3;
  ctx.strokeRect(6, 6, CANVAS_SIZE - 12, CANVAS_SIZE - 12);

  // Centre circle and rosette guide.
  ctx.beginPath();
  ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, 46, 0, Math.PI * 2);
  ctx.strokeStyle = boardLine;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, 12, 0, Math.PI * 2);
  ctx.stroke();

  // Baselines for both players.
  ctx.setLineDash([6, 6]);
  ctx.lineWidth = 1;
  for (const player of [1, 2] as PlayerId[]) {
    const y = baselineFor(player) * SCALE;
    ctx.beginPath();
    ctx.moveTo(14 * SCALE, y);
    ctx.lineTo((BOARD_SIZE - 14) * SCALE, y);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Pockets.
  for (const pocket of POCKETS) {
    ctx.beginPath();
    ctx.arc(
      pocket.x * SCALE,
      pocket.y * SCALE,
      POCKET_RADIUS * SCALE,
      0,
      Math.PI * 2,
    );
    ctx.fillStyle = foreground;
    ctx.fill();
    ctx.strokeStyle = boardLine;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Discs.
  for (const disc of discs) {
    if (disc.pocketed) continue;
    const x = disc.x * SCALE;
    const y = disc.y * SCALE;
    const r = disc.radius * SCALE;

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    if (disc.kind === "striker") {
      ctx.fillStyle = cardface;
    } else if (disc.kind === "queen") {
      ctx.fillStyle = primary;
    } else if (disc.kind === "white") {
      ctx.fillStyle = cardface;
    } else {
      ctx.fillStyle = foreground;
    }
    ctx.fill();
    ctx.strokeStyle = boardLine;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    if (disc.kind === "queen") {
      ctx.beginPath();
      ctx.arc(x, y, r * 0.42, 0, Math.PI * 2);
      ctx.fillStyle = cardface;
      ctx.fill();
    }
  }
}

export function CarromPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const discsRef = useRef<Disc[]>(createInitialDiscs());
  const rafRef = useRef<number | null>(null);
  const settlingRef = useRef(false);

  const [turn, setTurn] = useState<TurnState>({
    player: 1,
    message: "Player 1 to break.",
  });
  const [aim, setAim] = useState(0);
  const [power, setPower] = useState(55);
  const [strikerX, setStrikerX] = useState(BOARD_SIZE / 2);
  const [winner, setWinner] = useState<PlayerId | null>(null);
  const [tick, setTick] = useState(0);

  const bounds = useMemo(() => strikerBounds(), []);

  const scores = useMemo(() => {
    // `tick` is the board revision counter; reading it keeps scores in sync
    // with every reset, slide, and settled shot.
    void tick;
    return {
      1: scoreFor(discsRef.current, 1),
      2: scoreFor(discsRef.current, 2),
    };
  }, [tick]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawBoard(ctx, discsRef.current);
  }, []);

  // Redraw whenever the board or theme changes.
  useEffect(() => {
    void tick;
    render();
  }, [render, tick]);

  useEffect(() => {
    const observer = new MutationObserver(() => render());
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, [render]);

  const finishShot = useCallback(() => {
    settlingRef.current = false;
    const discs = discsRef.current;
    const strikerDisc = discs.find((d) => d.kind === "striker") as Disc;

    const whiteLeft = scoreFor(discs, 1).remaining;
    const blackLeft = scoreFor(discs, 2).remaining;

    if (whiteLeft === 0 || blackLeft === 0) {
      const winnerId: PlayerId = whiteLeft === 0 ? 1 : 2;
      setWinner(winnerId);
      setTurn((prev) => ({
        ...prev,
        message: `Player ${winnerId} cleared the board.`,
      }));
      setTick((t) => t + 1);
      return;
    }

    setTurn((prev) => {
      const nextPlayer: PlayerId = prev.player === 1 ? 2 : 1;
      placeStriker(strikerDisc, nextPlayer, BOARD_SIZE / 2);
      setStrikerX(BOARD_SIZE / 2);
      return {
        player: nextPlayer,
        message: `Player ${nextPlayer}'s turn.`,
      };
    });
    setTick((t) => t + 1);
  }, []);

  const animate = useCallback(() => {
    const discs = discsRef.current;
    step(discs);
    render();

    if (isSettled(discs)) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      finishShot();
      return;
    }
    rafRef.current = requestAnimationFrame(animate);
  }, [finishShot, render]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const handleShoot = useCallback(() => {
    if (winner || settlingRef.current) return;
    const strikerDisc = discsRef.current.find(
      (d) => d.kind === "striker",
    ) as Disc;
    if (strikerOverlapsCoin(discsRef.current, strikerDisc)) {
      setTurn((prev) => ({
        ...prev,
        message: "Striker is touching a coin — slide it aside.",
      }));
      return;
    }
    settlingRef.current = true;
    launchStriker(strikerDisc, aim, power);
    setTurn((prev) => ({ ...prev, message: "Shot in play…" }));
    rafRef.current = requestAnimationFrame(animate);
  }, [aim, animate, power, winner]);

  const handleReset = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    settlingRef.current = false;
    discsRef.current = createInitialDiscs();
    setWinner(null);
    setTurn({ player: 1, message: "Player 1 to break." });
    setStrikerX(BOARD_SIZE / 2);
    setAim(0);
    setPower(55);
    setTick((t) => t + 1);
  }, []);

  const handleStrikerSlide = useCallback(
    (value: number) => {
      if (winner || settlingRef.current) return;
      const strikerDisc = discsRef.current.find(
        (d) => d.kind === "striker",
      ) as Disc;
      placeStriker(strikerDisc, turn.player, value);
      setStrikerX(strikerDisc.x);
      setTick((t) => t + 1);
    },
    [turn.player, winner],
  );

  return (
    <div className="rule-grid-fine min-h-full">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Games
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Carrom
            </h1>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground text-pretty">
              Two players share one board. Slide the striker along your
              baseline, aim, and flick to pocket your coins.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            data-ocid="carrom.reset_button"
            className="rounded-sm"
          >
            <RotateCcw className="size-4" />
            New game
          </Button>
        </header>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section
            data-ocid="carrom.board_panel"
            className="flex flex-col items-center"
          >
            <div className="relative w-full max-w-[640px]">
              <canvas
                ref={canvasRef}
                width={CANVAS_SIZE}
                height={CANVAS_SIZE}
                data-ocid="carrom.canvas_target"
                role="img"
                aria-label="Carrom board with coins, striker, and four corner pockets"
                className="w-full rounded-sm border border-border shadow-elevated"
              />
              {winner ? (
                <div
                  data-ocid="carrom.success_state"
                  className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-sm bg-background/85 backdrop-blur-sm"
                >
                  <span className="seal size-12 text-xl" aria-hidden="true">
                    勝
                  </span>
                  <p className="font-display text-2xl font-bold tracking-tight">
                    Player {winner} wins
                  </p>
                  <p className="text-sm text-muted-foreground">
                    All {winner === 1 ? "white" : "black"} coins pocketed.
                  </p>
                  <Button
                    type="button"
                    onClick={handleReset}
                    data-ocid="carrom.play_again_button"
                    className="rounded-sm shadow-stamp"
                  >
                    Play again
                  </Button>
                </div>
              ) : null}
            </div>
          </section>

          <aside className="flex flex-col gap-4">
            <div
              data-ocid="carrom.score_panel"
              className="border border-border bg-card p-4 shadow-subtle"
            >
              <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Score
              </h2>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {([1, 2] as PlayerId[]).map((player) => {
                  const active = turn.player === player && !winner;
                  return (
                    <div
                      key={player}
                      data-ocid={`carrom.player_card.${player}`}
                      className={`border p-3 transition-smooth ${
                        active
                          ? "border-primary bg-primary/5"
                          : "border-border bg-background"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                          Player {player}
                        </span>
                        {active ? (
                          <span className="seal size-4 text-[0.6rem]">手</span>
                        ) : null}
                      </div>
                      <p className="mt-2 font-display text-2xl font-bold tabular-nums">
                        {scores[player].pocketed}
                        <span className="text-sm font-normal text-muted-foreground">
                          /9
                        </span>
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {player === 1 ? "White" : "Black"} ·{" "}
                        {scores[player].remaining} left
                      </p>
                    </div>
                  );
                })}
              </div>
              <p
                data-ocid="carrom.turn_status"
                className="mt-3 border-t border-border pt-3 text-sm text-muted-foreground"
              >
                {turn.message}
              </p>
            </div>

            <div
              data-ocid="carrom.controls_panel"
              className="border border-border bg-card p-4 shadow-subtle"
            >
              <h2 className="flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                <Target className="size-4" />
                Aim &amp; power
              </h2>

              <div className="mt-4 space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="carrom-aim"
                      className="text-xs font-medium text-foreground"
                    >
                      Aim angle
                    </label>
                    <span className="font-mono text-xs text-muted-foreground">
                      {Math.round((aim * 180) / Math.PI)}°
                    </span>
                  </div>
                  <Slider
                    id="carrom-aim"
                    data-ocid="carrom.aim_input"
                    className="mt-2"
                    min={-180}
                    max={180}
                    step={1}
                    value={[Math.round((aim * 180) / Math.PI)]}
                    onValueChange={([value]) => setAim((value * Math.PI) / 180)}
                    disabled={!!winner}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="carrom-power"
                      className="text-xs font-medium text-foreground"
                    >
                      Power
                    </label>
                    <span className="font-mono text-xs text-muted-foreground">
                      {power}%
                    </span>
                  </div>
                  <Slider
                    id="carrom-power"
                    data-ocid="carrom.power_input"
                    className="mt-2"
                    min={10}
                    max={100}
                    step={1}
                    value={[power]}
                    onValueChange={([value]) => setPower(value)}
                    disabled={!!winner}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="carrom-striker"
                      className="text-xs font-medium text-foreground"
                    >
                      Striker position
                    </label>
                    <span className="font-mono text-xs text-muted-foreground">
                      {Math.round(strikerX)}
                    </span>
                  </div>
                  <Slider
                    id="carrom-striker"
                    data-ocid="carrom.striker_input"
                    className="mt-2"
                    min={bounds.min}
                    max={bounds.max}
                    step={0.5}
                    value={[strikerX]}
                    onValueChange={([value]) => handleStrikerSlide(value)}
                    disabled={!!winner}
                  />
                </div>

                <Button
                  type="button"
                  onClick={handleShoot}
                  disabled={!!winner}
                  data-ocid="carrom.shoot_button"
                  className="w-full rounded-sm shadow-stamp"
                >
                  Flick striker
                </Button>
              </div>
            </div>

            <div className="border border-border bg-card p-4 text-xs text-muted-foreground shadow-subtle">
              <p className="font-mono uppercase tracking-wider">How to play</p>
              <ul className="mt-2 space-y-1.5">
                <li>· Player 1 pockets white coins, Player 2 pockets black.</li>
                <li>
                  · Slide the striker on your baseline, then set aim and power.
                </li>
                <li>· Pocket all nine of your coins to win the board.</li>
                <li>· The queen is the red coin at the centre.</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
