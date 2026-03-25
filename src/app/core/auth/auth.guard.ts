import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from './auth.store';

// CONCEPT: Functional Guards + Store - authGuard reads authStore.isAuthenticated()
// synchronously. If false, redirect to login. If true, allow navigation.
// No class, no Observable, no canActivate interface. Just a function.
// This is the modern Angular approach to route guards.
export const authGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (authStore.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};

// CONCEPT: Reverse guard - Prevents authenticated users from seeing the login page.
// If already logged in, redirect to dashboard. This avoids confusion.
export const guestGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (!authStore.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};
