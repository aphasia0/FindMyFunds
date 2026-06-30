// src/app/features/dashboard/dashboard.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DashboardService, MonthSummary, CompositionItem } from './dashboard.service';
import { SummaryCardComponent } from './components/summary-card/summary-card.component';
import { PatrimonioChartComponent } from './components/patrimonio-chart/patrimonio-chart.component';
import { MonthlyMetricsChartComponent } from './components/monthly-metrics-chart/monthly-metrics-chart.component';
import { CompositionBarComponent } from './components/composition-bar/composition-bar.component';

const MONTH_LABELS = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, TranslateModule, ButtonModule,
            SummaryCardComponent, PatrimonioChartComponent,
            MonthlyMetricsChartComponent, CompositionBarComponent],
  template: `
    <h1 class="page-title">{{ 'dashboard.title' | translate }}</h1>

    <div class="window-nav fmf-card">
      <p-button icon="pi pi-chevron-left" [text]="true" (onClick)="shiftWindow(-1)" />
      <span class="window-label">{{ windowLabel }}</span>
      <p-button icon="pi pi-chevron-right" [text]="true" (onClick)="shiftWindow(1)"
                [disabled]="isAtOrPastToday" />
      @if (!isAtOrPastToday) {
        <p-button size="small" severity="secondary"
                  [label]="'dashboard.today' | translate" (onClick)="goToToday()" />
      }
    </div>

    @if (currentSummary) {
      <app-summary-card [summary]="currentSummary" />
    }

    @if (showNoCta) {
      <div class="fmf-card cta-banner mb-3">
        <span>{{ 'dashboard.no_data_title' | translate }}</span>
        <p-button routerLink="/entry" [label]="'dashboard.no_data_cta' | translate"
                  icon="pi pi-plus" size="small" />
      </div>
    }

    @if (summaries.length > 0) {
      <app-patrimonio-chart [summaries]="summaries" />
      <app-monthly-metrics-chart [summaries]="summaries" />
      <app-composition-bar [items]="composition" />
    }
  `,
  styles: [`
    .cta-banner { display: flex; align-items: center; justify-content: space-between;
                  flex-wrap: wrap; gap: 0.75rem; background: #e0e7ff; border: 1px solid #a5b4fc; }
    .window-nav { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; padding: 0.5rem 0.75rem; }
    .window-label { font-weight: 500; flex: 1; text-align: center; }
  `],
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);

  private allSnapshots: any[] = [];
  private allIncome: any[] = [];

  windowEnd = (() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  })();

  summaries: MonthSummary[] = [];
  composition: CompositionItem[] = [];
  currentSummary: MonthSummary | null = null;
  showNoCta = false;

  get isAtOrPastToday(): boolean {
    const now = new Date();
    const cy = now.getFullYear(), cm = now.getMonth() + 1;
    return this.windowEnd.year > cy ||
      (this.windowEnd.year === cy && this.windowEnd.month >= cm);
  }

  get windowLabel(): string {
    const months = this.dashboardService.getMonthsWindow(this.windowEnd);
    const s = months[0], e = months[months.length - 1];
    return `${MONTH_LABELS[s.month - 1]} ${s.year} – ${MONTH_LABELS[e.month - 1]} ${e.year}`;
  }

  async ngOnInit() {
    try {
      const { snapshots, income } = await this.dashboardService.loadAllData();
      this.allSnapshots = snapshots;
      this.allIncome = income;
      this.recompute();
    } catch (e) {
      console.error('Dashboard load error', e);
    }
  }

  shiftWindow(months: number) {
    const d = new Date(this.windowEnd.year, this.windowEnd.month - 1 + months, 1);
    this.windowEnd = { year: d.getFullYear(), month: d.getMonth() + 1 };
    this.recompute();
  }

  goToToday() {
    const now = new Date();
    this.windowEnd = { year: now.getFullYear(), month: now.getMonth() + 1 };
    this.recompute();
  }

  private recompute() {
    const { summaries, composition } = this.dashboardService.computeWindow(
      this.allSnapshots, this.allIncome, this.windowEnd
    );
    this.summaries = summaries;
    this.composition = composition;
    this.currentSummary = summaries[summaries.length - 1] ?? null;
    this.showNoCta = this.currentSummary?.total === 0;
  }
}
