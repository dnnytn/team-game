# Ship Battle Arena

A browser-based team competition game designed to teach Git workflows and AI-assisted development. Teams build custom battle ships on feature branches, merge them into a shared repo through GitLab merge requests, and then watch their ships fight in a free-for-all arena.

## Purpose

This is a hands-on learning exercise with three goals:

1. **Practice Git** — branching, committing, pushing, creating merge requests, and resolving merge conflicts on a real shared codebase
2. **Learn AI-assisted development** — using Claude Code to generate code (pixel art sprites, stat builds), troubleshoot errors, and perform Git operations
3. **Have fun** — the battle is the payoff for doing the Git work correctly

## Roles

### Admin / Facilitator

Sets up the GitLab repo and runner, runs the exercise session, projects the final battle on screen. You control the pacing, help teams when they get stuck, and run the battle at the end.

**Read:** [docs/admin-guide.md](docs/admin-guide.md)

### Contestant (Team Member)

Clones the repo, creates a ship module on a feature branch, and merges it to `main` via a merge request. You'll design your ship's stats, choose an ability, create pixel art, and resolve merge conflicts along the way.

**Read:** [docs/contestant-guide.md](docs/contestant-guide.md)

## How It Works

```
1. Teams clone the repo and create feature branches
2. Each team builds a ship file (stats, ability, pixel sprite)
3. Teams push their branches and open merge requests
4. GitLab CI validates the ship automatically
5. Teams resolve merge conflicts in the ship registry
6. Once all ships are merged, the facilitator runs the battle
7. Ships fight AI-controlled in a free-for-all — last one standing wins!
```

## The Game

- Ships have a **100-point budget** across 4 stats: shields, speed, weapon power, and ability strength
- Each ship picks **one special ability** from 6 options (cloak, EMP, teleport, shield burst, overdrive, mine layer)
- Ships are rendered as **16x16 pixel art** that teams design (with Claude Code's help)
- Battles feature **retro visuals and procedural audio** — all generated in-browser with zero external files
- The arena supports **up to 6 ships** in a dramatic 2-3 minute battle

## Quick Start

```bash
git clone <your-gitlab-url>/team-game.git
cd team-game
python -m http.server 8080
# Open http://localhost:8080
```

Or just double-click `index.html` to open it directly.

## Tech Stack

- Vanilla HTML, CSS, JavaScript — no frameworks, no build tools, no npm
- Web Audio API for all sound (no audio files)
- Canvas 2D for rendering
- Works offline, airgapped, and on `file://` protocol

## Project Structure

```
index.html              Entry point — open in a browser
css/style.css           Retro pixel-art theme
js/
  registry-api.js       Ship registration API
  validation.js         Ship config validation (browser + CI)
  abilities.js          Special ability definitions
  ai.js                 Ship AI (movement, targeting, firing)
  engine.js             Battle simulation engine
  audio.js              Procedural music and sound effects
  renderer.js           Canvas rendering
  ui.js                 Lobby, battle, and victory screens
ships/
  registry.js           Ship manifest (the merge-conflict chokepoint)
  TEMPLATE.js           Template for teams to copy
  example-tank.js       Example: slow tanky ship
  example-glass-cannon.js  Example: fast fragile ship
tests/
  validate-ships.js     CI validation script (Node.js)
docs/
  admin-guide.md        Setup and facilitation instructions
  contestant-guide.md   Player guide with step-by-step workflow
.gitlab-ci.yml          CI pipeline configuration
CONTRIBUTING.md         Git workflow and conflict resolution guide
```

## Running Tests

```bash
node tests/validate-ships.js
```

Validates all registered ships: file parsing, point budget, stat ranges, ability selection, sprite format, and team name matching.
