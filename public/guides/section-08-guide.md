# Section 08: Global State -- Auth, Permissions & Notifications

**Duration:** ~30 minutes
**URLs:** http://localhost:4200/login, http://localhost:4200/dashboard
**Goal:** Show how `providedIn: 'root'` stores serve as the single source of truth for authentication, route protection, HTTP authorization, and app-wide notifications.

---

## Pre-Section Checklist

- [ ] App running at http://localhost:4200
- [ ] Logged OUT (clear sessionStorage or click Logout if currently logged in)
- [ ] Editor open with these files ready in tabs:
  - `src/app/core/auth/auth.store.ts`
  - `src/app/core/auth/auth.interceptor.ts`
  - `src/app/core/auth/auth.guard.ts`
  - `src/app/core/auth/auth-api.service.ts`
  - `src/app/core/notifications/notifications.store.ts`
  - `src/app/core/notifications/notifications.models.ts`
  - `src/app/features/login/login.component.ts`
  - `src/app/core/layout/shell.component.ts`
  - `src/app/app.config.ts`
  - `src/app/app.routes.ts`
- [ ] Browser DevTools > Application > Session Storage visible
- [ ] Browser DevTools > Network tab open and ready

---

## Opening (2 min)

**Say:** "In the previous section we saw feature-scoped stores that live and die with a route. But authentication is different. The auth state must be available everywhere: guards check it before navigation, interceptors read tokens for every HTTP request, the toolbar shows the user avatar, and the sidenav hides protected links. This is the classic use case for a global store with `providedIn: 'root'`."

**Quick audience poll:** "How many of you have previously stored auth tokens in a service with BehaviorSubjects?" (Context for the improvement signals bring.)

---

## Demo Flow

### Part 1: AuthStore -- The Global Source of Truth (8 min)

1. **Editor:** Open `src/app/core/auth/auth.store.ts`.
2. **Lines 16-22:** Walk through `AuthState`: `user`, `accessToken`, `refreshToken`, `status` (type `AuthStatus`), and `errorMessage`.
3. **Lines 32-33:** `signalStore({ providedIn: 'root' })`. "This store is a singleton. Angular creates it once and it lives for the entire app lifetime."
4. **Lines 40-48:** `withComputed`:
   - **Line 41:** `isAuthenticated` -- derived from `status() === 'authenticated'`. Guards, interceptors, and components all read this single signal.
   - **Lines 42-45:** `userFullName` -- computed from `user()`. Null-safe with early return.
   - **Line 46:** `userImage` -- uses nullish coalescing with `?? ''`.
   - **Line 47:** `isLoading` -- `status() === 'loading'`. Drives the progress bar in the login form.
5. **Lines 56-92:** `login` rxMethod with `exhaustMap`:
   - **Line 58:** `tap` sets status to `'loading'` and clears errors.
   - **Lines 59-89:** `exhaustMap` calls `authApi.login()`. On success (lines 63-77), patches user, tokens, and status, then navigates to `/dashboard` on line 80. On error (lines 82-86), patches status to `'error'` with the error message.
   - **Key point:** "exhaustMap ignores rapid duplicate clicks. If the user hammers the Sign In button, only the first request goes through."
6. **Lines 94-106:** `logout()`:
   - **Line 97:** Calls `StoreCoordinator.onLogout()` before clearing state. "The coordinator gets a chance to clean up other stores while the user data is still available."
   - **Lines 98-104:** Patches all state back to initial values.
   - **Line 105:** Navigates to `/login`.
7. **Lines 111-128:** `restoreSession` rxMethod with `switchMap`:
   - Called on app start if a token exists in sessionStorage.
   - Calls `authApi.getMe(token)` to validate the saved token.
   - On error (line 120-123), clears the invalid token silently.
8. **Lines 168-189:** `withHooks` `onInit`:
   - **Lines 172-176:** Checks `sessionStorage` for `stockpilot_access_token`. If found, patches token and calls `restoreSession`.
   - **Lines 181-188:** `effect()` watches `accessToken()`. When it changes, auto-saves to or removes from sessionStorage.

> **Wow moment:** "The entire auth lifecycle -- login, token persistence, session restoration, logout -- is 191 lines in one file. No scattered services, no manual subscriptions."

### Part 2: Interceptor -- Signals in the HTTP Pipeline (3 min)

1. **Editor:** Open `src/app/core/auth/auth.interceptor.ts`.
2. **Lines 10-21:** The entire interceptor is 12 lines.
   - **Line 11:** `inject(AuthStore)` -- gets the singleton store.
   - **Line 12:** `authStore.accessToken()` -- reads the token synchronously. No Observable, no async.
   - **Lines 14-18:** If a token exists and the request is not the login endpoint, clone the request with an `Authorization: Bearer` header.
3. **Editor:** Open `src/app/app.config.ts`.
   - **Line 19:** `provideHttpClient(withInterceptors([authInterceptor]))` -- wires the interceptor into the pipeline.
4. **Key teaching point:** "Compare this to the old class-based interceptor with `Observable<HttpEvent>` chains. Signals make it a simple synchronous read."

### Part 3: Guards -- Route Protection with Signals (4 min)

1. **Editor:** Open `src/app/core/auth/auth.guard.ts`.
2. **Lines 9-18:** `authGuard`:
   - **Line 13:** `authStore.isAuthenticated()` -- synchronous boolean check.
   - **Line 17:** If not authenticated, redirect to `/login` with `router.createUrlTree`.
3. **Lines 22-31:** `guestGuard`:
   - Reverse logic. If already authenticated, redirect to `/dashboard`.
   - "This prevents a logged-in user from seeing the login form."
4. **Editor:** Open `src/app/app.routes.ts`.
   - **Lines 8-14:** Login route uses `canActivate: [guestGuard]` on line 11.
   - **Lines 38-41:** Protected routes (inventory, orders, order-builder, dashboard) all use `canActivate: [authGuard]`.
5. **Browser:** While logged out, manually type http://localhost:4200/dashboard in the address bar.
   - You are redirected to `/login`. "The authGuard kicked in."
6. **Browser:** Log in (credentials are pre-filled: `emilys` / `emilyspass`). After redirect to dashboard, type http://localhost:4200/login.
   - You are redirected to `/dashboard`. "The guestGuard kicked in."

> **Wow moment:** "Both guards are pure functions. No class, no interface implementation, no Observable. Just `inject()` and a synchronous signal read."

### Part 4: Login Flow -- End to End (5 min)

1. **Browser:** Log out first (click user avatar > Logout). You land on `/login`.
2. **Editor:** Open `src/app/features/login/login.component.ts`.
   - **Line 166:** `authStore = inject(AuthStore)` -- the component injects the global store.
   - **Lines 168-169:** Pre-filled credentials: `username = 'emilys'`, `password = 'emilyspass'`.
   - **Lines 172-177:** `onLogin()` calls `this.authStore.login({ username, password })`. That is the entire component logic.
   - **Line 38 (template):** `authStore.isLoading()` drives the progress bar.
   - **Line 49 (template):** `authStore.errorMessage()` drives the error banner.
3. **Browser:** Open DevTools > Network tab. Click "Sign In".
   - Watch the POST to `/auth/login`.
   - On success, the browser navigates to `/dashboard`.
4. **Browser:** Open DevTools > Application > Session Storage.
   - See `stockpilot_access_token` saved automatically by the effect on line 181-188 of auth.store.ts.
5. **Browser:** Hard refresh (Ctrl+Shift+R).
   - The user stays logged in. "The `onInit` hook restored the session from sessionStorage."
6. **Error scenario:** Log out, change the password field to `wrongpass`, click Sign In.
   - The error banner appears. The button re-enables after the error. "exhaustMap completed, so a new login attempt is allowed."

**Recovery:** If login fails with a network error, check that dummyjson.com is reachable. The API occasionally has downtime. Retry after a few seconds.

### Part 5: Shell Component -- Global State Driving the UI (4 min)

1. **Editor:** Open `src/app/core/layout/shell.component.ts`.
2. **Lines 225-232:** Four store injections:
   - `themeStore` (line 225), `authStore` (line 226), `notificationsStore` (line 227), `coordinator` (line 232).
   - **Line 232:** The coordinator is injected for eager initialization. Its `effect()` hooks activate even though no template binding references it.
3. **Lines 54-93 (template):** Notification bell:
   - **Line 54:** `@if (authStore.isAuthenticated())` -- bell only shows when logged in.
   - **Line 57:** `notificationsStore.unreadCount()` drives the badge number.
   - **Line 58:** `notificationsStore.hasNotifications()` hides the badge when count is zero.
   - **Lines 71-85:** Iterates `visibleNotifications()` with icon per type.
4. **Lines 101-123 (template):** Auth-conditional toolbar:
   - **Line 101:** `@if (authStore.isAuthenticated())` -- shows avatar and user menu.
   - **Line 104:** `authStore.userImage()` for the avatar src.
   - **Line 111:** `authStore.userFullName()` in the menu header.
   - **Line 113:** Logout button calls `authStore.logout()`.
   - **Lines 118-123:** Else block shows a "Login" button.
5. **Lines 134-149 (template):** Nav items:
   - **Line 137:** `@if (!item.requiresAuth || authStore.isAuthenticated())` -- protected nav items are hidden when logged out.
   - **Lines 243-251:** The `navItems` array with `requiresAuth` flags. Items like Inventory, Orders, Order Builder, and Dashboard have `requiresAuth: true`.
6. **Browser:** Log out. Notice that "Inventory", "Orders", "Order Builder", and "Dashboard" disappear from the sidenav. The notification bell and user avatar also disappear. Log back in. They reappear instantly.

> **Wow moment:** "One signal -- `isAuthenticated()` -- controls the entire shell UI. No event bus, no manual show/hide logic, no subscription management."

### Part 6: NotificationsStore -- Global Event Queue (4 min)

1. **Editor:** Open `src/app/core/notifications/notifications.store.ts`.
2. **Lines 9-10:** `signalStore({ providedIn: 'root' })`.
3. **Lines 12-15:** State: `notifications` array and `maxVisible: 5`.
4. **Lines 17-23:** Computed signals:
   - `visibleNotifications` -- slices to `maxVisible`.
   - `unreadCount` -- total notification count.
   - `hasNotifications` -- boolean flag.
5. **Lines 29-42:** Private `_add` function:
   - **Line 31:** Generates a UUID with `crypto.randomUUID()`.
   - **Lines 35-37:** Prepends the new notification (newest first).
   - **Lines 39-41:** Sets up `setTimeout` for auto-dismiss based on `duration`.
6. **Lines 51-62:** Public convenience methods: `showSuccess` (3s), `showError` (5s), `showInfo` (3s), `showWarning` (4s). Each calls `_add` with a preset type and duration.
7. **Editor:** Open `src/app/core/notifications/notifications.models.ts`.
   - 7 lines defining `AppNotification` with `id`, `message`, `type`, `duration`, and `timestamp`.
8. **Key teaching point:** "Any store or component in the app can inject `NotificationsStore` and call `showSuccess('Order placed!')`. The shell toolbar picks it up automatically through the notification bell. This decouples the event source from the display."

---

## Audience Interaction Points

1. **(After AuthStore walkthrough):** "Why did we use `exhaustMap` for login but `switchMap` for session restoration?" Answer: Login should not be cancelled mid-flight (exhaustMap ignores duplicates). Session restore should cancel a stale attempt if a new one starts (switchMap cancels previous).
2. **(After guard demo):** "Could we make the guard async, for example to call an API?" Answer: Yes. `CanActivateFn` can return `Observable<boolean | UrlTree>` or `Promise`. But with signals holding pre-fetched state, synchronous guards are simpler and faster.
3. **(After NotificationsStore):** "What happens if 100 notifications fire at once?" Answer: `visibleNotifications` slices to `maxVisible` (5), so the UI stays clean. Old notifications remain in the array but are not rendered. Auto-dismiss cleans them up over time.

---

## Common Questions & Answers

**Q: Why sessionStorage instead of localStorage for auth tokens?**
A: sessionStorage is cleared when the browser tab closes. This is a security best practice for access tokens. Compare with `withLocalStorage` for the theme store, which uses localStorage because theme preference should persist across sessions.

**Q: Why does the interceptor skip the `/auth/login` request?**
A: The login request does not have a token yet (that is the request that obtains one). Attaching a null or stale token would cause the API to reject it. See `auth.interceptor.ts` line 14.

**Q: How does the shell get the coordinator running if nothing in the template uses it?**
A: The coordinator is injected on line 232 of `shell.component.ts` as `private coordinator = inject(StoreCoordinator)`. Angular creates it because it is injected, even though the component never calls any of its methods. This triggers the coordinator's constructor and its `effect()` hooks.

**Q: What happens if the session restore fails on app start?**
A: The `restoreSession` rxMethod has an error handler (lines 120-123 of auth.store.ts) that silently resets the state to `idle` and clears the stored tokens. The user simply sees the logged-out UI without an error message.

**Q: Can multiple components dispatch login at the same time?**
A: They can try, but `exhaustMap` (line 59 of auth.store.ts) ignores any new emission while the first login request is still in-flight. Only the first click has an effect.

**Q: Why is the notification `_add` function not a store method?**
A: It is a private function inside the `withMethods` closure (line 29 of notifications.store.ts). It is not exposed on the store's public API. Only the convenience wrappers (`showSuccess`, `showError`, etc.) are public. This keeps the API clean and prevents callers from bypassing the preset durations.

---

## Transition to Next Section

**Say:** "We now have global stores for auth and notifications, feature-scoped stores for the order builder, and reusable features that snap into any store. But what happens when stores need to talk to each other? For example, when the user logs in, maybe we want to load their dashboard data automatically. In the next section we will look at store coordination patterns and how to orchestrate cross-store workflows."

---

## Section Cheat Sheet

| Concept | File | Line(s) | What to Show |
|---|---|---|---|
| Global store (`providedIn: 'root'`) | `src/app/core/auth/auth.store.ts` | 32-33 | Singleton for the entire app |
| AuthState type | `src/app/core/auth/auth.store.ts` | 16-22 | user, tokens, status, errorMessage |
| Global computed signals | `src/app/core/auth/auth.store.ts` | 40-48 | isAuthenticated, userFullName, isLoading |
| Login with exhaustMap | `src/app/core/auth/auth.store.ts` | 56-92 | Prevents double-login |
| Logout with coordinator | `src/app/core/auth/auth.store.ts` | 94-106 | Notify coordinator, clear state, navigate |
| Session restoration | `src/app/core/auth/auth.store.ts` | 111-128 | switchMap with getMe API call |
| Token persistence effect | `src/app/core/auth/auth.store.ts` | 181-188 | Auto-save to sessionStorage |
| Interceptor with signal read | `src/app/core/auth/auth.interceptor.ts` | 10-21 | Synchronous `accessToken()` read |
| Interceptor wiring | `src/app/app.config.ts` | 19 | `withInterceptors([authInterceptor])` |
| Functional authGuard | `src/app/core/auth/auth.guard.ts` | 9-18 | Synchronous `isAuthenticated()` check |
| Functional guestGuard | `src/app/core/auth/auth.guard.ts` | 22-31 | Reverse guard for login page |
| Protected routes | `src/app/app.routes.ts` | 38-41 | `canActivate: [authGuard]` |
| Guest route | `src/app/app.routes.ts` | 8-14 | `canActivate: [guestGuard]` |
| Login component dispatch | `src/app/features/login/login.component.ts` | 172-177 | `authStore.login(credentials)` |
| Pre-filled credentials | `src/app/features/login/login.component.ts` | 168-169 | emilys / emilyspass |
| NotificationsStore | `src/app/core/notifications/notifications.store.ts` | 9-10 | Global notification queue |
| Notification computed | `src/app/core/notifications/notifications.store.ts` | 17-23 | visibleNotifications, unreadCount |
| Auto-dismiss | `src/app/core/notifications/notifications.store.ts` | 39-41 | setTimeout in `_add` |
| Shell notification bell | `src/app/core/layout/shell.component.ts` | 54-92 | Badge + dropdown menu |
| Shell auth-conditional UI | `src/app/core/layout/shell.component.ts` | 101-123 | Avatar/menu vs login button |
| Shell auth-conditional nav | `src/app/core/layout/shell.component.ts` | 134-149 | `requiresAuth` filtering |
| Shell store injections | `src/app/core/layout/shell.component.ts` | 225-232 | Four stores including coordinator |
