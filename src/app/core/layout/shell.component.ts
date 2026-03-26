import { Component, ChangeDetectionStrategy, inject, viewChild } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbar } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton, MatAnchor } from '@angular/material/button';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatBadge } from '@angular/material/badge';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { map } from 'rxjs';
import { ThemeStore } from '../theme/theme.store';
import { AuthStore } from '../auth/auth.store';
import { NotificationsStore } from '../notifications/notifications.store';
import { StoreCoordinator } from '../coordination/store-coordinator.service';

interface NavItem {
  label: string;
  route: string;
  icon: string;
  requiresAuth: boolean;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    MatSidenavModule,
    MatToolbar,
    MatListModule,
    MatIcon,
    MatIconButton,
    MatAnchor,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    MatBadge,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-toolbar color="primary" class="toolbar">
      <button mat-icon-button (click)="toggleSidenav()">
        <mat-icon>menu</mat-icon>
      </button>
      <span class="app-name">StockPilot</span>
      <span class="spacer"></span>

      <!-- CONCEPT: Global State - Reading NotificationsStore in the toolbar.
           Any part of the app can push notifications; the bell reflects the count. -->
      @if (authStore.isAuthenticated()) {
        <button
          mat-icon-button
          [matBadge]="notificationsStore.unreadCount()"
          [matBadgeHidden]="!notificationsStore.hasNotifications()"
          matBadgeColor="warn"
          matBadgeSize="small"
          [matMenuTriggerFor]="notifMenu"
          aria-label="Notifications"
        >
          <mat-icon>notifications</mat-icon>
        </button>

        <mat-menu #notifMenu="matMenu" class="notif-menu">
          <div class="notif-header" mat-menu-item disabled>
            <strong>Notifications</strong>
          </div>
          @for (notif of notificationsStore.visibleNotifications(); track notif.id) {
            <button mat-menu-item (click)="notificationsStore.dismiss(notif.id)">
              <mat-icon [class]="'notif-icon-' + notif.type">
                @switch (notif.type) {
                  @case ('success') { check_circle }
                  @case ('error') { error }
                  @case ('warning') { warning }
                  @case ('info') { info }
                }
              </mat-icon>
              <span>{{ notif.message }}</span>
            </button>
          } @empty {
            <button mat-menu-item disabled>No notifications</button>
          }
          @if (notificationsStore.hasNotifications()) {
            <button mat-menu-item (click)="notificationsStore.clearAll()">
              <mat-icon>clear_all</mat-icon>
              <span>Clear all</span>
            </button>
          }
        </mat-menu>
      }

      <button mat-icon-button aria-label="Toggle theme" (click)="themeStore.toggleTheme()">
        <mat-icon>{{ themeStore.icon() }}</mat-icon>
      </button>

      <!-- CONCEPT: Global State - AuthStore drives the toolbar UI.
           When authenticated, show user avatar + menu. Otherwise, show Login button. -->
      @if (authStore.isAuthenticated()) {
        <button mat-icon-button [matMenuTriggerFor]="userMenu" aria-label="User menu">
          <img
            [src]="authStore.userImage()"
            [alt]="authStore.userFullName()"
            class="user-avatar"
          />
        </button>
        <mat-menu #userMenu="matMenu">
          <div class="user-info" mat-menu-item disabled>
            <strong>{{ authStore.userFullName() }}</strong>
          </div>
          <button mat-menu-item (click)="authStore.logout()">
            <mat-icon>logout</mat-icon>
            <span>Logout</span>
          </button>
        </mat-menu>
      } @else {
        <a mat-button routerLink="/login">
          <mat-icon>login</mat-icon>
          Login
        </a>
      }
    </mat-toolbar>

    <mat-sidenav-container class="sidenav-container">
      <mat-sidenav
        #sidenav
        [mode]="isMobile() ? 'over' : 'side'"
        [opened]="!isMobile()"
        class="sidenav"
      >
        <mat-nav-list>
          @for (item of navItems; track item.route) {
            <!-- CONCEPT: Global State - Conditionally show nav items based on auth.
                 Protected items only appear when the user is logged in. -->
            @if (!item.requiresAuth || authStore.isAuthenticated()) {
              <a
                mat-list-item
                [routerLink]="item.route"
                routerLinkActive="active-link"
                [routerLinkActiveOptions]="{ exact: item.route === '/' }"
                (click)="isMobile() ? sidenav.close() : null"
              >
                <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
                <span matListItemTitle>{{ item.label }}</span>
              </a>
            }
          }
        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content class="content">
        <router-outlet />
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100vh;
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

    .sidenav-container {
      flex: 1;
    }

    .sidenav {
      width: 260px;
    }

    .content {
      padding: 24px;
      box-sizing: border-box;
    }

    @media (max-width: 599px) {
      .content {
        padding: 12px;
      }
    }

    .active-link {
      background-color: var(--mat-sys-surface-variant);
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      object-fit: cover;
    }

    .user-info {
      padding: 8px 16px;
    }

    .notif-header {
      padding: 8px 16px;
    }

    .notif-icon-success { color: var(--mat-sys-primary); }
    .notif-icon-error { color: var(--mat-sys-error); }
    .notif-icon-warning { color: var(--mat-sys-tertiary); }
    .notif-icon-info { color: var(--mat-sys-secondary); }
  `,
})
export class ShellComponent {
  readonly themeStore = inject(ThemeStore);
  readonly authStore = inject(AuthStore);
  readonly notificationsStore = inject(NotificationsStore);
  // CONCEPT: Eager initialization - The coordinator uses effect() in its constructor.
  // We inject it in the shell to ensure it's created early, even if no component
  // directly depends on it. Without this, the coordinator's effect() for login
  // detection wouldn't activate until some component happened to inject it.
  private coordinator = inject(StoreCoordinator);
  private breakpointObserver = inject(BreakpointObserver);
  private sidenav = viewChild<MatSidenav>('sidenav');

  isMobile = toSignal(
    this.breakpointObserver
      .observe([Breakpoints.Handset, Breakpoints.TabletPortrait])
      .pipe(map(result => result.matches)),
    { initialValue: false }
  );

  navItems: NavItem[] = [
    { label: 'Home', route: '/', icon: 'home', requiresAuth: false },
    { label: 'Signals Playground', route: '/signals-playground', icon: 'science', requiresAuth: false },
    { label: 'Products', route: '/products', icon: 'shopping_bag', requiresAuth: false },
    { label: 'Inventory', route: '/inventory', icon: 'inventory_2', requiresAuth: true },
    { label: 'Orders', route: '/orders', icon: 'receipt_long', requiresAuth: true },
    { label: 'Order Builder', route: '/order-builder', icon: 'add_shopping_cart', requiresAuth: true },
    { label: 'Dashboard', route: '/dashboard', icon: 'dashboard', requiresAuth: true },
  ];

  toggleSidenav(): void {
    this.sidenav()?.toggle();
  }
}
