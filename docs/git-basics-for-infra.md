---
marp: true
theme: gaia
paginate: true
size: 16:9
---

# Git Operations for Infra Engineers

## A practical, step‑by‑step guide

(No prior Git experience needed)

---

## Why care about Git?

For infra and cloud engineers:

- Version control for **scripts, configs, manifests, Terraform, automation**.
- Safe collaboration across teams.
- Rollback, audit trail, and reproducible environments.

Git is your **safety harness** for change.

---

## Key Git concepts (simple!)

- **Repository (repo)**  
  A folder that Git is tracking.
- **Commit**  
  A saved snapshot of changes at a point in time.
- **Branch**  
  A line of work; you can have many branches at once.
- **Main / master**  
  The “truth” branch where stable code lives.
- **Remote**  
  The shared repo on GitHub / GitLab (e.g., `origin`).

Think of branches as **parallel timelines** that may later be merged.

---

## Typical Git workflow for infra

Very common pattern:

1. `git clone` the repo.
2. `git switch -c feature/my-change` (create a feature branch).
3. Edit files, test changes.
4. `git add .` and `git commit -m "meaningful message"`.
5. `git push` your branch.
6. Open a **PR / Merge Request** to `main`.
7. Team reviews, CI runs, conflict is checked.
8. Merge into `main` (or reject and fix).

You never push directly to `main` in a healthy workflow.

---

## What is a merge conflict?

A **merge conflict** happens when:

- Two branches modify **the same part of a file**.
- Git cannot automatically decide which change to keep.

Instead of silently overwriting, Git **stops** and asks you to choose or combine both.

Example:

- Branch A changes line 10 in `config.yaml`.
- Branch B also changes line 10 in `config.yaml`.
- When merging A into B (or both into `main`), Git cannot auto‑pick.

---

## When do conflicts usually happen?

Common in infra scenarios:

- **Shared config / registry**
  - Multiple teams editing `config.yaml`, `shipRegistry.ts`, `inventory.json`, etc.
- **Shared scripts**
  - Two people modifying the same Bash / Python / Terraform file.
- **Shared README / docs**
  - Everyone updating docs in parallel.
- **Branches from stale main**
  - Your branch is 100 commits behind `main`; you rebase and may conflict.

Merges are **safe**; conflicts are **expected** and resolvable.

---

## Types of merge conflicts (infra view)

### 1. **Text file conflict (line‑level)**

Example: two people edit the same config line.

```yaml
# file.yaml
server_count: 2   # Team A
server_count: 3   # Team B ?
```

Git will insert conflict markers:

```yaml
<<<<<<< HEAD
server_count: 2
=======
server_count: 3
>>>>>>> feature/team-b
```

You must choose which line (or a new value) to keep.

---

### 2. **Same file, different regions**

Example:

- Team A edits the top of `script.sh`.
- Team B edits the bottom of `script.sh`.

Git usually merges cleanly, but:

- If you later edit the **same line**, you get a conflict.

This is why **small, focused commits** matter.

---

### 3. **Renamed / deleted file**

Example:

- Team A renames `configs/prod.yaml` → `configs/prod-main.yaml`.
- Team B edits `configs/prod.yaml` in their branch.

Git cannot reconcile “which file is the real one.”

---

### 4. **Directory / structure conflict**

Example:

- Team A adds `modules/network/vpc.tf`.
- Team B adds `modules/vpc.tf` and deletes the old VPC code.

This is a “rename vs. add” scenario and can be tricky.

---

## How to prevent conflicts

### 1. **Use branches properly**

- Do **one logical change per branch**:
  - `feature/add-new-ec2-module`
  - `fix/typo-in-readme`
- Avoid huge branches that touch 50 files.

### 2. **Keep main up‑to‑date**

- Frequently:
  ```bash
  git switch main
  git pull origin main
  git switch my-feature
  git rebase main
  ```
- This reduces the chance of big diffs and complex conflicts.

### 3. **Coordinate on shared files**

- Agree:
  - Which file is the “registry” (e.g., `shipRegistry.ts`).
  - Who edits which section.
- Use **comments** or **sections** in YAML/JSON so edits are well‑separated.

### 4. **Small, frequent commits**

- Instead of:
  - One commit: “update all configs”
- Do:
  - `commit -m "add network config"`
  - `commit -m "add security group config"`

Smaller diffs = smaller conflicts.

---

## Step‑by‑step: how to resolve a conflict

Let’s walk through a realistic example.

### Scenario

- Branch `main` has:
  ```yaml
  replicas: 2
  ```
- Branch `feature/higher-load` changed it to:
  ```yaml
  replicas: 4
  ```
- Branch `feature/safety` changed it to:
  ```yaml
  replicas: 3
  ```

When you merge `feature/higher-load` and then `feature/safety` into `main`, Git cannot auto‑resolve.

---

### Step 1: Get into the conflict state

Try to merge:

```bash
git switch main
git merge feature/safety
```

You see:
Auto-merging config.yaml
CONFLICT (content): Merge conflict in config.yaml
Automatic merge failed; fix conflicts and then commit the result.

`git status` shows:

```bash
Unmerged paths:
  both modified:   config.yaml
```

---

### Step 2: Open the file in VS Code

Git inserts markers:

```yaml
<<<<<<< HEAD
replicas: 2
=======
replicas: 3
>>>>>>> feature/safety
```

- `HEAD` ≈ the current branch (`main`).
- `feature/safety` ≈ the branch you are merging.

---

### Step 3: Decide what to keep

Choose one of:

- Keep `replicas: 4` (from `feature/higher-load`).
- Keep `replicas: 3` (from `feature/safety`).
- Or pick a new value, e.g., `replicas: 4`, with a comment.

Edit to:

```yaml
replicas: 4 # chosen for higher load
```

Remove the markers:

```yaml
<<<<<<< HEAD
replicas: 2
=======
replicas: 3
>>>>>>> feature/safety
```

After editing, the file should have **no markers**.

---

### Step 4: Tell Git you fixed it

```bash
git add config.yaml
git status  # should no longer show "Unmerged paths"
```

Then commit:

```bash
git commit -m "Resolve conflict: set replicas = 4"
```

Now the merge is complete.

---

### Step 5: Push the merge

```bash
git push origin main
```

If someone else pushed in the meantime, you may need:

```bash
git pull origin main
git push origin main
```

---

## Using VS Code to help with conflicts

VS Code has a built‑in **merge editor**:

- When you open a conflicted file:
  - You see three columns:
    - **Current change** (main).
    - **Incoming change** (the branch you’re merging).
    - **Result** (what you’ll keep).
- You can:
  - Accept “Current”,
  - Accept “Incoming”,
  - Or manually edit.

This is perfect for infra engineers who want a visual safety net.

---

## How to avoid being stuck

### 1. **Don’t panic**

A conflict is just Git asking you a question:

> “Which version of this line do you want?”

### 2. **Always have a backup**

- Before a risky merge or rebase:
  ```bash
  git switch -c backup/my-branch-before-merge
  ```

If you mess up, you can:

```bash
git switch main
git reset --hard backup/my-branch-before-merge
```

### 3. **Ask for help**

When you see:

- `CONFLICT (content)`
- `Automatic merge failed`

That’s the signal to **stop and ask**.

---

## Using AI to help with Git conflicts

You can ask Claude (or similar) things like:

- “Explain this Git conflict in `config.yaml`.”
- “Show me the Git commands to resolve a conflict and keep the incoming branch’s version.”
- “Help me write a commit message after resolving a merge conflict.”
- “Show me how to rebase my feature branch onto main and handle conflicts.”

AI can:

- Explain the symbols (`<<<<<<<`, `=======`, `>>>>>>>`).
- Suggest Git commands.
- Help you decide which value makes sense from an infra / SLO / cost perspective.

---

## Git hygiene rules for infra teams

Adopt a simple set of rules:

1. **Never push directly to main**  
   Always use PRs / MRs.

2. **One logical change per branch**  
   No “everything” branches.

3. **Update from main regularly**  
   `git switch main; git pull; git switch my-feature; git rebase main`.

4. **Small, descriptive commits**  
   Good commit message:
   - `Add VPC module for production`
   - `Fix typo in README`
   - `Increase replicas to 4 for higher load`

5. **Use CI / tests before merging**  
   If tests fail or CI is red, you probably shouldn’t merge.

---

## Quick reference: common Git commands

```bash
git clone <url>                    # get repo
git status                         # see what changed
git switch main                    # switch to main
git pull origin main               # update main
git switch -c feature/my-branch    # create + switch to new branch
git add .                          # stage all changes
git commit -m "message"            # commit
git push origin feature/my-branch  # push branch
git switch main                    # back to main
git merge feature/my-branch        # merge (or use PR in GitHub)
git rebase main                    # rebase branch onto main
git mergetool                      # if you want a GUI merge tool
```

Save these in a small `cheat.md` in every infra repo.

---

## Wrapping up for infra engineers

- **Git** is just **safety‑backed change management**.
- **Conflicts** are normal; they protect you from silent overwrites.
- **Branches, PRs, and small commits** are your friends.
- **AI + Git** =
  - Use Git for control,
  - Use AI to explain Git and help with commands.

Practice a few small merges, then a real one in your competition repo, and Git will start to feel like a natural part of your infra workflow.
