# Contestant Guide

Welcome to Ship Battle Arena! Your mission: build a custom battle ship and merge it into the arena. Then watch it fight against every other team's ship in a free-for-all battle. Last ship standing wins.

## What You'll Learn

- Creating Git branches and making commits
- Pushing code and creating merge requests in GitLab
- Resolving merge conflicts (you will hit these — it's part of the exercise!)
- Using Claude Code (AI assistant) to help you write code and work with Git

## Your Ship at a Glance

Your ship is a single JavaScript file with:

- **A name** — up to 24 characters, make it cool
- **4 stats** totaling exactly 100 points — the tradeoff is the strategy
- **1 special ability** — chosen from 6 options
- **A 16x16 pixel art sprite** — this is your ship's look on the battlefield
- **A theme color** — used for your projectiles and HUD bar

## Step 1: Clone the Repo and Create Your Branch

```bash
git clone <your-gitlab-url>/team-game.git
cd team-game
git checkout -b ship/your-team-name
```

Replace `your-team-name` with your actual team name (lowercase, use dashes instead of spaces).

## Step 2: Create Your Ship File

```bash
cp ships/TEMPLATE.js ships/your-team-name.js
```

Open `ships/your-team-name.js` in your editor and customize everything.

## Step 3: Choose Your Stats

You have **100 points** to distribute across 4 stats. Each stat must be between 1 and 60. They must add up to exactly 100.

| Stat | What It Does | Low Value | High Value |
|---|---|---|---|
| `shields` | How much damage you can take | Die quickly | Very tanky |
| `speed` | How fast you move and dodge | Slow, easy target | Hard to hit, agile |
| `weaponPower` | Damage per shot and fire rate | Weak pea-shooter | Heavy hitter |
| `ability` | How strong your special ability is | Short/weak ability | Long/powerful ability |

### Example Builds

- **"The Tank"** — shields: 40, speed: 10, weaponPower: 35, ability: 15
- **"Glass Cannon"** — shields: 15, speed: 35, weaponPower: 40, ability: 10
- **"Assassin"** — shields: 10, speed: 30, weaponPower: 20, ability: 40
- **"Balanced"** — shields: 25, speed: 25, weaponPower: 25, ability: 25

Think about synergies with your chosen ability. For example, high ability + cloak = long invisibility window for ambushes.

## Step 4: Choose Your Special Ability

Pick exactly one:

| Ability | Key to Use | What It Does |
|---|---|---|
| Shield Burst | `"shield_burst"` | Restores shields and reduces incoming damage briefly. Great for tanks. |
| Cloaking Device | `"cloak"` | Go invisible so enemies can't see or target you. Breaks when you fire. Great for ambushes. |
| EMP Blast | `"emp_blast"` | Disables nearby enemies' weapons and abilities. Great when surrounded. |
| Warp Jump | `"teleport"` | Teleport to a random safe spot when you're in danger. Great for fragile ships. |
| Weapon Overdrive | `"overdrive"` | Temporarily double your fire rate and projectile speed. Great for finishing off wounded targets. |
| Mine Layer | `"mine_layer"` | Drop proximity mines behind you that explode when enemies get close. Great for area control. |

The `ability` stat makes your chosen ability stronger (longer duration, bigger radius, shorter cooldown, etc.).

## Step 5: Design Your Sprite

Your sprite is a 16x16 grid where each cell is either a hex color (`"#ff0000"` for red) or `null` for transparent. Row 0 is the top, and your ship faces **up** by default.

**Use Claude Code to help!** Try asking it:

> "Generate a 16x16 pixel art spaceship sprite as a JavaScript array of hex color strings. Make it look like a sleek red fighter jet facing up. Use null for transparent pixels."

Or:

> "Modify this sprite array to add green engine flames at the bottom."

Claude Code is great at generating and tweaking pixel art arrays. Experiment!

## Step 6: Register Your Ship

Open `ships/registry.js` and add your filename to the list:

```js
var SHIP_MANIFEST = [
  "example-tank.js",
  "example-glass-cannon.js",
  "your-team-name.js",
];
```

**Important:** Every team edits this same file. This is where you'll practice resolving merge conflicts (see below).

## Step 7: Test Locally

Open `index.html` in your browser (or run `python -m http.server 8080` and visit `http://localhost:8080`). You should see your ship in the lobby with its sprite and stat bars.

You can also run the validation tests:

```bash
node tests/validate-ships.js
```

If something is wrong, the validator will tell you exactly what to fix.

## Step 8: Commit and Push

```bash
git add ships/your-team-name.js ships/registry.js
git commit -m "Add ship: Your Ship Name"
git push -u origin ship/your-team-name
```

## Step 9: Create a Merge Request

Go to GitLab in your browser. You should see a prompt to create a merge request for your branch. Create it targeting `main`.

The CI pipeline will automatically validate your ship. If it fails, check the pipeline output — it will tell you what's wrong (wrong budget total, invalid ability, sprite format issues, etc.).

## Step 10: Resolve Merge Conflicts

If another team merged before you, you'll likely see a conflict in `registry.js`. Here's how to fix it:

```bash
# Update your branch with latest main
git fetch origin
git merge origin/main
```

If you see a conflict, open `ships/registry.js`. It will look like:

```
<<<<<<< HEAD
  "your-team-name.js",
=======
  "other-team.js",
>>>>>>> origin/main
```

Fix it by keeping **both** entries:

```js
  "other-team.js",
  "your-team-name.js",
```

Then:

```bash
git add ships/registry.js
git commit -m "Resolve merge conflict in registry.js"
git push
```

**Tip:** Ask Claude Code for help! Try: "Help me resolve this Git merge conflict."

## Tips for Winning

- **Don't dump everything into one stat.** A ship with 60 weapon power but 1 shields dies instantly.
- **Think about ability synergy.** Cloak + high speed = deadly hit-and-run. Shield burst + high shields = nearly unkillable.
- **Watch the example battle first.** See how the two example ships behave to understand the combat mechanics.
- **Your sprite doesn't affect gameplay** — but it does affect bragging rights. Make it look good!

## Using Claude Code

Claude Code can help you with everything in this exercise:

- **Ship design**: "Suggest a balanced ship build for mine_layer ability"
- **Pixel art**: "Generate a 16x16 pixel art dragon-shaped spaceship"
- **Git operations**: "How do I create a new branch?" or "Help me resolve this merge conflict"
- **Debugging**: "My ship validation is failing with this error: [paste error]"
- **Strategy**: "Which ability works best with high speed and low shields?"

Don't be afraid to experiment. You can always test locally before pushing!
