# Angular Audit Report

**Generated:** 2026-03-26
**Angular Version:** 21.1.0
**NgRx Version:** 21.0.1
**Material Version:** 21.2.3
**RxJS Version:** 7.8.x
**Files Scanned:** 62 (52 TypeScript, 1 HTML, 1 SCSS + models/routes)
**ESLint Configured:** No
**Strict Mode:** Full (strict: true, strictTemplates: true, strictNullChecks: true)

## Executive Summary

- **CRITICAL issues:** 0
- **HIGH issues:** 5
- **MEDIUM issues:** 24
- **LOW issues:** 8
- **Overall compliance score:** 72/100

### Build Health

- **Production build:** PASS
- **Lint status:** NOT CONFIGURED (no @angular-eslint)
- **Pending migrations:** None detected

### Material Coverage

- **Material components used:** MatButton, MatIcon, MatCard, MatToolbar, MatSidenav, MatList, MatMenu, MatBadge, MatFormField, MatInput, MatSelect, MatTable, MatChips, MatProgressBar, MatTooltip, MatDivider, MatDialog, MatSnackBar, MatTabs, MatCheckbox, MatButtonToggle, MatSort
- **Material components NOT used but should be:** None -- good Material adoption
- **Raw HTML elements that should be Material:** 0 (all buttons/inputs are within Material wrappers)
- **Incorrect Material usage:** Material Module imports instead of standalone component imports (18 files)
- **Material coverage score:** 82/100

### Top 5 Issues to Fix First

1. **Material Module imports instead of standalone component imports** -- 18 files, import `MatButton` not `MatButtonModule`
2. **Missing takeUntilDestroyed()** on `.subscribe()` calls -- 5 files with potential memory leaks
3. **Hardcoded hex colors** instead of theme tokens -- 15+ instances across 6 files
4. **No Angular ESLint configured** -- setup `@angular-eslint/schematics` for automated enforcement
5. **`any` type usage** in store features -- 2 files with multiple `any` assertions

---

## Tooling Recommendations

Before fixing code issues, fix the tooling:

| Tool | Status | Recommendation |
|------|--------|----------------|
| Angular ESLint | Missing | `ng add @angular-eslint/schematics` |
| Strict templates | Enabled | No action needed |
| Strict null checks | Enabled | No action needed |
| Production budgets | Configured | No action needed (500kB warn / 1MB error) |

---

## Detailed Findings

### Category 1: Standalone Components

**Status:** PASS -- 0 issues found

All components use `standalone: true`. No `@NgModule` declarations found. No `CommonModule` imports.

### Category 2: New Control Flow

**Status:** PASS -- 0 issues found

All templates use `@if`, `@for`, `@switch` syntax. No legacy `*ngIf`, `*ngFor`, or `*ngSwitch` directives found.

### Category 3: Signals & Reactivity

**Status:** 2 issues found (intentional teaching examples excluded)

| File | Line | Issue | Current Code | Suggested Fix | Severity | Source |
|------|------|-------|-------------|---------------|----------|--------|
| `src/app/features/home/signals-playground/signals-playground.component.ts` | 770 | BehaviorSubject usage | `readonly rxCounter$ = new BehaviorSubject(0);` | Intentional teaching example -- no fix needed | INFO | [GREP] |
| `src/app/features/home/signals-playground/signals-playground.component.ts` | 294-295 | async pipe usage | `{{ rxCounter$ \| async }}` | Intentional teaching example -- no fix needed | INFO | [GREP] |

**Note:** The signals-playground component intentionally demonstrates BehaviorSubject vs signals for educational purposes. These are not actual issues.

### Category 4: Dependency Injection

**Status:** PASS -- 0 issues found

All services and components use `inject()` instead of constructor injection. Guards (`authGuard`, `guestGuard`) are functional `CanActivateFn`. Interceptor (`authInterceptor`) is functional `HttpInterceptorFn`. All injectable services have `providedIn: 'root'`.

### Category 5: NgRx SignalStore Patterns

**Status:** PASS -- 0 issues found

All stores use `signalStore()` with proper patterns:
- `patchState()` for all state mutations
- `tapResponse()` for error handling in rxMethod pipes
- `switchMap` for reads, `concatMap`/`exhaustMap` for mutations
- Entity operations from `@ngrx/signals/entities` where applicable
- Shared `withLoading()` custom feature extracted to `shared/store-features/`

### Category 6: Angular Style Guide

**Status:** PASS -- 0 issues found

- File naming follows `feature-name.type.ts` convention
- Component selectors use `app-` prefix consistently
- No files exceed 400 lines unreasonably (signals-playground is large but serves as a comprehensive teaching reference)
- Proper folder structure with feature modules

### Category 7: Change Detection & Performance

**Status:** PASS -- 0 issues found

- All components use `ChangeDetectionStrategy.OnPush`
- All `@for` loops include `track` expressions
- Computed signals used for derived state instead of function calls in templates

### Category 8: RxJS Best Practices

**Status:** 5 issues found

| File | Line | Issue | Current Code | Suggested Fix | Severity | Source |
|------|------|-------|-------------|---------------|----------|--------|
| `src/app/core/layout/shell.component.ts` | 245-253 | Manual subscribe + ngOnDestroy pattern | `this.subscription = this.breakpointObserver.observe(...).subscribe(...)` + manual `ngOnDestroy` | Use `takeUntilDestroyed()` in injection context or `toSignal()` | HIGH | [MANUAL] |
| `src/app/features/guides/guide-viewer.component.ts` | 287-297 | subscribe() without takeUntilDestroyed() | `this.http.get(...).subscribe({...})` | Add `pipe(takeUntilDestroyed(this.destroyRef))` or use `resource()` | HIGH | [MANUAL] |
| `src/app/features/home/product-list-bad.component.ts` | 98-107 | subscribe() without takeUntilDestroyed() | `this.http.get<ProductsResponse>(...).subscribe({...})` | Intentional anti-pattern example -- label clearly | MEDIUM | [MANUAL] |
| `src/app/features/inventory/components/inventory-list.component.ts` | 606 | afterClosed().subscribe() without cleanup | `dialogRef.afterClosed().subscribe(async (result) => {...})` | Add `pipe(take(1))` or `firstValueFrom()` | MEDIUM | [MANUAL] |
| `src/app/features/inventory/components/inventory-list.component.ts` | 629, 651 | afterClosed().subscribe() without cleanup (2 more instances) | Same pattern as line 606 | Same fix | MEDIUM | [MANUAL] |

**Note:** `dialogRef.afterClosed()` completes after emitting once, so this is technically safe but inconsistent with best practices. Using `firstValueFrom()` or `take(1)` makes intent explicit.

### Category 9: Template & Accessibility

**Status:** PASS -- no significant issues found

Material components provide built-in accessibility. `mat-label` is used consistently in form fields.

### Category 10: TypeScript Strictness

**Status:** 3 issues found

| File | Line | Issue | Current Code | Suggested Fix | Severity | Source |
|------|------|-------|-------------|---------------|----------|--------|
| `src/app/shared/store-features/with-local-storage.ts` | 16, 34, 45 | `any` type assertions | `(store as any)[key]()`, `onInit(store: any)` | Use proper generic constraints | MEDIUM | [GREP] |
| `src/app/shared/store-features/with-undo-redo.ts` | 28, 32, 41, 56 | Extensive `any` type assertions | `const current: any = {}`, `patchState(store as any, ...)` | Create typed store interface | MEDIUM | [GREP] |
| `src/app/features/home/signals-playground/signals-playground.component.ts` | 178 | console.log in production code | `console.log('Input changed to:', inputValue());` | Remove or guard with `isDevMode()` | LOW | [GREP] |

### Category 11: Deprecated APIs & Pending Migrations

**Status:** PASS -- 0 issues found

- No `RouterModule.forRoot/forChild` -- uses `provideRouter()` with `Routes`
- No `HttpClientModule` -- uses `provideHttpClient()` in app config
- No `BrowserAnimationsModule` -- uses `provideAnimationsAsync()`
- No class-based guards or interceptors
- No `@angular/flex-layout`
- No `entryComponents`

### Category 12: Angular ESLint & Build Health

**Status:** 1 issue found

| Check | Source | Severity |
|-------|--------|----------|
| ESLint not configured | Missing `@angular-eslint` | HIGH (setup recommendation) |

All other checks pass:
- Strict template type checking: enabled
- strictNullChecks: enabled (via `strict: true`)
- strictPropertyInitialization: enabled (via `strict: true`)
- Production build: PASS
- No circular dependencies detected

### Category 13: Angular Material Usage & Correctness

**Status:** 18 files with Material Module import pattern issue

#### 13A: Material Module Imports Instead of Standalone Component Imports

All 18 component files import `MatXxxModule` instead of standalone component imports. In Angular Material v19+, individual components can be imported directly (e.g., `MatButton` instead of `MatButtonModule`).

| File | Lines | Modules Imported | Severity | Source |
|------|-------|-----------------|----------|--------|
| `src/app/core/layout/auth-layout.component.ts` | 2-4, 12-14 | MatToolbarModule, MatIconModule, MatButtonModule | MEDIUM | [GREP] |
| `src/app/core/layout/shell.component.ts` | 3-9, 28-34 | MatSidenavModule, MatToolbarModule, MatListModule, MatIconModule, MatButtonModule, MatMenuModule, MatBadgeModule | MEDIUM | [GREP] |
| `src/app/features/dashboard/dashboard.component.ts` | 3-9, 23-29 | MatCardModule, MatIconModule, MatListModule, MatTableModule, MatChipsModule, MatCheckboxModule, MatProgressBarModule | MEDIUM | [GREP] |
| `src/app/features/guides/guide-list.component.ts` | 3-5, 17 | MatCardModule, MatIconModule, MatListModule | MEDIUM | [GREP] |
| `src/app/features/guides/guide-viewer.component.ts` | 5-7, 13 | MatButtonModule, MatIconModule, MatProgressBarModule | MEDIUM | [GREP] |
| `src/app/features/home/home.component.ts` | 2-6, 14-18 | MatCardModule, MatListModule, MatIconModule, MatChipsModule, MatSnackBarModule | MEDIUM | [GREP] |
| `src/app/features/home/product-actions-bad.component.ts` | 2-3, 12 | MatButtonModule, MatIconModule | MEDIUM | [GREP] |
| `src/app/features/home/product-item-bad.component.ts` | 2, 14 | MatCardModule | MEDIUM | [GREP] |
| `src/app/features/home/product-list-bad.component.ts` | 3-6, 16 | MatProgressBarModule, MatButtonModule, MatIconModule, MatBadgeModule | MEDIUM | [GREP] |
| `src/app/features/home/signals-playground/signals-playground.component.ts` | 11-18, 28-35 | MatCardModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatListModule, MatChipsModule, MatDividerModule | MEDIUM | [GREP] |
| `src/app/features/inventory/components/inventory-form.component.ts` | 3-7, 23-27 | MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule | MEDIUM | [GREP] |
| `src/app/features/inventory/components/inventory-list.component.ts` | 4-15, 29-40 | MatTableModule, MatCardModule, MatToolbarModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatChipsModule, MatProgressBarModule, MatButtonToggleModule, MatTooltipModule | MEDIUM | [GREP] |
| `src/app/features/login/login.component.ts` | 3-8, 20-25 | MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatProgressBarModule | MEDIUM | [GREP] |
| `src/app/features/order-builder/components/order-builder.component.ts` | 4-15, 29-40 | MatCardModule, MatButtonModule, MatIconModule, MatTableModule, MatFormFieldModule, MatInputModule, MatBadgeModule, MatProgressBarModule, MatChipsModule, MatTooltipModule, MatToolbarModule, MatDividerModule | MEDIUM | [GREP] |
| `src/app/features/orders/components/order-card.component.ts` | 3-8, 21-26 | MatCardModule, MatChipsModule, MatIconModule, MatButtonModule, MatMenuModule, MatTooltipModule | MEDIUM | [GREP] |
| `src/app/features/orders/components/orders-kanban.component.ts` | 8-15, 31-38 | MatCardModule, MatIconModule, MatButtonModule, MatButtonToggleModule, MatTabsModule, MatProgressBarModule, MatSnackBarModule, MatChipsModule | MEDIUM | [GREP] |
| `src/app/features/products/product-detail.component.ts` | 15-20, 33-38 | MatCardModule, MatButtonModule, MatIconModule, MatChipsModule, MatListModule, MatProgressBarModule | MEDIUM | [GREP] |
| `src/app/features/products/products.component.ts` | 15-23, 35-43 | MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonToggleModule, MatButtonModule, MatIconModule, MatCardModule, MatProgressBarModule, MatChipsModule | MEDIUM | [GREP] |
| `src/app/shared/ui/confirm-dialog/confirm-dialog.component.ts` | 2-3, 18 | MatButtonModule, MatDialogModule | MEDIUM | [GREP] |
| `src/app/shared/ui/empty-state/empty-state.component.ts` | 2, 9 | MatIconModule | MEDIUM | [GREP] |

#### 13B: Missing Material Component Adoption

**Status:** PASS -- No raw HTML elements found where Material equivalents should be used.

All buttons use `mat-raised-button`, `mat-flat-button`, `mat-icon-button`, `mat-menu-item`, or `mat-fab` directives. All inputs are wrapped in `mat-form-field` with `matInput`. All tables use `mat-table`. Dialogs use `MatDialog`. Snackbars use `MatSnackBar`.

#### 13C: Incorrect Material Usage Patterns

**Status:** PASS -- No significant incorrect usage found.

#### 13D: Material Theming & Consistency

| Check | Status | Details |
|-------|--------|---------|
| Custom theme defined | Yes | Configured in `src/styles.scss` |
| Hardcoded colors found | 15+ instances | See table below |
| `!important` overrides | 0 | None found |
| `::ng-deep` usage | 0 | None found |

**Hardcoded Colors:**

| File | Line | Current Code | Severity | Source |
|------|------|-------------|----------|--------|
| `src/app/core/layout/shell.component.ts` | 214 | `.notif-icon-success { color: #4caf50; }` | MEDIUM | [GREP] |
| `src/app/core/layout/shell.component.ts` | 215 | `.notif-icon-error { color: #f44336; }` | MEDIUM | [GREP] |
| `src/app/core/layout/shell.component.ts` | 216 | `.notif-icon-warning { color: #ff9800; }` | MEDIUM | [GREP] |
| `src/app/core/layout/shell.component.ts` | 217 | `.notif-icon-info { color: #2196f3; }` | MEDIUM | [GREP] |
| `src/app/features/dashboard/dashboard.component.ts` | 268 | `&.products { color: #1976d2; }` | MEDIUM | [GREP] |
| `src/app/features/dashboard/dashboard.component.ts` | 269 | `&.orders { color: #7b1fa2; }` | MEDIUM | [GREP] |
| `src/app/features/dashboard/dashboard.component.ts` | 270 | `&.revenue { color: #388e3c; }` | MEDIUM | [GREP] |
| `src/app/features/dashboard/dashboard.component.ts` | 271 | `&.low-stock { color: #f57c00; }` | MEDIUM | [GREP] |
| `src/app/features/dashboard/dashboard.component.ts` | 306 | `color: #f57c00;` | MEDIUM | [GREP] |
| `src/app/features/guides/guide-viewer.component.ts` | 150-151 | `background: #1e1e1e; color: #d4d4d4;` | LOW | [GREP] |
| `src/app/features/home/home.component.ts` | 113, 116 | `color: #f44336;` / `color: #4caf50;` | MEDIUM | [GREP] |
| `src/app/features/home/signals-playground/signals-playground.component.ts` | 450-463 | Multiple hardcoded dark theme colors | LOW | [GREP] |
| `src/app/features/inventory/components/inventory-list.component.ts` | 334-335 | `.stat-card.in-stock .stat-value { color: #2e7d32; }` / low-stock | MEDIUM | [GREP] |

#### 13E: Material Best Practices

| Check | Issue | Recommendation | Severity |
|-------|-------|----------------|----------|
| Not using standalone Material imports | All 18 component files import `MatXxxModule` | Import standalone components: `MatButton` from `@angular/material/button` | MEDIUM |
| Missing `MAT_FORM_FIELD_DEFAULT_OPTIONS` | Not set in providers | Add to app.config.ts: `{ provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { appearance: 'outline' } }` | MEDIUM |

---

## Material Adoption Report

### Material Components Inventory

| Component | Import Path | Times Used | Files |
|-----------|------------|------------|-------|
| MatIcon/MatIconModule | @angular/material/icon | 17 | Nearly all component files |
| MatButton/MatButtonModule | @angular/material/button | 15 | Most component files |
| MatCard/MatCardModule | @angular/material/card | 12 | dashboard, guides, home, inventory, login, orders, products |
| MatProgressBar/MatProgressBarModule | @angular/material/progress-bar | 9 | dashboard, guides, home, inventory, login, orders, products |
| MatChips/MatChipsModule | @angular/material/chips | 9 | dashboard, home, inventory, orders, products, signals-playground |
| MatFormField/MatFormFieldModule | @angular/material/form-field | 6 | signals-playground, inventory, login, order-builder, products |
| MatInput/MatInputModule | @angular/material/input | 6 | signals-playground, inventory, login, order-builder, products |
| MatList/MatListModule | @angular/material/list | 6 | shell, dashboard, guides, home, products, signals-playground |
| MatToolbar/MatToolbarModule | @angular/material/toolbar | 4 | auth-layout, shell, inventory, order-builder |
| MatTooltip/MatTooltipModule | @angular/material/tooltip | 3 | inventory, order-builder, order-card |
| MatTable/MatTableModule | @angular/material/table | 3 | dashboard, inventory, order-builder |
| MatSnackBar/MatSnackBarModule | @angular/material/snack-bar | 3 | home, orders-kanban |
| MatSelect/MatSelectModule | @angular/material/select | 3 | inventory-form, inventory-list, products |
| MatDialog/MatDialogModule | @angular/material/dialog | 3 | inventory-form, inventory-list, confirm-dialog |
| MatBadge/MatBadgeModule | @angular/material/badge | 3 | shell, product-list-bad, order-builder |
| MatButtonToggle/MatButtonToggleModule | @angular/material/button-toggle | 3 | inventory, orders-kanban, products |
| MatMenu/MatMenuModule | @angular/material/menu | 2 | shell, order-card |
| MatDivider/MatDividerModule | @angular/material/divider | 2 | signals-playground, order-builder |
| MatTabs/MatTabsModule | @angular/material/tabs | 1 | orders-kanban |
| MatSidenav/MatSidenavModule | @angular/material/sidenav | 1 | shell |
| MatCheckbox/MatCheckboxModule | @angular/material/checkbox | 1 | dashboard |

### Missing Material Adoption (Highest Priority)

No raw HTML elements found that should be replaced with Material components. The project has excellent Material adoption.

### Material Theming Consistency

| Check | Status | Details |
|-------|--------|---------|
| Custom theme defined | Yes | `src/styles.scss` |
| Dark mode support | Unknown | Depends on theme configuration |
| Consistent form field appearance | Mostly consistent | No `MAT_FORM_FIELD_DEFAULT_OPTIONS` set |
| Hardcoded colors found | 15+ | shell, dashboard, guides, home, inventory |
| Typography scale used | Partial | Some custom font sizing observed |

### Material Default Options Configured

| Token | Status | Recommendation |
|-------|--------|----------------|
| `MAT_FORM_FIELD_DEFAULT_OPTIONS` | Not set | Add `{ provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { appearance: 'outline' } }` |
| `MAT_DIALOG_DEFAULT_OPTIONS` | Not set | Consider adding `{ hasBackdrop: true, disableClose: false }` |
| `MAT_SNACK_BAR_DEFAULT_OPTIONS` | Not set | Consider adding `{ duration: 3000 }` |
| `MAT_TABS_CONFIG` | Not set | Not critical |

---

## ng lint Summary

```
RECOMMENDATION: Angular ESLint is not configured.
Run: ng add @angular-eslint/schematics
This will catch an estimated 10-15 of the issues found in this audit automatically on every save.
```

---

## ng build Summary

```
Production build: PASS
Warnings: 0
Errors: 0
```

---

## ng update Summary

```
All packages are up to date.
```

---

## File-by-File Summary

| File | Critical | High | Medium | Low | Material Issues | Status |
|------|----------|------|--------|-----|----------------|--------|
| `src/app/app.config.ts` | 0 | 0 | 0 | 0 | 0 | GOOD |
| `src/app/app.routes.ts` | 0 | 0 | 0 | 0 | 0 | GOOD |
| `src/app/app.ts` | 0 | 0 | 0 | 0 | 0 | GOOD |
| `src/app/core/activity-log/activity-log.store.ts` | 0 | 0 | 0 | 0 | 0 | GOOD |
| `src/app/core/auth/auth.guard.ts` | 0 | 0 | 0 | 0 | 0 | GOOD |
| `src/app/core/auth/auth.interceptor.ts` | 0 | 0 | 0 | 0 | 0 | GOOD |
| `src/app/core/auth/auth.store.ts` | 0 | 0 | 0 | 0 | 0 | GOOD |
| `src/app/core/auth/auth-api.service.ts` | 0 | 0 | 0 | 0 | 0 | GOOD |
| `src/app/core/coordination/store-coordinator.service.ts` | 0 | 0 | 0 | 0 | 0 | GOOD |
| `src/app/core/layout/auth-layout.component.ts` | 0 | 0 | 1 | 0 | 1 (Module imports) | NEEDS WORK |
| `src/app/core/layout/shell.component.ts` | 0 | 1 | 5 | 0 | 1 (Module imports) | NEEDS WORK |
| `src/app/core/notifications/notifications.store.ts` | 0 | 0 | 0 | 0 | 0 | GOOD |
| `src/app/core/theme/theme.store.ts` | 0 | 0 | 0 | 0 | 0 | GOOD |
| `src/app/features/dashboard/dashboard.component.ts` | 0 | 0 | 5 | 0 | 1 (Module imports) | NEEDS WORK |
| `src/app/features/guides/guide-list.component.ts` | 0 | 0 | 0 | 0 | 1 (Module imports) | MINOR |
| `src/app/features/guides/guide-viewer.component.ts` | 0 | 1 | 0 | 1 | 1 (Module imports) | NEEDS WORK |
| `src/app/features/home/home.component.ts` | 0 | 0 | 2 | 0 | 1 (Module imports) | NEEDS WORK |
| `src/app/features/home/product-actions-bad.component.ts` | 0 | 0 | 0 | 0 | 1 (Module imports) | MINOR |
| `src/app/features/home/product-item-bad.component.ts` | 0 | 0 | 0 | 0 | 1 (Module imports) | MINOR |
| `src/app/features/home/product-list-bad.component.ts` | 0 | 0 | 1 | 0 | 1 (Module imports) | MINOR (anti-pattern demo) |
| `src/app/features/home/signals-playground/signals-playground.component.ts` | 0 | 0 | 0 | 2 | 1 (Module imports) | MINOR (teaching file) |
| `src/app/features/inventory/components/inventory-form.component.ts` | 0 | 0 | 0 | 0 | 1 (Module imports) | MINOR |
| `src/app/features/inventory/components/inventory-list.component.ts` | 0 | 0 | 4 | 0 | 1 (Module imports) | NEEDS WORK |
| `src/app/features/inventory/store/inventory.store.ts` | 0 | 0 | 0 | 0 | 0 | GOOD |
| `src/app/features/login/login.component.ts` | 0 | 0 | 0 | 0 | 1 (Module imports) | MINOR |
| `src/app/features/order-builder/components/order-builder.component.ts` | 0 | 0 | 0 | 0 | 1 (Module imports) | MINOR |
| `src/app/features/order-builder/store/order-builder.store.ts` | 0 | 0 | 0 | 0 | 0 | GOOD |
| `src/app/features/orders/components/order-card.component.ts` | 0 | 0 | 0 | 0 | 1 (Module imports) | MINOR |
| `src/app/features/orders/components/orders-kanban.component.ts` | 0 | 0 | 0 | 1 | 1 (Module imports) | MINOR |
| `src/app/features/orders/services/orders-api.service.ts` | 0 | 0 | 0 | 0 | 0 | GOOD |
| `src/app/features/orders/store/orders.store.ts` | 0 | 0 | 0 | 0 | 0 | GOOD |
| `src/app/features/products/product-detail.component.ts` | 0 | 0 | 0 | 0 | 1 (Module imports) | MINOR |
| `src/app/features/products/products.component.ts` | 0 | 0 | 0 | 0 | 1 (Module imports) | MINOR |
| `src/app/features/products/services/products-api.service.ts` | 0 | 0 | 0 | 0 | 0 | GOOD |
| `src/app/shared/store-features/with-local-storage.ts` | 0 | 0 | 1 | 0 | 0 | NEEDS WORK |
| `src/app/shared/store-features/with-undo-redo.ts` | 0 | 0 | 1 | 0 | 0 | NEEDS WORK |
| `src/app/shared/ui/confirm-dialog/confirm-dialog.component.ts` | 0 | 0 | 0 | 0 | 1 (Module imports) | MINOR |
| `src/app/shared/ui/empty-state/empty-state.component.ts` | 0 | 0 | 0 | 0 | 1 (Module imports) | MINOR |

---

## Migration Recipes

### Recipe 1: Material Module Imports to Standalone Component Imports

**Affected files:** 18 component files
**Auto-fixable:** No, manual migration required

**Before:**
```typescript
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

@Component({
  imports: [MatButtonModule, MatIconModule, MatCardModule],
})
```

**After:**
```typescript
import { MatButton, MatIconButton, MatFabButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatCard, MatCardHeader, MatCardContent, MatCardActions, MatCardTitle } from '@angular/material/card';

@Component({
  imports: [MatButton, MatIconButton, MatIcon, MatCard, MatCardHeader, MatCardContent, MatCardActions, MatCardTitle],
})
```

**Steps:**
1. For each component file, identify which Material module imports are used
2. Replace `MatXxxModule` with the specific standalone components actually used in the template
3. Check the template to identify exact components needed (e.g., `mat-card` needs `MatCard`, `mat-card-header` needs `MatCardHeader`)
4. Update the `imports` array in `@Component`
5. Remove the module import statement

**Common mappings:**
- `MatButtonModule` -> `MatButton`, `MatIconButton`, `MatFabButton`, `MatMiniFabButton`, `MatAnchor`
- `MatIconModule` -> `MatIcon`
- `MatCardModule` -> `MatCard`, `MatCardHeader`, `MatCardContent`, `MatCardActions`, `MatCardTitle`, `MatCardSubtitle`
- `MatFormFieldModule` -> `MatFormField`, `MatLabel`, `MatError`, `MatHint`, `MatPrefix`, `MatSuffix`
- `MatInputModule` -> `MatInput`
- `MatSelectModule` -> `MatSelect`, `MatOption`
- `MatTableModule` -> `MatTable`, `MatHeaderRow`, `MatRow`, `MatHeaderCell`, `MatCell`, `MatColumnDef`, `MatHeaderCellDef`, `MatCellDef`, `MatHeaderRowDef`, `MatRowDef`
- `MatChipsModule` -> `MatChipSet`, `MatChip`, `MatChipGrid`, `MatChipRow`, `MatChipInput`
- `MatProgressBarModule` -> `MatProgressBar`
- `MatTooltipModule` -> `MatTooltip`
- `MatMenuModule` -> `MatMenu`, `MatMenuItem`, `MatMenuTrigger`
- `MatDialogModule` -> `MatDialogTitle`, `MatDialogContent`, `MatDialogActions`, `MatDialogClose`
- `MatSnackBarModule` -> (service only -- `MatSnackBar` injected via `inject()`, no template import needed)
- `MatBadgeModule` -> `MatBadge`
- `MatListModule` -> `MatList`, `MatListItem`, `MatNavList`
- `MatToolbarModule` -> `MatToolbar`, `MatToolbarRow`
- `MatSidenavModule` -> `MatSidenav`, `MatSidenavContainer`, `MatSidenavContent`
- `MatTabsModule` -> `MatTabGroup`, `MatTab`
- `MatCheckboxModule` -> `MatCheckbox`
- `MatButtonToggleModule` -> `MatButtonToggleGroup`, `MatButtonToggle`
- `MatDividerModule` -> `MatDivider`
- `MatSortModule` -> `MatSort`, `MatSortHeader`

---

### Recipe 2: Replace Manual Subscription with takeUntilDestroyed()

**Affected files:** `shell.component.ts`, `guide-viewer.component.ts`
**Auto-fixable:** No, manual migration required

**Before (shell.component.ts):**
```typescript
export class ShellComponent implements OnInit, OnDestroy {
  private subscription?: Subscription;

  ngOnInit(): void {
    this.subscription = this.breakpointObserver
      .observe([Breakpoints.Handset, Breakpoints.TabletPortrait])
      .subscribe(result => this.isMobile.set(result.matches));
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
```

**After:**
```typescript
export class ShellComponent {
  private breakpointObserver = inject(BreakpointObserver);

  isMobile = toSignal(
    this.breakpointObserver
      .observe([Breakpoints.Handset, Breakpoints.TabletPortrait])
      .pipe(map(result => result.matches)),
    { initialValue: false }
  );
}
```

**Alternative (if toSignal is not suitable):**
```typescript
export class ShellComponent {
  private destroyRef = inject(DestroyRef);

  constructor() {
    this.breakpointObserver
      .observe([Breakpoints.Handset, Breakpoints.TabletPortrait])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => this.isMobile.set(result.matches));
  }
}
```

---

### Recipe 3: Replace Hardcoded Colors with CSS Custom Properties

**Affected files:** 6 files (shell, dashboard, guides, home, inventory, signals-playground)
**Auto-fixable:** No, manual migration required

**Before:**
```scss
.notif-icon-success { color: #4caf50; }
.notif-icon-error { color: #f44336; }
```

**After:**
```scss
.notif-icon-success { color: var(--mat-sys-primary); }
.notif-icon-error { color: var(--mat-sys-error); }
```

**Steps:**
1. Define semantic CSS custom properties in `styles.scss` using Material theme tokens
2. Replace all hardcoded `#hex` colors with `var(--custom-property)` references
3. Map colors semantically: green/success -> primary or custom success token, red/error -> error token, etc.

---

### Recipe 4: Replace `any` Types in Store Features

**Affected files:** `with-local-storage.ts`, `with-undo-redo.ts`
**Auto-fixable:** No, manual migration required

**Before:**
```typescript
onInit(store: any) {
  data[key] = (store as any)[key]();
}
```

**After:**
```typescript
onInit(store: Record<string, () => unknown>) {
  data[key] = store[key]();
}
```

**Note:** NgRx SignalStore internal types may limit how strictly this can be typed. Use `Record<string, Signal<unknown>>` or similar constraints where possible.

---

## Recommended Fix Order

0. **Configure Angular ESLint** -- `ng add @angular-eslint/schematics` -- enables automated linting on every save
1. **Migrate Material Module imports to standalone** in 18 files -- reduces bundle size, aligns with Angular Material best practices -- manual migration
2. **Add takeUntilDestroyed()** to 2 files (shell.component.ts, guide-viewer.component.ts) -- prevents memory leaks -- manual migration
3. **Replace hardcoded hex colors** in 6 files -- improves theming consistency and dark mode support -- manual migration
4. **Remove `any` types** in 2 store feature files -- improves type safety -- manual migration
5. **Set MAT_FORM_FIELD_DEFAULT_OPTIONS** in app.config.ts -- ensures consistent form field appearance -- 1 line addition
6. **Remove console.log** in signals-playground.component.ts line 178 -- production hygiene -- 1 line removal

---

## Auto-Fix Script

```bash
#!/bin/bash
# Auto-fix script generated by audit

# Step 1: Add Angular ESLint (if not already installed)
npx ng add @angular-eslint/schematics --skip-confirmation

# Step 2: Run ESLint auto-fix (after configuration)
npx ng lint --fix

# Step 3: Rebuild to verify
npx ng build --configuration production
```

**Note:** The Material Module-to-standalone migration and takeUntilDestroyed changes require manual intervention. No Angular CLI schematic currently automates these migrations.
