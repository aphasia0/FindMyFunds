import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { Account, AccountType } from '../../core/models';
import { DashboardService, MonthSummary, CompositionItem, DashboardSelection } from './dashboard.service';
import { SummaryCardComponent } from './components/summary-card/summary-card.component';
import { PatrimonioChartComponent } from './components/patrimonio-chart/patrimonio-chart.component';
import { MonthlyMetricsChartComponent } from './components/monthly-metrics-chart/monthly-metrics-chart.component';
import { CompositionBarComponent } from './components/composition-bar/composition-bar.component';

const MONTH_LABELS = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
const TYPE_OPTIONS: AccountType[] = ['cash', 'bond', 'etf', 'stock', 'asset'];

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

    <div class="selection-toolbar fmf-card">
      <div class="selection-row">
        <button type="button" class="filter-chip" [class.active]="!selectedType && !selectedAccountId" (click)="clearSelection()">
          Tutto
        </button>
        @for (type of typeOptions; track type) {
          <button type="button" class="filter-chip" [class.active]="selectedType === type" (click)="selectType(type)">
            {{ 'accounts.types.' + type | translate }}
          </button>
        }
      </div>

      @if (allAccounts.length > 0) {
        <div class="selection-row account-row">
          @for (account of allAccounts; track account.id) {
            <button type="button" class="filter-chip account-chip" [class.active]="selectedAccountId === account.id" (click)="selectAccount(account.id)">
              {{ account.name }}
            </button>
          }
        </div>
      }

      @if (selectionLabel) {
        <div class="selection-summary">Selezione attiva: {{ selectionLabel }}</div>
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
      <app-composition-bar
        [items]="composition"
        [selectedType]="selectedType"
        (typeSelected)="selectType($event)" />
    }
  `,
  styles: [`
    .cta-banner { display: flex; align-items: center; justify-content: space-between;
                  flex-wrap: wrap; gap: 0.75rem; background: #e0e7ff; border: 1px solid #a5b4fc; }
    .window-nav { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; padding: 0.5rem 0.75rem; }
    .window-label { font-weight: 500; flex: 1; text-align: center; }
    .selection-toolbar { margin-bottom: 1.25rem; padding: 1rem; }
    .selection-row { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .selection-summary {
      margin-top: 0.75rem; font-size: 0.8rem; color: #4b5563; font-weight: 600;
    }
    .filter-chip {
      appearance: none; border: 1px solid #dbeafe; background: #f8fafc; color: #1f2937;
      border-radius: 999px; padding: 0.45rem 0.8rem; font-size: 0.8rem; cursor: pointer;
      transition: all 0.2s ease;
    }
    .filter-chip:hover {
      background: #eef2ff; border-color: #c7d2fe;
    }
    .filter-chip.active {
      background: #4f46e5; color: white; border-color: #4f46e5; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
    }
    .account-row { margin-top: 0.75rem; }
  `],
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);

  private allSnapshots: any[] = [];
  private allIncome: any[] = [];

  allAccounts: Account[] = [];
  selectedType: AccountType | null = null;
  selectedAccountId: string | null = null;
  typeOptions: AccountType[] = TYPE_OPTIONS;

  windowEnd = (() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  })();

  summaries: MonthSummary[] = [];
  composition: CompositionItem[] = [];
  currentSummary: MonthSummary | null = null;
  showNoCta = false;

  get selectedAccount(): Account | null {
    return this.allAccounts.find(a => a.id === this.selectedAccountId) ?? null;
  }

  get selectionLabel(): string {
    if (this.selectedAccount) return this.selectedAccount.name;
    if (this.selectedType) return `Tipo: ${this.selectedType}`;
    return '';
  }

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
      const { snapshots, income, accounts } = await this.dashboardService.loadAllData();
      this.allSnapshots = snapshots;
      this.allIncome = income;
      this.allAccounts = accounts;
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

  clearSelection() {
    this.selectedType = null;
    this.selectedAccountId = null;
    this.recompute();
  }

  selectType(type: AccountType | null) {
    if (type === null) {
      this.selectedType = null;
      this.selectedAccountId = null;
    } else {
      this.selectedType = this.selectedType === type ? null : type;
      this.selectedAccountId = null;
    }
    this.recompute();
  }

  selectAccount(accountId: string | null) {
    if (accountId === null) {
      this.selectedAccountId = null;
    } else {
      this.selectedAccountId = this.selectedAccountId === accountId ? null : accountId;
    }
    this.selectedType = null;
    this.recompute();
  }

  private recompute() {
    const { summaries, composition } = this.dashboardService.computeWindow(
      this.allSnapshots,
      this.allIncome,
      this.windowEnd,
      { type: this.selectedType, accountId: this.selectedAccountId }
    );
    this.summaries = summaries;
    this.composition = composition;
    this.currentSummary = summaries[summaries.length - 1] ?? null;
    this.showNoCta = this.currentSummary?.total === 0;
  }
}
