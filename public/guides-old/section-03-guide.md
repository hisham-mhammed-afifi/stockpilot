# Section 3: Component-Level State Patterns

## Duration: ~30 minutes

---

## Pre-Section Checklist

- [ ] App is running (`ng serve`)
- [ ] Browser open at http://localhost:4200/products
- [ ] Editor open to `src/app/features/products/products.component.ts`
- [ ] API is reachable (products load on the catalog page)

---

## Opening (2 min)

**Say:** "Now that we understand signals, computed, and effect as building blocks, let us see how they work together to manage real component state. This section is about knowing when you do NOT need a store or a service."

**Context bridge:** "In Section 2 we explored signals in isolation. Here we combine them into a complete component that handles search, filtering, pagination, and async data fetching with zero external state management."

---

## Demo Flow

### Demo 1: Products API Service (~3 min)

**Navigate to:** `src/app/features/products/services/products-api.service.ts`

**Show in editor:**

- Open `src/app/features/products/services/products-api.service.ts`
- Highlight lines 6-9: The CONCEPT comment explaining feature-specific API services
- Scroll through lines 14-32: Show the typed methods (`getAll`, `search`, `getById`, `getCategories`, `getByCategory`)
- Highlight lines 34-35: CRUD methods map 1:1 to REST endpoints

**Key talking point:**

> "This service is intentionally thin. It wraps HttpClient calls with typed return values and nothing else. No caching, no state, no transformation. The component or store that consumes it decides how to handle the data. Methods return Observable because HttpClient is Observable-based, but we will bridge to Promises when feeding resource()."

**CONCEPT spotlight:**

- Find the `// CONCEPT: Architecture` comment at line 6 and read it aloud
- Explain: Keeping API services thin means they are reusable across components and stores without coupling to a specific state management strategy

---

### Demo 2: Products Catalog with resource() (~10 min)

> **WOW MOMENT** - This is the demo that shows the power of resource().

**Navigate to:** `src/app/features/products/products.component.ts`

**Show in editor:**

- Open `src/app/features/products/products.component.ts`
- Highlight lines 291-294: Component State concept. These signals are local and ephemeral.
- Highlight lines 298-304: The individual signals for search, category, sort, and page size
- Scroll to lines 319-328: The `requestParams` computed that bundles all parameters into one signal
- Highlight lines 330-340: The resource() CONCEPT comment. Read this block carefully with the audience.
- Scroll to lines 341-359: The actual resource() call with its loader function

**Show in browser:**

- Open http://localhost:4200/products
- Wait for products to load (resource fetches automatically)
- Select a category from the dropdown and watch the grid update
- Type a search term and watch results update after debounce
- Point out there is no "loading = true; subscribe(); loading = false" pattern anywhere

**Key talking point:**

> "resource() is declarative async. You describe WHAT data you need as a function of reactive inputs, and Angular handles the WHEN. When requestParams changes, the loader re-runs. You get .value(), .isLoading(), .error(), and .status() for free. Compare this to the imperative pattern where you manually set loading flags, subscribe, handle errors, and manage cleanup."

**CONCEPT spotlight:**

- Find the `// CONCEPT: resource()` comment at lines 330-340 and read it aloud
- Explain: The trade-off with firstValueFrom is that it does not auto-cancel on new requests. In production, consider rxResource() for Observable cancellation.

**Show in editor (categories resource):**

- Scroll to lines 361-365: The categories resource has no params function
- Explain: "No params means the loader runs once when the component initializes. Static data like category lists are a perfect use case."

---

### Demo 3: linkedSignal for Page Reset (~5 min)

**Navigate to:** `src/app/features/products/products.component.ts`, lines 306-313

**Show in editor:**

- Open `src/app/features/products/products.component.ts`
- Highlight lines 306-309: The CONCEPT comment explaining linkedSignal
- Show lines 310-313: The linkedSignal implementation

**Show in browser:**

- Open http://localhost:4200/products
- Click "Next" to navigate to page 2 or 3
- Now type a search term in the search box
- Watch the page reset to 1 automatically
- Clear the search and select a category; page resets again

**Key talking point:**

> "linkedSignal solves a real UX problem. Without it, searching while on page 3 shows empty results because the API returns fewer items. linkedSignal is writable (user can click Next/Prev) AND it auto-resets when its source signals change. computed() cannot do this because computed is read-only."

**CONCEPT spotlight:**

- Find the `// CONCEPT: linkedSignal` comment at line 306 and read it aloud
- Explain: This is one of the newest Angular primitives. Before linkedSignal, you needed an effect() with a manual set() call, which felt like a workaround.

---

### Demo 4: Product Detail with toSignal() (~5 min)

**Navigate to:** `src/app/features/products/product-detail.component.ts`

**Show in editor:**

- Open `src/app/features/products/product-detail.component.ts`
- Highlight lines 374-381: The CONCEPT comment about toSignal() bridging Observable to Signal
- Show lines 378-381: toSignal() converting route params Observable to a Signal
- Highlight lines 383-392: resource() using the route-derived signal as params
- Show lines 394-404: Local UI state (selectedImageIndex) and computed (selectedImage)

**Show in browser:**

- Open http://localhost:4200/products/1
- Show the product detail page loads with data from resource()
- Click different thumbnail images; selectedImageIndex updates, main image changes
- Navigate to http://localhost:4200/products/5; watch resource auto-fetch the new product

**Key talking point:**

> "toSignal() is the bridge between Angular's Observable-based APIs (Router, HttpClient, Forms) and the Signal world. Route params come as Observable. resource() needs a Signal. toSignal() creates that bridge. Always provide an initialValue to avoid undefined."

**CONCEPT spotlight:**

- Find the `// CONCEPT: toSignal()` comment at line 374 and read it aloud
- Explain: The initialValue of 0 means the resource guard (`if (id === 0)`) prevents a fetch before the route params emit

---

### Demo 5: Effect for Debouncing (~3 min)

**Navigate to:** `src/app/features/products/products.component.ts`, lines 374-389

**Show in editor:**

- Open `src/app/features/products/products.component.ts`
- Highlight lines 375-380: The CONCEPT comment explaining the debounce pattern
- Show lines 381-389: The effect() implementation with onCleanup

**Key talking point:**

> "This is a valid use of effect(). We are bridging user input timing to state updates. The effect tracks searchInput. Each keystroke sets a 300ms timeout. onCleanup cancels the previous timeout if the user types again. After 300ms of silence, searchTerm updates, which triggers the resource to re-fetch. The empty string case updates immediately for instant clearing."

**Show in browser:**

- Open http://localhost:4200/products
- Type "phone" quickly and watch the network tab: only one request fires after you stop typing
- Clear the search and watch results update immediately (no 300ms delay)

**CONCEPT spotlight:**

- Find the `// CONCEPT: effect() for debouncing` comment at line 375 and read it aloud
- Explain: effect() is appropriate here because we are producing a side effect (updating searchTerm on a timer). Using computed() would not work because computed cannot set other signals.

---

### Demo 6: When to Extract (~4 min)

**Navigate to:** `src/app/features/products/products.component.ts`, lines 429-434

**Show in editor:**

- Open `src/app/features/products/products.component.ts`
- Scroll to the bottom of the file, lines 429-434: The CONCEPT comment about extraction criteria

**Key talking point:**

> "Right now all the state lives inside the component. And that is fine. We would extract to a service or store ONLY if: (1) another unrelated component needs the same data, (2) we need the state to survive navigation, or (3) the logic is complex enough to warrant separation. Do not reach for a store just because you can. Section 4 will show what happens when extraction becomes necessary."

**Audience Interaction:**

- Ask: "In your projects, how do you decide when to extract state from a component?"
- Let 2-3 people share their criteria before revealing the three rules from the CONCEPT comment

---

## Audience Interaction Points

- **Ask the audience:** "Who has written manual loading/error/success flag management before? How many lines of code did that take?"
- **Poll/show of hands:** "How many of you have had the bug where changing a filter shows empty results because the page number was stale?"
- **Challenge:** "Look at the resource() code. What happens if the API returns an error? Where does the error surface?" (Answer: resource provides .error() and .status() automatically)

---

## Common Questions & Answers

**Q: Why use firstValueFrom instead of just passing the Observable to resource()?**
A: resource() expects a Promise-based loader. If you want Observable-native handling with auto-cancellation, use rxResource() instead. We use resource() here because it is simpler to teach and sufficient for most cases.

**Q: Does resource() cancel the previous request when params change?**
A: No, that is the trade-off mentioned in the CONCEPT comment. firstValueFrom does not cancel. For cancellation, use rxResource() which leverages Observable's built-in unsubscription. We cover rxResource patterns in Section 6.

**Q: Why not use an effect() to reset the page instead of linkedSignal?**
A: You could, but linkedSignal is more declarative. It expresses the relationship ("page depends on search and category") rather than the imperative action ("when search changes, set page to 1"). It is also writable, which effect-based solutions handle clumsily.

**Q: When should I use toSignal() vs just subscribing in the component?**
A: Use toSignal() when you need the value as a Signal (for resource params, computed, template binding). Use subscribe() when you need to perform side effects. In modern Angular, toSignal() is almost always the better choice.

---

## Transition to Next Section

**Say:** "We have seen how far you can go with just signals, computed, resource, and effect inside a single component. But what happens when multiple components need the same state? What happens when you need CRUD operations, pagination that survives navigation, and cross-feature coordination? That is where NgRx SignalStore comes in."

**Action:** Navigate to http://localhost:4200/inventory and open `src/app/features/inventory/store/inventory.store.ts` in the editor

---

## Section Cheat Sheet (for quick reference during delivery)

| Concept | Where to find it | Key line |
| --- | --- | --- |
| Component State (local signals) | `products.component.ts:291-294` | `// These signals are local to this component` |
| linkedSignal (page reset) | `products.component.ts:306-313` | `currentPage = linkedSignal({...})` |
| resource() (async fetching) | `products.component.ts:330-359` | `products = resource({params: this.requestParams, ...})` |
| resource() (categories, no params) | `products.component.ts:361-365` | `categories = resource({loader: () => ...})` |
| toSignal() (Observable bridge) | `product-detail.component.ts:374-381` | `private productId = toSignal(...)` |
| resource() with route params | `product-detail.component.ts:383-392` | `product = resource<Product \| null, number>({...})` |
| Component UI state | `product-detail.component.ts:394-396` | `selectedImageIndex = signal(0)` |
| effect() for debouncing | `products.component.ts:375-389` | `effect((onCleanup) => {...})` |
| When to extract | `products.component.ts:429-434` | `// We would extract to a service/store ONLY if...` |
| API service layer | `products-api.service.ts:6-9` | `// Feature-specific API services wrap the generic ApiService` |
