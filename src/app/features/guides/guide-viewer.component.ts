import { Component, ChangeDetectionStrategy, inject, input, signal, effect, ViewEncapsulation } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { marked } from 'marked';

@Component({
  selector: 'app-guide-viewer',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, MatProgressBarModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="guide-viewer">
      <div class="guide-toolbar">
        <a mat-button routerLink="/guides">
          <mat-icon>arrow_back</mat-icon>
          Back to Guides
        </a>
      </div>

      @if (loading()) {
        <mat-progress-bar mode="indeterminate" />
      }

      @if (error()) {
        <div class="guide-error">
          <mat-icon>error_outline</mat-icon>
          <h3>Guide not found</h3>
          <p>Could not load "{{ filename() }}"</p>
          <a mat-flat-button routerLink="/guides">Back to Guides</a>
        </div>
      }

      @if (htmlContent()) {
        <article class="markdown-body" [innerHTML]="htmlContent()"></article>
      }
    </div>
  `,
  styles: `
    .guide-viewer {
      max-width: 960px;
      margin: 0 auto;
      padding: 16px 24px 48px;
    }

    .guide-toolbar {
      margin-bottom: 16px;
    }

    .guide-error {
      text-align: center;
      padding: 48px 24px;
    }

    .guide-error mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      opacity: 0.4;
    }

    .guide-error h3 {
      margin: 16px 0 8px;
    }

    .guide-error p {
      opacity: 0.6;
      margin-bottom: 16px;
    }

    /* Markdown rendering styles */
    .markdown-body {
      font-size: 15px;
      line-height: 1.7;
      color: var(--mat-sys-on-surface);
    }

    .markdown-body h1 {
      font-size: 28px;
      font-weight: 500;
      margin: 32px 0 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
    }

    .markdown-body h2 {
      font-size: 22px;
      font-weight: 500;
      margin: 28px 0 12px;
      padding-bottom: 6px;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
    }

    .markdown-body h3 {
      font-size: 18px;
      font-weight: 500;
      margin: 24px 0 8px;
    }

    .markdown-body h4 {
      font-size: 16px;
      font-weight: 600;
      margin: 20px 0 8px;
    }

    .markdown-body p {
      margin: 0 0 12px;
    }

    .markdown-body ul, .markdown-body ol {
      margin: 0 0 12px;
      padding-left: 28px;
    }

    .markdown-body li {
      margin-bottom: 4px;
    }

    .markdown-body li input[type="checkbox"] {
      margin-right: 8px;
    }

    .markdown-body blockquote {
      margin: 12px 0;
      padding: 8px 16px;
      border-left: 4px solid var(--mat-sys-primary);
      background: color-mix(in srgb, var(--mat-sys-primary) 8%, transparent);
      border-radius: 0 4px 4px 0;
    }

    .markdown-body blockquote p {
      margin: 0;
    }

    .markdown-body code {
      font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
      font-size: 13px;
      background: var(--mat-sys-surface-variant);
      padding: 2px 6px;
      border-radius: 3px;
    }

    .markdown-body pre {
      margin: 12px 0;
      padding: 16px;
      background: #1e1e1e;
      color: #d4d4d4;
      border-radius: 8px;
      overflow-x: auto;
    }

    .markdown-body pre code {
      background: none;
      padding: 0;
      color: inherit;
      font-size: 13px;
    }

    .markdown-body table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      font-size: 14px;
    }

    .markdown-body th, .markdown-body td {
      border: 1px solid var(--mat-sys-outline-variant);
      padding: 8px 12px;
      text-align: left;
    }

    .markdown-body th {
      background: var(--mat-sys-surface-variant);
      font-weight: 600;
    }

    .markdown-body hr {
      border: none;
      border-top: 2px solid var(--mat-sys-outline-variant);
      margin: 24px 0;
    }

    .markdown-body strong {
      font-weight: 600;
    }

    .markdown-body a {
      color: var(--mat-sys-primary);
      text-decoration: none;
    }

    .markdown-body a:hover {
      text-decoration: underline;
    }
  `,
})
export class GuideViewerComponent {
  private http = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);

  filename = input.required<string>();
  loading = signal(false);
  error = signal(false);
  htmlContent = signal<SafeHtml | null>(null);

  constructor() {
    effect(() => {
      const name = this.filename();
      if (!name) return;
      this.loadGuide(name);
    });
  }

  private async loadGuide(name: string) {
    this.loading.set(true);
    this.error.set(false);
    this.htmlContent.set(null);

    this.http.get(`/guides/${name}.md`, { responseType: 'text' }).subscribe({
      next: async (markdown) => {
        const html = await marked.parse(markdown);
        this.htmlContent.set(this.sanitizer.bypassSecurityTrustHtml(html));
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }
}
