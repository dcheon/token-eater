# Token Eater

A pet that lives in your VS Code sidebar and reacts to **your typing** and **Claude Code activity**.
It starts as a Lv 0 slime, grows the more tokens it eats, and takes on new forms as it levels up.

## How it works

| State | Pet | Detection |
|------|-----|-----------|
| `idle` | Sleeps — the slime plays its 3-frame sleeping loop | No activity |
| `typing` | Small hop (the dog also wags its tail) | File edits detected (`onDidChangeTextDocument`) |
| `working` | Randomly cycles run / zoom / eat / play / jump / spin | Claude Code session log (`~/.claude/projects/*.jsonl`) updates detected |
| `calling` | Hops and tilts toward you with a `!` overhead | Claude is blocked waiting on you (see below) |
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
| Slime | Lv 0 | 0 | 3-frame drawn art |
| Puppy | Lv 5 | ~14,300 | dedicated sprite |
| Wolf | Lv 12 | ~69,900 | puppy sprite + CSS tint (placeholder) |
| Beast | Lv 20 | ~293,000 | puppy sprite + CSS tint (placeholder) |
| Dragon | Lv 30 | ~1,582,000 | puppy sprite + CSS tint (placeholder) |

Leveling up shows a `LEVEL UP!` burst; changing form shows an `EVOLVED!` one plus a notification.
Use **Token Eater: Reset** — from the Command Palette, or the **...** menu next to the view's
title — to zero out level, XP, and food, starting back over from Lv 0 Slime.

## Art

Two kinds of sprite live in `src/sprites.ts`:

- **Inline SVG** (the dog) on a 176×128 grid in 4px cells, so CSS can animate individual parts.
  Attach the `.eye-open` / `.eye-closed` / `.tongue` classes and the sleeping/tongue-out
  animations come along for free.
- **Drawn frames** (the slime) shipped as PNGs from `media/img/` and cross-cut by CSS. It plays
  frames 1-2-3-2 on a 2.4s loop while sleeping, and holds frame 1 while working or calling.
  Its "zZz" is part of the art, so the DOM's own floating `zzz` is hidden for this form.

Only the sleeping pose is drawn for the slime so far, so its working and calling states hold a
sleeping frame and lean on the whole-pet motion instead. State motions (`.pet--calling` and
friends) transform the pet as a whole, which is what lets them work for both kinds of sprite.

Anything the webview loads at runtime has to live under `media/` — `.vscodeignore` excludes
`src/**`, so art kept there would be missing from the packaged `.vsix`. The slime frames are
committed at their native 152×73 pixel grid with the background already keyed out; scale them
in CSS rather than shipping large renders.

### Adding a new form

1. Add a sprite to `src/sprites.ts` (either kind).
2. Add one line to the `STAGES` array in `src/leveling.ts`: `{ id, name, minLevel, sprite }`.

CSS wires itself up automatically via the `.pet--stage-<id>` / `.pet--sprite-<id>` classes —
nothing else needs to change.

## Running it (development)

```bash
npm install
npm run compile
```

Then open this folder in VS Code and press **F5** to launch the Extension Development Host.
Click the Token Eater icon in the left Activity Bar.

`.vscode/` is gitignored, so a fresh clone has no launch config and F5 won't start the
Extension Development Host. Create `.vscode/launch.json` with an `extensionHost` configuration
pointing `--extensionDevelopmentPath` at the workspace folder.

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
