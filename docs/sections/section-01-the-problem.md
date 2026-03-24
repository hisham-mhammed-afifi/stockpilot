# Section 01: The Problem - Why State Management Matters

## Duration: ~20 minutes

## CONCEPTS TAUGHT
- What is "state" in a frontend application
- The 5 layers of state: UI, Component, Feature, Global, Server
- Pain points without state management: prop drilling, event bubbling, stale data, duplicated API calls
- Mental model for classifying state

## PREREQUISITES
- Fresh Angular project with Angular Material and NgRx signals installed
- No prior sections needed

## API ENDPOINTS USED
- `GET https://dummyjson.com/products?limit=5` (for demo)

## DELIVERABLES

### Files to Create

1. **`src/environments/environment.ts`**
   ```typescript
   export const environment = {
     apiUrl: 'https://dummyjson.com',
   };
   ```

2. **`src/app/shared/models/api-response.model.ts`**
   Generic paginated response type from dummyjson:
   ```typescript
   export interface ApiResponse<T> {
     total: number;
     skip: number;
     limit: number;
     [key: string]: T[] | number; // products, carts, users, etc.
   }
   ```

3. **`src/app/shared/models/product.model.ts`**
   Product interface matching dummyjson product shape:
   ```typescript
   export interface Product {
     id: number;
     title: string;
     description: string;
     category: string;
     price: number;
     discountPercentage: number;
     rating: number;
     stock: number;
     tags: string[];
     brand: string;
     sku: string;
     weight: number;
     dimensions: { width: number; height: number; depth: number };
     warrantyInformation: string;
     shippingInformation: string;
     availabilityStatus: string;
     reviews: ProductReview[];
     returnPolicy: string;
     minimumOrderQuantity: number;
     meta: { createdAt: string; updatedAt: string; barcode: string; qrCode: string };
     thumbnail: string;
     images: string[];
   }

   export interface ProductReview {
     rating: number;
     comment: string;
     date: string;
     reviewerName: string;
     reviewerEmail: string;
   }

   export interface ProductsResponse {
     products: Product[];
     total: number;
     skip: number;
     limit: number;
   }
   ```

4. **`src/app/shared/models/user.model.ts`**
   ```typescript
   export interface User {
     id: number;
     username: string;
     email: string;
     firstName: string;
     lastName: string;
     gender: string;
     image: string;
     accessToken?: string;
     refreshToken?: string;
   }
   ```

5. **`src/app/shared/models/cart.model.ts`**
   ```typescript
   export interface CartProduct {
     id: number;
     title: string;
     price: number;
     quantity: number;
     total: number;
     discountPercentage: number;
     discountedTotal: number;
     thumbnail: string;
   }

   export interface Cart {
     id: number;
     products: CartProduct[];
     total: number;
     discountedTotal: number;
     userId: number;
     totalProducts: number;
     totalQuantity: number;
   }

   export interface CartsResponse {
     carts: Cart[];
     total: number;
     skip: number;
     limit: number;
   }
   ```

6. **`src/app/shared/models/todo.model.ts`**
   ```typescript
   export interface Todo {
     id: number;
     todo: string;
     completed: boolean;
     userId: number;
   }

   export interface TodosResponse {
     todos: Todo[];
     total: number;
     skip: number;
     limit: number;
   }
   ```

7. **`src/app/shared/services/api.service.ts`**
   A thin HttpClient wrapper that sets the base URL:
   ```typescript
   @Injectable({ providedIn: 'root' })
   export class ApiService {
     private http = inject(HttpClient);
     private baseUrl = environment.apiUrl;

     get<T>(path: string, params?: Record<string, string | number>): Observable<T> {
       return this.http.get<T>(`${this.baseUrl}${path}`, {
         params: params as any,
       });
     }

     post<T>(path: string, body: unknown): Observable<T> {
       return this.http.post<T>(`${this.baseUrl}${path}`, body);
     }

     put<T>(path: string, body: unknown): Observable<T> {
       return this.http.put<T>(`${this.baseUrl}${path}`, body);
     }

     delete<T>(path: string): Observable<T> {
       return this.http.delete<T>(`${this.baseUrl}${path}`);
     }
   }
   ```

8. **`src/app/core/layout/shell.component.ts`**
   App shell with Material sidenav layout:
   - `mat-toolbar` at top with app name "StockPilot" and a theme toggle placeholder
   - `mat-sidenav-container` with a `mat-sidenav` (navigation links) and `mat-sidenav-content` (router-outlet)
   - Sidebar navigation links (use `mat-nav-list`):
     - Home (`/`)
     - Products (`/products`) - Section 3
     - Inventory (`/inventory`) - Section 4
     - Orders (`/orders`) - Section 6
     - Order Builder (`/order-builder`) - Section 7
     - Dashboard (`/dashboard`) - Section 9
   - All links except Home should show as "Coming Soon" disabled state for now
   - Use `routerLink` and `routerLinkActive`

9. **`src/app/features/home/home.component.ts`**
   The "problem demo" page. This page intentionally shows BAD patterns:

   **Build a 4-level component hierarchy demonstrating prop drilling:**
   ```
   home.component
     -> product-list-bad.component (fetches products via HttpClient directly)
       -> product-item-bad.component (receives product via @Input, emits select via @Output)
         -> product-actions-bad.component (receives productId via @Input, emits addToCart via @Output that bubbles up 3 levels)
   ```

   The page should have TWO sections side by side (use mat-card):

   **Left card: "Without State Management"**
   - The bad component hierarchy above
   - Show in the UI: "This component drills props 3 levels deep"
   - Show a counter of how many HTTP calls were made (increment on each ngOnInit fetch)
   - When user clicks "Add to Cart" on a product, the event bubbles through 3 `@Output()` chains

   **Right card: "The State Management Approach" (placeholder)**
   - Just show a mat-card with text: "After this workshop, you'll build this the right way"
   - List the 5 state layers with `mat-list`:
     - UI State: "Is this dropdown open?" (signal in component)
     - Component State: "Current search + filters" (signals + computed)
     - Feature State: "All inventory items" (SignalStore)
     - Global State: "Who is logged in?" (Global SignalStore)
     - Server State: "Cached API responses" (resource / rxMethod)

   Add `// CONCEPT: Anti-pattern` comments on every bad pattern in the left side.

10. **`src/app/features/home/home.routes.ts`**
    ```typescript
    export const homeRoutes: Routes = [
      { path: '', component: HomeComponent }
    ];
    ```

11. **`src/app/app.routes.ts`**
    Set up lazy-loaded routes:
    ```typescript
    export const routes: Routes = [
      { path: '', loadChildren: () => import('./features/home/home.routes').then(m => m.homeRoutes) },
      { path: 'products', loadChildren: () => import('./features/products/products.routes').then(m => m.productsRoutes) },
      { path: 'inventory', loadChildren: () => import('./features/inventory/inventory.routes').then(m => m.inventoryRoutes) },
      { path: 'orders', loadChildren: () => import('./features/orders/orders.routes').then(m => m.ordersRoutes) },
      { path: 'order-builder', loadChildren: () => import('./features/order-builder/order-builder.routes').then(m => m.orderBuilderRoutes) },
      { path: 'dashboard', loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.dashboardRoutes) },
      { path: '**', redirectTo: '' },
    ];
    ```
    Create placeholder route files for each feature that just export an empty Routes array with a simple placeholder component saying "Section N - Coming Soon".

### Files to Modify

1. **`src/app/app.component.ts`**
   - Replace default content with `<app-shell />`
   - Import ShellComponent

2. **`src/app/app.config.ts`**
   - Ensure `provideHttpClient()`, `provideRouter(routes)`, `provideAnimationsAsync()` are configured

## IMPLEMENTATION SPEC

### Step 1: Environment & Models
Create the environment file, all shared model interfaces, and the ApiService.

### Step 2: App Shell
Build the shell layout with Material sidenav. The sidebar should be responsive:
- On desktop (>960px): sidenav in `side` mode, opened
- On mobile: sidenav in `over` mode, closed by default, toggle via hamburger icon in toolbar

### Step 3: Routing Setup
Configure all lazy routes. Create placeholder components for sections 3-10 that show "Coming Soon".

### Step 4: Home Page - The Problem Demo
Build the intentionally-bad component hierarchy. This is the most important part of this section.

The bad components should:
- Fetch products directly in `product-list-bad.component` via `inject(HttpClient)` in `ngOnInit` (no service)
- Pass data down through 3 levels of `@Input()`
- Bubble events up through 3 levels of `@Output()`
- Show a visible HTTP call counter that increments each time the list re-fetches
- Add a button "Reload" that triggers a re-fetch (showing duplicate calls)

### Step 5: State Classification Panel
Build the right-side card showing the 5 state layers with descriptions and which tool handles each.

## TEACHING NOTES

Add these comments in the code:

```typescript
// CONCEPT: Anti-pattern - Fetching data directly in a component via HttpClient.
// This creates tight coupling and makes it impossible to share data between components.

// CONCEPT: Anti-pattern - Prop drilling. Passing data through 3+ levels of @Input().
// When the intermediate components don't use the data, this is a code smell.

// CONCEPT: Anti-pattern - Event bubbling. Chaining @Output() through 3+ levels.
// This creates fragile chains where any intermediate component must forward events.

// CONCEPT: Anti-pattern - Duplicate HTTP calls. Without shared state, each component
// fetches its own copy. 5 components showing the same product = 5 HTTP calls.

// CONCEPT: State Classification - Before choosing a tool, classify your state into:
// UI (component-local), Component (shared with children), Feature (lazy module scope),
// Global (app-wide), Server (cached remote data). Keep state as local as possible.
```

## VERIFICATION
After implementation:
1. `ng serve` should compile without errors
2. Shell layout renders with sidebar and toolbar
3. Home page shows the bad-pattern demo with working prop drilling
4. Navigation links appear in sidebar (most disabled/placeholder)
5. HTTP call counter increments on reload
