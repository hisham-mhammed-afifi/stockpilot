# Section 05: Entity Management & CRUD

## Duration: ~30 minutes

## CONCEPTS TAUGHT
- `withEntities()` from `@ngrx/signals/entities`
- Entity operations: `setAllEntities`, `addEntity`, `updateEntity`, `removeEntity`, `setEntity`
- `entityMap()`, `ids()`, `entities()` selectors
- Normalized flat state vs nested arrays
- Full CRUD operations through a store
- Optimistic UI patterns (preview, full implementation in Section 6)
- Dialog-based forms with store integration

## PREREQUISITES
- Section 04 (InventoryStore exists)

## API ENDPOINTS USED
- `GET /products?limit=N&skip=N` - list products
- `POST /products/add` - create product (simulated)
- `PUT /products/:id` - update product (simulated)
- `DELETE /products/:id` - delete product (simulated)

## DELIVERABLES

### Files to Create

1. **`src/app/shared/ui/confirm-dialog/confirm-dialog.component.ts`**
   Reusable Material confirmation dialog:
   ```typescript
   // Inputs via MAT_DIALOG_DATA: { title: string, message: string, confirmText: string, cancelText: string }
   // Returns: boolean (true = confirmed)
   ```

2. **`src/app/features/inventory/components/inventory-form.component.ts`**
   Product add/edit form as a Material dialog:
   - Reactive form with fields: title, description, price, stock, category, brand
   - Category field: mat-select populated from store categories
   - Validation: title required + minlength(3), price required + min(0), stock required + min(0)
   - Two modes: "Add Product" (empty form) and "Edit Product" (pre-filled with product data)
   - Pass product data via MAT_DIALOG_DATA
   - Returns the form value on save, null on cancel

### Files to Modify

1. **`src/app/features/inventory/store/inventory.store.ts`**
   Major refactor: replace the `products: Product[]` array with `withEntities<Product>()`.

   **Changes:**

   Remove from state: `products: Product[]`

   Add `withEntities<Product>()` after `withState()`:
   ```typescript
   export const InventoryStore = signalStore(
     { providedIn: 'root' },

     withState({
       // REMOVED: products: Product[] -- replaced by withEntities
       categories: [] as { slug: string; name: string }[],
       filters: initialFilters,
       total: 0,
       skip: 0,
       limit: 20,
       loading: false,
       error: null as string | null,
       selectedProductId: null as number | null,
     }),

     // CONCEPT: withEntities<Product>() - Adds normalized entity management.
     // Internally stores entities as { ids: number[], entityMap: Record<number, Product> }.
     // This gives O(1) lookups by ID (vs O(n) with array.find()).
     // Exposes signals: entities() (array), entityMap() (dict), ids() (array of IDs).
     withEntities<Product>(),

     withComputed((store) => ({
       // CONCEPT: entities() returns an array view - same API as before.
       // But internally, data is stored as a Map for fast lookups.
       filteredProducts: computed(() => {
         const products = store.entities(); // was store.products()
         const stockStatus = store.filters().stockStatus;
         // ... same filter logic
       }),

       // CONCEPT: entityMap() - O(1) lookup by ID.
       // Instead of products.find(p => p.id === id), use entityMap()[id].
       selectedProduct: computed(() => {
         const id = store.selectedProductId();
         return id ? store.entityMap()[id] ?? null : null;
       }),

       // ... rest of computed stay the same, just replace store.products() with store.entities()
     })),

     withMethods((store, productsApi = inject(ProductsApiService)) => ({
       // ... existing methods, updated:

       async loadProducts() {
         patchState(store, { loading: true, error: null });
         try {
           // ... same fetch logic ...
           // CONCEPT: setAllEntities() - Replaces ALL entities with a new set.
           // Use after a full list fetch. This clears old entities and sets new ones.
           patchState(store, setAllEntities(response.products), {
             total: response.total,
             loading: false,
           });
         } catch (err) {
           patchState(store, { loading: false, error: /* ... */ });
         }
       },

       // NEW: Add a product
       async addProduct(product: Partial<Product>) {
         patchState(store, { loading: true, error: null });
         try {
           const created = await firstValueFrom(productsApi.add(product));
           // CONCEPT: addEntity() - Adds a single entity to the collection.
           // The entity map and ids array are updated automatically.
           patchState(store, addEntity(created), {
             loading: false,
             total: store.total() + 1,
           });
           return created;
         } catch (err) {
           patchState(store, { loading: false, error: /* ... */ });
           return null;
         }
       },

       // NEW: Update a product
       async updateProduct(id: number, changes: Partial<Product>) {
         patchState(store, { loading: true, error: null });
         try {
           const updated = await firstValueFrom(productsApi.update(id, changes));
           // CONCEPT: updateEntity() - Updates a single entity by ID.
           // Only the specified changes are merged. The rest of the entity stays intact.
           patchState(store, updateEntity({ id, changes: updated }), {
             loading: false,
           });
           return updated;
         } catch (err) {
           patchState(store, { loading: false, error: /* ... */ });
           return null;
         }
       },

       // NEW: Delete a product
       async deleteProduct(id: number) {
         patchState(store, { loading: true, error: null });
         try {
           await firstValueFrom(productsApi.delete(id));
           // CONCEPT: removeEntity() - Removes an entity by ID.
           // If the deleted product was selected, clear the selection.
           patchState(store, removeEntity(id), {
             loading: false,
             total: store.total() - 1,
             selectedProductId: store.selectedProductId() === id ? null : store.selectedProductId(),
           });
           return true;
         } catch (err) {
           patchState(store, { loading: false, error: /* ... */ });
           return false;
         }
       },
     })),
   );
   ```

2. **`src/app/features/products/services/products-api.service.ts`**
   Add new methods:
   ```typescript
   add(product: Partial<Product>): Observable<Product> {
     return this.api.post<Product>('/products/add', product);
   }

   update(id: number, changes: Partial<Product>): Observable<Product> {
     return this.api.put<Product>(`/products/${id}`, changes);
   }

   delete(id: number): Observable<Product & { isDeleted: boolean; deletedOn: string }> {
     return this.api.delete(`/products/${id}`);
   }
   ```

3. **`src/app/features/inventory/components/inventory-list.component.ts`**
   Add CRUD action buttons:
   - "Add Product" button in the toolbar -> opens InventoryFormComponent dialog in add mode
   - "Edit" button per row -> opens dialog in edit mode, pre-filled with `store.entityMap()[id]`
   - "Delete" button per row -> opens ConfirmDialog, then calls `store.deleteProduct(id)`
   - Show mat-snackbar on success/failure for each operation

## IMPLEMENTATION SPEC

### Step 1: Update ProductsApiService
Add add/update/delete methods.

### Step 2: Refactor InventoryStore
Replace `products: Product[]` with `withEntities<Product>()`. Update all references from `store.products()` to `store.entities()` and from `store.products().find(...)` to `store.entityMap()[id]`.

### Step 3: Add CRUD Methods
Add addProduct, updateProduct, deleteProduct methods to the store.

### Step 4: Build Form Dialog
Create InventoryFormComponent as a Material dialog with reactive form validation.

### Step 5: Build Confirm Dialog
Create reusable ConfirmDialogComponent.

### Step 6: Update List Component
Add action buttons, dialog triggers, snackbar notifications.

## TEACHING NOTES

```typescript
// CONCEPT: Normalization - withEntities() stores data as { ids: [1,2,3], entityMap: { 1: {...}, 2: {...} } }.
// This is called "normalization". Benefits:
// 1. O(1) lookup by ID (entityMap[id]) vs O(n) array.find()
// 2. Updating one entity doesn't recreate the array (better performance)
// 3. No duplicate data (each entity exists exactly once)
// 4. Multiple views (filtered, sorted) can reference the same entity data

// CONCEPT: setAllEntities vs addEntity vs updateEntity vs removeEntity
// setAllEntities([...]) - Replace everything (after a list fetch)
// addEntity(entity) - Add one to the end
// addEntities([...]) - Add multiple
// updateEntity({ id, changes }) - Partial update one entity
// updateAllEntities({ changes }) - Update all entities with same changes
// removeEntity(id) - Remove one by ID
// removeAllEntities() - Clear everything

// CONCEPT: patchState composability - You can combine entity operations with
// regular state patches in a single patchState call:
// patchState(store, setAllEntities(products), { loading: false, total: 100 })
// This ensures both the entities and the loading flag update atomically.

// CONCEPT: entityMap() for O(1) lookups - When a component needs to display
// a product by ID (e.g., the selected product), use store.entityMap()[id]
// instead of store.entities().find(p => p.id === id). This is a map lookup,
// not an array scan. For 1000 products, this is 1000x faster.
```

## VERIFICATION
1. Inventory table still works with entity-backed data
2. "Add Product" dialog opens, validates, and adds product to table
3. "Edit" pre-fills the form with existing data, saves updates to table
4. "Delete" shows confirmation, removes product from table
5. Snackbar shows success/failure messages
6. Stats bar updates after add/delete operations
7. Selected product panel updates when entity is modified
