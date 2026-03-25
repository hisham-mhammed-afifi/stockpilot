import { computed, effect, inject, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { signalStore, withState, withComputed, withMethods, withHooks, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';
import { pipe, switchMap, exhaustMap, tap, EMPTY } from 'rxjs';
import { User } from '../../shared/models/user.model';
import { AuthApiService } from './auth-api.service';
import { AuthStatus, LoginRequest } from './auth.models';
import { StoreCoordinator } from '../coordination/store-coordinator.service';

// CONCEPT: Global State - AuthStore uses providedIn: 'root' so it lives for the
// entire app lifetime. Guards, interceptors, components, and other stores can all
// inject it and read its signals synchronously.
type AuthState = {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  status: AuthStatus;
  errorMessage: string | null;
};

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  status: 'idle',
  errorMessage: null,
};

export const AuthStore = signalStore(
  { providedIn: 'root' },

  withState(initialState),

  // CONCEPT: Global computed signals - Available anywhere in the app.
  // Guards, interceptors, components, other stores can all read these.
  // Because signals are synchronous, there is no need for async pipes or subscriptions.
  withComputed((store) => ({
    isAuthenticated: computed(() => store.status() === 'authenticated'),
    userFullName: computed(() => {
      const user = store.user();
      return user ? `${user.firstName} ${user.lastName}` : '';
    }),
    userImage: computed(() => store.user()?.image ?? ''),
    isLoading: computed(() => store.status() === 'loading'),
  })),

  // CONCEPT: Circular dependency prevention - StoreCoordinator injects AuthStore,
  // so AuthStore cannot inject StoreCoordinator directly. We use Injector for lazy resolution.
  withMethods((store, authApi = inject(AuthApiService), router = inject(Router), injector = inject(Injector)) => ({
    // CONCEPT: Login flow with exhaustMap - exhaustMap ignores new emissions while
    // a previous one is still in-flight. This prevents double-login on rapid clicks.
    // Compare with switchMap (cancels previous) and concatMap (queues all).
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
                // CONCEPT: Global store coordination - The store owns navigation logic
                // because it knows the full auth state. The login component just dispatches credentials.
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
      // CONCEPT: Coordinator call before state cleanup - We notify the coordinator
      // BEFORE clearing state so it can still read the current user for logging.
      injector.get(StoreCoordinator).onLogout();
      patchState(store, {
        user: null,
        accessToken: null,
        refreshToken: null,
        status: 'idle',
        errorMessage: null,
      });
      router.navigate(['/login']);
    },

    // CONCEPT: Session restoration - On app start, if a token exists in sessionStorage,
    // we call /auth/me to validate it and restore the user profile.
    // switchMap cancels any in-flight restore if called again.
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
                // Token expired or invalid, clear it
                patchState(store, { status: 'idle', accessToken: null, refreshToken: null });
              },
            })
          )
        )
      )
    ),

    // CONCEPT: Token refresh - Uses switchMap because we only care about the latest
    // refresh attempt. If no refresh token exists, returns EMPTY (completes immediately).
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
                  user: null,
                  accessToken: null,
                  refreshToken: null,
                  status: 'idle',
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

  // CONCEPT: withHooks - Store lifecycle. onInit runs when the store is first injected.
  // For root-provided stores, that happens early in the app lifecycle.
  withHooks({
    onInit(store) {
      // CONCEPT: Session restoration - Check sessionStorage for saved tokens on app start.
      // If a token exists, attempt to validate it by calling /auth/me.
      const savedToken = sessionStorage.getItem('stockpilot_access_token');
      if (savedToken) {
        patchState(store, { accessToken: savedToken });
        store.restoreSession(savedToken);
      }

      // CONCEPT: effect() for persistence - effect() watches all signals read inside it.
      // When accessToken() changes, this effect auto-saves or removes it from sessionStorage.
      // This is a valid use of effect(): synchronizing signal state to external storage.
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
