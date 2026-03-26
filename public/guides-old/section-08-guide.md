# Section 8: Global State - Auth, Permissions & Notifications

## Duration: ~30 minutes

---

## Pre-Section Checklist

- [ ] App is running (`ng serve`)
- [ ] Browser open at http://localhost:4200/login
- [ ] VS Code open with the project
- [ ] Logged OUT (clear sessionStorage if needed so the login flow is visible)
- [ ] Test credentials ready: username `emilys`, password `emilyspass`

---

## Opening (2 min)

**Say:** "In the last section we built feature-scoped stores that live and die with a route. But some state must survive for the entire app lifetime. Who is logged in? What permissions do they have? What notifications are queued? These are global concerns that guards, interceptors, and components across every route need to read. In this section, we build global stores and wire them into Angular's router and HTTP layers."

**Context bridge:** Section 7 showed feature-scoped composition. Now we shift to the other end of the spectrum: root-provided stores that the entire application depends on. The key difference is lifecycle. Feature-scoped stores are created and destroyed with navigation. Global stores live forever and must handle session restoration, token persistence, and cross-cutting concerns like HTTP headers and route protection.

---

## Demo Flow

### Demo 1: Auth Flow (~8 min)

**Open:** `src/app/core/auth/auth.models.ts`

- **Lines 1-2** - CONCEPT on global state models. These types define the contract for the auth flow. `LoginRequest`, `LoginResponse`, `RefreshResponse`, and `AuthStatus` are used across the store, API service, and login component.

**Open:** `src/app/core/auth/auth-api.service.ts`

- **Lines 8-10** - CONCEPT on architecture. The API service is a thin wrapper around HttpClient. It handles URL construction and typing but does NOT manage state. The store calls these methods and manages the response.

**Open:** `src/app/core/auth/auth.store.ts`

- **Lines 13-15** - CONCEPT on global state. Read aloud: "AuthStore uses `providedIn: 'root'` so it lives for the entire app lifetime. Guards, interceptors, components, and other stores can all inject it and read its signals synchronously."
- **Lines 16-22** - The `AuthState` type: `user`, `accessToken`, `refreshToken`, `status`, `errorMessage`. Walk through each field and explain its role.
- **Lines 37-39** - CONCEPT on global computed signals. `isAuthenticated`, `userFullName`, `userImage`, `isLoading` are available anywhere in the app. Because signals are synchronous, there is no need for async pipes or subscriptions.
- **Lines 50-51** - The `isAuthenticated` computed: `store.status() === 'authenticated'`. This is what guards and components read to determine access.
- **Lines 53-55** - CONCEPT on `exhaustMap` for login. Read aloud: "exhaustMap ignores new emissions while a previous one is still in-flight. This prevents double-login on rapid clicks." Compare with `switchMap` (cancels previous) and `concatMap` (queues all).
- **Lines 56-91** - Walk through the login `rxMethod`: `tap` sets loading, `exhaustMap` calls the API, `tapResponse` handles success (patch state, navigate to /dashboard) and error (set error message).
- **Lines 78-79** - CONCEPT on `tapResponse` error handling. The store transforms the raw `HttpErrorResponse` into a user-friendly error message.
- **Lines 95-96** - CONCEPT on logout. The store clears all auth state and navigates to `/login`. Note that the coordinator is notified BEFORE clearing state so it can still read the current user for logging.

**WOW MOMENT:** In the browser at http://localhost:4200/login, enter `emilys` and `emilyspass`. Click Sign In. Watch the loading bar appear, then the redirect to /dashboard. Point at the toolbar: the user's name and avatar are visible. Say: "The login component dispatched credentials. The store handled the API call, stored the tokens, updated the user profile, and navigated to the dashboard. The component did none of that work."

**Open:** `src/app/features/login/login.component.ts`

- **Lines 11-14** - CONCEPT on architecture. The login component is a thin UI layer. It collects credentials and dispatches them to `AuthStore.login()`. All auth logic lives in the store.
- **Lines 169-171** - CONCEPT: the component dispatches to the store. `this.authStore.login({ username, password })`. That is the only line of business logic in the entire component.

---

### Demo 2: Interceptor + Store (~5 min)

**Open:** `src/app/core/auth/auth.interceptor.ts`

- **Lines 5-8** - CONCEPT on interceptor + store integration. Read aloud: "The interceptor injects AuthStore and reads the accessToken signal to attach it to every outgoing request. Signals are synchronous, so `authStore.accessToken()` returns the current value instantly. No Observables, no async, just a function call."
- **Lines 10-21** - Walk through the interceptor: inject `AuthStore`, read `accessToken()`, clone the request with a Bearer header if a token exists and the URL is not the login endpoint. Point out how simple this is compared to the old Observable-based interceptor pattern.

**Open:** `src/app/app.config.ts`

- **Lines 15-17** - CONCEPT: wiring the interceptor. `provideHttpClient(withInterceptors([authInterceptor]))` registers the interceptor in the HTTP pipeline. Every outgoing request passes through it.

**Say:** "Open DevTools > Network tab. Make any navigation that triggers an API call. Look at the request headers. You will see `Authorization: Bearer <token>` on every request. The interceptor reads the signal synchronously and attaches it. No subscription, no Observable chain."

---

### Demo 3: Functional Guards (~5 min)

**Open:** `src/app/core/auth/auth.guard.ts`

- **Lines 5-8** - CONCEPT on functional guards. Read aloud: "authGuard reads `authStore.isAuthenticated()` synchronously. If false, redirect to login. If true, allow navigation. No class, no Observable, no canActivate interface. Just a function."
- **Lines 9-18** - Walk through `authGuard`: inject `AuthStore` and `Router`, check `isAuthenticated()`, return `true` or a URL tree redirecting to `/login`.
- **Lines 20-21** - CONCEPT on reverse guard. `guestGuard` prevents authenticated users from seeing the login page. If already logged in, redirect to `/dashboard`.
- **Lines 22-31** - Walk through `guestGuard`: the inverse logic.

**Open:** `src/app/app.routes.ts`

- **Lines 11-18** - CONCEPT on guards in route config. Show `canActivate: [guestGuard]` on the login route and `canActivate: [authGuard]` on the protected routes (inventory, orders, order-builder, dashboard).

**In the browser:** Log out (or clear session). Try navigating directly to http://localhost:4200/inventory. You get redirected to /login. Say: "The guard read `isAuthenticated()`, got false, and returned a URL tree for `/login`. No async, no race conditions. The signal always has a value."

Now log in with `emilys` / `emilyspass`. Try navigating to http://localhost:4200/login. You get redirected to /dashboard. Say: "The guestGuard caught that. You are already authenticated, so it redirects you away from the login page."

---

### Demo 4: Session Persistence (~4 min)

**Open:** `src/app/core/auth/auth.store.ts`

- **Lines 108-110** - CONCEPT on session restoration. On app start, if a token exists in `sessionStorage`, the store calls `/auth/me` to validate it and restore the user profile.
- **Lines 166-167** - CONCEPT on `withHooks`. `onInit` runs when the store is first injected. For root-provided stores, that happens early in the app lifecycle.
- **Lines 170-171** - CONCEPT on session restoration from `sessionStorage`. The store checks for a saved token and, if found, patches it into state and calls `restoreSession()`.
- **Lines 178-180** - CONCEPT on `effect()` for token persistence. When `accessToken()` changes, this effect auto-saves or removes it from `sessionStorage`. This is a valid use of `effect()`: synchronizing signal state to external storage.

**In the browser:** Log in with `emilys` / `emilyspass`. Verify you are on the dashboard. Now press F5 (hard refresh). The page reloads, and after a brief loading moment, you are still logged in with your user info in the toolbar. Say: "The store's `onInit` hook found the token in sessionStorage, called `/auth/me` to validate it, and restored the full user profile. No manual code in any component."

---

### Demo 5: Notifications Store (~4 min)

**Open:** `src/app/core/notifications/notifications.models.ts`

- **Lines 1-7** - The `AppNotification` interface: `id`, `message`, `type` (success/error/info/warning), `duration`, `timestamp`.

**Open:** `src/app/core/notifications/notifications.store.ts`

- **Lines 5-8** - CONCEPT on the notification queue pattern. Read aloud: "Any component or store can push notifications by injecting NotificationsStore and calling `showSuccess()`, etc. The notification component reads `visibleNotifications()` and renders them. This decouples 'what happened' from 'how to show it'."
- **Lines 9-10** - `providedIn: 'root'`. This is a global store, available everywhere.
- **Lines 12-15** - State: `notifications` array and `maxVisible` limit.
- **Lines 17-23** - Computed signals: `visibleNotifications` (sliced to max), `unreadCount`, `hasNotifications`.
- **Lines 26-28** - CONCEPT on the private `_add` helper. It creates the notification object, adds it to the queue, and sets up auto-dismiss via `setTimeout`.

**Say:** "Navigate to /inventory and try creating, updating, or deleting a product. Watch the notification toast appear. The inventory store calls `notificationsStore.showSuccess('Product created')`, and the notification component picks it up and renders it. The inventory store has no idea how the notification is displayed."

---

### Demo 6: Logout Flow (~4 min)

**Open:** `src/app/core/auth/auth.store.ts`

- **Lines 94-106** - The `logout()` method. Walk through: notify the coordinator (line 97), clear all auth state with `patchState` (lines 98-104), navigate to `/login` (line 105).
- **Lines 130-131** - CONCEPT on `refreshToken` rxMethod. Uses `switchMap` because only the latest refresh attempt matters. If no refresh token exists, returns `EMPTY`.

**In the browser:** While logged in, click the user menu in the toolbar and choose Logout. Observe: the user info disappears from the toolbar, the sidenav updates, and you are redirected to /login. Say: "One method call cleared five state fields, notified the coordinator, and navigated to the login page. Every component that reads `isAuthenticated()` or `userFullName()` updated automatically because they are reading signals."

Try navigating to http://localhost:4200/dashboard after logging out. You get redirected to /login. The guard is working. Open DevTools > Application > Session Storage. The token is gone. The `effect()` cleaned it up.

---

## Audience Interaction Points

1. **After Demo 1 (Auth Flow):** "How does your current app handle the login flow? Does the login component own the API call, or does a service or store handle it?"
2. **After Demo 2 (Interceptor):** "How many lines of code is your current auth interceptor? Compare that with this 21-line functional interceptor that reads a signal."
3. **After Demo 3 (Guards):** "Are your route guards class-based or functional? Have you ever had race conditions with Observable-based guards?"
4. **After Demo 4 (Session Persistence):** "How does your app handle page refresh? Do users have to log in again?"
5. **After Demo 5 (Notifications):** "Where do your notifications come from today? Are they coupled to specific components, or do you have a centralized notification system?"

---

## Common Questions & Answers

**Q: "Why sessionStorage instead of localStorage for tokens?"**
A: sessionStorage is cleared when the browser tab closes, which is a safer default for auth tokens. If you need tokens to persist across tabs or browser restarts, use localStorage, but be aware of the security implications. The `withLocalStorage` feature from Section 7 shows the localStorage pattern for non-sensitive data like theme preferences.

**Q: "Why use `Injector.get()` instead of `inject()` for StoreCoordinator?"**
A: AuthStore and StoreCoordinator have a circular dependency. StoreCoordinator injects AuthStore, so AuthStore cannot inject StoreCoordinator directly without creating a circular reference. `Injector.get()` resolves the dependency lazily at call time, breaking the cycle. See lines 178-180 in `auth.store.ts`.

**Q: "What happens if the token expires mid-session?"**
A: The `refreshToken` rxMethod (lines 130-131) handles this. When a 401 response comes back, the interceptor or a retry mechanism can trigger `store.refreshToken()`. If the refresh succeeds, the new token is patched into state and the `effect()` saves it to sessionStorage. If it fails, the store forces a logout.

**Q: "Can multiple stores push notifications?"**
A: Yes. Any store or component that injects `NotificationsStore` can call `showSuccess()`, `showError()`, `showInfo()`, or `showWarning()`. The notifications store is the single source of truth for the notification queue, but any part of the app can write to it.

**Q: "Why is the guard synchronous? What if auth state is still loading?"**
A: On a fresh page load, `restoreSession` sets `status` to `'loading'` and then to `'authenticated'` when the API responds. If the guard runs before the session is restored, `isAuthenticated()` returns false and the user is redirected to login. In practice, the session restore happens fast enough that this is rarely an issue. For apps where it matters, you can add a `canActivate` guard that waits for the status signal to leave the `'loading'` state.

**Q: "Should I put navigation logic in the store or the component?"**
A: For auth flows, the store is the right place. The store knows the full auth state and can decide where to navigate after login, logout, or token expiry. For user-initiated navigation (clicking a link), keep it in the component or use `routerLink`. The rule of thumb: if the navigation is a side effect of a state change, put it in the store.

---

## Transition to Next Section

**Say:** "We now have global stores for auth and notifications, functional guards that read signals synchronously, and an interceptor that attaches tokens with zero Observable boilerplate. In Section 9, we will look at how all these stores coordinate with each other: global event buses, store-to-store communication, and the architecture patterns that keep a multi-store app maintainable."

**Action:** Keep the app running and logged in for the next section's demos.

---

## Section Cheat Sheet

| Concept | Where to See It | File | Lines |
|---|---|---|---|
| Global state model | AuthState type | `src/app/core/auth/auth.store.ts` | 13-15 |
| Global computed signals | isAuthenticated, userFullName | `src/app/core/auth/auth.store.ts` | 37-39 |
| exhaustMap for login | Prevent double-login | `src/app/core/auth/auth.store.ts` | 53-55 |
| tapResponse error handling | User-friendly errors | `src/app/core/auth/auth.store.ts` | 78-79 |
| Logout with navigation | Clear state and redirect | `src/app/core/auth/auth.store.ts` | 95-96 |
| restoreSession rxMethod | Validate saved token | `src/app/core/auth/auth.store.ts` | 108-110 |
| refreshToken rxMethod | Token refresh flow | `src/app/core/auth/auth.store.ts` | 130-131 |
| Session restoration | Check sessionStorage on init | `src/app/core/auth/auth.store.ts` | 166-167, 170-171 |
| effect() for persistence | Auto-save token | `src/app/core/auth/auth.store.ts` | 178-180 |
| Interceptor reads store | Synchronous signal access | `src/app/core/auth/auth.interceptor.ts` | 5-8 |
| Functional authGuard | Synchronous guard | `src/app/core/auth/auth.guard.ts` | 5-8 |
| Reverse guestGuard | Redirect if authenticated | `src/app/core/auth/auth.guard.ts` | 20-21 |
| API service (thin wrapper) | No state management | `src/app/core/auth/auth-api.service.ts` | 8-10 |
| Auth models | Contract types | `src/app/core/auth/auth.models.ts` | 1-2 |
| Notification queue | Global notification pattern | `src/app/core/notifications/notifications.store.ts` | 5-8, 26-28 |
| Login component | Thin UI layer | `src/app/features/login/login.component.ts` | 11-14, 169-171 |
| withInterceptors | Wire interceptor | `src/app/app.config.ts` | 15-17 |
| Guards in routes | authGuard / guestGuard | `src/app/app.routes.ts` | 11-18 |
