# Token Eater

A pet living in your VS Code sidebar that reacts to **your typing** and **Claude Code activity**.
It starts as a Lv 0 slime, grows the more tokens Claude eats, and eventually **evolves** into
other creatures.

## How it works

| State | Pet | Detection |
|------|-----|-----------|
| `idle` | Sleeps — the slime plays its 3-frame sleeping loop | No activity |
| `typing` | Small hop (the dog also wags its tail) | File edits detected (`onDidChangeTextDocument`) |
| `working` | Randomly cycles run / zoom / eat / play / jump / spin | Claude Code session log (`~/.claude/projects/*.jsonl`) updates detected |
| `digesting` | Belly deflates right after a compaction | Summary line in the transcript / sudden context drop detected |

Priority is `working` > `typing` > `idle`: while Claude is working, file changes are assumed
to be Claude editing rather than you typing, so the pet doesn't flicker between the two.

## The readout

- **Lv + stage name**, with an XP bar underneath showing `<into level> / <level cost> XP (<pct>%)`
  and the level the next evolution lands on.
- **Food** — tokens eaten, abbreviated past a thousand (`12.3k`, `1.58m`).

Level-ups play Pokémon-style: the bar fills all the way to 100% *first*, and only once it's
full does the level number flip over. Gaining several levels at once plays that as several
separate level-ups rather than one jump.

## Leveling & evolution

The pet tracks two separate numbers.

- **Food** — how many tokens the pet has eaten since the last reset. It counts only
  *newly consumed* tokens, so a reset actually sticks at 0 instead of snapping back to whatever
  the running session already had in context. Not persisted across restarts.
  (Fatness is separate: the pet widens off the *live* context size, once that crosses 80% of
  the auto-compact point at ~160k.)
- **XP** — the **cumulative** number of tokens ever eaten. Never decreases, and is persisted in
  VS Code's `globalState`, surviving restarts. Cache reuse (`cache_read`) re-sends context
  that's already been paid for, so it's excluded from XP.

The cost of each level starts at 2,000 tokens and grows 1.18x per level.

| Stage | Reached at | Cumulative XP | Art |
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
  frames 1-2-3-2 on a 2.4s loop whenever it isn't eating tokens, and holds frame 1 while Claude
  works. Its "zZz" is part of the art, so the DOM's own floating `zzz` is hidden for this form.

Anything the webview loads at runtime has to live under `media/` — `.vscodeignore` excludes
`src/**`, so art kept there would be missing from the packaged `.vsix`. The slime frames are
committed at their native 152×73 pixel grid with the background already keyed out; scale them
in CSS rather than shipping large renders.

### Adding a new evolution stage

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

## Notes

- Claude activity detection relies on the **Claude Code CLI** writing session logs to
  `~/.claude/projects/`. The pet starts moving once you begin working with Claude Code.
  The log format is undocumented, so this can break when it changes.
- History from before the extension was first enabled doesn't count toward XP.
- The pet's art is all original — hand-drawn SVG for the dog, drawn frames for the slime.

## Ideas for next steps

- Dedicated sprites for the wolf / beast / dragon stages (currently a CSS-tinted puppy placeholder)
- More slime frames for the working/eating states (only the sleeping loop is drawn so far)
- Click interactions (feeding / petting)
- Branching evolutions (different forms depending on the kind of tokens eaten)
- Make use of the sprite sheets in the `references/` folder
