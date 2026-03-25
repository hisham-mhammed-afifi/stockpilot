import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AuthStore } from '../../core/auth/auth.store';

// CONCEPT: Architecture - The login component is a thin UI layer.
// It collects credentials and dispatches them to AuthStore.login().
// All auth logic (API call, token storage, navigation) lives in the store.
// The component just reads store signals for loading/error state.
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        @if (authStore.isLoading()) {
          <mat-progress-bar mode="indeterminate" />
        }

        <mat-card-header>
          <mat-icon mat-card-avatar class="login-icon">lock</mat-icon>
          <mat-card-title>StockPilot Login</mat-card-title>
          <mat-card-subtitle>Sign in to manage your inventory</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          @if (authStore.errorMessage(); as error) {
            <div class="error-banner">
              <mat-icon>error_outline</mat-icon>
              <span>{{ error }}</span>
            </div>
          }

          <form (ngSubmit)="onLogin()" class="login-form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Username</mat-label>
              <input
                matInput
                [(ngModel)]="username"
                name="username"
                required
                placeholder="Enter your username"
              />
              <mat-icon matSuffix>person</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input
                matInput
                [type]="hidePassword() ? 'password' : 'text'"
                [(ngModel)]="password"
                name="password"
                required
                placeholder="Enter your password"
              />
              <button
                mat-icon-button
                matSuffix
                type="button"
                (click)="hidePassword.set(!hidePassword())"
              >
                <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
            </mat-form-field>

            <button
              mat-raised-button
              color="primary"
              type="submit"
              class="full-width login-button"
              [disabled]="authStore.isLoading() || !username || !password"
            >
              @if (authStore.isLoading()) {
                Signing in...
              } @else {
                Sign In
              }
            </button>
          </form>

          <p class="hint-text">
            Hint: Use <strong>emilys</strong> / <strong>emilyspass</strong>
          </p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: `
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 60vh;
      padding: 24px;
    }

    .login-card {
      max-width: 420px;
      width: 100%;
    }

    .login-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: var(--mat-sys-primary);
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 24px;
    }

    .full-width {
      width: 100%;
    }

    .login-button {
      margin-top: 8px;
      padding: 8px;
    }

    .error-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      border-radius: 8px;
      background: var(--mat-sys-error-container, #fce4ec);
      color: var(--mat-sys-on-error-container, #b71c1c);
      margin-top: 16px;
    }

    .hint-text {
      text-align: center;
      margin-top: 16px;
      font-size: 13px;
      opacity: 0.7;
    }
  `,
})
export class LoginComponent {
  readonly authStore = inject(AuthStore);

  username = '';
  password = '';
  hidePassword = signal(true);

  onLogin() {
    if (this.username && this.password) {
      // CONCEPT: Architecture - Component dispatches to store. The store handles
      // the API call, token storage, error handling, and navigation.
      this.authStore.login({ username: this.username, password: this.password });
    }
  }
}
