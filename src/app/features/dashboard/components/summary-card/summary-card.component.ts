// src/app/features/dashboard/components/summary-card/summary-card.component.ts
import { Component, Input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { MonthSummary } from '../../dashboard.service';

@Component({
  selector: 'app-summary-card',
  standalone: true,
  imports: [TranslateModule],
  template: `
    @if (summary) {
      <div class="fmf-card summary-card">
        <p class="metric-label">{{ 'dashboard.net_worth' | translate }}</p>
        <p class="hero-value">{{ formatTotal(summary.total) }}</p>

        <div class="divider"></div>

        <div class="metrics-row">
          <div class="metric">
            <p class="metric-label">{{ 'dashboard.delta_label' | translate }}</p>
            @if (summary.delta !== null) {
              <span class="pill" [class.pill-positive]="summary.delta >= 0"
                                 [class.pill-negative]="summary.delta < 0">
                {{ formatDelta(summary.delta) }}
              </span>
            } @else {
              <span class="pill pill-neutral">{{ 'dashboard.na' | translate }}</span>
            }
          </div>
          <div class="metric">
            <p class="metric-label">{{ 'dashboard.saving_rate' | translate }}</p>
            @if (summary.savingPct !== null) {
              <span class="pill" [class.pill-positive]="summary.savingPct >= 0"
                                 [class.pill-negative]="summary.savingPct < 0">
                {{ formatSavingPct(summary.savingPct) }}
              </span>
            } @else {
              <span class="pill pill-neutral">{{ 'dashboard.na' | translate }}</span>
            }
          </div>
          <div class="metric">
            <p class="metric-label">{{ 'dashboard.income_label' | translate }}</p>
            @if (summary.income > 0) {
              <span class="pill pill-income">{{ formatIncome(summary.income) }}</span>
            } @else {
              <span class="pill pill-neutral">{{ 'dashboard.na' | translate }}</span>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .summary-card { margin-bottom: 1.25rem; box-shadow: var(--shadow-raised); }
    .metric-label { margin: 0; font-size: 0.8rem; font-weight: 500; color: #6b7280; }
    .hero-value {
      margin: 0.25rem 0 0;
      font-size: 2.25rem;
      font-weight: 800;
      color: #1a2e1a;
      letter-spacing: -0.02em;
      line-height: 1;
      animation: reveal 0.5s ease-out;
    }
    @keyframes reveal {
      from { opacity: 0; transform: translateY(6px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .divider { height: 1px; background: #f0fdf4; margin: 1rem 0; }
    .metrics-row { display: flex; gap: 2rem; flex-wrap: wrap; }
    .metric { display: flex; flex-direction: column; gap: 0.4rem; }
    .pill {
      display: inline-flex;
      align-items: center;
      font-size: 0.95rem;
      font-weight: 600;
      padding: 0.3rem 0.75rem;
      border-radius: 999px;
    }
    .pill-positive { background: #dcfce7; color: #15803d; }
    .pill-negative { background: #fee2e2; color: #b91c1c; }
    .pill-neutral  { background: #f3f4f6; color: #6b7280; }
    .pill-income   { background: #e0f2fe; color: #0369a1; }
  `],
})
export class SummaryCardComponent {
  @Input() summary: MonthSummary | null = null;

  formatTotal(total: number): string {
    return '€ ' + total.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatDelta(delta: number): string {
    const sign = delta >= 0 ? '+' : '';
    return `${sign}${delta.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
  }

  formatSavingPct(pct: number): string {
    return pct.toLocaleString('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%';
  }

  formatIncome(income: number): string {
    return '€ ' + income.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
