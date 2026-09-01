/**
 * Leveling & evolution rules for the pet.
 *
 * XP is the *cumulative* number of tokens the pet has ever eaten. It only ever
 * grows and is persisted across sessions — unlike `food` (the current context
 * size), which shrinks whenever Claude Code compacts.
 */

export const MAX_LEVEL = 99;

/** Tokens needed to clear level 0. */
const XP_BASE = 2000;
/** Each level costs this much more than the one before it. */
const XP_GROWTH = 1.18;

/**
 * Cumulative XP required to reach each level, index = level. Precomputed once
 * so `xpForLevel` and `levelFromXp` are exact inverses; deriving the level from
 * a closed-form log instead drifts by one at the rounded boundaries.
 */
const THRESHOLDS: number[] = (() => {
  const table = [0];
  let cost = XP_BASE;
  for (let level = 1; level <= MAX_LEVEL + 1; level++) {
    table.push(table[level - 1] + Math.round(cost));
    cost *= XP_GROWTH;
  }
  return table;
})();

/** Cumulative XP required to *reach* the given level. */
export function xpForLevel(level: number): number {
  const capped = Math.max(0, Math.min(Math.floor(level), MAX_LEVEL + 1));
  return THRESHOLDS[capped];
}

/** Inverse of {@link xpForLevel}. */
export function levelFromXp(xp: number): number {
  const safe = Math.max(0, xp);
  let level = 0;
  while (level < MAX_LEVEL && safe >= THRESHOLDS[level + 1]) {
    level++;
  }
  return level;
}

export interface PetStage {
  /** Stable id — also the `pet--stage-<id>` CSS class. */
  id: string;
  name: string;
  /** First level at which this form appears. */
  minLevel: number;
  /** Which sprite in `sprites.ts` draws this form. */
  sprite: string;
}

/**
 * The evolution ladder. Adding a form should stay a one-line change here plus
 * one SVG in `sprites.ts` — keep the two apart.
 *
 * Only `slime` and `dog` are drawn so far; the later forms borrow the dog
 * sprite and are re-tinted in CSS until they get real art.
 */
export const STAGES: PetStage[] = [
  { id: 'slime', name: 'Slime', minLevel: 0, sprite: 'slime' },
  { id: 'puppy', name: 'Puppy', minLevel: 5, sprite: 'dog' },
  { id: 'wolf', name: 'Wolf', minLevel: 12, sprite: 'dog' },
  { id: 'beast', name: 'Beast', minLevel: 20, sprite: 'dog' },
  { id: 'dragon', name: 'Dragon', minLevel: 30, sprite: 'dog' },
];

export function stageForLevel(level: number): PetStage {
  let found = STAGES[0];
  for (const stage of STAGES) {
    if (level >= stage.minLevel) {
      found = stage;
    }
  }
  return found;
}

/** The next form the pet is growing toward, or undefined at the final form. */
export function nextStage(level: number): PetStage | undefined {
  return STAGES.find((s) => s.minLevel > level);
}

export interface Progress {
  xp: number;
  level: number;
  stage: PetStage;
  /** XP earned inside the current level. */
  xpIntoLevel: number;
  /** XP the current level costs in total. */
  xpForNext: number;
  /** 0–1, how far through the current level. */
  ratio: number;
  /** Level at which the pet next changes form; undefined at the final form. */
  evolvesAt?: number;
}

export function levelProgress(xp: number): Progress {
  const safe = Math.max(0, Math.round(xp));
  const level = levelFromXp(safe);
  const floor = xpForLevel(level);
  const span = Math.max(1, xpForLevel(level + 1) - floor);
  const xpIntoLevel = level >= MAX_LEVEL ? span : safe - floor;
  return {
    xp: safe,
    level,
    stage: stageForLevel(level),
    xpIntoLevel,
    xpForNext: span,
    ratio: Math.max(0, Math.min(1, xpIntoLevel / span)),
    evolvesAt: nextStage(level)?.minLevel,
  };
}
