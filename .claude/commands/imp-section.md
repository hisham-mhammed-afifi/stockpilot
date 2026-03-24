# Implement StockPilot Section

You are implementing a section of the **StockPilot** Angular workshop project that teaches state management progressively.

## Instructions

1. Read the section file at: `docs/sections/section-$ARGUMENTS.md`
2. If $ARGUMENTS is empty, list all available sections from `docs/sections/` and ask which one to implement.
3. Before coding, read the section file completely and understand:
   - **PREREQUISITES**: What must exist before this section (previous sections)
   - **CONCEPTS TAUGHT**: What state management concepts this section covers
   - **DELIVERABLES**: Exact files to create/modify
   - **API ENDPOINTS**: Which dummyjson.com endpoints to use
   - **IMPLEMENTATION SPEC**: Step-by-step build instructions
   - **TEACHING NOTES**: Comments to add that explain concepts for learners

## Rules

- **Angular 19+**: Use standalone components, new control flow (`@if`, `@for`, `@switch`), `inject()`, functional guards
- **Signals-first**: Use `signal()`, `computed()`, `linkedSignal()`, `effect()` as primary reactivity
- **NgRx SignalStore**: Use `signalStore`, `withState`, `withComputed`, `withMethods`, `withEntities`, `withHooks`, `patchState`, `rxMethod` from `@ngrx/signals`
- **Angular Material**: Use Material components for UI (mat-table, mat-card, mat-toolbar, mat-sidenav, mat-button, mat-icon, mat-form-field, mat-select, mat-chip, mat-snackbar, mat-dialog, mat-tabs, mat-progress-bar, mat-menu, mat-badge)
- **DummyJSON API**: Base URL is `https://dummyjson.com`. Do NOT create mock services - always hit the real API
- **Teaching comments**: Add `// CONCEPT:` comments before every state management pattern to explain what it does and why
- **No em dashes**: Never use em dashes in any generated text or comments
- **Section isolation**: Each section builds on previous ones. Do NOT break existing functionality
- **Routing**: Every feature is a lazy-loaded route
- **Folder structure**: Follow the structure defined in `docs/sections/section-00-project-structure.md` if it exists, otherwise follow the structure specified in the section file

## Workflow

1. Read the section MD file
2. Check what already exists in the project (don't duplicate)
3. Create/modify files as specified in DELIVERABLES
4. Add teaching comments (`// CONCEPT:`) throughout
5. Ensure the app compiles and runs (`ng serve`)
6. Summarize what was built and which concepts were demonstrated

## Comment Format

```typescript
// CONCEPT: [Category] - [Explanation]
// Example:
// CONCEPT: Signal - signal() creates a reactive primitive. Reading it (count()) tracks dependencies.
// CONCEPT: Computed - computed() derives state from other signals. It only recalculates when dependencies change.
// CONCEPT: SignalStore - withEntities() provides normalized entity management with O(1) lookups via entityMap()
// CONCEPT: rxMethod - rxMethod wraps an Observable pipeline that can be triggered imperatively or reactively
// CONCEPT: Architecture - Components never call API services directly. They go through the store.
```
