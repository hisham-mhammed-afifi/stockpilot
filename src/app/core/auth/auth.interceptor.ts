import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthStore } from './auth.store';

// CONCEPT: Interceptor + Store - The interceptor injects AuthStore and reads
// the accessToken signal to attach it to every outgoing request.
// Signals are synchronous, so authStore.accessToken() returns the current value
// instantly. No Observables, no async, just a function call.
// This is simpler than the old Observable-based interceptor pattern.
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
