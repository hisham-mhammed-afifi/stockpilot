# StockPilot Workshop -- Presenter Guide

> Angular State Management with Signals and SignalStore
> Duration: ~5 hours teaching + ~55 min breaks = ~6 hours total

---

## Workshop Setup Checklist

Before the session, verify every item on this list. A missing dependency or wrong font size can eat 15 minutes of your teaching time.

### Required Software
- **Node.js 18+** -- run `node -v` to confirm
- **Angular CLI** -- `npm install -g @angular/cli` (verify with `ng version`)
- **VS Code** with the **Angular Language Service** extension installed
- **Chrome** browser with DevTools (you will use the Network tab for API demos)

### Project Setup
1. Clone the repo and run `npm install`
2. Run `ng serve` and verify that http://localhost:4200 loads the StockPilot app
3. Open the project in VS Code

### Display Settings (Critical for Visibility)
- **VS Code font size**: 16+ (`editor.fontSize` in settings)
- **VS Code zoom level**: 150% (`Ctrl+=` to increase)
- **Terminal font size**: 14+ (`terminal.integrated.fontSize` in settings)
- **Chrome zoom**: 125-150% for API demos
- **Screen resolution**: If projecting, use 1920x1080. Avoid 4K native resolution on a projector.

### Browser Tabs
Have two browser tabs ready before you start:
1. **http://localhost:4200** -- the running StockPilot app
2. **https://dummyjson.com/docs** -- DummyJSON API docs for reference

### Quick Smoke Test
1. Navigate to the Login page at `/login`
2. Log in with `emilys` / `emilyspass`
3. Confirm the dashboard loads with data
4. Open DevTools > Network tab and verify API calls to `dummyjson.com`

---

## Timing Breakdown

| Section | Topic | Duration | Cumulative |
|---------|-------|----------|------------|
| 1 | The Problem | ~20 min | 0:20 |
| -- | Break | 5 min | 0:25 |
| 2 | Signals Foundation | ~30 min | 0:55 |
| 3 | Component State | ~30 min | 1:25 |
| -- | Break | 10 min | 1:35 |
| 4 | SignalStore Core | ~30 min | 2:05 |
| 5 | Entity CRUD | ~30 min | 2:35 |
| -- | Lunch Break | 30 min | 3:05 |
| 6 | Async & Side Effects | ~35 min | 3:40 |
| 7 | Custom Features | ~30 min | 4:10 |
| -- | Break | 10 min | 4:20 |
| 8 | Global State | ~30 min | 4:50 |
| 9 | Store Architecture | ~35 min | 5:25 |
| 10 | Migration & Wrap-up | ~30 min | 5:55 |

**Total teaching time:** ~5 hours
**Total with breaks:** ~6 hours

---

## Tips for Live Coding

### Navigation Shortcuts
| Action | Shortcut |
|--------|----------|
| Go to File | `Ctrl+P` |
| Go to Symbol in File | `Ctrl+Shift+O` |
| Go to Line | `Ctrl+G` |
| Find in Files | `Ctrl+Shift+F` |
| Toggle Terminal | `` Ctrl+` `` |
| Split Editor | `Ctrl+\` |

### Editor Layout
- **Split editor**: code on the left, terminal on the right
- Use `Ctrl+P` to jump between files instead of clicking the file tree
- Use `Ctrl+Shift+O` to jump to a specific method or property within a file
- Use `Ctrl+G` to go to specific line numbers when referencing CONCEPT comments

### Coding Tips
- Type slowly and narrate what you are typing
- Use VS Code autocomplete and explain the suggestions as they appear
- If you make a typo, leave it for a moment and let the audience spot it
- Keep the terminal visible so attendees can see compilation errors in real time
- Use `Ctrl+K Ctrl+0` (Fold All) to collapse a file, then unfold sections one by one

### Dealing with API Issues
- DummyJSON is a free public API. If it goes down, the app will show loading spinners.
- The app uses simulated mutations (POST/PUT/DELETE return mock data). Mention this when you reach Section 5.
- If network issues arise, you can still demonstrate the store patterns by focusing on the code structure.

---

## How to Handle Running Behind

If you are running behind schedule, here are the demos you can skip in each section. The skippable demos are the least critical to the learning progression.

| Section | What to Skip | Time Saved |
|---------|-------------|------------|
| 1 -- The Problem | Demo 1 (shell walkthrough) | ~5 min |
| 2 -- Signals Foundation | Part E (untracked) and Part F (comparison) | ~8 min |
| 3 -- Component State | Demo 5 (debounce) and Demo 6 (extraction discussion) | ~8 min |
| 4 -- SignalStore Core | Demo 6 (signalStore vs signal service) | ~5 min |
| 5 -- Entity CRUD | Demo 6 (confirm dialog) | ~5 min |
| 6 -- Async & Side Effects | Demo 6 (tapResponse detail) and Demo 7 (operator comparison) | ~8 min |
| 7 -- Custom Features | Demo 6 (lifecycle demo) | ~5 min |
| 8 -- Global State | Demo 5 (notifications detail) | ~5 min |
| 9 -- Store Architecture | Demo 5 (circular dependency) and Demo 6 (eager init) | ~8 min |
| 10 -- Migration & Wrap-up | Demo 4 (decision tree) | ~5 min |

**Maximum time saved by skipping all optional demos:** ~62 minutes

**Priority rule:** If you must cut aggressively, keep Sections 2-6 intact (the core learning path) and trim Sections 1, 7-10.

---

## Section Guides

Detailed presenter guides for each section:

1. [Section 01 -- The Problem](./section-01-guide.md)
2. Section 02 -- Signals Foundation (see [section notes](../sections/section-02-signals-foundation.md))
3. [Section 03 -- Component State](./section-03-guide.md)
4. Section 04 -- SignalStore Core (see [section notes](../sections/section-04-signalstore-core.md))
5. [Section 05 -- Entity CRUD](./section-05-guide.md)
6. Section 06 -- Async & Side Effects (see [section notes](../sections/section-06-async-side-effects.md))
7. Section 07 -- Custom Features (see [section notes](../sections/section-07-custom-features.md))
8. Section 08 -- Global State (see [section notes](../sections/section-08-global-state.md))
9. Section 09 -- Store Architecture (see [section notes](../sections/section-09-store-architecture.md))
10. Section 10 -- Migration & Wrap-up (see [section notes](../sections/section-10-migration-patterns.md))

---

## Key Files to Have Open Before Each Section

| Section | Files to Pre-Open |
|---------|-------------------|
| 1 | `src/app/features/home/product-list-bad.component.ts`, `src/app/features/home/product-item-bad.component.ts`, `src/app/features/home/product-actions-bad.component.ts` |
| 2 | `src/app/features/home/signals-playground/signals-playground.component.ts` |
| 3 | `src/app/features/products/products.component.ts`, `src/app/features/products/product-detail.component.ts` |
| 4 | `src/app/features/inventory/store/inventory.store.ts` |
| 5 | `src/app/features/inventory/store/inventory.store.ts`, `src/app/features/inventory/components/inventory-list.component.ts` |
| 6 | `src/app/features/orders/store/orders.store.ts`, `src/app/features/orders/services/orders-api.service.ts` |
| 7 | `src/app/shared/store-features/with-loading.ts`, `src/app/shared/store-features/with-pagination.ts`, `src/app/shared/store-features/with-undo-redo.ts`, `src/app/shared/store-features/with-local-storage.ts` |
| 8 | `src/app/core/auth/auth.store.ts`, `src/app/core/auth/auth.interceptor.ts`, `src/app/core/auth/auth.guard.ts`, `src/app/core/notifications/notifications.store.ts` |
| 9 | `src/app/core/coordination/store-coordinator.service.ts`, `src/app/features/dashboard/store/dashboard.store.ts`, `src/app/core/activity-log/activity-log.store.ts`, `src/app/features/order-builder/store/order-builder.store.ts` |
| 10 | Section notes file (no specific source files needed beyond what is in the section notes) |

---

## Audience Engagement Tips

- After each section, ask: "What questions do you have?" (not "Do you have questions?")
- Use the CONCEPT comments as anchors. Say: "Find the comment that says CONCEPT on line X" to keep everyone on the same line.
- When showing anti-patterns in Section 1, ask the audience: "What is wrong with this code?" before revealing the answer.
- During the SignalStore sections (4-6), draw the store composition on a whiteboard: `signalStore(withState, withComputed, withMethods, withHooks)`.
- In Section 7, let attendees guess what a `signalStoreFeature` should look like before showing the code.
