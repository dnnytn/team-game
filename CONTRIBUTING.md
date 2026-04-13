# Contributing - Git Workflow Guide

This guide walks you through the Git workflow to add your ship to the battle arena.

## Step-by-Step Workflow

### 1. Clone the repository

```bash
git clone <your-gitlab-url>/team-game.git
cd team-game
```

### 2. Create your feature branch

Always branch from `main`:

```bash
git checkout main
git pull origin main
git checkout -b ship/your-team-name
```

### 3. Create your ship

```bash
cp ships/TEMPLATE.js ships/your-team-name.js
```

Edit `ships/your-team-name.js` with your ship configuration. See the README for stat details.

**Tip:** Ask Claude Code to help you design your 16x16 pixel sprite!

### 4. Register your ship

Edit `ships/registry.js` and add your filename to the array:

```js
var SHIP_MANIFEST = [
  "example-tank.js",
  "example-glass-cannon.js",
  "your-team-name.js",
];
```

### 5. Test locally

Open `index.html` in your browser. Your ship should appear in the lobby with correct stats and sprite.

Run the validation tests:

```bash
node tests/validate-ships.js
```

### 6. Commit and push

```bash
git add ships/your-team-name.js ships/registry.js
git commit -m "Add ship: Your Ship Name"
git push -u origin ship/your-team-name
```

### 7. Create a Merge Request

Go to GitLab and create a merge request from your branch to `main`. The CI pipeline will validate your ship automatically.

## Resolving Merge Conflicts

Since every team edits `ships/registry.js`, you will likely encounter merge conflicts. Here's how to resolve them:

### 1. Update your branch

```bash
git checkout ship/your-team-name
git fetch origin
git merge origin/main
```

### 2. If you see a conflict in `registry.js`

The conflict will look something like this:

```
var SHIP_MANIFEST = [
  "example-tank.js",
  "example-glass-cannon.js",
<<<<<<< HEAD
  "your-team-name.js",
=======
  "other-team.js",
>>>>>>> origin/main
];
```

### 3. Resolve by keeping both entries

Edit the file to include both ships:

```js
var SHIP_MANIFEST = [
  "example-tank.js",
  "example-glass-cannon.js",
  "other-team.js",
  "your-team-name.js",
];
```

### 4. Complete the merge

```bash
git add ships/registry.js
git commit -m "Resolve merge conflict in registry.js"
git push
```

## Tips

- **Keep your branch up to date**: Run `git fetch origin && git merge origin/main` regularly
- **One ship per branch**: Don't mix other changes into your ship branch
- **Test before pushing**: Always open `index.html` locally to verify your ship loads
- **Ask Claude Code for help**: It can generate pixel art sprites, suggest stat distributions, and help with Git operations
