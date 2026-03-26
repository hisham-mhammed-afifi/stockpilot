# Section 5: Entity Management & CRUD

## Duration: ~30 minutes

---

## Pre-Section Checklist

- [ ] App is running (`ng serve`)
- [ ] Browser open at http://localhost:4200/inventory
- [ ] Editor open with `src/app/features/inventory/store/inventory.store.ts`
- [ ] Inventory table is loaded and displaying products

---

## Opening (2 min)

**Say:** "So far we have been managing arrays of data manually in our store. But what happens when you need to add, update, and delete items in that array? You end up writing the same boilerplate over and over. NgRx Signals has a built-in solution called `withEntities` that gives us normalized storage and free CRUD operations."

**Context bridge:** "In Section 4 we built our first SignalStore with `withState`, `withComputed`, and `withMethods`. Now we are going to replace the raw products array with a normalized entity collection that gives us O(1) lookups and atomic CRUD operations."

---

## Demo Flow

### Demo 1: withEntities Introduction (~5 min)

**Navigate to:** `src/app/features/inventory/store/inventory.store.ts`

**Show in editor:**

- Open `src/app/features/inventory/store/inventory.store.ts`
- Highlight lines 3-11: the imports from `@ngrx/signals/entities` -- `withEntities`, `setAllEntities`, `addEntity`, `updateEntity`, `removeEntity`
- Scroll to lines 31-34: the CONCEPT comment explaining normalization. Point out that `products: Product[]` is gone from the state interface
- Highlight lines 79-83: `withEntities<Product>()` in the store composition. Explain that this single line replaces a manual array and gives you `ids`, `entityMap`, and `entities` signals

**Key talking point:**

> "The key insight here is normalization. Instead of storing products as an array, `withEntities` stores them as `{ ids: number[], entityMap: Record<number, Product> }`. This means looking up a product by ID is O(1) instead of O(n). For a table with 1000 rows, that is roughly 1000x faster for lookups."

**CONCEPT spotlight:**

- Find the `// CONCEPT: Normalization` comment at line 31 and read it aloud
- Explain: "This is the same pattern that Redux/NgRx Entity has used for years, but now it is built into SignalStore with zero boilerplate."

---

### Demo 2: Entity Operations (~8 min)

**Navigate to:** `src/app/features/inventory/store/inventory.store.ts`

**Show in editor:**

- Scroll to lines 211-213: the `setAllEntities()` call inside `loadProducts`. Point out how it replaces ALL entities atomically as part of a `patchState` call at line 215
- Scroll to lines 241-243: the `addEntity()` CONCEPT comment. Show line 248 where `addEntity(created)` is composed with `patchState`
- Scroll to lines 266-268: the `updateEntity()` CONCEPT comment. Show line 273 where `updateEntity({ id, changes: updated })` merges partial changes
- Scroll to lines 288-290: the `removeEntity()` CONCEPT comment. Show line 298 where `removeEntity(id)` removes by ID

**Show in browser:**

- Navigate to http://localhost:4200/inventory
- Click "Add Product" button in the toolbar
- Fill out the form (any title, price, stock) and click "Create"
- **WOW MOMENT:** The product instantly appears in the table. Point out the snackbar confirmation
- Find the newly added product, click the edit (pencil) icon
- Change the price and click "Update". Show the table updates immediately
- Click the delete (trash) icon on the same product
- Confirm in the dialog. Show the product disappears from the table

**Key talking point:**

> "Notice how each operation is a single function call: `addEntity`, `updateEntity`, `removeEntity`. You never manually spread arrays or filter by ID. The entity adapter handles the normalized storage updates for you."

**CONCEPT spotlight:**

- Find the `// CONCEPT: addEntity()` comment at line 241 and read it aloud
- Explain: "Each entity operation returns an updater function that `patchState` applies. This is composable. You can combine an entity operation with regular state patches in a single `patchState` call, and they all apply atomically."

---

### Demo 3: entityMap() O(1) Lookups (~3 min)

**Navigate to:** `src/app/features/inventory/store/inventory.store.ts`

**Show in editor:**

- Open `src/app/features/inventory/store/inventory.store.ts`
- Highlight lines 109-115: the `selectedProduct` computed signal that uses `store.entityMap()[id]`
- Point out line 94: `store.entities()` returns the array view (for iteration), while `store.entityMap()` returns the dictionary (for lookups)

**Show in browser:**

- Click the "View" (eye) icon on any product row
- The detail panel opens instantly at the bottom of the page
- Click a different product. The panel updates immediately

**Key talking point:**

> "Compare `store.entityMap()[id]` with `store.products().find(p => p.id === id)`. The map lookup is constant time regardless of how many products you have. The array find scans every element until it finds a match. For large datasets, this difference is significant."

---

### Demo 4: setAllEntities vs addEntity (~5 min)

**Navigate to:** `src/app/features/inventory/store/inventory.store.ts`

**Show in editor:**

- Scroll to lines 214-218: the `patchState(store, setAllEntities(response.products), { total: response.total, loading: false })` call
- Point out how `setAllEntities` and `{ total, loading }` are composed together in a single `patchState` call
- Compare with line 248: `patchState(store, addEntity(created), { loading: false, total: store.total() + 1 })` -- same composability pattern

**Key talking point:**

> "This composability is what makes entity operations powerful. `setAllEntities` replaces everything, while `addEntity` appends one item. But both are just updater functions that you pass to `patchState`. You can mix entity operations with regular state patches in one atomic update. The UI only re-renders once."

**CONCEPT spotlight:**

- Find the `// CONCEPT: setAllEntities()` comment at line 211 and read it aloud
- Explain: "Atomic updates matter because Angular's change detection sees one state change, not two. If you did `patchState(store, setAllEntities(...))` and then `patchState(store, { loading: false })` separately, you would trigger two change detection cycles."

---

### Demo 5: CRUD Form Dialog (~5 min)

**Navigate to:** `src/app/features/inventory/components/inventory-form.component.ts`

**Show in editor:**

- Open `src/app/features/inventory/components/inventory-form.component.ts`
- Highlight lines 10-12: the `InventoryFormData` interface. Point out the `product: Product | null` field that determines add vs edit mode
- Scroll to lines 119-128: the reactive form with validators. Point out `Validators.required`, `Validators.minLength(3)`, `Validators.min(0)`
- Show line 31: the template uses `data.product ? 'Edit Product' : 'Add Product'` to switch the dialog title

**Show in browser:**

- Click "Add Product" and try to submit with an empty title. Show the validation error
- Type "AB" (only 2 chars) and show the min length error
- Fill in valid data and submit

**Key talking point:**

> "The form dialog follows a clean separation of concerns. The dialog component handles form validation and UI. The parent component (inventory-list) opens the dialog, waits for the result, and delegates the actual API call to the store. The dialog never touches the store directly."

**CONCEPT spotlight:**

- Find the `// CONCEPT: Architecture - Dialog data defines the contract` comment at line 10 and read it aloud
- Explain: "By passing `product: null` for add mode and `product: existingProduct` for edit mode, we reuse one dialog component for both operations. The form pre-fills itself from the data."

---

### Demo 6: Confirm Dialog Pattern (~4 min)

**Navigate to:** `src/app/shared/ui/confirm-dialog/confirm-dialog.component.ts`

**Show in editor:**

- Open `src/app/shared/ui/confirm-dialog/confirm-dialog.component.ts`
- Highlight lines 5-7: the CONCEPT comment explaining the reusable pattern
- Show lines 8-13: the `ConfirmDialogData` interface with `title`, `message`, `confirmText`, `cancelText`
- Show lines 26-30: the template uses `[mat-dialog-close]="false"` and `[mat-dialog-close]="true"` to return boolean results

**Show in editor (second file):**

- Switch to `src/app/features/inventory/components/inventory-list.component.ts`
- Scroll to lines 613-632: the `onDeleteProduct` method. Show how it opens `ConfirmDialogComponent` with custom data and waits for the boolean result

**Show in browser:**

- Click the delete icon on any product
- The confirm dialog appears with "Delete Product" title and a warning message
- Click "Cancel" to dismiss without deleting
- Click delete again and this time click "Delete" to confirm

**Key talking point:**

> "This is a reusable pattern. The confirm dialog lives in `shared/ui/` and any feature can use it. You configure it through the data contract, not by creating a new dialog for each feature. The same component handles delete confirmations, logout confirmations, or any destructive action."

---

## Audience Interaction Points

- **Ask the audience:** "Who has written code like `this.products = this.products.filter(p => p.id !== id)` before? How many bugs have you had from forgetting to spread the array?"
- **Poll/show of hands:** "How many of you have worked with NgRx Entity or similar normalized state libraries before?"
- **Challenge:** "What would happen if we called `addEntity` with a product that already exists in the collection? Think about it for a moment." (Answer: it would add a duplicate ID to the ids array, which can cause bugs. In practice, the API returns unique IDs.)

---

## Common Questions & Answers

**Q: What happens if two entities have the same ID?**
A: By default, `withEntities` uses a property called `id` as the entity identifier. If you add an entity with a duplicate ID, the existing one gets overwritten in the entityMap. You can customize the ID field by passing `{ selectId: (entity) => entity.customId }` to `withEntities`.

**Q: Can I have multiple entity collections in one store?**
A: Yes. You can call `withEntities` multiple times with different entity types by using the `collection` option: `withEntities<Product>({ collection: 'products' })` and `withEntities<Category>({ collection: 'categories' })`. Each collection gets its own `ids`, `entityMap`, and `entities` signals, prefixed with the collection name.

**Q: Why not just use a regular array with immutable updates?**
A: You absolutely can for small datasets. The benefits of `withEntities` show up when you have many items and need frequent lookups by ID, or when you want to avoid writing the same array manipulation boilerplate across multiple stores.

**Q: Does the DummyJSON API actually persist the changes?**
A: No. DummyJSON simulates CRUD operations and returns realistic responses, but changes are not saved server-side. If you reload the page, you get the original data back. This is fine for our workshop since we are focused on the client-side state management patterns.

---

## Transition to Next Section

**Say:** "We now have full CRUD operations with normalized entities, but notice something: our `addProduct`, `updateProduct`, and `deleteProduct` methods all use `async/await` with `firstValueFrom`. This works, but it gives us no control over concurrent requests. What happens if the user clicks 'Add Product' twice quickly? In the next section, we will replace these with `rxMethod` to get cancellation, queueing, and deduplication for free."

**Action:** Navigate to http://localhost:4200/orders and open `src/app/features/orders/store/orders.store.ts` in the editor.

---

## Section Cheat Sheet (for quick reference during delivery)

| Concept | Where to find it | Key line |
| --- | --- | --- |
| withEntities import | `inventory.store.ts:3-11` | `import { withEntities, setAllEntities, addEntity, updateEntity, removeEntity }` |
| Normalization explanation | `inventory.store.ts:31-34` | `// CONCEPT: Normalization` |
| withEntities composition | `inventory.store.ts:79-83` | `withEntities<Product>()` |
| entities() array view | `inventory.store.ts:94` | `const products = store.entities()` |
| entityMap() O(1) lookup | `inventory.store.ts:112-114` | `store.entityMap()[id]` |
| setAllEntities | `inventory.store.ts:215` | `patchState(store, setAllEntities(response.products), {...})` |
| addEntity | `inventory.store.ts:248` | `patchState(store, addEntity(created), {...})` |
| updateEntity | `inventory.store.ts:273` | `patchState(store, updateEntity({ id, changes: updated }), {...})` |
| removeEntity | `inventory.store.ts:298` | `patchState(store, removeEntity(id), {...})` |
| Dialog data contract | `inventory-form.component.ts:10-12` | `export interface InventoryFormData` |
| Reactive form validators | `inventory-form.component.ts:119-128` | `this.fb.nonNullable.group({...})` |
| Add Product handler | `inventory-list.component.ts:570-587` | `onAddProduct()` |
| Edit Product handler | `inventory-list.component.ts:593-611` | `onEditProduct(product)` |
| Delete with confirm | `inventory-list.component.ts:613-632` | `onDeleteProduct(product)` |
| Confirm dialog component | `confirm-dialog.component.ts:5-7` | `// CONCEPT: Architecture - Reusable confirmation dialog` |
| API CRUD methods | `products-api.service.ts:34-35` | `// CONCEPT: Architecture - CRUD methods map 1:1 to REST endpoints` |
