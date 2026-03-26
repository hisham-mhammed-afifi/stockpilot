import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';

interface GuideEntry {
  filename: string;
  title: string;
  duration: string;
  icon: string;
}

@Component({
  selector: 'app-guide-list',
  standalone: true,
  imports: [RouterLink, MatCardModule, MatIconModule, MatListModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="guide-list">
      <h1>Workshop Presenter Guides</h1>
      <p class="subtitle">StockPilot Angular State Management Workshop</p>

      <div class="guide-grid">
        @for (guide of guides; track guide.filename) {
          <mat-card class="guide-card" [routerLink]="guide.filename">
            <mat-card-header>
              <mat-icon mat-card-avatar class="guide-icon">{{ guide.icon }}</mat-icon>
              <mat-card-title>{{ guide.title }}</mat-card-title>
              <mat-card-subtitle>{{ guide.duration }}</mat-card-subtitle>
            </mat-card-header>
          </mat-card>
        }
      </div>
    </div>
  `,
  styles: `
    .guide-list {
      max-width: 960px;
      margin: 0 auto;
      padding: 24px;
    }

    h1 {
      margin: 0 0 4px;
      font-size: 28px;
      font-weight: 500;
    }

    .subtitle {
      margin: 0 0 24px;
      opacity: 0.6;
      font-size: 16px;
    }

    .guide-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(400px, 100%), 1fr));
      gap: 16px;
    }

    .guide-card {
      cursor: pointer;
      transition: box-shadow 0.2s;
    }

    .guide-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .guide-icon {
      font-size: 24px;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: var(--mat-sys-surface-variant);
      color: var(--mat-sys-primary);
    }
  `,
})
export class GuideListComponent {
  guides: GuideEntry[] = [
    { filename: 'section-01-guide', title: 'Section 1: The Problem', duration: '~20 min', icon: 'warning' },
    { filename: 'section-02-guide', title: 'Section 2: Signals Foundation', duration: '~30 min', icon: 'sensors' },
    { filename: 'section-03-guide', title: 'Section 3: Component State', duration: '~30 min', icon: 'widgets' },
    { filename: 'section-04-guide', title: 'Section 4: SignalStore Core', duration: '~30 min', icon: 'store' },
    { filename: 'section-05-guide', title: 'Section 5: Entity CRUD', duration: '~30 min', icon: 'edit_note' },
    { filename: 'section-06-guide', title: 'Section 6: Async & Side Effects', duration: '~35 min', icon: 'sync' },
    { filename: 'section-07-guide', title: 'Section 7: Custom Features', duration: '~30 min', icon: 'extension' },
    { filename: 'section-08-guide', title: 'Section 8: Global State', duration: '~30 min', icon: 'public' },
    { filename: 'section-09-guide', title: 'Section 9: Store Architecture', duration: '~35 min', icon: 'account_tree' },
    { filename: 'section-10-guide', title: 'Section 10: Migration & Patterns', duration: '~30 min', icon: 'swap_horiz' },
  ];
}
