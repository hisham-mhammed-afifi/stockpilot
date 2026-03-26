# Angular Project Audit: Latest Syntax & Style Guide Compliance

You are an Angular 19+ expert auditor. Your job is to scan this entire project, check every `.ts`, `.html`, and `.scss` file against the latest Angular syntax and the official Angular style guide, then produce a detailed gap report with concrete fix suggestions.

## Scope

**If $ARGUMENTS is a file path:** Audit only that file.
**If $ARGUMENTS is a folder path:** Audit all files in that folder recursively.
**If $ARGUMENTS is empty:** Audit the entire `src/app/` directory.

## Step 1: Gather Context via Angular CLI & Tooling

Before auditing, use the Angular CLI and project tooling to gather metadata and automated findings. This project has Angular MCP configured, so use Angular CLI commands directly.

### 1A: Project Metadata

```bash
# Angular, NgRx, Material, RxJS versions
npx ng version 2>/dev/null || cat package.json | grep -E "angular|ngrx|material|rxjs|zone"

# Angular workspace config (strict mode, SSR, budgets, optimization)
cat angular.json

# TypeScript strictness
cat tsconfig.json
cat tsconfig.app.json 2>/dev/null
```

### 1B: Automated Angular CLI Checks

```bash
# Run Angular ESLint (captures structural and style guide violations automatically)
npx ng lint --format json 2>&1 | head -500
# If lint is not configured, check:
cat .eslintrc.json 2>/dev/null || cat eslint.config.js 2>/dev/null || cat eslint.config.mjs 2>/dev/null

# Run production build in dry-run to catch strict compilation errors
# (type errors, unused imports, missing types, template type checking)
npx ng build --configuration production 2>&1 | tail -100

# Check if there are any Angular update migrations pending
npx ng update 2>&1 | head -30
```

### 1C: Inventory All Source Files

```bash
# All TypeScript files
find src/app -type f -name "*.ts" | sort

# All HTML template files
find src/app -type f -name "*.html" | sort

# All SCSS/CSS files
find src/app -type f -name "*.scss" -o -name "*.css" | sort

# Count totals
echo "TypeScript files: $(find src/app -type f -name '*.ts' | wc -l)"
echo "HTML templates: $(find src/app -type f -name '*.html' | wc -l)"
echo "Style files: $(find src/app -type f \( -name '*.scss' -o -name '*.css' \) | wc -l)"
```

### 1D: Quick Pattern Scans (pre-screen before full read)

```bash
# Legacy structural directives (should be zero in Angular 19+)
grep -rn '\*ngIf\|*ngFor\|\*ngSwitch' src/app --include="*.ts" --include="*.html" | head -30

# Legacy decorators (should be migrated to signal-based)
grep -rn '@Input()\|@Output()\|@ViewChild\|@ContentChild' src/app --include="*.ts" | head -30

# Constructor injection (should use inject())
grep -rn 'constructor(' src/app --include="*.ts" | grep -v 'node_modules\|\.spec\.' | head -30

# BehaviorSubject usage (should be signals)
grep -rn 'BehaviorSubject\|ReplaySubject' src/app --include="*.ts" | head -20

# CommonModule imports (should be removed with new control flow)
grep -rn 'CommonModule' src/app --include="*.ts" | head -20

# NgModule declarations (should be standalone)
grep -rn '@NgModule' src/app --include="*.ts" | head -20

# Missing track in @for
grep -rn '@for' src/app --include="*.ts" --include="*.html" | grep -v 'track' | head -20

# async pipe (check if signal alternative exists)
grep -rn '| async' src/app --include="*.ts" --include="*.html" | head -20

# subscribe() in components (potential leak)
grep -rn '\.subscribe(' src/app/features --include="*.ts" | grep -v '\.spec\.' | head -20

# any type usage
grep -rn ': any\b' src/app --include="*.ts" | grep -v '\.spec\.\|node_modules' | head -20

# console.log left in code
grep -rn 'console\.\(log\|warn\|error\)' src/app --include="*.ts" | grep -v '\.spec\.' | head -20

# Missing OnPush
grep -rn '@Component' src/app --include="*.ts" -A 5 | grep -v 'OnPush\|changeDetection' | head -20

# --- Material-specific scans ---

# Raw buttons without Material
grep -rn '<button' src/app --include="*.ts" --include="*.html" | grep -v 'mat-button\|mat-raised-button\|mat-flat-button\|mat-stroked-button\|mat-icon-button\|mat-fab\|mat-mini-fab\|matDialogClose\|matStepperPrevious\|matStepperNext\|mat-sort-header\|cdkDrag' | head -20

# Raw inputs without matInput
grep -rn '<input' src/app --include="*.ts" --include="*.html" | grep -v 'matInput\|mat-input\|cdkTextareaAutosize\|type="hidden"\|matDatepicker\|#\|formControlName.*matInput\|matChipInput\|matAutocomplete' | head -20

# Raw select without mat-select
grep -rn '<select' src/app --include="*.ts" --include="*.html" | grep -v 'mat-select' | head -10

# Raw table without mat-table
grep -rn '<table' src/app --include="*.ts" --include="*.html" | grep -v 'mat-table\|cdk-table' | head -10

# Native browser dialogs
grep -rn 'window\.alert\|window\.confirm\|window\.prompt\|[^.]alert(' src/app --include="*.ts" | head -10

# matInput without mat-form-field wrapper
grep -rn 'matInput' src/app --include="*.ts" --include="*.html" -B 3 | grep -v 'mat-form-field' | head -10

# mat-form-field without mat-label
grep -rn 'mat-form-field' src/app --include="*.ts" --include="*.html" -A 3 | grep -v 'mat-label\|mat-form-field\|--\|appearance' | head -10

# Hardcoded colors that should use theme
grep -rn 'color:\s*#\|background:\s*#\|background-color:\s*#' src/app --include="*.scss" --include="*.css" --include="*.ts" | grep -v 'node_modules\|// theme\|var(--' | head -20

# title="" attribute (should be matTooltip)
grep -rn 'title="' src/app --include="*.ts" --include="*.html" | grep -v 'matTooltip\|<title>\|mat-card-title\|dialogTitle\|panelTitle' | head -10

# Which Material modules are actually imported
grep -rn 'from .@angular/material/' src/app --include="*.ts" | sed "s/.*material\///" | sed "s/'.*//" | sort | uniq -c | sort -rn

# Check for !important overrides on Material styles
grep -rn '!important' src/app --include="*.scss" --include="*.css" | head -10

# Check for ::ng-deep usage
grep -rn '::ng-deep' src/app --include="*.scss" --include="*.css" --include="*.ts" | head -10

# Barrel imports from @angular/material (should use specific entry points)
grep -rn "from '@angular/material'" src/app --include="*.ts" | head -10

# Full module imports instead of standalone component imports
grep -rn 'MatButtonModule\|MatIconModule\|MatInputModule\|MatFormFieldModule\|MatSelectModule\|MatTableModule\|MatCardModule\|MatToolbarModule\|MatSidenavModule\|MatListModule\|MatMenuModule\|MatDialogModule\|MatSnackBarModule\|MatTabsModule\|MatChipsModule\|MatProgressBarModule\|MatProgressSpinnerModule\|MatBadgeModule\|MatTooltipModule\|MatExpansionModule\|MatStepperModule\|MatPaginatorModule\|MatSortModule\|MatSlideToggleModule\|MatCheckboxModule\|MatRadioModule\|MatDatepickerModule\|MatAutocompleteModule\|MatButtonToggleModule\|MatDividerModule\|MatGridListModule\|MatRippleModule\|MatSliderModule\|MatBottomSheetModule\|MatTreeModule' src/app --include="*.ts" | head -20
```

### 1E: Angular ESLint Rule Check

If ESLint is configured with `@angular-eslint`, check which rules are enabled:

```bash
# Check angular-eslint config
cat .eslintrc.json 2>/dev/null | grep -A 2 'angular-eslint' || echo "No .eslintrc.json found"
cat eslint.config.js 2>/dev/null | head -50 || cat eslint.config.mjs 2>/dev/null | head -50 || echo "No flat config found"

# If eslint is not configured, note this as a HIGH finding:
# "Angular ESLint not configured. Run: ng add @angular-eslint/schematics"
```

### 1F: Incorporate CLI Findings

After running Steps 1B-1E:

- Parse `ng lint` JSON output and map each violation to the matching audit category below
- Parse `ng build` errors and map type errors to Category 10 (TypeScript Strictness)
- Parse `ng update` output and flag any pending migrations as Category 11 (Deprecated APIs)
- Use the grep pattern scans from 1D to create a pre-screen hit list, then READ those files in full for Step 2

## Step 2: Read and Audit Every File

Use the pre-screen results from Step 1D to prioritize files with likely issues, but still read ALL `.ts` files in scope. For each file, check against ALL categories below. Do NOT skip files. Do NOT assume compliance. Read every file.

**Merge findings:** If `ng lint` already flagged an issue in a file, include it in the report but mark it as `[LINT]` so the presenter knows the linter also catches it. If your manual audit finds something the linter missed, mark it as `[MANUAL]`. This shows the value of both approaches.

## Audit Categories

### Category 1: Standalone Components (CRITICAL)

Check every `@Component`, `@Directive`, `@Pipe` for:

| Check               | Bad (Legacy)                                             | Good (Angular 19+)                                                 | Severity |
| ------------------- | -------------------------------------------------------- | ------------------------------------------------------------------ | -------- |
| Standalone flag     | `standalone: false` or missing                           | `standalone: true`                                                 | CRITICAL |
| NgModule usage      | Any `@NgModule` that declares components                 | Remove NgModule, use standalone                                    | CRITICAL |
| Imports array       | Importing entire modules (`CommonModule`, `FormsModule`) | Import only what you use (`NgIf`, `NgFor` OR use new control flow) | HIGH     |
| CommonModule import | `imports: [CommonModule]`                                | Remove entirely if using new control flow                          | HIGH     |

### Category 2: New Control Flow (CRITICAL)

Check every template (inline or `.html`) for:

| Check          | Bad (Legacy)                                  | Good (Angular 19+)                               | Severity |
| -------------- | --------------------------------------------- | ------------------------------------------------ | -------- |
| \*ngIf         | `*ngIf="condition"`                           | `@if (condition) { }`                            | CRITICAL |
| \*ngFor        | `*ngFor="let item of items"`                  | `@for (item of items; track item.id) { }`        | CRITICAL |
| \*ngSwitch     | `[ngSwitch]` + `*ngSwitchCase`                | `@switch (value) { @case (x) { } }`              | CRITICAL |
| ngClass        | `[ngClass]="{'active': isActive}"`            | `[class.active]="isActive()"` (for simple cases) | MEDIUM   |
| ngStyle        | `[ngStyle]="{'color': textColor}"`            | `[style.color]="textColor()"` (for simple cases) | MEDIUM   |
| Missing track  | `@for` without `track`                        | `@for (item of items; track item.id) { }`        | HIGH     |
| @empty block   | `@for` without `@empty` for user-facing lists | Add `@empty { <no results> }`                    | LOW      |
| @loading block | `@defer` without `@loading`                   | Add `@loading { <spinner> }`                     | LOW      |

### Category 3: Signals & Reactivity (HIGH)

Check every component and service for:

| Check                              | Bad (Legacy)                                   | Good (Angular 19+)                                          | Severity |
| ---------------------------------- | ---------------------------------------------- | ----------------------------------------------------------- | -------- |
| BehaviorSubject for state          | `new BehaviorSubject<T>(init)`                 | `signal<T>(init)`                                           | HIGH     |
| Manual subscriptions in components | `.subscribe()` in component code               | Use `toSignal()`, `resource()`, or signal reads in template | HIGH     |
| async pipe with signals available  | `value$ \| async` when a signal version exists | `store.value()` direct read                                 | MEDIUM   |
| Input decorator                    | `@Input() name: string`                        | `name = input<string>()` (signal input)                     | MEDIUM   |
| Output decorator                   | `@Output() clicked = new EventEmitter()`       | `clicked = output<void>()` (signal output)                  | MEDIUM   |
| ViewChild decorator                | `@ViewChild('ref') el: ElementRef`             | `el = viewChild<ElementRef>('ref')`                         | MEDIUM   |
| ContentChild decorator             | `@ContentChild(X) x: X`                        | `x = contentChild<X>(X)`                                    | MEDIUM   |
| Required input                     | `@Input() name!: string`                       | `name = input.required<string>()`                           | MEDIUM   |
| Input transform                    | `@Input({ transform: booleanAttribute })`      | `flag = input(false, { transform: booleanAttribute })`      | LOW      |
| model() for two-way binding        | `@Input() value` + `@Output() valueChange`     | `value = model<string>()`                                   | MEDIUM   |
| effect() misuse                    | `effect(() => { someSignal.set(...) })`        | Use `computed()` or `linkedSignal()` for derived state      | HIGH     |
| toSignal missing initialValue      | `toSignal(obs$)` without initialValue          | `toSignal(obs$, { initialValue: default })`                 | MEDIUM   |

### Category 4: Dependency Injection (HIGH)

| Check                    | Bad (Legacy)                                       | Good (Angular 19+)                                                    | Severity |
| ------------------------ | -------------------------------------------------- | --------------------------------------------------------------------- | -------- |
| Constructor injection    | `constructor(private svc: MyService)`              | `private svc = inject(MyService)`                                     | HIGH     |
| @Inject decorator        | `@Inject(TOKEN) value`                             | `value = inject(TOKEN)`                                               | HIGH     |
| Class-based guards       | `class AuthGuard implements CanActivate`           | `export const authGuard: CanActivateFn = () => {}`                    | HIGH     |
| Class-based interceptors | `class AuthInterceptor implements HttpInterceptor` | `export const authInterceptor: HttpInterceptorFn = (req, next) => {}` | HIGH     |
| Class-based resolvers    | `class DataResolver implements Resolve<T>`         | `export const dataResolver: ResolveFn<T> = () => {}`                  | HIGH     |
| providedIn missing       | `@Injectable()` without providedIn                 | `@Injectable({ providedIn: 'root' })` or provide in route             | MEDIUM   |

### Category 5: NgRx SignalStore Patterns (HIGH)

| Check                     | Bad                                                           | Good                                                                            | Severity |
| ------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------- | -------- |
| Direct state mutation     | Mutating state object properties directly                     | Use `patchState()` for all state changes                                        | CRITICAL |
| Missing tapResponse       | `catchError` inside `rxMethod` pipe                           | `tapResponse({ next, error })`                                                  | HIGH     |
| subscribe inside rxMethod | `.subscribe()` in rxMethod pipe                               | Use flattening operators + `tapResponse`                                        | HIGH     |
| Wrong flattening operator | `switchMap` for mutations (data loss risk)                    | `concatMap` for mutations, `switchMap` for reads, `exhaustMap` for submits      | MEDIUM   |
| Inline entity operations  | Manual array push/filter/map for entity CRUD                  | `addEntity()`, `updateEntity()`, `removeEntity()` from `@ngrx/signals/entities` | HIGH     |
| Duplicated loading/error  | Repeated `loading: boolean, error: string` in multiple stores | Extract to `withLoading()` custom feature                                       | MEDIUM   |
| Store in component        | State logic in component class                                | Extract to SignalStore, component only reads signals and calls methods          | MEDIUM   |

### Category 6: Angular Style Guide (MEDIUM)

Check the official Angular style guide conventions:

| Check                     | Rule                                                                      | Severity |
| ------------------------- | ------------------------------------------------------------------------- | -------- |
| File naming               | `feature-name.type.ts` (kebab-case, dot-separated type)                   | MEDIUM   |
| Component selector prefix | Consistent prefix (e.g., `app-`)                                          | MEDIUM   |
| Single responsibility     | Files > 400 lines should be split                                         | LOW      |
| Component type suffix     | `XComponent`, `XService`, `XDirective`, `XPipe`, `XGuard`                 | LOW      |
| Folder structure          | Feature folders with `index.ts` barrels where useful                      | LOW      |
| Lifecycle ordering        | `ngOnInit` before `ngOnDestroy`, etc.                                     | LOW      |
| Member ordering           | Static > public > protected > private; properties > methods               | LOW      |
| Const enums/types         | Magic strings should be typed constants                                   | MEDIUM   |
| Private members           | Prefix with `_` or use `private` keyword consistently                     | LOW      |
| Template complexity       | Complex expressions in templates should be in computed signals or methods | MEDIUM   |

### Category 7: Change Detection & Performance (MEDIUM)

| Check                              | Bad                                               | Good                                              | Severity |
| ---------------------------------- | ------------------------------------------------- | ------------------------------------------------- | -------- |
| Missing OnPush                     | Default change detection with signals             | `changeDetection: ChangeDetectionStrategy.OnPush` | MEDIUM   |
| Missing track in @for              | `@for (item of items)`                            | `@for (item of items; track item.id)`             | HIGH     |
| Function calls in template         | `{{ getTotal() }}` (recalculates every CD cycle)  | `{{ total() }}` (computed signal, cached)         | HIGH     |
| Heavy computation in template      | Complex expressions in `@if` or interpolation     | Move to `computed()` signal                       | MEDIUM   |
| Large lists without virtual scroll | `@for` over 100+ items without CDK virtual scroll | Use `cdk-virtual-scroll-viewport`                 | LOW      |

### Category 8: RxJS Best Practices (MEDIUM)

| Check                      | Bad                                                 | Good                                              | Severity |
| -------------------------- | --------------------------------------------------- | ------------------------------------------------- | -------- |
| Missing takeUntilDestroyed | `.subscribe()` without cleanup (in non-signal code) | `pipe(takeUntilDestroyed())` or convert to signal | HIGH     |
| Nested subscribes          | `.subscribe(() => obs$.subscribe())`                | Use `switchMap`, `concatMap`, etc.                | HIGH     |
| Manual unsubscribe array   | `subs: Subscription[] = []`                         | `takeUntilDestroyed()` or `DestroyRef`            | MEDIUM   |
| toPromise (deprecated)     | `.toPromise()`                                      | `firstValueFrom()` or `lastValueFrom()`           | MEDIUM   |
| Unused Observable imports  | Importing operators not used                        | Remove unused imports                             | LOW      |

### Category 9: Template & Accessibility (LOW-MEDIUM)

| Check                  | Rule                                                     | Severity |
| ---------------------- | -------------------------------------------------------- | -------- |
| Missing aria labels    | Interactive elements without `aria-label`                | MEDIUM   |
| Missing alt text       | `<img>` without `alt` attribute                          | MEDIUM   |
| Click without keyboard | `(click)` without `(keyup.enter)` on non-button elements | MEDIUM   |
| Color-only indicators  | Status shown only by color (no icon/text)                | LOW      |
| Missing form labels    | `mat-form-field` without `<mat-label>`                   | LOW      |

### Category 10: TypeScript Strictness (MEDIUM)

| Check                          | Bad                                         | Good                              | Severity |
| ------------------------------ | ------------------------------------------- | --------------------------------- | -------- |
| `any` type                     | `data: any`                                 | Proper interface or generic       | MEDIUM   |
| Non-null assertion overuse     | `user!.name` frequently                     | Proper null checks or `@if` guard | MEDIUM   |
| Missing return types           | Public methods without explicit return type | Add return type                   | LOW      |
| Loose equality                 | `==` or `!=`                                | `===` or `!==`                    | LOW      |
| Console.log in production code | `console.log()` outside debug utilities     | Remove or use proper logging      | LOW      |

### Category 11: Deprecated APIs & Pending Migrations (HIGH)

Check for Angular APIs deprecated in v17/18/19 and pending `ng update` migrations:

| Check                                             | Deprecated        | Replacement                                                 | Severity |
| ------------------------------------------------- | ----------------- | ----------------------------------------------------------- | -------- |
| `ComponentFixture.debugElement.componentInstance` | Deprecated in v19 | Use typed `componentRef.instance`                           | MEDIUM   |
| `RouterModule.forRoot/forChild`                   | Legacy pattern    | `provideRouter()` + `Routes`                                | HIGH     |
| `HttpClientModule`                                | Legacy module     | `provideHttpClient()` in app config                         | HIGH     |
| `BrowserAnimationsModule`                         | Legacy module     | `provideAnimationsAsync()` in app config                    | HIGH     |
| `NgModule` for routing                            | Legacy pattern    | Functional route config with `loadComponent`/`loadChildren` | HIGH     |
| `Renderer2` for DOM manipulation                  | Discouraged       | Signal-driven templates, or `afterNextRender()`             | MEDIUM   |
| `ResolveData` with class resolvers                | Deprecated        | `ResolveFn` functional resolver                             | HIGH     |
| `CanActivate` class guard                         | Deprecated        | `CanActivateFn` functional guard                            | HIGH     |
| `HTTP_INTERCEPTORS` multi-provider                | Legacy            | `withInterceptors([fn])` in `provideHttpClient()`           | HIGH     |
| `@angular/flex-layout`                            | Abandoned         | CSS Grid / Flexbox / Tailwind                               | MEDIUM   |
| `entryComponents`                                 | Removed in v13+   | Remove entirely                                             | LOW      |
| `ViewEncapsulation.Native`                        | Deprecated        | `ViewEncapsulation.ShadowDom`                               | LOW      |

Also run `npx ng update` and flag any migrations available from:

- `@angular/core`
- `@angular/cli`
- `@angular/material`
- `@ngrx/signals`
- `@ngrx/store` (if present)

### Category 12: Angular ESLint & Build Health (INFO)

These findings come from `ng lint` and `ng build`, not manual review.

| Check                                   | Source                                       | Severity                            |
| --------------------------------------- | -------------------------------------------- | ----------------------------------- |
| ESLint not configured                   | Missing `@angular-eslint`                    | HIGH (setup recommendation)         |
| ESLint rule violations                  | `ng lint` output                             | Mapped to matching categories above |
| Strict template type checking disabled  | `tsconfig "strictTemplates": false`          | HIGH                                |
| `strictNullChecks` disabled             | `tsconfig "strictNullChecks": false`         | HIGH                                |
| `strictPropertyInitialization` disabled | `tsconfig`                                   | MEDIUM                              |
| Build warnings                          | `ng build --configuration production` output | Varies                              |
| Bundle size over budget                 | `angular.json` budgets                       | MEDIUM                              |
| Circular dependencies                   | Build output warnings                        | HIGH                                |

### Category 13: Angular Material Usage & Correctness (HIGH)

**This is a priority audit category.** The project uses Angular Material as its design system. Every UI element should leverage Material components where applicable. Using raw HTML when a Material equivalent exists is considered a HIGH finding.

#### 13A: Pre-Scan for Material Usage

```bash
# Check which Material modules/components are imported across the project
grep -rn '@angular/material' src/app --include="*.ts" | sed 's/.*from .@angular\/material\///' | sed "s/'.*$//" | sort | uniq -c | sort -rn

# Check for raw HTML elements that should be Material components
grep -rn '<button' src/app --include="*.ts" --include="*.html" | grep -v 'mat-button\|mat-raised-button\|mat-flat-button\|mat-stroked-button\|mat-icon-button\|mat-fab\|mat-mini-fab' | head -20
grep -rn '<input' src/app --include="*.ts" --include="*.html" | grep -v 'matInput\|mat-input' | head -20
grep -rn '<select' src/app --include="*.ts" --include="*.html" | grep -v 'mat-select' | head -20
grep -rn '<table' src/app --include="*.ts" --include="*.html" | grep -v 'mat-table' | head -20
grep -rn '<textarea' src/app --include="*.ts" --include="*.html" | grep -v 'matInput' | head -20
grep -rn '<a ' src/app --include="*.ts" --include="*.html" | grep 'href\|routerLink' | grep -v 'mat-button\|mat-raised-button\|mat-flat-button\|mat-stroked-button' | head -20

# Check for native browser dialogs instead of MatDialog
grep -rn 'window\.alert\|window\.confirm\|window\.prompt\|alert(' src/app --include="*.ts" | head -10

# Check for custom loading spinners instead of MatProgressBar/MatProgressSpinner
grep -rn 'spinner\|loading' src/app --include="*.ts" --include="*.html" | grep -v 'mat-progress\|mat-spinner\|MatProgress' | head -15

# Check for custom tooltip implementations
grep -rn 'tooltip\|title=' src/app --include="*.ts" --include="*.html" | grep -v 'matTooltip\|MatTooltip' | head -10

# Check for proper MatFormField wrapping
grep -rn 'matInput' src/app --include="*.ts" --include="*.html" | head -5
grep -rn 'mat-form-field' src/app --include="*.ts" --include="*.html" | head -5

# Check for custom snackbar/toast instead of MatSnackBar
grep -rn 'toast\|snack\|notification' src/app --include="*.ts" --include="*.html" | grep -v 'MatSnackBar\|mat-snack\|snackBar' | head -10

# Check for custom chips/badges/tags
grep -rn 'chip\|badge\|tag' src/app --include="*.ts" --include="*.html" | grep -v 'mat-chip\|matBadge\|MatChip\|MatBadge' | head -10
```

#### 13B: Missing Material Component Adoption

Every UI pattern should use its Material equivalent. Check for:

| UI Pattern          | Raw HTML (BAD)                                     | Material Component (GOOD)                                                                           | Severity |
| ------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------- | -------- |
| Buttons             | `<button>`, `<button class="btn">`                 | `<button mat-raised-button>`, `mat-flat-button`, `mat-stroked-button`, `mat-icon-button`, `mat-fab` | HIGH     |
| Text inputs         | `<input type="text">`                              | `<mat-form-field><input matInput></mat-form-field>`                                                 | HIGH     |
| Select/dropdown     | `<select>`                                         | `<mat-form-field><mat-select>`                                                                      | HIGH     |
| Textarea            | `<textarea>`                                       | `<mat-form-field><textarea matInput>`                                                               | HIGH     |
| Checkbox            | `<input type="checkbox">`                          | `<mat-checkbox>`                                                                                    | HIGH     |
| Radio               | `<input type="radio">`                             | `<mat-radio-group><mat-radio-button>`                                                               | HIGH     |
| Slide toggle        | Custom toggle switch                               | `<mat-slide-toggle>`                                                                                | HIGH     |
| Data tables         | `<table>`                                          | `<table mat-table>` with `matSort`, `matColumnDef`, `mat-header-row`, `mat-row`                     | HIGH     |
| Paginator           | Custom pagination buttons                          | `<mat-paginator>`                                                                                   | HIGH     |
| Tabs                | Custom tab implementation                          | `<mat-tab-group><mat-tab>`                                                                          | HIGH     |
| Cards               | `<div class="card">`                               | `<mat-card><mat-card-header><mat-card-content>`                                                     | MEDIUM   |
| Lists               | `<ul><li>` for structured data                     | `<mat-list><mat-list-item>`, `<mat-nav-list>`, `<mat-selection-list>`                               | MEDIUM   |
| Dialogs             | `window.alert()`, `window.confirm()`, custom modal | `MatDialog` service with `MatDialogRef`                                                             | HIGH     |
| Snackbar/toast      | Custom notification div                            | `MatSnackBar.open()`                                                                                | HIGH     |
| Progress            | Custom loading spinner/bar                         | `<mat-progress-bar>` or `<mat-progress-spinner>`                                                    | HIGH     |
| Tooltip             | `title=""` attribute, custom tooltip               | `matTooltip` directive                                                                              | MEDIUM   |
| Menu                | Custom dropdown menu                               | `<mat-menu>` with `matMenuTriggerFor`                                                               | HIGH     |
| Sidenav             | Custom sidebar div                                 | `<mat-sidenav-container><mat-sidenav>`                                                              | MEDIUM   |
| Toolbar             | Custom header div                                  | `<mat-toolbar>`                                                                                     | MEDIUM   |
| Icon                | `<i class="icon">`, `<img>` for icons              | `<mat-icon>` with Material Symbols/Icons                                                            | MEDIUM   |
| Expansion           | Custom accordion                                   | `<mat-expansion-panel>`                                                                             | MEDIUM   |
| Chips               | Custom tag/badge spans                             | `<mat-chip-set><mat-chip>`                                                                          | MEDIUM   |
| Badge               | Custom counter spans                               | `matBadge` directive                                                                                | MEDIUM   |
| Stepper             | Custom step wizard divs                            | `<mat-stepper><mat-step>`                                                                           | HIGH     |
| Autocomplete        | Custom search dropdown                             | `<mat-autocomplete>`                                                                                | MEDIUM   |
| Date picker         | `<input type="date">`                              | `<mat-datepicker>`                                                                                  | HIGH     |
| Divider             | `<hr>`                                             | `<mat-divider>`                                                                                     | LOW      |
| Ripple              | No interaction feedback                            | `matRipple` directive                                                                               | LOW      |
| Sorting in tables   | Custom sort headers                                | `matSort` + `mat-sort-header` directives                                                            | HIGH     |
| Button toggle group | Custom radio-style buttons                         | `<mat-button-toggle-group>`                                                                         | MEDIUM   |
| Slider              | `<input type="range">`                             | `<mat-slider>`                                                                                      | MEDIUM   |
| Bottom sheet        | Custom bottom drawer                               | `MatBottomSheet` service                                                                            | LOW      |
| Tree                | Custom nested list                                 | `<mat-tree>`                                                                                        | LOW      |

#### 13C: Incorrect Material Usage Patterns

Check for Material components used incorrectly:

| Check                                 | Bad (Incorrect Usage)                                                         | Good (Correct Usage)                                                                                  | Severity |
| ------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | -------- |
| Input without form field              | `<input matInput>` (bare, no wrapper)                                         | `<mat-form-field><input matInput></mat-form-field>`                                                   | HIGH     |
| Form field without label              | `<mat-form-field><input matInput></mat-form-field>`                           | Add `<mat-label>` inside `mat-form-field`                                                             | HIGH     |
| Form field without appearance         | `<mat-form-field>` (default)                                                  | `<mat-form-field appearance="outline">` (explicit, consistent)                                        | MEDIUM   |
| mat-table without trackBy             | `<table mat-table [dataSource]="data">`                                       | Add `[trackBy]="trackByFn"` or use signal-based data source                                           | HIGH     |
| mat-table without sort                | Data table with sortable columns but no `matSort`                             | Add `matSort` to table, `mat-sort-header` to columns                                                  | MEDIUM   |
| MatDialog without closing strategy    | `dialog.open(Component)`                                                      | Add `disableClose`, `hasBackdrop`, `autoFocus` config as needed                                       | LOW      |
| MatDialog not returning data          | Dialog that should return a result but uses `dialogRef.close()` with no value | `dialogRef.close(result)` with typed `MatDialogRef<C, R>`                                             | MEDIUM   |
| MatSnackBar without action            | Error notification without dismiss action                                     | `snackBar.open(msg, 'Dismiss', { duration: 5000 })`                                                   | LOW      |
| MatSnackBar without duration          | `snackBar.open(msg)` (stays forever)                                          | Add `{ duration: 3000 }` for non-critical messages                                                    | MEDIUM   |
| Icon without accessible label         | `<mat-icon>delete</mat-icon>` as action button without label                  | Add `aria-label` or wrap in button with label                                                         | HIGH     |
| Button type missing                   | `<button mat-raised-button>` in a form                                        | Add `type="button"` (prevent accidental form submit) or `type="submit"` explicitly                    | MEDIUM   |
| Color attribute misuse                | `<button mat-raised-button color="primary">` everywhere                       | Use `color` strategically: `primary` for main actions, `accent` for secondary, `warn` for destructive | LOW      |
| Reactive forms without error display  | `<mat-form-field>` with validators but no `<mat-error>`                       | Add `<mat-error>` for each validation rule                                                            | HIGH     |
| Missing hint                          | Password/complex fields without guidance                                      | Add `<mat-hint>` for user guidance                                                                    | LOW      |
| Suffix/prefix misuse                  | Icons outside form field                                                      | Use `matSuffix`/`matPrefix` for icons inside form fields                                              | LOW      |
| Paginator not connected to table      | `<mat-paginator>` present but not wired to data source                        | Connect via `MatTableDataSource.paginator` or handle `(page)` event                                   | HIGH     |
| Sort not connected to table           | `matSort` present but not wired to data source                                | Connect via `MatTableDataSource.sort` or handle `(matSortChange)` event                               | HIGH     |
| CDK DragDrop without drop zone styles | `cdkDropList` without visual feedback                                         | Add `.cdk-drag-placeholder`, `.cdk-drag-preview`, `.cdk-drop-list-dragging` CSS                       | MEDIUM   |
| MatSelect without compare function    | Object-based mat-select                                                       | Add `[compareWith]="compareFn"` when option values are objects                                        | HIGH     |
| Expansion panel without lazy content  | Heavy content in expansion panels loaded eagerly                              | Use `ng-template matExpansionPanelContent` for lazy rendering                                         | MEDIUM   |

#### 13D: Material Theming & Consistency

| Check                              | Issue                                                  | Recommendation                                                                     | Severity |
| ---------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- | -------- |
| No custom theme                    | Using default purple/pink theme                        | Create a custom theme with `mat.define-theme()` in styles.scss                     | MEDIUM   |
| Hardcoded colors                   | CSS with `color: #1976d2` instead of theme tokens      | Use `mat.get-theme-color()` or CSS variables from Material theme                   | HIGH     |
| Mixed appearance                   | Some form fields `outline`, some `fill`, some default  | Set consistent `MAT_FORM_FIELD_DEFAULT_OPTIONS` in providers                       | MEDIUM   |
| Mixed density                      | Inconsistent component sizing                          | Set `mat.define-theme({ density: ... })` globally or per-component                 | LOW      |
| Missing typography                 | Using custom font sizes instead of Material typography | Use `mat.define-theme({ typography: ... })` and type scale classes                 | MEDIUM   |
| Theme not applied to overlay       | Dialogs/menus with wrong background in dark mode       | Ensure overlay container has theme class                                           | MEDIUM   |
| No dark theme support              | Only light theme configured                            | Add dark theme via `color-scheme` or class-based toggle using `mat.define-theme()` | MEDIUM   |
| Inline styles overriding Material  | `style="padding: 20px"` on `mat-card`                  | Use `::ng-deep` sparingly or component styles with proper specificity              | LOW      |
| `!important` overrides on Material | CSS with `!important` on Material component styles     | Fix specificity instead of using `!important`                                      | MEDIUM   |
| `::ng-deep` overuse                | More than 5 `::ng-deep` rules in a component           | Refactor to use Material's built-in customization APIs                             | MEDIUM   |

#### 13E: Material Best Practices

| Check                                 | Issue                                                    | Recommendation                                                                                                                                                                | Severity |
| ------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Not using standalone Material imports | `import { MatButtonModule }` (full module)               | `import { MatButton }` (standalone component, Angular Material 19+)                                                                                                           | MEDIUM   |
| Importing from barrel                 | `import { ... } from '@angular/material'`                | Import from specific entry point: `@angular/material/button`                                                                                                                  | HIGH     |
| Missing `MAT_*` default options       | Repeated config per instance                             | Set defaults via `MAT_FORM_FIELD_DEFAULT_OPTIONS`, `MAT_DIALOG_DEFAULT_OPTIONS`, `MAT_SNACK_BAR_DEFAULT_OPTIONS`, `MAT_TABS_CONFIG`, `MAT_RIPPLE_GLOBAL_OPTIONS` in providers | MEDIUM   |
| Not using MatTableDataSource          | Manual filtering/sorting/pagination logic with mat-table | Use `MatTableDataSource` with built-in filter, sort, paginator bindings                                                                                                       | MEDIUM   |
| Custom scroll handling                | Manual scroll logic for long lists                       | Use CDK `ScrollingModule` with `cdk-virtual-scroll-viewport`                                                                                                                  | LOW      |
| Missing breakpoint observer           | Custom window.innerWidth checks                          | Use CDK `BreakpointObserver` for responsive layouts                                                                                                                           | MEDIUM   |
| Not using CDK clipboard               | Custom copy-to-clipboard logic                           | Use CDK `Clipboard` service or `cdkCopyToClipboard` directive                                                                                                                 | LOW      |
| Not using CDK overlay                 | Custom dropdown/popover positioning                      | Use CDK `Overlay` for positioned floating panels                                                                                                                              | LOW      |
| Manual focus management               | Custom focus trap logic in dialogs/drawers               | Use CDK `cdkTrapFocus`, `cdkFocusInitial`                                                                                                                                     | MEDIUM   |
| Not using CDK a11y                    | Custom keyboard navigation                               | Use CDK `ListKeyManager`, `FocusMonitor`, `LiveAnnouncer`                                                                                                                     | MEDIUM   |

#### 13F: Missed Opportunities

For each component file, check if the template has UI patterns where Material is NOT used but SHOULD be. This is the most important sub-check. For each finding, explain:

1. What raw HTML element or custom implementation was found
2. Which Material component should replace it
3. The exact import needed (standalone component import path)
4. A brief before/after code snippet

## Step 3: Generate the Report

Save the report to `docs/audit-report.md` with this structure:

```markdown
# Angular Audit Report

**Generated:** [date]
**Angular Version:** [version]
**NgRx Version:** [version]
**Material Version:** [version]
**RxJS Version:** [version]
**Files Scanned:** [count]
**ESLint Configured:** [yes/no]
**Strict Mode:** [full/partial/disabled]

## Executive Summary

- **CRITICAL issues:** [count] ([N] from lint, [N] from manual audit)
- **HIGH issues:** [count]
- **MEDIUM issues:** [count]
- **LOW issues:** [count]
- **Overall compliance score:** [X/100]

### Build Health

- **Production build:** [PASS / FAIL with error count]
- **Lint status:** [PASS / X violations / NOT CONFIGURED]
- **Pending migrations:** [none / list from ng update]

### Material Coverage

- **Material components used:** [list of mat-* components found in project]
- **Material components NOT used but should be:** [list with file references]
- **Raw HTML elements that should be Material:** [count]
- **Incorrect Material usage:** [count]
- **Material coverage score:** [X/100] (100 = every UI element uses Material where applicable)

### Top 5 Issues to Fix First

1. [Most impactful issue with file count]
2. ...

---

## Tooling Recommendations

Before fixing code issues, fix the tooling:

| Tool               | Status               | Recommendation                                           |
| ------------------ | -------------------- | -------------------------------------------------------- |
| Angular ESLint     | [installed/missing]  | [action if missing: `ng add @angular-eslint/schematics`] |
| Strict templates   | [enabled/disabled]   | [action if disabled]                                     |
| Strict null checks | [enabled/disabled]   | [action if disabled]                                     |
| Production budgets | [configured/missing] | [action if missing]                                      |

---

## Detailed Findings

### Category 1: Standalone Components

**Status:** [PASS / X issues found]

| File          | Line | Issue           | Current Code       | Suggested Fix         | Severity | Source   |
| ------------- | ---- | --------------- | ------------------ | --------------------- | -------- | -------- |
| `src/app/...` | 42   | Legacy NgModule | `@NgModule({...})` | Convert to standalone | CRITICAL | [MANUAL] |

The **Source** column indicates how the issue was found:

- `[LINT]` = Caught by `ng lint` (auto-fixable in most cases)
- `[BUILD]` = Caught by `ng build --configuration production`
- `[MANUAL]` = Found by manual code review (linter does not catch this)
- `[GREP]` = Found by pattern scan in Step 1D

### Category 2: New Control Flow

**Status:** [PASS / X issues found]

[Same table format with Source column]

... [repeat for all 13 categories]

---

## Material Adoption Report

This section provides a comprehensive view of Angular Material usage across the project.

### Material Components Inventory

| Component | Import Path              | Times Used | Files       |
| --------- | ------------------------ | ---------- | ----------- |
| MatButton | @angular/material/button | [N]        | [file list] |
| MatTable  | @angular/material/table  | [N]        | [file list] |
| ...       | ...                      | ...        | ...         |

### Missing Material Adoption (Highest Priority)

These are concrete places where raw HTML should be replaced with Material:

| File          | Line | Current Element        | Should Be                          | Impact                                       |
| ------------- | ---- | ---------------------- | ---------------------------------- | -------------------------------------------- |
| `src/app/...` | 23   | `<button class="btn">` | `<button mat-raised-button>`       | Consistency, theming, a11y, ripple           |
| `src/app/...` | 45   | `<input type="text">`  | `<mat-form-field><input matInput>` | Validation display, label animation, theming |
| `src/app/...` | 67   | `<table>`              | `<table mat-table>`                | Sorting, pagination, responsive              |
| `src/app/...` | 89   | `window.confirm()`     | `MatDialog`                        | Consistent UX, theming, accessibility        |

### Incorrect Material Usage

| File | Line | Issue | Current Code | Correct Code |
| ---- | ---- | ----- | ------------ | ------------ |
| ...  | ...  | ...   | ...          | ...          |

### Material Theming Consistency

| Check                            | Status              | Details                      |
| -------------------------------- | ------------------- | ---------------------------- |
| Custom theme defined             | [yes/no]            | [location or recommendation] |
| Dark mode support                | [yes/no]            | [details]                    |
| Consistent form field appearance | [yes/uniform/mixed] | [details]                    |
| Hardcoded colors found           | [count]             | [files]                      |
| Typography scale used            | [yes/no]            | [details]                    |

### Material Default Options Configured

| Token                            | Status        | Recommendation            |
| -------------------------------- | ------------- | ------------------------- |
| `MAT_FORM_FIELD_DEFAULT_OPTIONS` | [set/not set] | [value or recommendation] |
| `MAT_DIALOG_DEFAULT_OPTIONS`     | [set/not set] | [value or recommendation] |
| `MAT_SNACK_BAR_DEFAULT_OPTIONS`  | [set/not set] | [value or recommendation] |
| `MAT_TABS_CONFIG`                | [set/not set] | [value or recommendation] |

---

## ng lint Summary

If `ng lint` was run successfully, include:
```

Total violations: [N]
Auto-fixable: [N] (run `npx ng lint --fix` to auto-fix)
Manual fix required: [N]

Top rules violated:

1. [rule-name]: [count] violations
2. [rule-name]: [count] violations

```

If `ng lint` was NOT configured, include:

```

RECOMMENDATION: Angular ESLint is not configured.
Run: ng add @angular-eslint/schematics
This will catch [estimated N] of the issues found in this audit automatically on every save.

```

---

## ng build Summary

```

Production build: [PASS/FAIL]
Warnings: [count]
Errors: [count]

Key issues:

- [list any type errors, missing imports, circular deps]

```

---

## ng update Summary

```

Pending migrations:

- [package@version -> version: migration description]
- ...

Run: npx ng update [package] to apply migrations.

````

If no migrations pending: "All packages are up to date."

---

## File-by-File Summary

| File | Critical | High | Medium | Low | Lint | Material Issues | Status |
|------|----------|------|--------|-----|------|----------------|--------|
| `src/app/core/auth/auth.store.ts` | 0 | 0 | 1 | 0 | 0 | 0 | GOOD |
| `src/app/features/...` | 1 | 2 | 0 | 1 | 3 | 2 | NEEDS WORK |

---

## Migration Recipes

For each CRITICAL and HIGH issue pattern found, provide a complete before/after migration recipe:

### Recipe: [Issue Name]
**Affected files:** [list]
**Estimated effort:** [X minutes per file]
**Auto-fixable:** [yes via `ng lint --fix` / no, manual migration required]

**Before:**
```typescript
[exact current code from the project]
````

**After:**

```typescript
[exact migrated code]
```

**Steps:**

1. [Step-by-step migration instruction]
2. ...

**Angular CLI schematic (if available):**

```bash
# If there's an ng update migration or schematic that handles this:
npx ng generate @angular/core:migration-name
```

---

## Recommended Fix Order

Priority-ordered list of what to fix and why:

0. **[Tooling setup]** - Configure ESLint if missing, enable strict mode if disabled
1. **[Issue]** in [N files] - [why this matters most] - [auto-fixable? yes/no]
2. **[Issue]** in [N files] - [why this is next]
3. ...

---

## Auto-Fix Script

If multiple issues are auto-fixable, provide a single script the developer can run:

```bash
#!/bin/bash
# Auto-fix script generated by audit

# Step 1: Run Angular ESLint auto-fix
npx ng lint --fix

# Step 2: Run any pending Angular migrations
# npx ng update @angular/core (if applicable)

# Step 3: Rebuild to verify
npx ng build --configuration production
```

```

## Rules

1. **Read every file.** Do not assume a file is compliant without reading it.
2. **Quote actual code.** Every finding must reference the real code from the actual file with the actual line content. Do not fabricate examples.
3. **Be specific.** "Line 42 in auth.store.ts uses constructor injection" not "some files use constructor injection".
4. **Tag the source.** Every finding gets a `[LINT]`, `[BUILD]`, `[GREP]`, or `[MANUAL]` tag indicating how it was discovered.
5. **No duplicates.** If `ng lint` and manual review find the same issue, report it once with `[LINT]` tag (linter gets credit).
6. **Group by category first, then provide file-by-file summary.** This lets the presenter fix by pattern (efficient) or by file (focused).
7. **No false positives.** If a pattern is acceptable in context (e.g., `any` in a generic utility), note it as acceptable and skip.
8. **Score fairly.** 100 = perfect compliance with all Angular 19+ patterns. Deduct based on severity and count.
9. **Migration recipes must compile.** The "After" code must be valid Angular 19+ that works as a drop-in replacement.
10. **No em dashes.** Never use em dashes in generated text.
11. **Check for deprecated APIs.** Flag any usage of APIs deprecated in Angular 17/18/19 (Category 11).
12. **Check for zoneless readiness.** Flag patterns that would break in a zoneless Angular app (explicit change detection triggers needed).
13. **Include Angular CLI recommendations.** If ESLint is not configured, strict mode is disabled, or migrations are pending, flag these as HIGH-priority tooling fixes before code fixes.
14. **Provide auto-fix info.** For each finding, indicate whether it can be auto-fixed via `ng lint --fix`, an `ng update` schematic, or requires manual migration.

## Scoring Formula

### Overall Compliance Score
```

Score = 100 - (CRITICAL _ 5) - (HIGH _ 2) - (MEDIUM _ 0.5) - (LOW _ 0.1)
Minimum score: 0

```

Cap deductions per category at 20 points to avoid one bad pattern tanking the entire score.

### Material Coverage Score (reported separately)
```

MaterialScore = 100 - (raw_elements_that_should_be_material _ 3) - (incorrect_material_usage _ 2) - (missing_theming \* 1)
Minimum score: 0

```

Both scores are reported in the Executive Summary. Material score is critical for this project because Angular Material is the design system and every UI surface must use it consistently.

## Workflow

1. **Gather metadata** via Angular CLI: versions, config, strict mode, ESLint setup (Step 1A)
2. **Run automated checks**: `ng lint`, `ng build --production`, `ng update` (Step 1B)
3. **Pattern scan** via grep to pre-screen likely issues including Material gaps (Step 1D)
4. **Merge CLI findings** into audit categories with `[LINT]`/`[BUILD]` tags (Step 1F)
5. **Read each file** in scope, check against all 13 categories (Step 2)
6. **Material deep scan**: For every component template, verify every visible UI element uses Material where applicable. This is the most important step. Open the app in browser if needed to visually identify missed Material opportunities. (Category 13)
7. **Deduplicate** findings (lint + manual = one entry tagged `[LINT]`)
8. **Generate the report** with all sections including Material Adoption Report
9. **Save** to `docs/audit-report.md`
10. **Print** executive summary (including Material coverage score) to the terminal
```
