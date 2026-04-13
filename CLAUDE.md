# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A browser-based team competition game for teaching Git workflows and AI-assisted development. Teams create ship modules on feature branches, merge via GitLab MRs, then watch AI-controlled ships battle in a canvas arena. Designed for airgapped deployment with zero external dependencies.

## Commands

```bash
# Run validation (the only test — validates all ships in registry)
node tests/validate-ships.js

# Serve locally
python -m http.server 8080

# Or just open index.html directly in a browser (file:// works)
```

There is no build step, no npm, no linting, no framework CLI.

## Architecture

### Ship Loading Flow

Ships use a **self-registering script tag pattern** (not ES modules — those break on `file://` due to CORS):

1. `index.html` loads `js/registry-api.js` (defines global `ShipRegistry`)
2. `ships/registry.js` loads (sets global `SHIP_MANIFEST` array of filenames)
3. `js/ui.js` dynamically injects `<script>` tags for each filename in the manifest
4. Each ship file calls `ShipRegistry.register({...})` which validates and stores the config
5. UI reads `ShipRegistry.getAll()` to populate the lobby

**Script load order in index.html is critical.** Registry API and validation must load before ship files, and all engine modules must load before `ui.js`.

### Global Module Pattern

Every JS file uses `var X = (function() { ... })()` — IIFE modules on the global scope. No import/export, no ES modules. The key globals and their roles:

| Global | File | Purpose |
|---|---|---|
| `ShipRegistry` | `registry-api.js` | Ship registration and lookup |
| `ShipValidator` | `validation.js` | Config validation (shared browser + Node.js) |
| `Abilities` | `abilities.js` | Ability definitions with `activate/update/shouldUse` methods |
| `ShipAI` | `ai.js` | Per-tick AI: movement, targeting, firing, ability triggers |
| `BattleEngine` | `engine.js` | Game loop, physics, collisions, elimination tracking |
| `Renderer` | `renderer.js` | Canvas 2D drawing with pre-cached sprite rotations |
| `GameAudio` | `audio.js` | Procedural BGM and SFX via Web Audio API |

### Game Loop

The engine tick (100ms, configurable via speed multiplier) and render loop (requestAnimationFrame) are **decoupled**:

- **Engine tick:** AI decisions → projectile movement → mine checks → particle updates → collision detection → elimination → win condition
- **Render loop:** Reads `BattleEngine.getState()` each frame, draws to canvas independently

### Dual-Mode Validation

`validation.js` works in both browser and Node.js. It exports via `module.exports` when `module` exists. The CI script (`tests/validate-ships.js`) uses Node's `vm` module to sandbox ship file execution, intercepts `ShipRegistry.register()`, and runs the same validator.

### Intentional Merge Conflict Point

`ships/registry.js` is the **only file all teams edit** (adding their filename to `SHIP_MANIFEST`). This is by design — it forces teams to practice Git merge conflict resolution, which is a primary learning objective.

## Key Constraints

- **No fetch(), no ES modules, no npm** — must work on `file://` protocol in airgapped environments
- **All audio is procedural** — Web Audio API oscillators only, zero external files
- **Sprites are 16x16 JS arrays** of hex color strings — no image files
- **Ship stats must sum to exactly 100** with each stat in range [1, 60]
- **Up to 6 ships** supported in battle simultaneously
- **Shell runner assumed** for GitLab CI — only Node.js required, no Docker

## Ship Module Format

Each ship file is a single call to `ShipRegistry.register()` with: `name`, `team` (must match filename), 4 stats (`shields`, `speed`, `weaponPower`, `ability`), `specialAbility` (one of 6 keys), `sprite` (16x16 array), and `color` (hex string). See `ships/TEMPLATE.js` for the full format.
