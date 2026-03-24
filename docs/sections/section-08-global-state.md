# Section 08: Global State - Auth, Permissions & Notifications

## Duration: ~30 minutes

## CONCEPTS TAUGHT
- Global stores with `providedIn: 'root'`
- Auth flow: login, token storage, auto-refresh, logout
- HttpInterceptor reading from a SignalStore
- Functional route guards reading from a SignalStore
- Notification queue pattern (toast/snackbar store)
- `effect()` for cross-cutting concerns (auto-redirect on auth change)
- Router integration with stores

## PREREQUISITES
- Section 04-07 (SignalStore, rxMethod, custom features)

## API ENDPOINTS USED
- `POST /auth/login` - login with username/password, returns tokens + user
- `GET /auth/me` - get current user with access token
- `POST /auth/refresh` - refresh access token

## DELIVERABLES

### Files to Create

1. **`src/app/core/auth/auth.models.ts`**
   ```typescript
   export interface LoginRequest {
     username: string;
     password: string;
   }

   export interface LoginResponse {
     id: number;
     username: string;
     email: string;
     firstName: string;
     lastName: string;
     gender: string;
     image: string;
     accessToken: string;
     refreshToken: string;
   }

   export interface RefreshResponse {
     accessToken: string;
     refreshToken: string;
   }

   export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'error';
   ```

2. **`src/app/core/auth/auth-api.service.ts`**
   ```typescript
   @Injectable({ providedIn: 'root' })
   export class AuthApiService {
     private http = inject(HttpClient);
     private baseUrl = environment.apiUrl;

     login(credentials: LoginRequest): Observable<LoginResponse> {
       return this.http.post<LoginResponse>(`${this.baseUrl}/auth/login`, credentials);
     }

     getMe(token: string): Observable<User> {
       return this.http.get<User>(`${this.baseUrl}/auth/me`, {
         headers: { Authorization: `Bearer ${token}` },
       });
     }

     refresh(refreshToken: string): Observable<RefreshResponse> {
       return this.http.post<RefreshResponse>(`${this.baseUrl}/auth/refresh`, {
         refreshToken,
         expiresInMins: 30,
       });
     }
   }
   ```

3. **`src/app/core/auth/auth.store.ts`**
   ```typescript
   type AuthState = {
     user: User | null;
     accessToken: string | null;
     refreshToken: string | null;
     status: AuthStatus;
     errorMessage: string | null;
   };

   export const AuthStore = signalStore(
     { providedIn: 'root' },

     withState<AuthState>({
       user: null,
       accessToken: null,
       refreshToken: null,
       status: 'idle',
       errorMessage: null,
     }),

     // CONCEPT: Global computed signals - Available anywhere in the app.
     // Guards, interceptors, components, other stores can all read these.
     withComputed((store) => ({
       isAuthenticated: computed(() => store.status() === 'authenticated'),
       userFullName: computed(() => {
         const user = store.user();
         return user ? `${user.firstName} ${user.lastName}` : '';
       }),
       userImage: computed(() => store.user()?.image ?? ''),
       isLoading: computed(() => store.status() === 'loading'),
     })),

     withMethods((store, authApi = inject(AuthApiService), router = inject(Router)) => ({
       // CONCEPT: Login flow with exhaustMap - Prevents double-login on rapid clicks
       login: rxMethod<LoginRequest>(
         pipe(
           tap(() => patchState(store, { status: 'loading', errorMessage: null })),
           exhaustMap((credentials) =>
             authApi.login(credentials).pipe(
               tapResponse({
                 next: (response) => {
                   patchState(store, {
                     user: {
                       id: response.id,
                       username: response.username,
                       email: response.email,
                       firstName: response.firstName,
                       lastName: response.lastName,
                       gender: response.gender,
                       image: response.image,
                     },
                     accessToken: response.accessToken,
                     refreshToken: response.refreshToken,
                     status: 'authenticated',
                     errorMessage: null,
                   });
                   router.navigate(['/dashboard']);
                 },
                 error: (err: HttpErrorResponse) => {
                   patchState(store, {
                     status: 'error',
                     errorMessage: err.error?.message ?? 'Login failed. Check your credentials.',
                   });
                 },
               })
             )
           )
         )
       ),

       logout() {
         patchState(store, {
           user: null,
           accessToken: null,
           refreshToken: null,
           status: 'idle',
           errorMessage: null,
         });
         router.navigate(['/login']);
       },

       // Try to restore session from token (called on app init)
       restoreSession: rxMethod<string>(
         pipe(
           tap(() => patchState(store, { status: 'loading' })),
           switchMap((token) =>
             authApi.getMe(token).pipe(
               tapResponse({
                 next: (user) => {
                   patchState(store, { user, status: 'authenticated' });
                 },
                 error: () => {
                   patchState(store, { status: 'idle', accessToken: null, refreshToken: null });
                 },
               })
             )
           )
         )
       ),

       refreshToken: rxMethod<void>(
         pipe(
           switchMap(() => {
             const rt = store.refreshToken();
             if (!rt) return EMPTY;
             return authApi.refresh(rt).pipe(
               tapResponse({
                 next: (tokens) => {
                   patchState(store, {
                     accessToken: tokens.accessToken,
                     refreshToken: tokens.refreshToken,
                   });
                 },
                 error: () => {
                   // Refresh failed, force logout
                   patchState(store, {
                     user: null, accessToken: null, refreshToken: null, status: 'idle',
                   });
                   router.navigate(['/login']);
                 },
               })
             );
           })
         )
       ),

       clearError() {
         patchState(store, { errorMessage: null });
       },
     })),

     // Persist tokens to sessionStorage
     withHooks({
       onInit(store) {
         // CONCEPT: Session restoration - Check sessionStorage for saved tokens on app start
         const savedToken = sessionStorage.getItem('stockpilot_access_token');
         if (savedToken) {
           patchState(store, { accessToken: savedToken });
           store.restoreSession(savedToken);
         }

         // CONCEPT: effect() for persistence - Auto-save token changes to sessionStorage
         effect(() => {
           const token = store.accessToken();
           if (token) {
             sessionStorage.setItem('stockpilot_access_token', token);
           } else {
             sessionStorage.removeItem('stockpilot_access_token');
           }
         });
       },
     }),
   );
   ```

4. **`src/app/core/auth/auth.interceptor.ts`**
   ```typescript
   // CONCEPT: Interceptor reading from store - The interceptor injects AuthStore
   // and reads the accessToken signal to attach it to every outgoing request.
   // This is a great example of global state being consumed by infrastructure code.
   export const authInterceptor: HttpInterceptorFn = (req, next) => {
     const authStore = inject(AuthStore);
     const token = authStore.accessToken();

     if (token && !req.url.includes('/auth/login')) {
       req = req.clone({
         setHeaders: { Authorization: `Bearer ${token}` },
       });
     }

     return next(req);
   };
   ```

5. **`src/app/core/auth/auth.guard.ts`**
   ```typescript
   // CONCEPT: Functional guard reading from store - Clean, testable, no class needed.
   // The guard reads isAuthenticated() from AuthStore and redirects if not logged in.
   export const authGuard: CanActivateFn = () => {
     const authStore = inject(AuthStore);
     const router = inject(Router);

     if (authStore.isAuthenticated()) {
       return true;
     }

     return router.createUrlTree(['/login']);
   };

   // Reverse guard for login page (redirect to dashboard if already logged in)
   export const guestGuard: CanActivateFn = () => {
     const authStore = inject(AuthStore);
     const router = inject(Router);

     if (!authStore.isAuthenticated()) {
       return true;
     }

     return router.createUrlTree(['/dashboard']);
   };
   ```

6. **`src/app/core/notifications/notifications.models.ts`**
   ```typescript
   export interface AppNotification {
     id: string;
     message: string;
     type: 'success' | 'error' | 'info' | 'warning';
     duration?: number; // ms, 0 = sticky
     timestamp: number;
   }
   ```

7. **`src/app/core/notifications/notifications.store.ts`**
   ```typescript
   export const NotificationsStore = signalStore(
     { providedIn: 'root' },

     withState({
       notifications: [] as AppNotification[],
       maxVisible: 5,
     }),

     withComputed((store) => ({
       visibleNotifications: computed(() =>
         store.notifications().slice(0, store.maxVisible())
       ),
       unreadCount: computed(() => store.notifications().length),
       hasNotifications: computed(() => store.notifications().length > 0),
     })),

     withMethods((store) => ({
       // CONCEPT: Notification queue - Add to the queue, auto-dismiss after duration.
       // This is a global state pattern: any component or store can push notifications.
       showSuccess(message: string) {
         this._add({ message, type: 'success', duration: 3000 });
       },
       showError(message: string) {
         this._add({ message, type: 'error', duration: 5000 });
       },
       showInfo(message: string) {
         this._add({ message, type: 'info', duration: 3000 });
       },
       showWarning(message: string) {
         this._add({ message, type: 'warning', duration: 4000 });
       },
       dismiss(id: string) {
         patchState(store, (s) => ({
           notifications: s.notifications.filter(n => n.id !== id),
         }));
       },
       clearAll() {
         patchState(store, { notifications: [] });
       },
       _add(partial: Omit<AppNotification, 'id' | 'timestamp'>) {
         const notification: AppNotification = {
           ...partial,
           id: crypto.randomUUID(),
           timestamp: Date.now(),
         };
         patchState(store, (s) => ({
           notifications: [notification, ...s.notifications],
         }));
         // Auto-dismiss
         if (partial.duration && partial.duration > 0) {
           setTimeout(() => this.dismiss(notification.id), partial.duration);
         }
       },
     })),
   );
   ```

8. **`src/app/features/login/login.component.ts`**
   Login page:
   - Material form with username and password fields
   - "Login" button (disabled while loading)
   - Error message display from AuthStore
   - Pre-filled hint: "Use emilys / emilyspass"
   - On success, redirects to /dashboard (handled by store)

9. **`src/app/features/login/login.routes.ts`**

### Files to Modify

1. **`src/app/app.config.ts`**
   - Add `provideHttpClient(withInterceptors([authInterceptor]))`

2. **`src/app/app.routes.ts`**
   - Add login route with `guestGuard`
   - Add `authGuard` to protected routes (inventory, orders, order-builder, dashboard)
   - Products and home remain public

3. **`src/app/core/layout/header.component.ts`** (toolbar)
   - Show user avatar + name when authenticated (from AuthStore)
   - Show Login button when not authenticated
   - User menu (mat-menu): Profile info, Logout button
   - Notification bell icon with badge showing `notificationsStore.unreadCount()`

4. **`src/app/core/layout/shell.component.ts`**
   - Conditionally show/hide nav items based on `authStore.isAuthenticated()`
   - Login/Logout links

5. **`src/app/features/inventory/store/inventory.store.ts`**
   - Add a notification on successful CRUD operations:
   ```typescript
   // Inside addProduct success:
   inject(NotificationsStore).showSuccess(`Product "${created.title}" added`);
   ```

## IMPLEMENTATION SPEC

### Step 1: Auth Infrastructure
Create AuthApiService, auth models, AuthStore.

### Step 2: Interceptor & Guards
Create authInterceptor and authGuard. Wire into app config and routes.

### Step 3: Login Page
Build login form that dispatches to AuthStore.

### Step 4: Notifications Store
Build NotificationsStore with queue pattern.

### Step 5: Update Shell & Header
Show auth-aware UI: user profile, login/logout, notification bell.

### Step 6: Protect Routes
Add authGuard to protected routes. Add guestGuard to login.

### Step 7: Wire Notifications
Add notification calls to existing stores (inventory CRUD).

## TEACHING NOTES

```typescript
// CONCEPT: Global State - AuthStore and NotificationsStore use providedIn: 'root'.
// They live for the entire app lifetime. Any component, guard, interceptor,
// or other store can inject and read from them.

// CONCEPT: Interceptor + Store - The auth interceptor reads authStore.accessToken()
// synchronously (signals are sync!) and attaches it to every HTTP request.
// No Observables, no async, just a function call. This is simpler than
// the old Observable-based interceptor pattern.

// CONCEPT: Functional Guards + Store - authGuard reads authStore.isAuthenticated()
// synchronously. If false, redirect to login. If true, allow navigation.
// No class, no Observable, no canActivate interface. Just a function.

// CONCEPT: effect() for session persistence - The effect in AuthStore's onInit
// watches accessToken() and auto-saves/removes from sessionStorage.
// This is a valid use of effect(): synchronizing signal state to external storage.

// CONCEPT: Notification queue - A global notification pattern.
// Any store calls notificationsStore.showSuccess("message").
// The notification component reads visibleNotifications() and renders them.
// This decouples the "what happened" (store) from "how to show it" (component).

// CONCEPT: Global store coordination - The login flow shows how global stores
// interact with routing. AuthStore.login() calls router.navigate() on success.
// This is an opinionated pattern: the store owns the navigation logic because
// it knows the full auth state. The login component just dispatches credentials.
```

## VERIFICATION
1. Login page renders with form
2. Login with emilys/emilyspass succeeds and redirects to dashboard
3. Auth token is attached to subsequent API requests (check Network tab)
4. User info shows in toolbar after login
5. Logout clears state and redirects to login
6. Protected routes redirect to login when not authenticated
7. Login page redirects to dashboard when already authenticated
8. Session survives page reload (sessionStorage token restore)
9. Notifications appear on inventory CRUD operations
10. Notification bell shows unread count
