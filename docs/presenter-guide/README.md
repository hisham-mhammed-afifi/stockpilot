# StockPilot Workshop - Presenter Guide

> A 5-hour hands-on Angular State Management workshop using a live project instead of slides.

## Workshop Setup Checklist

Before the workshop begins, make sure the following are ready:

### Software Requirements

- [ ] Node.js 20+ installed
- [ ] Angular CLI installed globally (`npm i -g @angular/cli`)
- [ ] VS Code (or preferred editor) with Angular Language Service extension
- [ ] Google Chrome (for DevTools and Angular DevTools extension)
- [ ] Angular DevTools browser extension installed

### Project Setup

- [ ] Clone the StockPilot repository
- [ ] Run `npm install` (verify no errors)
- [ ] Run `ng serve` and confirm the app compiles and loads at `http://localhost:4200`
- [ ] Verify DummyJSON API is accessible: open `https://dummyjson.com/products?limit=1` in browser

### Editor Setup

- [ ] Font size: 18-20px (so the back row can read code)
- [ ] Theme: light theme recommended for projectors (dark theme for screens)
- [ ] Minimap: OFF (saves horizontal space)
- [ ] Line numbers: ON
- [ ] Word wrap: ON
- [ ] Terminal font size: 16px+
- [ ] Sidebar: closed during demos (toggle with `Ctrl+B`)

### Browser Setup

- [ ] Zoom to 125-150% for projector visibility
- [ ] DevTools open in a separate window (not docked)
- [ ] Network tab ready (for API call demos)
- [ ] Console tab ready (for error demos)
- [ ] Angular DevTools: Component Explorer tab open

### Pre-Load These Tabs

1. `http://localhost:4200` (Home - Section 01)
2. `http://localhost:4200/signals-playground` (Section 02)
3. `http://localhost:4200/products` (Section 03)
4. `http://localhost:4200/inventory` (Section 04-05)
5. `http://localhost:4200/orders` (Section 06)
6. `http://localhost:4200/order-builder` (Section 07)
7. `http://localhost:4200/login` (Section 08)
8. `http://localhost:4200/dashboard` (Section 09)

---

## Timing Breakdown

| Section | Topic | Target Duration | Cumulative |
|---------|-------|----------------|------------|
| 01 | The Problem | 20 min | 0:20 |
| 02 | Signals Foundation | 30 min | 0:50 |
| -- | **Break** | 10 min | 1:00 |
| 03 | Component State | 30 min | 1:30 |
| 04 | SignalStore Core | 30 min | 2:00 |
| -- | **Break** | 10 min | 2:10 |
| 05 | Entities & CRUD | 30 min | 2:40 |
| 06 | Async & Side Effects | 35 min | 3:15 |
| -- | **Lunch / Long Break** | 15 min | 3:30 |
| 07 | Custom Features | 30 min | 4:00 |
| 08 | Global State | 30 min | 4:30 |
| -- | **Break** | 5 min | 4:35 |
| 09 | Store Architecture | 35 min | 5:10 |
| 10 | Migration & Patterns | 30 min | 5:40 |
| -- | **Buffer / Q&A** | 20 min | 6:00 |

**Total with breaks: ~6 hours**
**Content only: ~5 hours**

---

## Tips for Live Coding

### General

- **Practice the demos** at least once before the workshop
- **Keep the terminal visible** when running `ng serve` so the audience sees compile feedback
- **Narrate what you type** as you type it
- **Pause after each demo** to let the audience absorb

### VS Code Shortcuts to Practice

| Action | Shortcut |
|--------|----------|
| Go to File | `Ctrl+P` |
| Go to Symbol | `Ctrl+Shift+O` |
| Go to Line | `Ctrl+G` |
| Toggle Sidebar | `Ctrl+B` |
| Toggle Terminal | `` Ctrl+` `` |
| Find in Files | `Ctrl+Shift+F` |
| Quick Fix | `Ctrl+.` |
| Fold/Unfold | `Ctrl+Shift+[` / `Ctrl+Shift+]` |
| Multi-cursor | `Alt+Click` |

### When Hot Reload Breaks

1. Check the terminal for compile errors
2. If the app is blank, try `Ctrl+Shift+R` (hard refresh)
3. If all else fails, stop `ng serve` and restart it
4. Keep a backup browser tab with the last working state

---

## If You Run Behind Schedule

### Priority Demos per Section (what to keep if short on time)

| Section | Must Do | Can Skip |
|---------|---------|----------|
| 01 | Show the bad component hierarchy + state classification | HTTP call counter details |
| 02 | Counter (signal), Shopping Cart (computed), Effect Logger | untracked demo, BehaviorSubject comparison |
| 03 | Products page with resource(), linkedSignal pagination | Product detail page walkthrough |
| 04 | InventoryStore walkthrough, show withState/withComputed/withMethods | Stats bar deep dive |
| 05 | Add Product dialog demo, show entity operations | Delete flow, form validation details |
| 06 | Kanban drag-and-drop (wow moment), operator comparison | Detailed code walkthrough of each rxMethod |
| 07 | Undo/redo demo (wow moment), withLocalStorage for theme | withPagination deep dive |
| 08 | Login flow + interceptor, guard demo | Notification store details, refresh token |
| 09 | Dashboard aggregation, coordinator walkthrough | Activity log deep dive |
| 10 | Decision tree, migration cheat sheet | All 8 anti-patterns (pick top 3) |

### Emergency Compression

If you are 30+ minutes behind:
- Skip Section 10 entirely and hand out the decision tree as a reference
- Combine Sections 04 and 05 by showing the final InventoryStore with entities already in place
- In Section 06, show only the drag-and-drop demo and the operator comparison chart

---

## Section Guides

1. [Section 01: The Problem](section-01-guide.md)
2. [Section 02: Signals Foundation](section-02-guide.md)
3. [Section 03: Component State](section-03-guide.md)
4. [Section 04: SignalStore Core](section-04-guide.md)
5. [Section 05: Entities & CRUD](section-05-guide.md)
6. [Section 06: Async & Side Effects](section-06-guide.md)
7. [Section 07: Custom Features](section-07-guide.md)
8. [Section 08: Global State](section-08-guide.md)
9. [Section 09: Store Architecture](section-09-guide.md)
10. [Section 10: Migration & Patterns](section-10-guide.md)

---

## Quick Links

- [Quick Reference (all concepts on one page)](quick-reference.md)
- [DummyJSON API docs](https://dummyjson.com/docs)
- Auth test credentials: `emilys` / `emilyspass`
