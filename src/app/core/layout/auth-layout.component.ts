import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { MatToolbar } from '@angular/material/toolbar';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton, MatIconAnchor } from '@angular/material/button';
import { RouterOutlet, RouterLink } from '@angular/router';
import { ThemeStore } from '../theme/theme.store';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [
    MatToolbar,
    MatIcon,
    MatIconButton,
    MatIconAnchor,
    RouterOutlet,
    RouterLink,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-toolbar color="primary" class="toolbar">
      <a mat-icon-button routerLink="/" aria-label="Back to home">
        <mat-icon>arrow_back</mat-icon>
      </a>
      <span class="app-name">StockPilot</span>
      <span class="spacer"></span>
      <button mat-icon-button aria-label="Toggle theme" (click)="themeStore.toggleTheme()">
        <mat-icon>{{ themeStore.icon() }}</mat-icon>
      </button>
    </mat-toolbar>

    <div class="content">
      <router-outlet />
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100vh;
    }

    .content {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .toolbar {
      position: sticky;
      top: 0;
      z-index: 1000;
    }

    .app-name {
      margin-left: 8px;
      font-weight: 500;
    }

    .spacer {
      flex: 1 1 auto;
    }
  `,
})
export class AuthLayoutComponent {
  readonly themeStore = inject(ThemeStore);
}
