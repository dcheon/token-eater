/**
 * Pixel-art sprites for each evolution form, as inline SVG.
 *
 * They are inlined (rather than <img src>) so CSS can animate individual parts
 * — the tail, the head, the eyes. Every sprite is drawn on the same 176x128
 * grid in 4px cells, and all of them ship in the DOM at once; CSS shows only
 * the one matching the pet's current form.
 *
 * Shared part classes each sprite should provide where it makes sense:
 *   .eye-open / .eye-closed  — swapped when the pet sleeps
 *   .tongue                  — shown only while Claude is working
 */

/** Lv 0+ — a small blob. Where every pet starts. */
const SLIME = /* html */ `
<svg class="pixel sprite sprite--slime" viewBox="0 0 176 128" width="164" height="119" xmlns="http://www.w3.org/2000/svg">
  <g class="slime-body">
    <!-- dome: dark outline on each edge, body fill between -->
    <rect x="80" y="60" width="16" height="4" fill="#1f6f68"/>
    <rect x="72" y="64" width="4" height="4" fill="#1f6f68"/>
    <rect x="76" y="64" width="24" height="4" fill="#4fd0bb"/>
    <rect x="100" y="64" width="4" height="4" fill="#1f6f68"/>
    <rect x="68" y="68" width="4" height="4" fill="#1f6f68"/>
    <rect x="72" y="68" width="32" height="4" fill="#4fd0bb"/>
    <rect x="104" y="68" width="4" height="4" fill="#1f6f68"/>
    <rect x="64" y="72" width="4" height="4" fill="#1f6f68"/>
    <rect x="68" y="72" width="40" height="4" fill="#4fd0bb"/>
    <rect x="108" y="72" width="4" height="4" fill="#1f6f68"/>
    <rect x="60" y="76" width="4" height="4" fill="#1f6f68"/>
    <rect x="64" y="76" width="48" height="4" fill="#4fd0bb"/>
    <rect x="112" y="76" width="4" height="4" fill="#1f6f68"/>
    <rect x="60" y="80" width="4" height="4" fill="#1f6f68"/>
    <rect x="64" y="80" width="48" height="4" fill="#4fd0bb"/>
    <rect x="112" y="80" width="4" height="4" fill="#1f6f68"/>
    <rect x="56" y="84" width="4" height="4" fill="#1f6f68"/>
    <rect x="60" y="84" width="56" height="4" fill="#4fd0bb"/>
    <rect x="116" y="84" width="4" height="4" fill="#1f6f68"/>
    <rect x="56" y="88" width="4" height="4" fill="#1f6f68"/>
    <rect x="60" y="88" width="56" height="4" fill="#4fd0bb"/>
    <rect x="116" y="88" width="4" height="4" fill="#1f6f68"/>
    <rect x="52" y="92" width="4" height="4" fill="#1f6f68"/>
    <rect x="56" y="92" width="64" height="4" fill="#4fd0bb"/>
    <rect x="120" y="92" width="4" height="4" fill="#1f6f68"/>
    <rect x="52" y="96" width="4" height="4" fill="#1f6f68"/>
    <rect x="56" y="96" width="64" height="4" fill="#4fd0bb"/>
    <rect x="120" y="96" width="4" height="4" fill="#1f6f68"/>
    <rect x="48" y="100" width="4" height="4" fill="#1f6f68"/>
    <rect x="52" y="100" width="72" height="4" fill="#4fd0bb"/>
    <rect x="124" y="100" width="4" height="4" fill="#1f6f68"/>
    <rect x="48" y="104" width="4" height="4" fill="#1f6f68"/>
    <rect x="52" y="104" width="72" height="4" fill="#35b3a0"/>
    <rect x="124" y="104" width="4" height="4" fill="#1f6f68"/>
    <rect x="44" y="108" width="4" height="4" fill="#1f6f68"/>
    <rect x="48" y="108" width="80" height="4" fill="#35b3a0"/>
    <rect x="128" y="108" width="4" height="4" fill="#1f6f68"/>
    <rect x="44" y="112" width="88" height="4" fill="#1f6f68"/>
    <!-- gloss -->
    <rect x="80" y="68" width="8" height="4" fill="#bff6ec"/>
    <rect x="76" y="72" width="8" height="4" fill="#bff6ec"/>
    <rect x="72" y="76" width="4" height="4" fill="#bff6ec"/>
    <!-- face -->
    <g class="eye-open">
      <rect x="72" y="84" width="8" height="8" fill="#12332f"/>
      <rect x="96" y="84" width="8" height="8" fill="#12332f"/>
      <rect x="76" y="84" width="4" height="4" fill="#ffffff"/>
      <rect x="100" y="84" width="4" height="4" fill="#ffffff"/>
    </g>
    <rect class="eye-closed" x="70" y="87" width="12" height="3" fill="#12332f"/>
    <rect class="eye-closed" x="94" y="87" width="12" height="3" fill="#12332f"/>
    <rect x="84" y="96" width="8" height="4" fill="#12332f"/>
    <rect class="tongue" x="84" y="100" width="8" height="6" fill="#e8697d"/>
  </g>
</svg>`;

/** Lv 5+ — the original hand-drawn pup, sitting in profile. */
const DOG = /* html */ `
<svg class="pixel sprite sprite--dog" viewBox="0 0 176 128" width="164" height="119" xmlns="http://www.w3.org/2000/svg">
  <!-- tail: curls up over the back -->
  <g class="tail">
    <rect x="36" y="44" width="16" height="4" fill="#3a2317"/>
    <rect x="28" y="48" width="8" height="4" fill="#3a2317"/>
    <rect x="36" y="48" width="12" height="4" fill="#fdf4e6"/>
    <rect x="48" y="48" width="4" height="4" fill="#3a2317"/>
    <rect x="24" y="52" width="4" height="4" fill="#3a2317"/>
    <rect x="28" y="52" width="20" height="4" fill="#e79a4f"/>
    <rect x="48" y="52" width="4" height="4" fill="#3a2317"/>
    <rect x="20" y="56" width="4" height="4" fill="#3a2317"/>
    <rect x="24" y="56" width="16" height="4" fill="#e79a4f"/>
    <rect x="40" y="56" width="8" height="4" fill="#3a2317"/>
    <rect x="16" y="60" width="4" height="4" fill="#3a2317"/>
    <rect x="20" y="60" width="16" height="4" fill="#e79a4f"/>
    <rect x="36" y="60" width="4" height="4" fill="#3a2317"/>
    <rect x="12" y="64" width="4" height="4" fill="#3a2317"/>
    <rect x="16" y="64" width="16" height="4" fill="#e79a4f"/>
    <rect x="32" y="64" width="4" height="4" fill="#3a2317"/>
    <rect x="12" y="68" width="4" height="4" fill="#3a2317"/>
    <rect x="16" y="68" width="12" height="4" fill="#e79a4f"/>
    <rect x="28" y="68" width="4" height="4" fill="#3a2317"/>
    <rect x="12" y="72" width="4" height="4" fill="#3a2317"/>
    <rect x="16" y="72" width="12" height="4" fill="#e79a4f"/>
    <rect x="28" y="72" width="4" height="4" fill="#3a2317"/>
    <rect x="12" y="76" width="4" height="4" fill="#3a2317"/>
    <rect x="16" y="76" width="16" height="4" fill="#e79a4f"/>
    <rect x="32" y="76" width="4" height="4" fill="#3a2317"/>
    <rect x="16" y="80" width="4" height="4" fill="#3a2317"/>
    <rect x="20" y="80" width="16" height="4" fill="#e79a4f"/>
    <rect x="36" y="80" width="4" height="4" fill="#3a2317"/>
    <rect x="20" y="84" width="8" height="4" fill="#3a2317"/>
    <rect x="28" y="84" width="12" height="4" fill="#e79a4f"/>
    <rect x="40" y="84" width="4" height="4" fill="#3a2317"/>
    <rect x="28" y="88" width="12" height="4" fill="#3a2317"/>
  </g>
  <!-- torso, haunch, rump -->
  <g class="body">
    <rect x="116" y="64" width="4" height="4" fill="#3a2317"/>
    <rect x="120" y="64" width="20" height="4" fill="#fdf4e6"/>
    <rect x="140" y="64" width="4" height="4" fill="#3a2317"/>
    <rect x="116" y="68" width="4" height="4" fill="#3a2317"/>
    <rect x="120" y="68" width="16" height="4" fill="#fdf4e6"/>
    <rect x="136" y="68" width="4" height="4" fill="#3a2317"/>
    <rect x="92" y="72" width="24" height="4" fill="#3a2317"/>
    <rect x="116" y="72" width="20" height="4" fill="#fdf4e6"/>
    <rect x="136" y="72" width="4" height="4" fill="#3a2317"/>
    <rect x="76" y="76" width="16" height="4" fill="#3a2317"/>
    <rect x="92" y="76" width="24" height="4" fill="#e79a4f"/>
    <rect x="116" y="76" width="20" height="4" fill="#fdf4e6"/>
    <rect x="136" y="76" width="4" height="4" fill="#3a2317"/>
    <rect x="64" y="80" width="12" height="4" fill="#3a2317"/>
    <rect x="76" y="80" width="12" height="4" fill="#e79a4f"/>
    <rect x="88" y="80" width="4" height="4" fill="#3a2317"/>
    <rect x="92" y="80" width="20" height="4" fill="#e79a4f"/>
    <rect x="52" y="84" width="12" height="4" fill="#3a2317"/>
    <rect x="64" y="84" width="24" height="4" fill="#e79a4f"/>
    <rect x="88" y="84" width="4" height="4" fill="#3a2317"/>
    <rect x="92" y="84" width="20" height="4" fill="#e79a4f"/>
    <rect x="40" y="88" width="4" height="4" fill="#e79a4f"/>
    <rect x="44" y="88" width="8" height="4" fill="#3a2317"/>
    <rect x="52" y="88" width="40" height="4" fill="#e79a4f"/>
    <rect x="92" y="88" width="4" height="4" fill="#3a2317"/>
    <rect x="96" y="88" width="16" height="4" fill="#e79a4f"/>
    <rect x="40" y="92" width="8" height="4" fill="#3a2317"/>
    <rect x="48" y="92" width="44" height="4" fill="#e79a4f"/>
    <rect x="92" y="92" width="4" height="4" fill="#3a2317"/>
    <rect x="96" y="92" width="16" height="4" fill="#e79a4f"/>
    <rect x="40" y="96" width="4" height="4" fill="#3a2317"/>
    <rect x="44" y="96" width="4" height="4" fill="#e79a4f"/>
    <rect x="48" y="96" width="4" height="4" fill="#3a2317"/>
    <rect x="52" y="96" width="36" height="4" fill="#e79a4f"/>
    <rect x="88" y="96" width="4" height="4" fill="#3a2317"/>
    <rect x="92" y="96" width="20" height="4" fill="#e79a4f"/>
    <rect x="40" y="100" width="4" height="4" fill="#3a2317"/>
    <rect x="44" y="100" width="4" height="4" fill="#e79a4f"/>
    <rect x="48" y="100" width="8" height="4" fill="#3a2317"/>
    <rect x="56" y="100" width="28" height="4" fill="#e79a4f"/>
    <rect x="84" y="100" width="8" height="4" fill="#3a2317"/>
    <rect x="92" y="100" width="20" height="4" fill="#e79a4f"/>
    <rect x="40" y="104" width="4" height="4" fill="#3a2317"/>
    <rect x="44" y="104" width="8" height="4" fill="#e79a4f"/>
    <rect x="80" y="104" width="4" height="4" fill="#3a2317"/>
    <rect x="84" y="104" width="28" height="4" fill="#e79a4f"/>
    <rect x="40" y="108" width="8" height="4" fill="#3a2317"/>
    <rect x="48" y="108" width="4" height="4" fill="#e79a4f"/>
    <rect x="80" y="108" width="32" height="4" fill="#e79a4f"/>
    <rect x="48" y="112" width="4" height="4" fill="#3a2317"/>
    <rect x="80" y="112" width="32" height="4" fill="#3a2317"/>
  </g>
  <!-- back foot -->
  <g class="leg leg-bl">
    <rect x="52" y="104" width="28" height="4" fill="#3a2317"/>
    <rect x="52" y="108" width="28" height="4" fill="#fdf4e6"/>
    <rect x="52" y="112" width="28" height="4" fill="#3a2317"/>
  </g>
  <!-- front leg -->
  <g class="leg leg-fl">
    <rect x="112" y="80" width="4" height="4" fill="#3a2317"/>
    <rect x="116" y="80" width="20" height="4" fill="#fdf4e6"/>
    <rect x="136" y="80" width="4" height="4" fill="#3a2317"/>
    <rect x="112" y="84" width="4" height="4" fill="#3a2317"/>
    <rect x="116" y="84" width="20" height="4" fill="#fdf4e6"/>
    <rect x="136" y="84" width="4" height="4" fill="#3a2317"/>
    <rect x="112" y="88" width="4" height="4" fill="#3a2317"/>
    <rect x="116" y="88" width="20" height="4" fill="#fdf4e6"/>
    <rect x="136" y="88" width="4" height="4" fill="#3a2317"/>
    <rect x="112" y="92" width="4" height="4" fill="#3a2317"/>
    <rect x="116" y="92" width="20" height="4" fill="#fdf4e6"/>
    <rect x="136" y="92" width="4" height="4" fill="#3a2317"/>
    <rect x="112" y="96" width="4" height="4" fill="#3a2317"/>
    <rect x="116" y="96" width="20" height="4" fill="#fdf4e6"/>
    <rect x="136" y="96" width="4" height="4" fill="#3a2317"/>
    <rect x="112" y="100" width="4" height="4" fill="#3a2317"/>
    <rect x="116" y="100" width="16" height="4" fill="#fdf4e6"/>
    <rect x="132" y="100" width="4" height="4" fill="#3a2317"/>
    <rect x="112" y="104" width="4" height="4" fill="#3a2317"/>
    <rect x="116" y="104" width="16" height="4" fill="#fdf4e6"/>
    <rect x="132" y="104" width="4" height="4" fill="#3a2317"/>
    <rect x="112" y="108" width="4" height="4" fill="#3a2317"/>
    <rect x="116" y="108" width="20" height="4" fill="#fdf4e6"/>
    <rect x="136" y="108" width="8" height="4" fill="#3a2317"/>
    <rect x="112" y="112" width="32" height="4" fill="#3a2317"/>
  </g>
  <!-- head: skull, drop ear, muzzle -->
  <g class="head">
    <rect x="124" y="20" width="28" height="4" fill="#3a2317"/>
    <rect x="120" y="24" width="16" height="4" fill="#3a2317"/>
    <rect x="136" y="24" width="16" height="4" fill="#e79a4f"/>
    <rect x="152" y="24" width="4" height="4" fill="#3a2317"/>
    <rect x="116" y="28" width="4" height="4" fill="#3a2317"/>
    <rect x="120" y="28" width="12" height="4" fill="#c87c34"/>
    <rect x="132" y="28" width="4" height="4" fill="#3a2317"/>
    <rect x="136" y="28" width="20" height="4" fill="#e79a4f"/>
    <rect x="156" y="28" width="4" height="4" fill="#3a2317"/>
    <rect x="112" y="32" width="4" height="4" fill="#3a2317"/>
    <rect x="116" y="32" width="16" height="4" fill="#c87c34"/>
    <rect x="132" y="32" width="4" height="4" fill="#3a2317"/>
    <rect x="136" y="32" width="20" height="4" fill="#e79a4f"/>
    <rect x="156" y="32" width="4" height="4" fill="#3a2317"/>
    <rect x="112" y="36" width="4" height="4" fill="#3a2317"/>
    <rect x="116" y="36" width="16" height="4" fill="#c87c34"/>
    <rect x="132" y="36" width="4" height="4" fill="#3a2317"/>
    <rect x="136" y="36" width="20" height="4" fill="#e79a4f"/>
    <rect x="156" y="36" width="4" height="4" fill="#3a2317"/>
    <rect x="112" y="40" width="4" height="4" fill="#3a2317"/>
    <rect x="116" y="40" width="12" height="4" fill="#c87c34"/>
    <rect x="128" y="40" width="4" height="4" fill="#3a2317"/>
    <rect x="132" y="40" width="24" height="4" fill="#e79a4f"/>
    <rect x="156" y="40" width="4" height="4" fill="#3a2317"/>
    <rect x="116" y="44" width="4" height="4" fill="#3a2317"/>
    <rect x="120" y="44" width="8" height="4" fill="#c87c34"/>
    <rect x="128" y="44" width="4" height="4" fill="#3a2317"/>
    <rect x="132" y="44" width="24" height="4" fill="#e79a4f"/>
    <rect x="156" y="44" width="4" height="4" fill="#3a2317"/>
    <rect x="116" y="48" width="12" height="4" fill="#3a2317"/>
    <rect x="128" y="48" width="32" height="4" fill="#e79a4f"/>
    <rect x="160" y="48" width="8" height="4" fill="#3a2317"/>
    <rect x="116" y="52" width="4" height="4" fill="#3a2317"/>
    <rect x="120" y="52" width="44" height="4" fill="#e79a4f"/>
    <rect x="164" y="52" width="4" height="4" fill="#54382a"/>
    <rect x="168" y="52" width="4" height="4" fill="#3a2317"/>
    <rect x="116" y="56" width="4" height="4" fill="#3a2317"/>
    <rect x="120" y="56" width="12" height="4" fill="#e79a4f"/>
    <rect x="132" y="56" width="20" height="4" fill="#fdf4e6"/>
    <rect x="152" y="56" width="16" height="4" fill="#3a2317"/>
    <rect x="116" y="60" width="4" height="4" fill="#3a2317"/>
    <rect x="120" y="60" width="24" height="4" fill="#fdf4e6"/>
    <rect x="144" y="60" width="12" height="4" fill="#3a2317"/>
    <!-- eye: open (awake) -->
    <g class="eye-open">
      <rect x="136" y="36" width="8" height="4" fill="#2a1a10"/>
      <rect x="144" y="36" width="4" height="4" fill="#ffffff"/>
      <rect x="136" y="40" width="12" height="4" fill="#2a1a10"/>
    </g>
    <!-- eye: closed (sleeping) -->
    <rect class="eye-closed" x="134" y="41" width="16" height="3" fill="#2a1a10"/>
    <!-- tongue (only when working) -->
    <rect class="tongue" x="152" y="60" width="12" height="10" fill="#e8697d"/>
  </g>
</svg>`;

const SPRITES: Record<string, string> = { slime: SLIME, dog: DOG };

/** Every sprite, ready to drop into the webview. CSS reveals the active one. */
export function spritesMarkup(): string {
  return Object.values(SPRITES).join('\n');
}
