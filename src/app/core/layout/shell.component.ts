import { Component, ChangeDetectionStrategy, inject, signal, viewChild, OnInit, OnDestroy } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { Subscription } from 'rxjs';
import { ThemeService } from '../theme/theme.store';

interface NavItem {
  label: string;
  route: string;
  icon: string;
  disabled: boolean;
  section?: string;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
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
      <button mat-icon-button aria-label="Toggle theme" (click)="themeService.toggleTheme()">
        <mat-icon>{{ themeService.icon() }}</mat-icon>
      </button>
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
            @if (item.disabled) {
              <a mat-list-item [class.disabled-link]="true">
                <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
                <span matListItemTitle>{{ item.label }}</span>
                <span matListItemLine class="coming-soon">{{ item.section }}</span>
              </a>
            } @else {
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
    }

    .active-link {
      background-color: rgba(0, 0, 0, 0.04);
    }

    .disabled-link {
      opacity: 0.5;
      pointer-events: none;
    }

    .coming-soon {
      font-size: 11px;
      color: rgba(0, 0, 0, 0.54);
    }
  `,
})
export class ShellComponent implements OnInit, OnDestroy {
  readonly themeService = inject(ThemeService);
  private breakpointObserver = inject(BreakpointObserver);
  private subscription?: Subscription;
  private sidenav = viewChild<MatSidenav>('sidenav');

  isMobile = signal(false);

  navItems: NavItem[] = [
    { label: 'Home', route: '/', icon: 'home', disabled: false },
    { label: 'Signals Playground', route: '/signals-playground', icon: 'science', disabled: false },
    { label: 'Products', route: '/products', icon: 'shopping_bag', disabled: true, section: 'Section 3 - Coming Soon' },
    { label: 'Inventory', route: '/inventory', icon: 'inventory_2', disabled: true, section: 'Section 4 - Coming Soon' },
    { label: 'Orders', route: '/orders', icon: 'receipt_long', disabled: true, section: 'Section 6 - Coming Soon' },
    { label: 'Order Builder', route: '/order-builder', icon: 'add_shopping_cart', disabled: true, section: 'Section 7 - Coming Soon' },
    { label: 'Dashboard', route: '/dashboard', icon: 'dashboard', disabled: true, section: 'Section 9 - Coming Soon' },
  ];

  ngOnInit(): void {
    this.subscription = this.breakpointObserver
      .observe([Breakpoints.Handset])
      .subscribe(result => this.isMobile.set(result.matches));
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  toggleSidenav(): void {
    this.sidenav()?.toggle();
  }
}
