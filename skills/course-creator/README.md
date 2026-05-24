# course-creator skill

A Claude Code skill for building single-page, self-contained, airgap-safe HTML courses on technical topics. Slide-based navigation, inline quizzes, SVG diagrams, and a single running-example thread that ties every section together.

## What you get

- **`SKILL.md`** — the methodology Claude uses when you invoke it: how to scope the topic, pick a running example, structure 8–12 sections, build incrementally chapter-by-chapter, and verify the result.
- **`templates/scaffold.html`** — a fully wired starter HTML file. Inline CSS, inline JS, slide controller, quiz engine, ToC with ✓ progress, keyboard navigation, dark technical theme. Drop in section content and you have a course.
- **`templates/section.html`** — one section's HTML pattern with diagram, callouts, and quiz wired up.
- **`templates/diagrams.svg.md`** — five common SVG diagram patterns (boxes-and-arrows, sequence, comparison, topology with perimeter, code-flow) ready to copy.

## Install

User-level (available in every project):

```bash
mkdir -p ~/.claude/skills
cp -r ./course-creator ~/.claude/skills/
```

Project-level (only in this repo):

```bash
mkdir -p .claude/skills
cp -r ./course-creator .claude/skills/
```

Restart Claude Code (or open a new session) and the skill will be available.

## Use it

In any Claude Code session, say:

```
build me a course on <topic> for <audience>
```

Claude will trigger the `course-creator` skill and walk you through:

1. Scoping the topic and audience
2. Picking a concrete running example to thread through every section
3. Drafting an 8–12 section table of contents
4. Building it incrementally — one chapter at a time, with review points
5. Final verification before push

The output is one `.html` file (typically `courses/<topic>.html`) you can open offline.

## Reference course

This skill was distilled from a real course built using the same methodology: `courses/mcp-server.html` — a ~3500-line MCP-server course for infrastructure engineers, with 12 sections, 11 SVG diagrams, 27 quiz questions, a 35-line "build your own" hands-on chapter, and a 5-question capstone. Read it as a worked example before starting your own.
