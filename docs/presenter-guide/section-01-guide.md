# Section 01: The Problem - Why State Management Matters

**Duration:** ~20 minutes
**URL:** http://localhost:4200/
**Goal:** Show the audience real pain points (prop drilling, event bubbling, duplicate HTTP calls) so they feel the need for a solution before you introduce one.

---

## Pre-Section Checklist

- [ ] `ng serve` running at http://localhost:4200/
- [ ] Browser open with DevTools Network tab visible
- [ ] Editor open with `src/app/features/home/` folder expanded
- [ ] Terminal clear of errors
- [ ] Browser cache cleared (hard refresh) so HTTP call counter starts at 1

---

## Opening (2 min)

Start on the Home page at http://localhost:4200/. Point out the two-card layout:

- **Left card** ("Without State Management") shows the broken approach
- **Right card** ("The State Management Approach") previews what the workshop will teach

> "Before we learn any tool, let's feel the pain. This page has four components chained together, and every one of them has a problem."

---

## Demo Flow

### Demo 1: Trace the Component Hierarchy (5 min)

**Browser:**

1. Look at the chip diagram at the top of the left card: `home > product-list-bad > product-item-bad > product-actions-bad`
2. Point out that four components are involved just to display products and handle an "Add to Cart" button

**Editor - walk top-down through the hierarchy:**

1. Open `src/app/features/home/home.component.ts`
   - **Line 48-50**: Read the CONCEPT comment aloud. The event from "Add to Cart" bubbles through three levels of `@Output()` chaining.
   - **Line 51**: `<app-product-list-bad (addToCart)="onAddToCart($event)" />` is the entry point.
   - **Lines 151-159**: `onAddToCart()` finally handles the event. It took three hops to get here.

2. Open `src/app/features/home/product-list-bad.component.ts`
   - **Lines 10-12**: Read the CONCEPT comment. Direct `HttpClient` injection in a component is the first anti-pattern.
   - **Line 75**: `private http = inject(HttpClient);` -- no service layer, no caching.
   - **Lines 77-79**: Local signals (`products`, `loading`, `httpCallCount`) that cannot be shared.
   - **Line 82**: `addToCart = output<number>();` -- this output just forwards events from two levels below.
   - **Lines 38-43** (template): `(addToCart)="addToCart.emit($event)"` -- pure boilerplate forwarding.

3. Open `src/app/features/home/product-item-bad.component.ts`
   - **Lines 7-10**: CONCEPT comment about prop drilling. This component is level 2; it receives the full product and passes `productId` down.
   - **Lines 28-29**: CONCEPT comment about forwarding the output. It does nothing with the event.
   - **Lines 59-64**: `product = input.required<Product>()` and `addToCart = output<number>()`. The component exists mostly as a pass-through.

4. Open `src/app/features/home/product-actions-bad.component.ts`
   - **Lines 5-8**: CONCEPT comment. This is the deepest level (level 3). The button click must travel up through two intermediaries.
   - **Lines 29-31**: CONCEPT comment. `productId` was drilled down from two levels above.
   - **Lines 34-36**: CONCEPT comment. The output must be forwarded by every parent in the chain.

> **Wow moment:** "Count the `output()` declarations across these four files. There are three of them, and not a single one actually handles the event. They all just forward it."

### Demo 2: Duplicate HTTP Calls (5 min)

**Browser:**

1. Look at the "HTTP Calls" badge on the product list. It should show `1`.
2. Click the **Reload** button. Watch the badge increment to `2`.
3. Click Reload three more times. The badge now shows `5`.
4. Open DevTools Network tab and filter by `products`. Point out five separate requests to `https://dummyjson.com/products?limit=5`.

**Editor:**

1. Open `src/app/features/home/product-list-bad.component.ts`
   - **Lines 88-91**: `reload()` calls `fetchProducts()` again. The CONCEPT comment explains there is no caching or deduplication.
   - **Lines 94-108**: `fetchProducts()` calls `this.http.get()` directly every time. No service, no store, no shared cache.
   - **Line 96**: `this.httpCallCount.update(c => c + 1);` -- the counter proves every reload creates a new HTTP request.

> **Wow moment:** "Imagine five different components on the same page all showing product data. That is five independent HTTP calls for the same data. With a store, it would be one call and five reads from cache."

### Demo 3: Event Bubbling in Action (3 min)

**Browser:**

1. Click any "Add to Cart" button on one of the product cards.
2. A snackbar appears: "Added product #N to cart (event bubbled through 3 levels!)"
3. Point out that the snackbar message explicitly tells you how far the event traveled.

**Editor:**

1. Open `src/app/features/home/home.component.ts`
   - **Lines 151-159**: `onAddToCart()` shows the snackbar. This is the only place the event is actually used.

> "The button lives in `product-actions-bad`. The handler lives in `home`. Three components in between do nothing but relay the event. With a store, the button would call `store.addToCart(id)` directly."

### Demo 4: State Classification Preview (3 min)

**Browser:**

1. Scroll down (or look at) the right card: "The State Management Approach"
2. Walk through each item in the state layers list

**Editor:**

1. Open `src/app/features/home/home.component.ts`
   - **Lines 63-65**: CONCEPT comment about State Classification
   - **Lines 66-92**: The `mat-list` enumerates five state layers:
     - **UI State** (line 70): "Is this dropdown open?" -- signal in component
     - **Component State** (line 75): "Current search + filters" -- signals + computed
     - **Feature State** (line 80): "All inventory items" -- SignalStore
     - **Global State** (line 85): "Who is logged in?" -- Global SignalStore
     - **Server State** (line 90): "Cached API responses" -- resource / rxMethod

> "Before picking a tool, always ask: what kind of state is this? We will cover each layer in the sections ahead."

---

## Audience Interaction Points

| When | What to Ask |
|------|-------------|
| After Demo 1 | "Has anyone worked on a codebase where events had to bubble through 5+ levels? What happened when requirements changed?" |
| After Demo 2 | "What would happen in production if every component on a page made its own HTTP call for the same data?" |
| After Demo 3 | "If the product team asks you to add a cart counter in the toolbar, how would you do it with this architecture?" (Answer: yet another output chain or a shared service.) |
| After Demo 4 | "Can anyone give an example from their own app of state that started local but had to become global?" |

---

## Common Questions & Answers

| Question | Answer |
|----------|--------|
| "Is direct HttpClient in a component always bad?" | Not always. For a throwaway prototype or a component that truly owns its data, it can be fine. The problem is when multiple components need the same data, or when you need caching, retry, or loading state. |
| "Can't we just use a shared service with BehaviorSubject?" | You can, and that is a valid step up. But you end up writing boilerplate for loading, error, caching, and subscription cleanup. Signals and SignalStore handle that for you. |
| "Why not just use NgRx Store from the start?" | Full NgRx Store (actions, reducers, effects) is powerful but heavy. For many apps, SignalStore gives you 80% of the benefit with 20% of the ceremony. We will build up to that decision point. |

---

## Transition to Next Section

> "We have seen three problems: prop drilling, event bubbling, and duplicate HTTP calls. The root cause is the same in all three cases: there is no shared, reactive state container. In the next section, we will learn the building block that fixes all of this: Angular Signals."

Navigate to http://localhost:4200/signals-playground to preview the next page.

---

## Section Cheat Sheet

| Concept | File | Line(s) | What to Show |
|---------|------|---------|--------------|
| Event bubbling (3 levels) | `src/app/features/home/home.component.ts` | 48-51 | CONCEPT comment + `<app-product-list-bad>` usage |
| Direct HttpClient in component | `src/app/features/home/product-list-bad.component.ts` | 73-75 | `inject(HttpClient)` anti-pattern |
| Local signals (not shared) | `src/app/features/home/product-list-bad.component.ts` | 77-79 | `products`, `loading`, `httpCallCount` signals |
| Duplicate HTTP calls | `src/app/features/home/product-list-bad.component.ts` | 88-92, 94-108 | `reload()` and `fetchProducts()` |
| Prop drilling | `src/app/features/home/product-item-bad.component.ts` | 7-10, 59-64 | CONCEPT comment + input/output declarations |
| Output forwarding (level 2) | `src/app/features/home/product-item-bad.component.ts` | 28-29 | CONCEPT comment about boilerplate forwarding |
| Event bubbling (deepest level) | `src/app/features/home/product-actions-bad.component.ts` | 5-8 | CONCEPT comment about level 3 |
| Prop drilling for productId | `src/app/features/home/product-actions-bad.component.ts` | 29-31 | `productId = input.required<number>()` |
| Event handler (final destination) | `src/app/features/home/home.component.ts` | 151-159 | `onAddToCart()` snackbar |
| State classification | `src/app/features/home/home.component.ts` | 63-92 | Five state layers in the mat-list |

---

## Recovery Steps

| Problem | Fix |
|---------|-----|
| Products do not load | Check that `ng serve` is running. Open DevTools Console for errors. Verify network access to `https://dummyjson.com/products?limit=5`. |
| HTTP call counter stuck at 0 | Hard refresh the browser (Ctrl+Shift+R). The counter initializes on `ngOnInit`. |
| Snackbar does not appear on Add to Cart | Check the DevTools Console for errors. Ensure `MatSnackBar` is imported (line 6 of `home.component.ts`). |
| Page is blank | Check that the route `/` is correctly configured in `src/app/app.routes.ts` (line 32). |
