# Admin / Facilitator Guide

This guide is for the person running the Ship Battle Arena exercise. You are responsible for setting up the environment, guiding teams through the workflow, and running the final battle.

## Overview

Ship Battle Arena is a hands-on learning exercise that teaches:

1. **Git fundamentals** — branching, committing, pushing, merge requests, and conflict resolution
2. **AI-assisted development** — using Claude Code to generate code, design sprites, and troubleshoot Git operations
3. **Collaboration workflows** — working in parallel on a shared codebase without breaking `main`

Teams each build a custom ship module file, merge it into the shared repo via GitLab merge requests, and then everyone watches the ships fight in a browser-based battle arena. The whole exercise is designed to be fun and low-stakes while practicing real engineering workflows.

## Pre-Session Setup

### Environment Requirements

- A GitLab instance (can be airgapped/intranet-only)
- GitLab Runner configured on a machine with Node.js installed (shell runner is fine)
- Each participant needs: Git, a text editor or IDE, a web browser, and Claude Code CLI
- No internet required after initial setup — everything runs locally

### 1. Create the GitLab Project

```bash
cd team-game
git init
git add .
git commit -m "Initial commit: Ship Battle Arena"
git remote add origin <your-gitlab-url>/team-game.git
git push -u origin main
```

### 2. Configure Branch Protection

In GitLab, go to **Settings > Repository > Protected Branches**:

- Protect `main` (or `master`)
- Set **Allowed to merge** to "Developers + Maintainers"
- Set **Allowed to push** to "No one" (force merge requests)
- Enable **"Pipelines must succeed"** under merge request settings

This ensures no one can push directly to `main` and all ships must pass CI validation before merging.

### 3. Register the GitLab Runner

On the machine that will run CI:

```bash
gitlab-runner register
```

- **Executor**: shell
- **Tags**: (leave blank or add a tag and reference it in `.gitlab-ci.yml`)

Verify Node.js is available on the runner:

```bash
node --version  # Should be v12+ (any modern version works)
```

### 4. Create Team Accounts

Create GitLab accounts for each team (or one per participant). Grant them **Developer** role on the project so they can push branches and create merge requests.

### 5. Verify the Setup

```bash
# Clone fresh and test
git clone <your-gitlab-url>/team-game.git test-clone
cd test-clone
python -m http.server 8080
# Open http://localhost:8080 — should see lobby with 2 example ships
node tests/validate-ships.js  # Should pass
```

## Running the Exercise

### Suggested Timeline (2-3 hours)

| Time | Activity |
|---|---|
| 0:00 - 0:15 | **Intro**: Explain the game, demo the battle with example ships, show the Git workflow |
| 0:15 - 0:30 | **Setup**: Teams clone the repo, verify they can open `index.html` locally |
| 0:30 - 1:30 | **Build Phase**: Teams create their ships using Claude Code to help with sprites, stats, and Git |
| 1:30 - 2:00 | **Merge Phase**: Teams push branches, create MRs, resolve conflicts, get CI to pass |
| 2:00 - 2:15 | **Battle**: Facilitator pulls `main`, opens the game, and runs the battle on a projector |
| 2:15 - 2:30 | **Debrief**: Discuss what they learned about Git, merge conflicts, and AI-assisted coding |

### Demo Script (Intro)

1. Open `index.html` and show the lobby with the 2 example ships
2. Point out the stat bars, sprites, and ability labels
3. Click "Start Battle" — let them watch the full fight
4. After the battle, show the victory screen
5. Open `ships/example-tank.js` in an editor — walk through the format
6. Show `ships/registry.js` — explain this is where merge conflicts will happen
7. Briefly demo Claude Code: "Generate a 16x16 pixel art spaceship in hex color arrays"

### During the Build Phase

Walk around and help teams with:

- **Cloning and branching** — many will be new to `git checkout -b`
- **Using Claude Code** — show them how to ask for sprite generation, stat suggestions, and Git help
- **Testing locally** — remind them to open `index.html` to verify their ship loads
- **Running validation** — `node tests/validate-ships.js` catches issues before CI does

### During the Merge Phase

This is where the real learning happens:

- The first team to merge will have no conflicts
- Every subsequent team will likely hit a conflict in `registry.js`
- **Let them struggle a bit** before helping — conflict resolution is the key learning moment
- Point them to `CONTRIBUTING.md` which has step-by-step conflict resolution instructions
- Encourage them to use Claude Code to help resolve conflicts

### Running the Final Battle

```bash
cd team-game
git pull origin main
python -m http.server 8080
# Open http://localhost:8080 on the projector
```

1. Show the lobby — all merged ships should appear with their sprites and stats
2. Build suspense! Let everyone see the lineup
3. Click **Start Battle**
4. Use the speed slider if the battle is too slow or fast (0.5x for dramatic, 2x to speed up)
5. The victory screen shows final standings automatically

### Troubleshooting

| Issue | Fix |
|---|---|
| Ship not appearing in lobby | Check browser console for errors. Usually a syntax error in the ship file or missing entry in `registry.js` |
| CI fails on "team does not match filename" | The `team` field in the JS file must exactly match the filename without `.js` |
| CI fails on "stats must sum to 100" | Team's stat points don't add up — have them recalculate |
| Merge conflict confusion | Walk them through `CONTRIBUTING.md` section on conflicts. The key insight: keep ALL entries, don't delete the other team's line |
| No sound in battle | Browser autoplay policy — the "Start Battle" button click should satisfy this. Try refreshing and clicking again |
| Ships not moving / battle frozen | Check browser console. Usually a JS error in one of the ship files causing the engine to crash |

### Re-Running Battles

Click **REPLAY** on the victory screen to return to the lobby. Each battle plays out slightly differently due to random initial positioning and AI jitter, so you can run multiple rounds.

## Post-Session

Consider:

- Keeping the repo as a reference for teams
- Running a "championship" with tweaked ships after teams learn from watching the first battle
- Having teams review each other's ship code via merge request comments
