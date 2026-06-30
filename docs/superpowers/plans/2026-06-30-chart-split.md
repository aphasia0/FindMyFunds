# Chart Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sostituire `NetWorthChartComponent` con due componenti separati: `PatrimonioChartComponent` (barre patrimonio) e `MonthlyMetricsChartComponent` (linee Delta + Entrate).

**Architecture:** Entrambi i componenti ricevono `summaries: MonthSummary[]` da `DashboardComponent` che già gestisce la finestra temporale — nessuna logica aggiuntiva necessaria. `NetWorthChartComponent` viene eliminato. `DashboardComponent` aggiorna import e template.

**Tech Stack:** Angular 17 standalone components, Chart.js 4, ng2-charts (`BaseChartDirective`), chartjs-plugin-zoom, TypeScript strict mode.

## Global Constraints

- Angular `@if/@else` control flow — no `*ngIf`
- Standalone components: ogni componente dichiara i propri `imports`
- `Chart.register(zoomPlugin)` a livello di modulo in ogni file che usa lo zoom plugin
- `maintainAspectRatio: false`, `canvas { max-height: 280px }`
- `touch-action: pan-y` normalmente; `touch-action: none` solo in fullscreen CSS
- `type="bar"` sul `<canvas baseChart>` per grafici misti; `type="line"` per solo linee
- Nessun commento nel codice salvo per logica non ovvia

---

## File Map

| Azione | Path |
|--------|------|
| Create | `src/app/features/dashboard/components/patrimonio-chart/patrimonio-chart.component.ts` |
| Create | `src/app/features/dashboard/components/monthly-metrics-chart/monthly-metrics-chart.component.ts` |
| Modify | `src/app/features/dashboard/dashboard.component.ts` |
| Delete | `src/app/features/dashboard/components/net-worth-chart/net-worth-chart.component.ts` |

---

### Task 1: PatrimonioChartComponent

**Files:**
- Create: `src/app/features/dashboard/components/patrimonio-chart/patrimonio-chart.component.ts`

**Interfaces:**
- Consumes: `MonthSummary` da `src/app/features/dashboard/dashboard.service.ts` — ha i campi `month: number`, `year: number`, `total: number`
- Produces: selettore `<app-patrimonio-chart [summaries]="summaries" />` — usato nel Task 3

- [ ] **Step 1: Crea il file del componente**

```typescript
// src/app/features/dashboard/components/patrimonio-chart/patrimonio-chart.component.ts
import { Component, Input, OnChanges, ViewChild, ElementRef } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, Chart } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import { MonthSummary } from '../../dashboard.service';

Chart.register(zoomPlugin);

const MONTHS = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];
const PATRIMONIO_COLOR = '#4ade80';
const PATRIMONIO_LAST  = '#16a34a';

@Component({
  selector: 'app-patrimonio-chart',
  standalone: true,
  imports: [BaseChartDirective],
  template: `
    <div #chartWrap class="fmf-card chart-wrap">
      <div class="chart-toolbar">
        <button class="fs-btn" (click)="toggleFullscreen()"
                [title]="isFullscreen ? 'Esci da schermo intero' : 'Schermo intero'">
          @if (!isFullscreen) {
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
              <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
            </svg>
          } @else {
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round">
              <polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/>
              <line x1="10" y1="14" x2="3" y2="21"/><line x1="21" y1="3" x2="14" y2="10"/>
            </svg>
          }
        </button>
      </div>
      <canvas baseChart [data]="chartData" [options]="chartOptions" type="bar"></canvas>
    </div>
  `,
  styles: [`
    .chart-wrap { margin-bottom: 1.25rem; position: relative; }
    .chart-wrap:fullscreen, .chart-wrap:-webkit-full-screen {
      background: white; display: flex; flex-direction: column; padding: 1.5rem; margin: 0;
    }
    .chart-wrap:fullscreen canvas, .chart-wrap:-webkit-full-screen canvas {
      max-height: none !important; flex: 1;
    }
    canvas { max-height: 280px; touch-action: pan-y; }
    .chart-wrap:fullscreen canvas, .chart-wrap:-webkit-full-screen canvas { touch-action: none; }
    .chart-toolbar { display: flex; justify-content: flex-end; margin-bottom: 0.4rem; }
    .fs-btn {
      display: flex; align-items: center; justify-content: center;
      width: 2rem; height: 2rem; border-radius: 6px;
      border: 1px solid #d1fae5; background: #f0fdf4; color: #15803d; cursor: pointer;
    }
    .fs-btn:hover { background: #dcfce7; }
  `],
})
export class PatrimonioChartComponent implements OnChanges {
  @Input() summaries: MonthSummary[] = [];
  @ViewChild('chartWrap') chartWrap!: ElementRef<HTMLDivElement>;

  isFullscreen = false;
  chartData: ChartData = { labels: [], datasets: [] };

  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    animation: { duration: 700, easing: 'easeInOutQuart' },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `  Patrimonio: € ${Number(ctx.raw).toLocaleString('it-IT')}`,
        },
      },
      zoom: {
        pan: { enabled: true, mode: 'x' },
        zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x' },
      },
    } as any,
    scales: {
      x: { grid: { display: false }, ticks: { maxRotation: 45 } },
      y: {
        position: 'left',
        title: { display: true, text: 'Patrimonio (€)', color: '#16a34a' },
        ticks: {
          color: '#16a34a',
          callback: v => `€ ${(Number(v) / 1000).toFixed(0)}k`,
        },
        grid: { color: '#f0fdf4' },
      },
    },
  };

  toggleFullscreen() {
    const el = this.chartWrap.nativeElement;
    if (!document.fullscreenElement) {
      el.requestFullscreen().then(() => { this.isFullscreen = true; });
    } else {
      document.exitFullscreen().then(() => { this.isFullscreen = false; });
    }
  }

  ngOnChanges() {
    const lastIdx = this.summaries.length - 1;
    this.chartData = {
      labels: this.summaries.map(s => `${MONTHS[s.month - 1]} ${String(s.year).slice(2)}`),
      datasets: [{
        type: 'bar' as const,
        label: 'Patrimonio',
        data: this.summaries.map(s => s.total),
        backgroundColor: this.summaries.map((_, i) =>
          i === lastIdx ? PATRIMONIO_LAST : PATRIMONIO_COLOR
        ),
        borderRadius: 6,
        yAxisID: 'y',
      }],
    };
  }
}
```

- [ ] **Step 2: Verifica compilazione**

```bash
npx tsc --noEmit
```

Expected: nessun output (zero errori).

- [ ] **Step 3: Commit**

```bash
git add src/app/features/dashboard/components/patrimonio-chart/patrimonio-chart.component.ts
git commit -m "feat: add PatrimonioChartComponent (bars only)"
```

---

### Task 2: MonthlyMetricsChartComponent

**Files:**
- Create: `src/app/features/dashboard/components/monthly-metrics-chart/monthly-metrics-chart.component.ts`

**Interfaces:**
- Consumes: `MonthSummary` da `src/app/features/dashboard/dashboard.service.ts` — ha i campi `month: number`, `year: number`, `delta: number | null`, `income: number`
- Produces: selettore `<app-monthly-metrics-chart [summaries]="summaries" />` — usato nel Task 3

- [ ] **Step 1: Crea il file del componente**

```typescript
// src/app/features/dashboard/components/monthly-metrics-chart/monthly-metrics-chart.component.ts
import { Component, Input, OnChanges, ViewChild, ElementRef } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, Chart, TooltipItem } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import { MonthSummary } from '../../dashboard.service';

Chart.register(zoomPlugin);

const MONTHS = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];
const DELTA_LINE         = '#f97316';
const DELTA_DOT_POSITIVE = '#22c55e';
const DELTA_DOT_NEGATIVE = '#ef4444';
const INCOME_LINE        = '#06b6d4';

@Component({
  selector: 'app-monthly-metrics-chart',
  standalone: true,
  imports: [BaseChartDirective],
  template: `
    <div #chartWrap class="fmf-card chart-wrap">
      <div class="chart-toolbar">
        <button class="fs-btn" (click)="toggleFullscreen()"
                [title]="isFullscreen ? 'Esci da schermo intero' : 'Schermo intero'">
          @if (!isFullscreen) {
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
              <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
            </svg>
          } @else {
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round">
              <polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/>
              <line x1="10" y1="14" x2="3" y2="21"/><line x1="21" y1="3" x2="14" y2="10"/>
            </svg>
          }
        </button>
      </div>
      <canvas baseChart [data]="chartData" [options]="chartOptions" type="line"></canvas>
    </div>
  `,
  styles: [`
    .chart-wrap { margin-bottom: 1.25rem; position: relative; }
    .chart-wrap:fullscreen, .chart-wrap:-webkit-full-screen {
      background: white; display: flex; flex-direction: column; padding: 1.5rem; margin: 0;
    }
    .chart-wrap:fullscreen canvas, .chart-wrap:-webkit-full-screen canvas {
      max-height: none !important; flex: 1;
    }
    canvas { max-height: 280px; touch-action: pan-y; }
    .chart-wrap:fullscreen canvas, .chart-wrap:-webkit-full-screen canvas { touch-action: none; }
    .chart-toolbar { display: flex; justify-content: flex-end; margin-bottom: 0.4rem; }
    .fs-btn {
      display: flex; align-items: center; justify-content: center;
      width: 2rem; height: 2rem; border-radius: 6px;
      border: 1px solid #d1fae5; background: #f0fdf4; color: #15803d; cursor: pointer;
    }
    .fs-btn:hover { background: #dcfce7; }
  `],
})
export class MonthlyMetricsChartComponent implements OnChanges {
  @Input() summaries: MonthSummary[] = [];
  @ViewChild('chartWrap') chartWrap!: ElementRef<HTMLDivElement>;

  isFullscreen = false;
  chartData: ChartData = { labels: [], datasets: [] };

  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    animation: { duration: 700, easing: 'easeInOutQuart' },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: { usePointStyle: true, pointStyleWidth: 10, boxHeight: 8 },
      },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<'line'>) => {
            const val = Number(ctx.raw);
            if (ctx.datasetIndex === 0) {
              const sign = val > 0 ? '+' : '';
              return `  Delta: ${sign}€ ${val.toLocaleString('it-IT')}`;
            }
            return `  Entrate: € ${val.toLocaleString('it-IT')}`;
          },
        },
      },
      zoom: {
        pan: { enabled: true, mode: 'x' },
        zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x' },
      },
    } as any,
    scales: {
      x: { grid: { display: false }, ticks: { maxRotation: 45 } },
      y: {
        position: 'right',
        title: { display: true, text: 'Mensile (€)', color: '#f97316' },
        ticks: {
          color: '#f97316',
          callback: v => {
            const n = Number(v);
            return (n >= 0 ? '+' : '') + `€ ${(n / 1000).toFixed(0)}k`;
          },
        },
        grid: { drawOnChartArea: false },
      },
    },
  };

  toggleFullscreen() {
    const el = this.chartWrap.nativeElement;
    if (!document.fullscreenElement) {
      el.requestFullscreen().then(() => { this.isFullscreen = true; });
    } else {
      document.exitFullscreen().then(() => { this.isFullscreen = false; });
    }
  }

  ngOnChanges() {
    this.chartData = {
      labels: this.summaries.map(s => `${MONTHS[s.month - 1]} ${String(s.year).slice(2)}`),
      datasets: [
        {
          type: 'line' as const,
          label: 'Delta',
          data: this.summaries.map(s => s.delta),
          borderColor: DELTA_LINE,
          backgroundColor: 'transparent',
          borderWidth: 2.5,
          tension: 0.35,
          spanGaps: false,
          pointRadius: this.summaries.map(s => s.delta !== null ? 5 : 0),
          pointHoverRadius: 7,
          pointBackgroundColor: this.summaries.map(s =>
            s.delta === null ? 'transparent' :
            s.delta >= 0 ? DELTA_DOT_POSITIVE : DELTA_DOT_NEGATIVE
          ),
          pointBorderColor: this.summaries.map(s =>
            s.delta === null ? 'transparent' :
            s.delta >= 0 ? DELTA_DOT_POSITIVE : DELTA_DOT_NEGATIVE
          ),
          yAxisID: 'y',
          order: 1,
        },
        {
          type: 'line' as const,
          label: 'Entrate',
          data: this.summaries.map(s => s.income > 0 ? s.income : null),
          borderColor: INCOME_LINE,
          backgroundColor: 'transparent',
          borderWidth: 2,
          tension: 0.35,
          spanGaps: false,
          pointRadius: this.summaries.map(s => s.income > 0 ? 4 : 0),
          pointHoverRadius: 6,
          pointBackgroundColor: INCOME_LINE,
          pointBorderColor: INCOME_LINE,
          yAxisID: 'y',
          order: 0,
        },
      ],
    };
  }
}
```

- [ ] **Step 2: Verifica compilazione**

```bash
npx tsc --noEmit
```

Expected: nessun output (zero errori).

- [ ] **Step 3: Commit**

```bash
git add src/app/features/dashboard/components/monthly-metrics-chart/monthly-metrics-chart.component.ts
git commit -m "feat: add MonthlyMetricsChartComponent (Delta + Entrate)"
```

---

### Task 3: Wiring Dashboard + eliminazione vecchio componente

**Files:**
- Modify: `src/app/features/dashboard/dashboard.component.ts` (righe 8, 17, 44-46)
- Delete: `src/app/features/dashboard/components/net-worth-chart/net-worth-chart.component.ts`

**Interfaces:**
- Consumes: `PatrimonioChartComponent` (selettore `app-patrimonio-chart`) da Task 1
- Consumes: `MonthlyMetricsChartComponent` (selettore `app-monthly-metrics-chart`) da Task 2

- [ ] **Step 1: Aggiorna `dashboard.component.ts`**

Sostituisci l'intero file con:

```typescript
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
                  flex-wrap: wrap; gap: 0.75rem; background: #dcfce7; border: 1px solid #86efac; }
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
```

- [ ] **Step 2: Elimina il vecchio componente**

```bash
rm src/app/features/dashboard/components/net-worth-chart/net-worth-chart.component.ts
```

- [ ] **Step 3: Verifica compilazione e test**

```bash
npx tsc --noEmit && npx ng test --watch=false --browsers=ChromeHeadless 2>&1 | tail -5
```

Expected:
- `npx tsc --noEmit` — nessun output
- Test runner: `TOTAL: 16 SUCCESS`

- [ ] **Step 4: Commit**

```bash
git add src/app/features/dashboard/dashboard.component.ts
git rm src/app/features/dashboard/components/net-worth-chart/net-worth-chart.component.ts
git commit -m "feat: split net-worth chart into patrimonio + monthly-metrics"
```

---

## Self-Review

**Spec coverage:**
- ✅ `PatrimonioChartComponent` — bars only, asse Y sinistro, fullscreen, zoom — Task 1
- ✅ `MonthlyMetricsChartComponent` — Delta + Entrate, asse Y destro, fullscreen, zoom — Task 2
- ✅ `NetWorthChartComponent` eliminato — Task 3 Step 2
- ✅ Dashboard aggiornato con due selettori — Task 3 Step 1
- ✅ Risparmio% assente da entrambi i componenti (non incluso)
- ✅ `touch-action: pan-y` + `:fullscreen canvas { touch-action: none }` — entrambi i componenti

**Placeholder scan:** nessuno — tutto il codice è completo.

**Type consistency:** `MonthSummary` usato identicamente in tutti e tre i task. `yAxisID: 'y'` coerente in MonthlyMetricsChartComponent (unico asse, nessun `y1`). `PatrimonioChartComponent` usa `yAxisID: 'y'` coerente con la scala dichiarata.
