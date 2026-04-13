# Todo

## Chores

- [x] **AI Loop Detection** — Already implemented in ai.js with position history tracking and loop breakout on detection. ✅

- [x] **Better Sprites & 4 New Ships** — Completed:
  - Increased SPRITE_SCALE from 3 → 4 (ships now 64×64px instead of 48×48px)
  - Created Thunder Striker (EMP Blast) — mid-range brawler with high ability
  - Created Quantum Ghost (Teleport) — ultra-fast glass cannon that teleports constantly
  - Created Blaze Fury (Overdrive) — balanced heavy hitter with burst fire potential
  - Created Minefield Marshal (Mine Layer) — slow defensive builder with 40-point ability
  - All 6 ships validated and ready to battle ✅

- [x] **Spectacular Ability Effects** — Fixed by implementing persistent visual effects system:
  - Added `state.visualEffects[]` that persists across engine ticks
  - Shield Burst: double expanding rings + glowing ship aura
  - EMP Blast: 3 concentric ripple rings + 6 lightning bolts radiating outward
  - Teleport: 6 rotating swirl lines at departure + white flash + arrival ring
  - Cloak: shimmering expanding ring + 12 sparkle particles
  - Overdrive: pulsing orange energy aura following ship + burst ring on activation
  - Mine Layer: amber deploy flash + small expanding ring
  - All effects render before ships (behind them) with proper alpha fade-out ✅
