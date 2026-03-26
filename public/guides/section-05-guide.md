# Section 05: Entity Management & CRUD

**Duration:** ~30 minutes
**URL:** http://localhost:4200/inventory
**Key Store File:** `src/app/features/inventory/store/inventory.store.ts` (331 lines)

---

## Pre-Section Checklist

- [ ] Browser open at http://localhost:4200/inventory with products loaded in the table
- [ ] Editor open to `src/app/features/inventory/store/inventory.store.ts`
- [ ] Second editor tab: `src/app/features/inventory/components/inventory-form.component.ts`
- [ ] Third editor tab: `src/app/features/inventory/components/inventory-list.component.ts`
- [ ] Network tab open and cleared
- [ ] Console tab open (to watch for errors during CRUD demos)

---

## Opening (2 min)

> "In the previous section we saw `withEntities<Product>()` sitting on line 83 but skipped over it. That single line is doing a LOT of work under the hood. It replaces a flat `products: Product[]` array with a normalized data structure -- an ID array plus an entity map. And it gives us a toolkit of operations: `setAllEntities`, `addEntity`, `updateEntity`, `removeEntity`. These operations are what power our full CRUD workflow."

**Key talking point:** Entity normalization is a pattern borrowed from database design. Instead of scanning an array to find a product by ID, you look it up in a dictionary. O(1) instead of O(n).

---

## Demo Flow

### Part 1: Why Entities? The Normalization Model (5 min)

**Editor:** Open `src/app/features/inventory/store/inventory.store.ts`

1. **Show lines 31-34 -- the CONCEPT comment above `InventoryState`:**
   ```typescript
   // CONCEPT: Normalization - Notice that "products: Product[]" is GONE from the state.
   // withEntities<Product>() replaces it with normalized storage:
   //   { ids: number[], entityMap: Record<number, Product> }
   // This gives O(1) lookups by ID instead of O(n) array.find().
   ```

2. **Show line 83: `withEntities<Product>()`.**
   > "This one line adds three signals to the store: `entities()` returns the array view (like the old `products` array), `entityMap()` returns the dictionary for O(1) lookups, and `ids()` returns just the ID array."

3. **Draw the mental model on a whiteboard or slide:**
   ```
   Array approach:       [{ id: 1, ... }, { id: 2, ... }, { id: 3, ... }]
                          find(p => p.id === 2)  --> scans all elements

   Entity approach:      ids: [1, 2, 3]
                          entityMap: { 1: {...}, 2: {...}, 3: {...} }
                          entityMap[2]  --> direct lookup
   ```

4. **Show lines 5-11 -- the entity imports:**
   ```typescript
   import {
     withEntities,
     setAllEntities,
     addEntity,
     updateEntity,
     removeEntity,
   } from '@ngrx/signals/entities';
   ```
   > "Four operations, each one handles the normalized structure for you. You never manually push to an array or splice by index."

### Part 2: Entity Reads in Computed Signals (5 min)

**Editor:** Stay in `inventory.store.ts`, lines 89-140.

1. **Show `filteredProducts` (line 94):** `const products = store.entities();`
   > "When you need the array form for iteration, filtering, or display, use `entities()`. It reconstructs the array from the ID list and entity map."

2. **Show `selectedProduct` (lines 112-115):**
   ```typescript
   selectedProduct: computed(() => {
     const id = store.selectedProductId();
     return id ? store.entityMap()[id] ?? null : null;
   }),
   ```
   > "When you need a single entity by ID, use `entityMap()`. This is the O(1) lookup. No array scanning."

3. **Show `stats` (line 129):** `const products = store.entities();`
   > "Stats like inStock, lowStock, outOfStock all derive from the entity array. The computed only recalculates when the entity collection changes."

**WOW MOMENT:**
> "Here is the beautiful part. When you call `updateEntity({ id: 5, changes: { stock: 0 } })`, the entity map updates that ONE entry. The `entities()` signal sees the change and emits a new array reference. Every computed that reads `entities()` -- filteredProducts, stats -- recalculates. But computed signals that do NOT read entities (like `totalPages`) are untouched. Angular's signal graph handles the granularity for you."

### Part 3: setAllEntities -- Bulk Loading (3 min)

**Editor:** Scroll to lines 192-230 -- the `loadProducts` rxMethod.

1. **Show lines 214-218:**
   ```typescript
   next: (response) => {
     patchState(store, setAllEntities(response.products), {
       total: response.total,
       loading: false,
     });
   },
   ```
   > "setAllEntities replaces the ENTIRE entity collection. The old products are gone, the new ones are in. Notice how we combine it with a regular state patch in the same `patchState` call -- entity operations and plain state updates compose together."

**Browser demo:**
- In the inventory page, watch the table
- Change the category dropdown to "smartphones"
- Watch Network tab: a new API call fires
- The entire table replaces with smartphone products
- Change back to "All Categories" -- full replacement again

### Part 4: addEntity -- Creating a Product (7 min)

**Editor:** Scroll to lines 244-263 -- the `addProduct` method.

1. **Walk through the flow line by line:**
   - Line 245: Set `loading: true` and clear errors
   - Line 247: `firstValueFrom(productsApi.add(product))` -- bridge Observable to Promise
   - Line 248-251: On success, `addEntity(created)` inserts the new product AND increments `total`
   - Line 254: Push a success notification
   - Line 255: Coordinate with other stores via `StoreCoordinator`
   - Lines 257-263: On error, set the error message

2. **Show the API service.** Open `src/app/features/products/services/products-api.service.ts`, line 37:
   ```typescript
   add(product: Partial<Product>): Observable<Product> {
     return this.api.post<Product>('/products/add', product);
   }
   ```
   > "The API returns the created product with a server-assigned ID. We pass that directly to `addEntity()`."

3. **Show the component trigger.** Open `src/app/features/inventory/components/inventory-list.component.ts`, lines 604-622 -- `onAddProduct()`:
   - Line 605: Opens `InventoryFormComponent` as a dialog
   - Line 609: Passes `categories` from the store for the dropdown
   - Line 615: Calls `this.store.addProduct(result)` with the form data
   - Lines 616-620: Shows a snackbar based on success or failure

4. **Show the form component.** Open `src/app/features/inventory/components/inventory-form.component.ts`:
   - Lines 13-16: `InventoryFormData` interface -- `product: Product | null` determines add vs. edit mode
   - Lines 126-133: Reactive form with validators (`Validators.required`, `Validators.minLength(3)`, `Validators.min(0)`)
   - Lines 139-142: `onSave()` returns `form.getRawValue()` to the dialog caller

**Browser demo (TESTABLE):**
1. Click the blue "Add Product" button in the toolbar
2. Fill in: Title = "Test Widget", Price = 29.99, Stock = 50, pick any category
3. Click "Create"
4. Watch for: snackbar "Product added successfully", stats bar updates (Total Products increments by 1)
5. The new product may appear at the end of the current page or require pagination to find (DummyJSON assigns ID 195+)

**Recovery:** If the dialog does not open, check the console for errors. If the API call fails, the snackbar will say "Failed to add product" -- check the Network tab for the response.

### Part 5: updateEntity -- Editing a Product (5 min)

**Editor:** Open `src/app/features/inventory/store/inventory.store.ts`, lines 269-286.

1. **Show the key line (273):**
   ```typescript
   patchState(store, updateEntity({ id, changes: updated }), {
     loading: false,
   });
   ```
   > "updateEntity merges `changes` into the existing entity. Only the fields you pass are updated. The rest of the product stays intact. The entity map updates in-place (well, immutably), and `entities()` emits a new array."

2. **Show the component trigger.** Open `inventory-list.component.ts`, lines 627-645 -- `onEditProduct()`:
   - Line 628: Opens the same `InventoryFormComponent`, but passes the existing `product`
   - Line 638: Calls `this.store.updateProduct(product.id, result)`

3. **Show the form pre-fill.** Open `inventory-form.component.ts`, lines 126-133:
   ```typescript
   title: [this.data.product?.title ?? '', [Validators.required, ...]],
   ```
   > "When `data.product` is not null, the form pre-fills with existing values. The template also toggles the title: 'Edit Product' vs 'Add Product' (line 36), and the button text: 'Update' vs 'Create' (line 102)."

**Browser demo (TESTABLE):**
1. Find any product row in the table
2. Click the pencil (edit) icon in the Actions column
3. Change the title to "MODIFIED - [original title]"
4. Change the price to 1.00
5. Click "Update"
6. Watch: snackbar appears, the table row updates with the new title and price
7. The stats bar may update if the price change affects averages

### Part 6: removeEntity -- Deleting a Product (5 min)

**Editor:** Open `inventory.store.ts`, lines 291-313.

1. **Walk through the flow:**
   - Line 293: Capture the product title BEFORE removal (for activity logging)
   - Line 298: `removeEntity(id)` removes from entity map and ID array
   - Line 301: If the deleted product was selected, clear `selectedProductId`
   - Line 300: Decrement `total` to keep stats accurate

2. **Show the confirm dialog.** Open `src/app/shared/ui/confirm-dialog/confirm-dialog.component.ts`:
   - Lines 8-13: `ConfirmDialogData` interface with title, message, confirmText, cancelText
   - Line 29: "Confirm" button uses `[mat-dialog-close]="true"` -- returns `true` when clicked

3. **Show the component trigger.** Open `inventory-list.component.ts`, lines 647-667 -- `onDeleteProduct()`:
   - Line 648: Opens `ConfirmDialogComponent` with a warning message
   - Line 660: Only calls `store.deleteProduct(product.id)` if `confirmed === true`

**Browser demo (TESTABLE):**
1. Find any product row (note the Total Products count in the stats bar)
2. Click the trash (delete) icon
3. A confirmation dialog appears: "Are you sure you want to delete [product name]?"
4. Click "Delete"
5. Watch: the row disappears from the table, Total Products decrements by 1, snackbar confirms
6. Click "Cancel" on the next delete attempt to verify the dialog cancellation works

**WOW MOMENT:**
> "Count the lines of code for the entire CRUD cycle. The store methods are about 20 lines each. The component handlers are about 15 lines each. The form is 144 lines total including the template. For a full Create-Read-Update-Delete workflow with validation, confirmation dialogs, error handling, and notification toasts, that is remarkably little code. And the component has zero business logic."

---

## Audience Interaction Points

- **After Part 1:** "Why would you pick entity normalization over a simple array? When would a simple array be fine?" (Answer: arrays are fine for small, read-only lists. Entities shine when you have frequent lookups by ID, frequent updates to individual items, or large collections.)
- **After Part 4:** "What happens to `filteredProducts` when we add a new product?" (Answer: `entities()` emits a new reference, `filteredProducts` recomputes, and if the new product matches the current stock filter, it appears.)
- **After Part 6:** "What would happen if we forgot to decrement `total` in `deleteProduct`?" (Answer: the stats bar would show the wrong Total Products count, and pagination would be off by one.)

---

## Common Questions & Answers

**Q: Does withEntities require a numeric `id` field?**
A: By default, yes -- it looks for a field called `id`. You can customize this with `withEntities({ entity: type<Product>(), collection: 'products', idKey: 'sku' })` if your entity uses a different identifier.

**Q: Can I have multiple entity collections in one store?**
A: Yes. Use the `collection` option: `withEntities({ entity: type<Product>(), collection: 'products' })` and `withEntities({ entity: type<Category>(), collection: 'categories' })`. Each gets its own `productsEntities()`, `categoriesEntities()`, etc.

**Q: Is addEntity atomic with patchState?**
A: Yes. In `patchState(store, addEntity(created), { loading: false, total: store.total() + 1 })`, all updates happen in a single synchronous call. There is no intermediate state where loading is true but the entity is already added.

**Q: Why use firstValueFrom instead of subscribe?**
A: `firstValueFrom` bridges Observable to Promise, letting us use `async/await`. It automatically unsubscribes after the first emission. For single-shot HTTP calls this is cleaner than manual subscribe/unsubscribe. For streams that emit multiple values, `rxMethod` (Section 06) is the better tool.

**Q: What if the API call fails after the dialog closes?**
A: The `catch` block in each method sets `loading: false` and `error` on the store. The component checks the return value (`created`, `updated`, `success`) and shows an appropriate snackbar. The entity collection is NOT modified on failure.

---

## Recovery Steps

**If the Add dialog does not open:**
1. Check console for `NullInjectorError` -- ensure `provideAnimations()` is in `app.config.ts`
2. Verify `MatDialog` import in `inventory-list.component.ts` (line 16)

**If the API call returns an error:**
1. DummyJSON may be down -- check https://dummyjson.com/products in a browser tab
2. The snackbar should show "Failed to add/update/delete product"
3. Check Network tab for the actual HTTP status code

**If the table does not update after CRUD:**
1. Verify `addEntity`/`updateEntity`/`removeEntity` is being called (add a `console.log` before the `patchState` call)
2. Check that the entity ID matches -- DummyJSON returns `id` as a number, not a string
3. Hard-refresh and try again

---

## Transition to Next Section

> "We now have a complete CRUD workflow powered by entity management. But you may have noticed that `loadProducts` uses `rxMethod` and `switchMap`, while `addProduct` uses plain `async/await`. Both work, but they have very different characteristics when it comes to cancellation, queueing, and error recovery. In the next section, we will switch to the Orders feature and explore these async patterns in depth -- including optimistic updates and drag-and-drop."

---

## Section Cheat Sheet

| Concept | Location | Line(s) |
|---|---|---|
| Entity imports | `inventory.store.ts` | 5-11 |
| Normalization comment | `inventory.store.ts` | 31-34 |
| `withEntities<Product>()` | `inventory.store.ts` | 83 |
| `entities()` read | `inventory.store.ts` | 94, 129 |
| `entityMap()` lookup | `inventory.store.ts` | 114 |
| `setAllEntities` (bulk load) | `inventory.store.ts` | 215 |
| `addEntity` (create) | `inventory.store.ts` | 248 |
| `updateEntity` (update) | `inventory.store.ts` | 273 |
| `removeEntity` (delete) | `inventory.store.ts` | 298 |
| Total adjustment on add | `inventory.store.ts` | 250 |
| Total adjustment on delete | `inventory.store.ts` | 300 |
| Selection cleanup on delete | `inventory.store.ts` | 301 |
| InventoryFormData interface | `inventory-form.component.ts` | 13-16 |
| Reactive form with validators | `inventory-form.component.ts` | 126-133 |
| Add dialog trigger | `inventory-list.component.ts` | 604-622 |
| Edit dialog trigger | `inventory-list.component.ts` | 627-645 |
| Delete with confirmation | `inventory-list.component.ts` | 647-667 |
| ConfirmDialogData interface | `confirm-dialog.component.ts` | 8-13 |
| ProductsApiService CRUD | `products-api.service.ts` | 37-47 |
