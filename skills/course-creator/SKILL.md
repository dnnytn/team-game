---
name: course-creator
description: Build a single-page, self-contained HTML course on a technical topic — airgap-safe (no external deps), slide-based navigation, inline quizzes, SVG diagrams, and a single running-example thread that ties every section together. Use when the user asks to create a course, tutorial, training, or self-paced learning page on a technical subject.
---

# Course Creator

You are helping the user build a **single-file HTML course** on a technical topic. The artifact is one `.html` file the user can open offline — inline CSS, inline JS, inline SVG diagrams, zero network requests. The reader walks through 8–12 progressively deepening sections, one at a time as slides, with an inline quiz after each section and a capstone scenario at the end.

This skill bakes in a teaching methodology that has been used to produce a polished course; follow it unless the user asks you to deviate.

## When to use

Trigger on requests like:
- "Build me a course on X"
- "Make a self-paced tutorial on X"
- "I need a training page for X"
- "Create offline learning material about X"

If the user just wants a blog post, a slide deck for presenting live, or API reference docs, this is the wrong skill — say so.

## The methodology (six non-negotiables)

1. **One self-contained HTML file.** Inline `<style>`, inline `<script>`, inline `<svg>`. No CDN fonts, no external images, no fetch calls. The reader must be able to open it on an airgapped laptop.

2. **One running example, threaded through every section.** Pick a concrete, realistic scenario at the start ("ClusterOps MCP" in the reference course) and anchor every concept to it with a callout. The example is the spine; the concepts hang off it. Without this thread, sections feel disconnected.

3. **Slide-based, not infinite-scroll.** Exactly one section visible at a time. Reader unlocks Next by scrolling to the bottom of the current slide (no quiz-gating — quizzes are formative, not punitive). ToC stays visible, highlights current slide, ✓s completed ones.

4. **Diagrams are inline SVG, at least 1–2 per section.** Reader retention on dense material doubles when each concept has a picture. SVG keeps the file self-contained and crisp at any zoom.

5. **Quiz every section, capstone at the end.** 2 multiple-choice questions per section (radio buttons, Check button, inline explanation on submit). The final section is a capstone with 4–6 questions that forces the reader to apply everything to a new scenario.

6. **Ship incrementally, review-gated.** Build in 6–8 chapters, commit and push after each, then **stop** and let the user review before continuing. Surprises at the end cost 10× more than surprises mid-build.

## Workflow

### Phase 1 — Discover the topic and scope

Ask the user (use `AskUserQuestion` if available, otherwise inline):

1. **Topic and audience.** "Course on X for whom?" Knowing the audience (junior dev, infrastructure engineer, ML researcher, PM) determines depth and the running example. Aim for ~90 minutes of reading time.
2. **The running example.** Help the user pick a concrete, realistic scenario you'll thread through every section. The example should be (a) close to the audience's day job, (b) detailed enough that you can show it from §1 to capstone, (c) one specific instance, not "a hypothetical company". Bad: "an app". Good: "ClusterOps MCP — an internal k8s-ops MCP server at an airgapped bank, 30 SREs, behind a gateway, OAuth via internal Keycloak."
3. **Source material.** What spec / docs / book is the canonical reference? Note the version explicitly.
4. **Sections (the table of contents).** Draft 8–12 sections that progress from "why does this exist?" to "I can deploy and operate this." Pattern: motivation → roles → primitives → mechanics → hands-on build → deployment topologies → security/auth → ops → capstone.

### Phase 2 — Plan in chapters, get approval

Write a plan that lists:
- The running example (one paragraph)
- The section list with one-line summaries each
- Visual / code conventions you'll use
- **A build broken into 6–8 chapters**, each ending in a review point. Typical chapter shape:
  - **Chapter 1**: Scaffold & chrome (empty shell, ToC, theme, quiz JS helpers, footer — no content yet)
  - **Chapters 2–N−2**: Section content, 2–3 sections per chapter
  - **Chapter N−1**: Convert to slide-based layout (if not built in from the start)
  - **Chapter N**: Final polish, proofread, commit, push

Use ExitPlanMode if you're in plan mode; otherwise show the plan and wait.

### Phase 3 — Execute, one chapter at a time

For each chapter:
1. Make the edits.
2. Run the verification checks (see below).
3. Commit with a message like `Write §N Title (chapter K of M)`.
4. Push to the feature branch.
5. **Stop**. Summarise what was added in 2–4 lines. Ask the user to confirm before the next chapter.

### Phase 4 — Final verification

Before declaring done:
- Open the file in a browser (or describe what to check). All slides render; every SVG renders; every quiz reveals correct/incorrect feedback; reset works.
- DevTools Network tab, hard reload → **zero** external requests.
- Resize to ~400px wide → layout stays readable.
- Capstone is answerable from material in the course.
- No `class="todo-note"` or `TODO/FIXME` strings remain in section bodies.

## Section template

Each section follows this pattern (see `templates/section.html` for the full skeleton):

```
<section id="sN" class="chapter">
  <h2><span class="num">N.</span> Section title</h2>

  <p>Opening — one short paragraph that answers "why am I reading this?"</p>

  <h3>Sub-concept A</h3>
  <p>Body text. Plain English. ~60–80 words per paragraph.</p>

  <div class="diagram"><svg viewBox="..."> ... </svg></div>

  <h3>Sub-concept B</h3>
  <p>Body text.</p>

  <!-- Running-example callout: how does this concept show up in our scenario? -->
  <div class="callout callout-running">
    <div class="callout-title">In {running-example-name}</div>
    <p>Concrete instantiation of the concept in the running scenario.</p>
  </div>

  <!-- Optional "in the wild" sidebar referencing a real, widely-known instance -->
  <div class="callout callout-wild">
    <div class="callout-title">In the wild</div>
    <p>One real project / product that exemplifies this concept, for contrast.</p>
  </div>

  <!-- Quiz: 2 questions per section. -->
  <form class="quiz" aria-label="Section N quiz">
    <div class="quiz-head">Check yourself</div>
    <p class="quiz-title">Two questions on §N.</p>

    <fieldset class="quiz-q" data-correct="b"
      data-explain="Explanation of why b is right and the others aren't. Reinforces the section's key insight.">
      <legend>Question text?</legend>
      <label class="quiz-opt"><input type="radio" name="q-sN-1" value="a"> Option A</label>
      <label class="quiz-opt"><input type="radio" name="q-sN-1" value="b"> Option B</label>
      <label class="quiz-opt"><input type="radio" name="q-sN-1" value="c"> Option C</label>
      <label class="quiz-opt"><input type="radio" name="q-sN-1" value="d"> Option D</label>
      <div class="quiz-feedback" aria-live="polite"></div>
    </fieldset>

    <!-- Second question, same shape, name="q-sN-2" -->

    <div class="quiz-actions">
      <button type="button" class="btn primary" data-quiz-action="check">Check answers</button>
      <button type="button" class="btn" data-quiz-action="reset">Reset</button>
      <span class="quiz-summary" aria-live="polite"></span>
    </div>
  </form>
</section>
```

**Quiz writing tips:**
- The wrong answers should be plausibly tempting — common misconceptions or adjacent-but-wrong choices. Don't write obvious junk distractors.
- Use the `data-explain` attribute to teach, not just to grade. Explain *why* the right answer is right and *why* a tempting wrong one is wrong.
- Every `<input type="radio">` in one question shares a `name="q-sN-M"` (section N, question M). **Don't reuse names across questions** — that's the #1 quiz bug.

## Visual conventions

- **Dark, neutral, technical aesthetic.** Background near `#0f1217`, text near `#e6e6e6`, accent calm blue `#5aa9ff`, success `#3fb950`, danger `#f85149`, warn `#d29922`. Long reads on dark work well for engineers.
- **System fonts.** `ui-sans-serif, system-ui, ...` for body; `ui-monospace, Menlo, Consolas, monospace` for code. No webfonts — they'd require network.
- **70–72ch content measure.** Anything wider hurts long-form reading.
- **Generous line-height** (1.6–1.7) and section borders.

## Callout types

The reference course uses four callouts; you can map them to whatever names match your topic, but the four roles are useful:

| Class | Use for |
|---|---|
| `callout-running` | The opening "what's our running example?" intro block, and any time you want to flag the example itself |
| `callout-clusterops` *(rename per topic)* | "How does this concept show up in our running example?" — appears in every section |
| `callout-wild` | "In the wild" — a brief, real-world reference that contrasts or reinforces |
| `callout-note` | Caveats, gotchas, asides |

## SVG diagram patterns to reuse

The reference course uses these recurring SVG diagram shapes — all in `templates/diagrams.svg.md`:

- **Boxes + arrows** for architectural pictures (client → server → backend)
- **Sequence diagram** with lifelines for protocol walkthroughs
- **Comparison diagram** (e.g., before/after, A vs. B vs. C) for design choices
- **Topology diagram** with a perimeter border for deployment shapes
- **Annotated code/data flow** with color-coded "your code" vs. "SDK code"

Keep arrowheads simple: one shared `<marker>` definition per SVG, reused across `<line>`s.

## The slide engine (CSS + JS)

The starter scaffold in `templates/scaffold.html` is fully wired with:
- **Slide-mode CSS**: `body { overflow: hidden }`, `.chapter { display: none }`, `.chapter.active { display: block }`, fixed-bottom `.slide-nav`, ToC `.current` highlight and `.done ✓` checkmarks
- **Slide controller JS** (~150 lines, vanilla, no deps): scroll-to-bottom unlock, prev/next buttons, ToC click-jump, `←/→/PageUp/PageDown` keyboard, `hashchange` deep linking, accessibility (`aria-current="step"`, `aria-hidden="true"` on inactive slides)
- **Quiz helper JS**: delegated click handler on `[data-quiz-action]`, validates radio selection against `data-correct`, reveals `data-explain`, scores

**Don't rewrite this from scratch.** Start from `templates/scaffold.html` and only add the section content.

## Build chapter checklist

A typical chapter ends with:

```bash
# 1. Verify the file
python3 -c "
import re
with open('courses/<topic>.html') as f: h = f.read()
print('sections:', len(re.findall(r'<section id=\"s[0-9]+\"', h)))
print('svgs:', h.count('<svg '))
print('quizzes:', h.count('class=\"quiz\"'))
loadable = [m.group(0) for m in re.finditer(r'(href|src)=\"https?://', h)]
print('loadable ext URLs:', loadable or 'none')
"

# 2. JS still parses
node -e "
const fs=require('fs'); const h=fs.readFileSync('courses/<topic>.html','utf8');
const m=h.match(/<script>([\s\S]*?)<\/script>/);
try{new Function(m[1]);console.log('JS OK')}catch(e){console.log('err:',e.message)}
"

# 3. Commit + push
git add courses/<topic>.html
git commit -m "Write §N <Title> (chapter K of M)"
git push -u origin <feature-branch>
```

## Anti-patterns to avoid

- **No running example.** Concepts read as a disconnected list. Always pick one and thread it.
- **A "Resources & further reading" section.** This is offline material. There are no links to follow. Put the references inline as "in the wild" sidebars.
- **External fonts or CDNs.** Breaks airgap. Use system fonts and inline SVG.
- **Quiz that gates on correctness.** Wrong answers should teach, not block. Gate Next on "scrolled to the end" instead.
- **One mega-chapter.** "I'll write everything then show you" — don't. Stop after every 2–3 sections.
- **Renaming sections after writing.** Pick the numbering once and stick with it. If you must renumber, work high→low and grep for `&sect;N` cross-references.

## Templates

- `templates/scaffold.html` — fully wired starter (CSS + JS + empty section shells)
- `templates/section.html` — section template with quiz and callouts
- `templates/diagrams.svg.md` — common SVG patterns (boxes-and-arrows, sequence, topology)

## Reference course

The methodology was distilled from a real course: an MCP-server course for infrastructure engineers, ~3500 lines, 12 sections, 11 SVG diagrams, 27 quiz questions, fully airgap-safe. The running example was "ClusterOps MCP — an internal k8s MCP server at an airgapped bank with 30 SREs behind a gateway." Read it (`courses/mcp-server.html` in the same repo this skill came from) for a worked end-to-end example.
