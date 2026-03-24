import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

// CONCEPT: Architecture - Reusable shared UI components live in shared/ui/.
// They are purely presentational: no services, no state, just inputs and rendering.
@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="empty-state">
      <mat-icon class="empty-icon">{{ icon() }}</mat-icon>
      <h3>{{ title() }}</h3>
      @if (subtitle()) {
        <p>{{ subtitle() }}</p>
      }
    </div>
  `,
  styles: `
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      text-align: center;
    }

    .empty-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      opacity: 0.4;
      margin-bottom: 16px;
    }

    h3 {
      margin: 0 0 8px;
      font-size: 18px;
      font-weight: 500;
    }

    p {
      margin: 0;
      opacity: 0.6;
      font-size: 14px;
    }
  `,
})
export class EmptyStateComponent {
  // CONCEPT: Signal Inputs - input() creates a signal-based component input.
  // These replace the old @Input() decorator with a reactive, signal-friendly API.
  icon = input.required<string>();
  title = input.required<string>();
  subtitle = input<string>('');
}
