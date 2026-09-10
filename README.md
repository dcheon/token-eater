# Token Eater

A pet that lives in your VS Code sidebar and reacts to **your typing** and **Claude Code activity**.
It starts as a Lv 0 slime, grows the more tokens it eats, and takes on new forms as it levels up.

## How it works

| State | Pet | Detection |
|------|-----|-----------|
| `idle` | Quietly breathing, waiting | No activity |
| `typing` | Bouncing, wagging its tail | File edits detected (`onDidChangeTextDocument`) |
| `working` | Randomly runs / eats / plays fetch | Claude Code session log (`~/.claude/projects/*.jsonl`) updates detected |
| `digesting` | Belly deflates right after a compaction | Summary line in the transcript / sudden context drop detected |

## Leveling & forms

The pet tracks two separate numbers.

- **Food** — the number of tokens *currently* in context. Shrinks when a compaction happens.
  Once it crosses 80% of the auto-compact point (~160k), the pet gets fat.
- **XP** — the **cumulative** number of tokens ever eaten. Never decreases, and is persisted
  in VS Code's `globalState`, surviving restarts. Cache reuse (`cache_read`) re-sends context
  that has already been paid for, so it is excluded from XP.

The cost of each level starts at 2,000 tokens and grows 1.18x per level.

| Form | Reached at | Cumulative XP | Art |
|------|-----------|---------|------|
| Slime | Lv 0 | 0 | dedicated sprite |
| Puppy | Lv 5 | ~14,000 | dedicated sprite |
| Wolf | Lv 12 | ~70,000 | puppy sprite + CSS tint (placeholder) |
| Beast | Lv 20 | ~293,000 | puppy sprite + CSS tint (placeholder) |
| Dragon | Lv 30 | ~1,580,000 | puppy sprite + CSS tint (placeholder) |

Leveling up shows a `LEVEL UP!` notification; changing form shows an `EVOLVED!` one.
Use **Token Eater: Reset** — from the Command Palette, or the **...** menu next to the
view's title — to zero out both level/XP and current food, starting back over from Lv 0 Slime.

### Adding a new form

1. Add a 176×128 grid (4px cells) SVG to `src/sprites.ts` and register it in `SPRITES`.
   Attach the `.eye-open` / `.eye-closed` / `.tongue` classes and the sleeping/tongue-out
   animations come along for free.
2. Add one line to the `STAGES` array in `src/leveling.ts`: `{ id, name, minLevel, sprite }`.

CSS wires itself up automatically via the `.pet--stage-<id>` / `.pet--sprite-<id>` classes —
nothing else needs to change.

## Running it (development)

```bash
npm install
npm run compile
```

Then open this folder in VS Code and press **F5** to launch the Extension Development Host.
Click the icon in the left Activity Bar.

## Where this is going

The current build raises a single pet along a fixed ladder. The direction I'm working toward
is a small roster instead: you hatch several different pets — a slime, a puppy, and others —
and raise them alongside each other rather than watching one form replace the last.

The next pieces of work follow from that:

- Dedicated sprites for every pet, so forms stop borrowing the puppy art
- A picker for choosing and switching between pets
- Per-pet XP, so each one grows from your work on its own
- Click interactions (feeding / petting)
- Branching growth, where the kind of tokens eaten shapes how a pet turns out

## Notes

- Claude activity detection relies on the **Claude Code CLI** writing session logs to
  `~/.claude/projects/`. The pet starts moving once you begin working with Claude Code.
- History from before the extension was first enabled doesn't count toward XP (past logs
  are not counted).
- All artwork in this project is AI-generated: both the in-app pet sprites in `src/sprites.ts`
  and the pose sheets under `references/`, which are kept only as drawing reference.
