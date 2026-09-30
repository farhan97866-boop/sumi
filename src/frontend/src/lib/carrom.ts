/**
 * Carrom physics — a compact, deterministic 2D disc simulation.
 *
 * The board is modelled in abstract units where the playing surface is a
 * square of side `BOARD_SIZE`. All positions are centre points; all radii are
 * in the same units. The simulation is stepped at a fixed timestep so the
 * result is stable regardless of frame rate.
 */

export const BOARD_SIZE = 100;
export const POCKET_RADIUS = 5.2;
export const COIN_RADIUS = 2.05;
export const STRIKER_RADIUS = 2.75;
export const FRICTION = 0.985;
export const MIN_SPEED = 0.045;
export const MAX_POWER = 46;

export type PlayerId = 1 | 2;
export type CoinKind = "white" | "black" | "queen";

export interface Disc {
  id: string;
  kind: CoinKind | "striker";
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  pocketed: boolean;
}

export interface Pocket {
  x: number;
  y: number;
}

export interface ShotResult {
  pocketed: CoinKind[];
  strikerPocketed: boolean;
}

export const POCKETS: Pocket[] = [
  { x: POCKET_RADIUS + 1.6, y: POCKET_RADIUS + 1.6 },
  { x: BOARD_SIZE - POCKET_RADIUS - 1.6, y: POCKET_RADIUS + 1.6 },
  { x: POCKET_RADIUS + 1.6, y: BOARD_SIZE - POCKET_RADIUS - 1.6 },
  { x: BOARD_SIZE - POCKET_RADIUS - 1.6, y: BOARD_SIZE - POCKET_RADIUS - 1.6 },
];

/** The striker slides along the baseline nearest the active player. */
export function baselineFor(player: PlayerId): number {
  return player === 1 ? BOARD_SIZE - 8 : 8;
}

/** Horizontal travel limits for the striker on its baseline. */
export function strikerBounds(): { min: number; max: number } {
  return { min: 14, max: BOARD_SIZE - 14 };
}

function makeDisc(
  id: string,
  kind: Disc["kind"],
  x: number,
  y: number,
  radius: number,
): Disc {
  return { id, kind, x, y, vx: 0, vy: 0, radius, pocketed: false };
}

/**
 * Build the standard opening arrangement: a hexagonal rosette of 19 coins
 * (9 white, 9 black, 1 queen at the centre) plus the striker.
 */
export function createInitialDiscs(): Disc[] {
  const discs: Disc[] = [];
  const cx = BOARD_SIZE / 2;
  const cy = BOARD_SIZE / 2;
  const step = COIN_RADIUS * 2 + 0.12;

  // Hexagonal packing rings: centre + ring 1 (6) + ring 2 (12) = 19 coins.
  const layout: Array<{ dx: number; dy: number }> = [{ dx: 0, dy: 0 }];
  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.PI / 3) * i;
    layout.push({ dx: Math.cos(angle) * step, dy: Math.sin(angle) * step });
  }
  for (let i = 0; i < 12; i += 1) {
    const angle = (Math.PI / 6) * i;
    const ring = i % 2 === 0 ? step * 1.732 : step * 2;
    layout.push({ dx: Math.cos(angle) * ring, dy: Math.sin(angle) * ring });
  }

  layout.forEach((slot, index) => {
    const x = cx + slot.dx;
    const y = cy + slot.dy;
    if (index === 0) {
      discs.push(makeDisc("queen", "queen", x, y, COIN_RADIUS));
      return;
    }
    // Alternate colours around the rosette so both players have a fair spread.
    const kind: CoinKind = index % 2 === 1 ? "white" : "black";
    discs.push(makeDisc(`${kind}-${index}`, kind, x, y, COIN_RADIUS));
  });

  discs.push(
    makeDisc(
      "striker",
      "striker",
      BOARD_SIZE / 2,
      baselineFor(1),
      STRIKER_RADIUS,
    ),
  );
  return discs;
}

export function countRemaining(discs: Disc[], kind: CoinKind): number {
  return discs.filter((d) => d.kind === kind && !d.pocketed).length;
}

/** True when every disc has come to rest. */
export function isSettled(discs: Disc[]): boolean {
  return discs.every((d) => d.pocketed || Math.hypot(d.vx, d.vy) < MIN_SPEED);
}

function resolvePockets(discs: Disc[], result: ShotResult): void {
  for (const disc of discs) {
    if (disc.pocketed) continue;
    for (const pocket of POCKETS) {
      const dist = Math.hypot(disc.x - pocket.x, disc.y - pocket.y);
      if (dist < POCKET_RADIUS - disc.radius * 0.35) {
        disc.pocketed = true;
        disc.vx = 0;
        disc.vy = 0;
        if (disc.kind === "striker") {
          result.strikerPocketed = true;
        } else {
          result.pocketed.push(disc.kind);
        }
        break;
      }
    }
  }
}

function resolveWalls(disc: Disc): void {
  const min = disc.radius;
  const max = BOARD_SIZE - disc.radius;
  if (disc.x < min) {
    disc.x = min;
    disc.vx = Math.abs(disc.vx) * 0.82;
  } else if (disc.x > max) {
    disc.x = max;
    disc.vx = -Math.abs(disc.vx) * 0.82;
  }
  if (disc.y < min) {
    disc.y = min;
    disc.vy = Math.abs(disc.vy) * 0.82;
  } else if (disc.y > max) {
    disc.y = max;
    disc.vy = -Math.abs(disc.vy) * 0.82;
  }
}

function resolveCollisions(discs: Disc[]): void {
  for (let i = 0; i < discs.length; i += 1) {
    const a = discs[i];
    if (a.pocketed) continue;
    for (let j = i + 1; j < discs.length; j += 1) {
      const b = discs[j];
      if (b.pocketed) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy);
      const minDist = a.radius + b.radius;
      if (dist === 0 || dist >= minDist) continue;

      const nx = dx / dist;
      const ny = dy / dist;
      const overlap = minDist - dist;
      a.x -= nx * overlap * 0.5;
      a.y -= ny * overlap * 0.5;
      b.x += nx * overlap * 0.5;
      b.y += ny * overlap * 0.5;

      // Relative velocity along the collision normal.
      const rvx = b.vx - a.vx;
      const rvy = b.vy - a.vy;
      const velAlongNormal = rvx * nx + rvy * ny;
      if (velAlongNormal > 0) continue;

      const restitution = 0.94;
      const impulse = (-(1 + restitution) * velAlongNormal) / 2;
      a.vx -= impulse * nx;
      a.vy -= impulse * ny;
      b.vx += impulse * nx;
      b.vy += impulse * ny;
    }
  }
}

/**
 * Advance the simulation by one fixed step. Returns the pocket events that
 * occurred during this step so the caller can score them.
 */
export function step(discs: Disc[]): ShotResult {
  const result: ShotResult = { pocketed: [], strikerPocketed: false };

  for (const disc of discs) {
    if (disc.pocketed) continue;
    disc.x += disc.vx;
    disc.y += disc.vy;
    disc.vx *= FRICTION;
    disc.vy *= FRICTION;
    if (Math.hypot(disc.vx, disc.vy) < MIN_SPEED) {
      disc.vx = 0;
      disc.vy = 0;
    }
  }

  resolveCollisions(discs);
  for (const disc of discs) {
    if (!disc.pocketed) resolveWalls(disc);
  }
  resolvePockets(discs, result);

  return result;
}

/** Launch the striker from its baseline toward the aim angle. */
export function launchStriker(
  striker: Disc,
  angle: number,
  power: number,
): void {
  const speed = (power / 100) * MAX_POWER;
  striker.vx = Math.cos(angle) * speed;
  striker.vy = Math.sin(angle) * speed;
}

/** Place the striker at a horizontal position on the active player's baseline. */
export function placeStriker(striker: Disc, player: PlayerId, x: number): void {
  const bounds = strikerBounds();
  striker.x = Math.min(bounds.max, Math.max(bounds.min, x));
  striker.y = baselineFor(player);
  striker.vx = 0;
  striker.vy = 0;
  striker.pocketed = false;
}

/** True when the striker overlaps any live coin at its current position. */
export function strikerOverlapsCoin(discs: Disc[], striker: Disc): boolean {
  return discs.some((disc) => {
    if (disc.pocketed || disc.kind === "striker") return false;
    const dist = Math.hypot(disc.x - striker.x, disc.y - striker.y);
    return dist < disc.radius + striker.radius + 0.4;
  });
}

export interface PlayerScore {
  pocketed: number;
  remaining: number;
}

export function scoreFor(discs: Disc[], player: PlayerId): PlayerScore {
  const kind: CoinKind = player === 1 ? "white" : "black";
  const remaining = countRemaining(discs, kind);
  return { pocketed: 9 - remaining, remaining };
}
