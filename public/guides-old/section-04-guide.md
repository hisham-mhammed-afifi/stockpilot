# Section 4: NgRx SignalStore - Core Concepts

## Duration: ~30 minutes

---

## Pre-Section Checklist

- [ ] App is running (`ng serve`)
- [ ] Browser open at http://localhost:4200/inventory
- [ ] Editor open to `src/app/features/inventory/store/inventory.store.ts`
- [ ] Products have loaded in the inventory table (verify the stats bar shows numbers)

---

## Opening (2 min)

**Say:** "In Section 3 we kept all state inside the component. That worked great for the products catalog. But inventory management needs CRUD operations, shared state across components, and data that survives navigation. This is where NgRx SignalStore gives us structure without boilerplate."

**Context bridge:** "Remember the three extraction criteria from the last section? The inventory feature hits all three: multiple components share the data, we want filters to persist across navigation, and the logic (CRUD, pagination, stats) is complex enough to warrant separation."

---

## Demo Flow

### Demo 1: Store Structure (~8 min)

**Navigate to:** `src/app/features/inventory/store/inventory.store.ts`

**Show in editor:**

- Open `src/app/features/inventory/store/inventory.store.ts`
- Highlight lines 20-22: State Shape definition. Show the InventoryFilters type (lines 23-29) and InventoryState type (lines 35-44)
- Highlight lines 31-34: CONCEPT comment about normalization. Explain that `products: Product[]` is gone, replaced by withEntities
- Show lines 46-63: Initial state values. Point out how filters have sensible defaults.
- Highlight lines 65-67: The signalStore() CONCEPT comment about composable architecture
- Show line 68: `export const InventoryStore = signalStore(`
- Highlight lines 69-71: CONCEPT about providedIn root scope
- Show lines 74-77: withState() and what it does (each property becomes a Signal)
- Show lines 79-83: withEntities<Product>() for normalized entity storage
- Show lines 85-88: withComputed() introduction
- Show lines 142-144: withMethods() introduction
- Show lines 320-324: withHooks() with onInit

**Key talking point:**

> "signalStore() is a composition function. You build your store by stacking features: withState for data, withEntities for collections, withComputed for derivations, withMethods for actions, withHooks for lifecycle. The order matters because later features can access signals from earlier ones. This is not a class hierarchy. It is functional composition."

**CONCEPT spotlight:**

- Find the `// CONCEPT: signalStore()` comment at line 65 and read it aloud
- Explain: Compare this to class-based services. There is no constructor, no manual dependency wiring between state and computed values. The store argument threads everything together automatically.

---

### Demo 2: patchState in Action (~5 min)

**Navigate to:** `src/app/features/inventory/store/inventory.store.ts`, lines 150-185

**Show in editor:**

- Open `src/app/features/inventory/store/inventory.store.ts`
- Highlight lines 152-155: CONCEPT comment about patchState immutability
- Show lines 156-161: `setFilters()` method using the function form of patchState. Point out `skip: 0` resetting pagination.
- Show lines 163-167: `selectProduct()` method using the simple object form of patchState
- Show lines 169-185: Navigation methods (nextPage, prevPage, goToPage)

**Show in browser:**

- Open http://localhost:4200/inventory
- Change the search filter and watch the table update
- Change the stock status toggle and observe client-side filtering
- Click pagination buttons and watch the table update
- Open DevTools console: point out there are no direct state mutations

**Key talking point:**

> "patchState has two forms. The simple form takes an object: `patchState(store, { selectedProductId: id })`. The function form gives you access to current state: `patchState(store, (state) => ({...}))`. Use the function form when the new value depends on the old value, like computing the next page offset."

**CONCEPT spotlight:**

- Find the `// CONCEPT: patchState()` comment at line 152 and read it aloud
- Explain: patchState is always immutable. It creates a new state object. You cannot accidentally mutate nested objects because the spread operator creates shallow copies.

---

### Demo 3: Computed Signals (~5 min)

> **WOW MOMENT** - The stats bar auto-updates when entities change.

**Navigate to:** `src/app/features/inventory/store/inventory.store.ts`, lines 89-139

**Show in editor:**

- Open `src/app/features/inventory/store/inventory.store.ts`
- Highlight lines 90-92: CONCEPT comment about client-side filtering with computed
- Show lines 93-107: `filteredProducts` computed that filters by stock status
- Highlight lines 109-111: CONCEPT about entityMap() for O(1) lookups
- Show lines 112-115: `selectedProduct` computed using entityMap()
- Highlight lines 117-119: CONCEPT about pagination helpers
- Show lines 120-123: totalPages, currentPage, hasNextPage, hasPrevPage
- Highlight lines 125-127: CONCEPT about stats computed
- Show lines 128-139: The stats computed that aggregates totalProducts, inStock, lowStock, outOfStock, averagePrice

**Show in browser:**

- Open http://localhost:4200/inventory
- Point to the stats bar at the top (Total Products, In Stock, Low Stock, Out of Stock)
- Change the stock status filter to "Low Stock" and observe the table filters client-side
- Point out that the stats bar still shows the full counts (it reads from unfiltered entities)

**Key talking point:**

> "Computed signals in SignalStore are lazy and cached. The stats computed only recalculates when store.entities() or store.total() changes, not when store.loading() or store.filters() changes. Angular's signal system tracks the exact dependencies. This is fine-grained reactivity without any manual optimization."

**CONCEPT spotlight:**

- Find the `// CONCEPT: Computed - Summary stats` comment at line 125 and read it aloud
- Explain: entityMap() gives O(1) lookups by ID. For 1000 products, `entityMap()[id]` is roughly 1000x faster than `products.find(p => p.id === id)`.

---

### Demo 4: Dumb Component Pattern (~5 min)

**Navigate to:** `src/app/features/inventory/components/inventory-list.component.ts`

**Show in editor:**

- Open `src/app/features/inventory/components/inventory-list.component.ts`
- Highlight lines 44-45: CONCEPT comment about the template reading signals from the store
- Show lines 48-54: Stats bar reading `store.stats().totalProducts` directly in the template
- Highlight lines 125-126: CONCEPT comment about the component being purely presentational
- Show lines 135-137: CONCEPT about dumb component handlers
- Scroll to lines 225-227: CONCEPT about store signal reads in template, showing Edit/Delete action buttons

**Key talking point:**

> "This component has zero business logic. It injects the store, reads signals in the template, and delegates every user action back to the store. Search changes? Call store.setFilters(). Delete clicked? Call store.deleteProduct(). The component does not know HOW filtering works or WHERE products come from. This separation makes testing trivial: you can test the store in isolation without any DOM."

**CONCEPT spotlight:**

- Find the `// CONCEPT: Architecture` comment at line 44 and read it aloud
- Explain: This is the "smart store, dumb component" pattern. The store handles logic. The component handles display. If you swap the UI framework, only the component changes.

---

### Demo 5: withHooks onInit (~3 min)

**Navigate to:** `src/app/features/inventory/store/inventory.store.ts`, lines 320-330

**Show in editor:**

- Open `src/app/features/inventory/store/inventory.store.ts`
- Highlight lines 320-324: CONCEPT comment about withHooks lifecycle
- Show lines 325-329: The onInit hook calling `store.loadProducts()` and `store.loadCategories()`

**Show in browser:**

- Open http://localhost:4200/inventory
- Watch the network tab: products and categories load automatically
- Navigate away and back: data is already cached in the root-provided store (no re-fetch)

**Key talking point:**

> "withHooks gives your store lifecycle awareness. onInit runs when the store is first created. For a root-provided store, that is the moment the first component injects it. Data loads automatically without the component needing to call anything in ngOnInit. This is self-initializing state."

**CONCEPT spotlight:**

- Find the `// CONCEPT: withHooks()` comment at line 320 and read it aloud
- Explain: For feature-scoped stores (provided via route), onInit fires when the route loads and the store is destroyed when navigating away. We use root scope here because inventory data may be shared across features.

---

### Demo 6: signalStore vs signal service (~4 min)

**Navigate to:** `src/app/features/inventory/store/inventory.store.ts`, lines 252-254

**Show in editor:**

- Open `src/app/features/inventory/store/inventory.store.ts`
- Highlight lines 252-254: CONCEPT comment comparing signalStore to signal services
- Remind the audience of the ThemeService from Section 2 (a simple injectable with signals)

**Key talking point:**

> "A signal service is a plain @Injectable with signal(), computed(), and methods. SignalStore adds structure: withState enforces an initial shape, patchState ensures immutability, withComputed groups derivations, withHooks adds lifecycle. For two or three signals, a service is fine. For a feature with 10+ state properties, CRUD, pagination, and computed stats, SignalStore pays for itself in maintainability."

**Audience Interaction:**

- Ask: "Looking at the inventory store, could we have built this as a plain signal service? What would we lose?"
- Expected answers: We would lose patchState immutability guarantees, the composable with*() structure, and the entity management from withEntities.

---

## Audience Interaction Points

- **Ask the audience:** "What is the biggest state management pain point in your current Angular projects?"
- **Poll/show of hands:** "Who is currently using NgRx Store (the class-based one with actions and reducers)? Who is using plain services? Who has no state management at all?"
- **Challenge:** "Look at the stats computed (line 128). If we add a new product, which computed signals will recalculate? Which will not?" (Answer: stats and filteredProducts recalculate because they depend on entities(). Pagination computeds like totalPages also update because they depend on total(). But selectedProduct does not, unless the new product happens to be selected.)

---

## Common Questions & Answers

**Q: Is SignalStore a replacement for NgRx Store (the classic one with actions/reducers)?**
A: It is a different tool for different scales. SignalStore is lighter and better for feature-level state. Classic NgRx Store is better when you need time-travel debugging, action logging, or when your team is already invested in the Redux pattern. They can coexist in the same app.

**Q: Can I use SignalStore without entities?**
A: Absolutely. withEntities is optional. If your store manages a form, a wizard, or settings (not a collection), skip withEntities and use plain withState.

**Q: How do I test a SignalStore?**
A: Create it with `const store = new InventoryStore()` in your test (or use TestBed). Call methods, assert on signal values. No component DOM needed. This is one of the biggest advantages of separating state from components.

**Q: What about devtools for debugging?**
A: NgRx provides a devtools package (`@ngrx/signals/devtools`) that integrates with the Redux DevTools browser extension. We do not cover it in this workshop, but it provides state inspection and action logging.

---

## Transition to Next Section

**Say:** "We now have a store that manages products as plain state. But notice we are using withEntities, which gives us normalized storage. In Section 5, we will explore entity management in depth: adding, updating, deleting products with full CRUD operations and optimistic updates."

**Action:** Keep the browser at http://localhost:4200/inventory and open `src/app/features/inventory/store/inventory.store.ts` scrolled to the entity methods (addProduct, updateProduct, deleteProduct)

---

## Section Cheat Sheet (for quick reference during delivery)

| Concept | Where to find it | Key line |
| --- | --- | --- |
| State Shape definition | `inventory.store.ts:20-22` | `type InventoryState = {...}` |
| signalStore() composition | `inventory.store.ts:65-67` | `signalStore(withState, withComputed, withMethods, withHooks)` |
| providedIn root | `inventory.store.ts:69-71` | `{ providedIn: 'root' }` |
| withState() initial values | `inventory.store.ts:74-77` | `withState(initialState)` |
| withEntities normalization | `inventory.store.ts:79-83` | `withEntities<Product>()` |
| Client-side filtering | `inventory.store.ts:90-92` | `filteredProducts: computed(...)` |
| entityMap() O(1) lookup | `inventory.store.ts:109-111` | `store.entityMap()[id]` |
| Pagination computed | `inventory.store.ts:117-119` | `totalPages, currentPage, hasNextPage, hasPrevPage` |
| Stats computed | `inventory.store.ts:125-127` | `stats: computed(() => {...})` |
| withMethods() | `inventory.store.ts:142-144` | `withMethods((store, ...) => ({...}))` |
| patchState() immutable | `inventory.store.ts:152-155` | `patchState(store, (state) => ({...}))` |
| setAllEntities() | `inventory.store.ts:211-213` | `patchState(store, setAllEntities(response.products), {...})` |
| withHooks onInit | `inventory.store.ts:320-324` | `onInit(store) { store.loadProducts(); }` |
| Dumb component pattern | `inventory-list.component.ts:44-45` | `// The entire template reads signals from the store` |
| Store injection | `inventory-list.component.ts:44-45` | `store = inject(InventoryStore)` |
| signalStore vs service | `inventory.store.ts:252-254` | `// signalStore vs signal service comparison` |
