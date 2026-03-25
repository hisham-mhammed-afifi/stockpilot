# Write Workshop Presenter Guide

You are writing a **presenter guide** for a 5-hour Angular State Management workshop called **StockPilot**.

The workshop uses a live Angular project instead of slides. The presenter walks through code, runs demos, and explains concepts interactively.

## Your Task

1. **Scan the project** to understand what is actually implemented:
   - Read `docs/sections/section-00-project-structure.md` for the intended structure
   - Run `find src/app -type f -name "*.ts" | sort` to see all implemented files
   - Run `find src/app -type f -name "*.html" | sort` to see templates
   - Read key store files to understand the actual implementation
   - Read key component files to understand the actual UI

2. **Read all section specs** from `docs/sections/section-01-*.md` through `docs/sections/section-10-*.md`

3. **If $ARGUMENTS is a number (01-10)**: Write the guide for ONLY that section.
   **If $ARGUMENTS is empty or "all"**: Write guides for ALL 10 sections.

4. **Write the presenter guide** as a Markdown file and save it to `docs/presenter-guide/`.

## Output Format

For each section, write a presenter guide with this exact structure:

```markdown
# Section N: [Title]

## Duration: ~X minutes

---

## Pre-Section Checklist

- [ ] App is running (`ng serve`)
- [ ] Browser open at [specific URL]
- [ ] Terminal visible for [specific reason if needed]
- [ ] [Any specific state: logged in/out, specific page open, etc.]

---

## Opening (2 min)

**Say:** [1-2 sentences to frame what this section covers and WHY it matters]
**Context bridge:** [How this connects to the previous section]

---

## Demo Flow

### Demo 1: [Name] (~X min)

**Navigate to:** `[URL or file path to open in editor]`

**Show in editor:**

- Open `[exact file path]`
- Highlight lines [N-M]: [what to point out]
- Scroll to [function/block]: [what to explain]

**Show in browser:**

- [What to click/interact with]
- [What the audience should observe]

**Key talking point:**

> [The main concept to explain here, written as a script the presenter can paraphrase]

**CONCEPT spotlight:**

- Find the `// CONCEPT:` comment at [location] and read it aloud
- Explain: [deeper context the comment doesn't cover]

**Live coding (if any):**

- [ ] [Step 1: what to type/change]
- [ ] [Step 2: what to type/change]
- [ ] [Expected result after the change]

---

### Demo 2: [Name] (~X min)

[Same structure as Demo 1]

---

## Audience Interaction Points

- **Ask the audience:** "[Specific question to engage them]"
- **Poll/show of hands:** "[Quick engagement question]"
- **Challenge:** "[Optional: give them 2 min to predict what happens if X]"

---

## Common Questions & Answers

**Q: [Likely question from audience]**
A: [Concise answer]

**Q: [Another likely question]**
A: [Concise answer]

---

## Transition to Next Section

**Say:** [1-2 sentences bridging to the next topic]
**Action:** [Navigate to X / open file Y / etc.]

---

## Section Cheat Sheet (for quick reference during delivery)

| Concept   | Where to find it | Key line           |
| --------- | ---------------- | ------------------ |
| [concept] | [file:line]      | [the code snippet] |
```

## Critical Rules

1. **Reference REAL file paths** from the actual project. Do NOT guess. Read the project first.
2. **Reference REAL code** from the actual files. Quote actual lines, not hypothetical ones.
3. **Every demo must be testable.** The presenter should be able to follow the guide and reproduce the demo exactly.
4. **Time management.** Each section has a target duration. The guide must fit within it. If a section has too much to cover, prioritize the most impactful demos and mark others as "if time permits".
5. **Beginner-friendly first, then depth.** Each demo should start with the simple explanation, then add the advanced nuance for architects.
6. **No em dashes.** Never use em dashes in any generated text.
7. **Browser + Editor flow.** The presenter alternates between showing code in the editor and showing the running app in the browser. Make this flow explicit.
8. **Mark "wow moments".** Flag the demos that get the biggest audience reaction so the presenter can build energy toward them.
9. **Include recovery steps.** If a demo might fail (API down, hot reload breaks), include a fallback plan.

## File Naming

Save each section guide as:

```
docs/presenter-guide/section-NN-guide.md
```

If writing all sections, also create:

```
docs/presenter-guide/README.md          # Overview + delivery tips
docs/presenter-guide/quick-reference.md # All concepts on one page for quick lookup during delivery
```

## Presenter Guide README Content

The README should include:

- Workshop setup checklist (what to install, configure, open before starting)
- Timing breakdown with buffer time
- Tips for live coding (font size, terminal setup, browser zoom)
- How to handle if you run behind schedule (which demos to skip per section)
- Links to each section guide

## Quick Reference Content

A single-page cheat sheet with:

- All signal/store APIs in one table
- All `// CONCEPT:` tags and their locations in the codebase
- All DummyJSON endpoints used
- All store files and what they manage
- All reusable features and their APIs
- Keyboard shortcuts for VS Code live demo (go to file, go to symbol, etc.)

## Workflow

1. Scan the project structure
2. Read each section spec + the actual implemented code
3. For each section, identify the actual file paths, line numbers, and code that matches the spec
4. Write the presenter guide referencing real code
5. Save to docs/presenter-guide/
6. Print a summary of what was generated
