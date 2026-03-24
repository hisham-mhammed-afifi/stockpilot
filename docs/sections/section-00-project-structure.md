# Section 00: Project Structure & Conventions

This is NOT an implementation section. It is a reference for all other sections.

## Target Folder Structure (Final State After All 10 Sections)

```
src/app/
  core/
    auth/
      auth.store.ts                    # Section 8
      auth.interceptor.ts              # Section 8
      auth.guard.ts                    # Section 8
      auth-api.service.ts              # Section 8
      auth.models.ts                   # Section 8
    notifications/
      notifications.store.ts           # Section 8
      notifications.models.ts          # Section 8
    theme/
      theme.store.ts                   # Section 2
    layout/
      shell.component.ts               # Section 1
      sidebar.component.ts             # Section 1
      header.component.ts              # Section 1
    activity-log/
      activity-log.store.ts            # Section 9
    coordination/
      store-coordinator.service.ts     # Section 9

  shared/
    store-features/
      with-loading.ts                  # Section 7
      with-pagination.ts               # Section 7
      with-undo-redo.ts                # Section 7
      with-local-storage.ts            # Section 7
    models/
      api-response.model.ts            # Section 1
      product.model.ts                 # Section 1
      cart.model.ts                    # Section 6
      user.model.ts                    # Section 1
      todo.model.ts                    # Section 6
    services/
      api.service.ts                   # Section 1 (base HttpClient wrapper)
    ui/
      confirm-dialog/                  # Section 5
      empty-state/                     # Section 3

  features/
    home/
      home.component.ts                # Section 1
      home.routes.ts                   # Section 1
    products/
      products.component.ts            # Section 3
      product-detail.component.ts      # Section 3
      products.routes.ts               # Section 3
    inventory/
      store/
        inventory.store.ts             # Section 4, enhanced in 5, 7
      components/
        inventory-list.component.ts    # Section 4
        inventory-form.component.ts    # Section 5
      inventory.routes.ts              # Section 4
    orders/
      store/
        orders.store.ts                # Section 6
      components/
        orders-kanban.component.ts     # Section 6
        order-card.component.ts        # Section 6
      orders.routes.ts                 # Section 6
    order-builder/
      store/
        order-builder.store.ts         # Section 7
      components/
        order-builder.component.ts     # Section 7
        step-products.component.ts     # Section 7
        step-review.component.ts       # Section 7
      order-builder.routes.ts          # Section 7
    dashboard/
      store/
        dashboard.store.ts             # Section 9
      dashboard.component.ts           # Section 9
      dashboard.routes.ts              # Section 9
    legacy/
      product-legacy.service.ts        # Section 10
      product-legacy.component.ts      # Section 10
      legacy.routes.ts                 # Section 10

  app.component.ts
  app.config.ts
  app.routes.ts
```

## API Base URL

```
https://dummyjson.com
```

## Key API Endpoints Used

| Endpoint | Method | Used In |
|----------|--------|---------|
| `/auth/login` | POST | Section 8 |
| `/auth/me` | GET | Section 8 |
| `/auth/refresh` | POST | Section 8 |
| `/products` | GET | Sections 3, 4, 5 |
| `/products/:id` | GET | Section 3 |
| `/products/search?q=` | GET | Sections 3, 4 |
| `/products/categories` | GET | Sections 3, 4 |
| `/products/category/:name` | GET | Section 4 |
| `/products?limit=N&skip=N&sortBy=X&order=Y` | GET | Sections 3, 4, 7 |
| `/products/add` | POST | Section 5 |
| `/products/:id` | PUT | Section 5 |
| `/products/:id` | DELETE | Section 5 |
| `/carts` | GET | Section 6 |
| `/carts/user/:id` | GET | Section 6 |
| `/carts/add` | POST | Section 7 |
| `/todos` | GET | Section 9 |
| `/users` | GET | Section 9 |

## Shared Conventions

### TypeScript Strict Mode
All code uses strict mode. No `any` types unless absolutely necessary.

### Component Convention
```typescript
@Component({
  selector: 'app-feature-name',
  standalone: true,
  imports: [/* Material + shared */],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `...`,
  styles: `...`
})
```

### Environment Config
```typescript
// src/environments/environment.ts
export const environment = {
  apiUrl: 'https://dummyjson.com',
};
```

### Auth Credentials for Testing
```
username: 'emilys'
password: 'emilyspass'
```

### Teaching Comment Convention
Every state management concept must have a `// CONCEPT:` comment above it.
