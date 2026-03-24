# StockPilot - Angular State Management Workshop

## 5-Hour Hands-On Workshop (No Slides, All Code)

A progressive Angular project that teaches state management from raw signals to production-grade architecture. Developers fork this repo and explore every pattern.

## Tech Stack
- Angular 19+ (standalone, signals, new control flow)
- NgRx SignalStore + Entities + RxJS Interop
- Angular Material
- DummyJSON API (https://dummyjson.com)

## How to Use with Claude Code

Each section has a detailed specification in `docs/sections/`. Use the custom command:

```bash
# Implement a specific section
/imp-section 01
/imp-section 02
# etc.

# List all sections
/imp-section
```

The command reads the section's MD file and implements everything described in it.

## Sections Overview

| # | Section | Duration | Key Feature Built | State Concepts |
|---|---------|----------|-------------------|----------------|
| 01 | The Problem | 20 min | App shell + bad-pattern demo | Why state management, 5 state layers |
| 02 | Signals Foundation | 30 min | Theme switcher + playground | signal, computed, effect, linkedSignal, untracked |
| 03 | Component State | 30 min | Products catalog | resource(), rxResource(), toSignal(), component-level state |
| 04 | SignalStore Core | 30 min | Inventory list + filters | signalStore, withState, withComputed, withMethods, patchState |
| 05 | Entities & CRUD | 30 min | Inventory CRUD | withEntities, add/update/remove, normalization |
| 06 | Async & Side Effects | 35 min | Orders kanban board | rxMethod, tapResponse, switchMap/concatMap/exhaustMap, optimistic updates |
| 07 | Custom Features | 30 min | Order builder wizard | signalStoreFeature, withLoading, withPagination, withUndoRedo, withLocalStorage |
| 08 | Global State | 30 min | Auth + notifications | Global stores, interceptors, guards, session persistence |
| 09 | Architecture | 35 min | Dashboard + activity log | Cross-store reads, mediator pattern, coordination, lazy scoping |
| 10 | Migration & Patterns | 30 min | Legacy comparison + decision tree | BehaviorSubject migration, anti-patterns, decision framework |

## Build Order

Sections MUST be implemented in order (01 through 10). Each builds on the previous.

## API Endpoints Used

All data comes from https://dummyjson.com (no mock services):

- **Auth**: POST /auth/login, GET /auth/me, POST /auth/refresh
- **Products**: GET/POST/PUT/DELETE /products, /products/search, /products/categories
- **Carts** (as Orders): GET/PUT/DELETE /carts, POST /carts/add
- **Todos**: GET /todos
- **Users**: GET /users

## Test Credentials

```
username: emilys
password: emilyspass
```

## Final Project Structure

```
src/app/
  core/               # Global stores + infrastructure
    auth/             # AuthStore, interceptor, guard
    notifications/    # NotificationsStore
    theme/            # ThemeStore (with localStorage)
    activity-log/     # ActivityLogStore
    coordination/     # StoreCoordinator (mediator)
    layout/           # Shell, header, sidebar

  shared/             # Reusable across features
    store-features/   # withLoading, withPagination, withUndoRedo, withLocalStorage
    models/           # TypeScript interfaces
    services/         # ApiService (HttpClient wrapper)
    ui/               # Shared components

  features/           # Lazy-loaded feature modules
    home/             # Section 1 bad-pattern demo
    products/         # Section 3 component-level state
    inventory/        # Sections 4-5 SignalStore + entities
    orders/           # Section 6 rxMethod + kanban
    order-builder/    # Section 7 composed features
    dashboard/        # Section 9 cross-store aggregation
    login/            # Section 8 auth
    legacy/           # Section 10 migration demos
```
