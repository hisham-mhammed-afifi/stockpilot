import { computed, inject } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, withHooks, patchState } from '@ngrx/signals';
// CONCEPT: withEntities - Import entity management from @ngrx/signals/entities.
// This gives us normalized storage and entity CRUD operations.
import {
  withEntities,
  setAllEntities,
  addEntity,
  updateEntity,
  removeEntity,
} from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { firstValueFrom, pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { ProductsApiService } from '../../products/services/products-api.service';
import { Product } from '../../../shared/models/product.model';
import { NotificationsStore } from '../../../core/notifications/notifications.store';

// CONCEPT: State Shape - Define the state interface separately.
// This makes it clear what the store manages and helps with typing.
// Nested objects (like filters) group related fields together.
export type InventoryFilters = {
  search: string;
  category: string;
  stockStatus: 'all' | 'in-stock' | 'low-stock' | 'out-of-stock';
  sortBy: 'title' | 'price' | 'stock' | 'rating';
  sortOrder: 'asc' | 'desc';
};

// CONCEPT: Normalization - Notice that "products: Product[]" is GONE from the state.
// withEntities<Product>() replaces it with normalized storage:
//   { ids: number[], entityMap: Record<number, Product> }
// This gives O(1) lookups by ID instead of O(n) array.find().
type InventoryState = {
  categories: { slug: string; name: string }[];
  filters: InventoryFilters;
  total: number;
  skip: number;
  limit: number;
  loading: boolean;
  error: string | null;
  selectedProductId: number | null;
};

const initialFilters: InventoryFilters = {
  search: '',
  category: '',
  stockStatus: 'all',
  sortBy: 'title',
  sortOrder: 'asc',
};

const initialState: InventoryState = {
  categories: [],
  filters: initialFilters,
  total: 0,
  skip: 0,
  limit: 20,
  loading: false,
  error: null,
  selectedProductId: null,
};

// CONCEPT: signalStore() - Creates a reactive store composed of features.
// Each with*() adds capabilities. The order matters: later features can
// access signals from earlier ones.
export const InventoryStore = signalStore(
  // CONCEPT: providedIn - Makes this store a singleton at root level.
  // For feature-scoped stores, remove this and provide via route providers.
  // We use root here because inventory data may be needed by orders/dashboard later.
  { providedIn: 'root' },

  // CONCEPT: withState() - Defines the state shape and initial values.
  // Each property becomes a Signal: store.loading(), store.categories(), etc.
  // The state is immutable. You cannot do store.loading = true.
  withState(initialState),

  // CONCEPT: withEntities<Product>() - Adds normalized entity management.
  // Internally stores entities as { ids: number[], entityMap: Record<number, Product> }.
  // This gives O(1) lookups by ID (vs O(n) with array.find()).
  // Exposes signals: entities() (array), entityMap() (dict), ids() (array of IDs).
  withEntities<Product>(),

  // CONCEPT: withComputed() - Adds derived signals to the store.
  // These are read-only computed signals that react to state changes.
  // The store parameter gives you access to all state signals from withState
  // AND entity signals from withEntities.
  withComputed((store) => ({
    // CONCEPT: Computed - Client-side filtering for stock status.
    // store.entities() returns the array view of normalized data.
    // This computed only recalculates when entities() or filters() change.
    filteredProducts: computed(() => {
      const products = store.entities(); // was store.products()
      const stockStatus = store.filters().stockStatus;

      if (stockStatus === 'all') return products;

      return products.filter(p => {
        switch (stockStatus) {
          case 'in-stock': return p.stock > 10;
          case 'low-stock': return p.stock > 0 && p.stock <= 10;
          case 'out-of-stock': return p.stock === 0;
          default: return true;
        }
      });
    }),

    // CONCEPT: entityMap() for O(1) lookups - Instead of store.products().find(p => p.id === id),
    // use store.entityMap()[id]. This is a map lookup, not an array scan.
    // For 1000 products, this is ~1000x faster.
    selectedProduct: computed(() => {
      const id = store.selectedProductId();
      return id ? store.entityMap()[id] ?? null : null;
    }),

    // CONCEPT: Computed - Pagination helpers derived from skip, limit, total.
    // Components read these signals directly in the template instead of
    // computing pagination logic themselves.
    totalPages: computed(() => Math.ceil(store.total() / store.limit())),
    currentPage: computed(() => Math.floor(store.skip() / store.limit()) + 1),
    hasNextPage: computed(() => store.skip() + store.limit() < store.total()),
    hasPrevPage: computed(() => store.skip() > 0),

    // CONCEPT: Computed - Summary stats aggregated from the entities array.
    // This only recalculates when store.entities() or store.total() changes,
    // not when store.loading() or store.filters() changes.
    stats: computed(() => {
      const products = store.entities(); // was store.products()
      return {
        totalProducts: store.total(),
        inStock: products.filter(p => p.stock > 10).length,
        lowStock: products.filter(p => p.stock > 0 && p.stock <= 10).length,
        outOfStock: products.filter(p => p.stock === 0).length,
        averagePrice: products.length
          ? products.reduce((sum, p) => sum + p.price, 0) / products.length
          : 0,
      };
    }),
  })),

  // CONCEPT: withMethods() - Adds methods to the store.
  // Methods can be synchronous (patchState) or async (rxMethod, covered in Section 6).
  // The store instance and injected services are available via the factory function.
  withMethods((store, productsApi = inject(ProductsApiService), notifications = inject(NotificationsStore)) => ({

    // CONCEPT: patchState() - Immutably updates part of the state.
    // Only the specified properties are updated. The rest remain unchanged.
    // The function form patchState(store, (state) => ({...})) gives you access
    // to the current state for computed patches.
    setFilters(filters: Partial<InventoryFilters>) {
      patchState(store, (state) => ({
        filters: { ...state.filters, ...filters },
        skip: 0, // Reset pagination when filters change
      }));
    },

    // CONCEPT: patchState - Simple property update. No function form needed
    // when you do not need the current state.
    selectProduct(id: number | null) {
      patchState(store, { selectedProductId: id });
    },

    nextPage() {
      patchState(store, (state) => ({
        skip: Math.min(state.skip + state.limit, state.total - state.limit),
      }));
    },

    prevPage() {
      patchState(store, (state) => ({
        skip: Math.max(state.skip - state.limit, 0),
      }));
    },

    goToPage(page: number) {
      patchState(store, (state) => ({
        skip: (page - 1) * state.limit,
      }));
    },

    // CONCEPT: rxMethod migration - This was previously an async/await method (Section 4).
    // We migrated it to rxMethod (Section 6) to gain: cancellation via switchMap
    // (if loadProducts is called twice, the first HTTP call is cancelled),
    // and tapResponse for error-safe handling that keeps the stream alive.
    // Compare this with the Orders store to see the same pattern.
    loadProducts: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(() => {
          const filters = store.filters();

          const source$ = filters.search
            ? productsApi.search(filters.search, store.limit())
            : filters.category
              ? productsApi.getByCategory(filters.category)
              : productsApi.getAll({
                  limit: store.limit(),
                  skip: store.skip(),
                  sortBy: filters.sortBy,
                  order: filters.sortOrder,
                });

          return source$.pipe(
            tapResponse({
              // CONCEPT: setAllEntities() - Replaces ALL entities with a new set.
              // patchState composability: entity operations and regular state patches
              // can be combined in a single patchState call for atomic updates.
              next: (response) => {
                patchState(store, setAllEntities(response.products), {
                  total: response.total,
                  loading: false,
                });
              },
              error: (err: Error) => {
                patchState(store, {
                  loading: false,
                  error: err.message || 'Failed to load products',
                });
              },
            })
          );
        })
      )
    ),

    async loadCategories() {
      try {
        const categories = await firstValueFrom(productsApi.getCategories());
        patchState(store, { categories });
      } catch {
        // Non-critical, silently fail
      }
    },

    // CONCEPT: addEntity() - Adds a single entity to the collection.
    // The entity map and ids array are updated automatically.
    // We also increment total to keep stats accurate.
    async addProduct(product: Partial<Product>) {
      patchState(store, { loading: true, error: null });
      try {
        const created = await firstValueFrom(productsApi.add(product));
        patchState(store, addEntity(created), {
          loading: false,
          total: store.total() + 1,
        });
        // CONCEPT: Global store coordination - Inventory store pushes a notification
        // to NotificationsStore. The notification bell in the toolbar updates automatically.
        notifications.showSuccess(`Product "${created.title}" added`);
        return created;
      } catch (err) {
        patchState(store, {
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to add product',
        });
        return null;
      }
    },

    // CONCEPT: updateEntity() - Updates a single entity by ID.
    // Only the specified changes are merged. The rest of the entity stays intact.
    // Other components reading this entity via entityMap() see the update immediately.
    async updateProduct(id: number, changes: Partial<Product>) {
      patchState(store, { loading: true, error: null });
      try {
        const updated = await firstValueFrom(productsApi.update(id, changes));
        patchState(store, updateEntity({ id, changes: updated }), {
          loading: false,
        });
        notifications.showSuccess(`Product "${updated.title}" updated`);
        return updated;
      } catch (err) {
        patchState(store, {
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to update product',
        });
        return null;
      }
    },

    // CONCEPT: removeEntity() - Removes an entity by ID.
    // If the deleted product was selected, clear the selection too.
    // We decrement total to keep stats accurate.
    async deleteProduct(id: number) {
      patchState(store, { loading: true, error: null });
      try {
        await firstValueFrom(productsApi.delete(id));
        patchState(store, removeEntity(id), {
          loading: false,
          total: store.total() - 1,
          selectedProductId: store.selectedProductId() === id ? null : store.selectedProductId(),
        });
        notifications.showSuccess('Product deleted');
        return true;
      } catch (err) {
        patchState(store, {
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to delete product',
        });
        return false;
      }
    },

    clearError() {
      patchState(store, { error: null });
    },
  })),

  // CONCEPT: withHooks() - Lifecycle hooks for the store.
  // onInit runs when the store is first injected/created.
  // For root-provided stores, that is when the first component injects it.
  // For feature-scoped stores, that is when the route loads.
  // Perfect for initial data loading.
  withHooks({
    onInit(store) {
      store.loadProducts();
      store.loadCategories();
    },
  }),
);
