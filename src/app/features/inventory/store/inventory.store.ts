import { computed, inject } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, withHooks, patchState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { ProductsApiService } from '../../products/services/products-api.service';
import { Product, ProductsResponse } from '../../../shared/models/product.model';

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

type InventoryState = {
  products: Product[];
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
  products: [],
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
  // Each property becomes a Signal: store.loading(), store.products(), etc.
  // The state is immutable. You cannot do store.loading = true.
  withState(initialState),

  // CONCEPT: withComputed() - Adds derived signals to the store.
  // These are read-only computed signals that react to state changes.
  // The store parameter gives you access to all state signals from withState.
  // Each computed signal only re-evaluates when its specific dependencies change.
  withComputed((store) => ({
    // CONCEPT: Computed - Client-side filtering for stock status.
    // The API does not support this filter, so we filter in memory.
    // This computed only recalculates when products() or filters() change.
    filteredProducts: computed(() => {
      const products = store.products();
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

    // CONCEPT: Computed - Derived lookup. Finds the selected product from the list.
    // Returns null if no product is selected or the ID is not found.
    selectedProduct: computed(() => {
      const id = store.selectedProductId();
      return id ? store.products().find(p => p.id === id) ?? null : null;
    }),

    // CONCEPT: Computed - Pagination helpers derived from skip, limit, total.
    // Components read these signals directly in the template instead of
    // computing pagination logic themselves.
    totalPages: computed(() => Math.ceil(store.total() / store.limit())),
    currentPage: computed(() => Math.floor(store.skip() / store.limit()) + 1),
    hasNextPage: computed(() => store.skip() + store.limit() < store.total()),
    hasPrevPage: computed(() => store.skip() > 0),

    // CONCEPT: Computed - Summary stats aggregated from the products array.
    // This only recalculates when store.products() or store.total() changes,
    // not when store.loading() or store.filters() changes.
    stats: computed(() => {
      const products = store.products();
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
  withMethods((store, productsApi = inject(ProductsApiService)) => ({

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

    // CONCEPT: Async methods - Simple Promise-based approach using firstValueFrom()
    // to convert the Observable from ProductsApiService into a Promise.
    // In Section 6 we will replace this with rxMethod for more powerful
    // Observable pipelines (debounce, switchMap, retry, etc.).
    async loadProducts() {
      patchState(store, { loading: true, error: null });
      try {
        const filters = store.filters();
        let response: ProductsResponse;

        if (filters.search) {
          response = await firstValueFrom(
            productsApi.search(filters.search, store.limit())
          );
        } else if (filters.category) {
          response = await firstValueFrom(
            productsApi.getByCategory(filters.category)
          );
        } else {
          response = await firstValueFrom(
            productsApi.getAll({
              limit: store.limit(),
              skip: store.skip(),
              sortBy: filters.sortBy,
              order: filters.sortOrder,
            })
          );
        }

        patchState(store, {
          products: response.products,
          total: response.total,
          loading: false,
        });
      } catch (err) {
        patchState(store, {
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to load products',
        });
      }
    },

    async loadCategories() {
      try {
        const categories = await firstValueFrom(productsApi.getCategories());
        patchState(store, { categories });
      } catch {
        // Non-critical, silently fail
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
