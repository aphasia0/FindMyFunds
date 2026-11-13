import { Component, Input, OnChanges, ViewChild, ElementRef, HostListener } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, Chart, TooltipItem } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import { MonthSummary } from '../../dashboard.service';

Chart.register(zoomPlugin);

const MONTHS = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];
const IS_TOUCH = typeof window !== 'undefined' && navigator.maxTouchPoints > 0;
const DELTA_LINE         = '#222222';
const DELTA_DOT_POSITIVE = '#0f7b55';
const DELTA_DOT_NEGATIVE = '#c13515';
const INCOME_LINE        = '#929292';

Chart.defaults.font.family = "'Inter', Circular, -apple-system, system-ui, Roboto, 'Helvetica Neue', sans-serif";
Chart.defaults.color = '#6a6a6a';

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
    .chart-wrap { margin-bottom: 1.25rem; position: relative; padding: 1.25rem; }
    .chart-wrap:fullscreen, .chart-wrap:-webkit-full-screen {
      background: var(--canvas); display: flex; flex-direction: column; padding: 1.5rem; margin: 0;
    }
    .chart-wrap:fullscreen canvas, .chart-wrap:-webkit-full-screen canvas {
      max-height: none !important; flex: 1;
    }
    canvas { max-height: 280px; touch-action: pan-y; }
    .chart-wrap:fullscreen canvas, .chart-wrap:-webkit-full-screen canvas { touch-action: none; }
    .chart-toolbar { display: flex; justify-content: flex-end; margin-bottom: 0.4rem; }
    .fs-btn {
      display: flex; align-items: center; justify-content: center;
      width: 2rem; height: 2rem; border-radius: var(--radius-full);
      border: 1px solid var(--hairline); background: var(--canvas);
      color: var(--ink); cursor: pointer;
      transition: background-color 0.15s ease;
    }
    .fs-btn:hover { background: var(--surface-soft); }
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
        labels: {
          usePointStyle: true,
          pointStyleWidth: 10,
          boxHeight: 8,
          color: '#6a6a6a',
          generateLabels: (chart: any) => {
            const labels = Chart.defaults.plugins.legend.labels.generateLabels!(chart);
            const delta = labels.find((l: any) => l.datasetIndex === 0);
            if (delta) {
              delta.fillStyle = DELTA_LINE;
              delta.strokeStyle = DELTA_LINE;
              delta.fontColor = '#222222';
            }
            return labels;
          },
        },
      },
      tooltip: {
        backgroundColor: '#222222',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#222222',
        borderWidth: 0,
        cornerRadius: 8,
        padding: 12,
        displayColors: false,
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
        pan: { enabled: !IS_TOUCH, mode: 'x' },
        zoom: { wheel: { enabled: !IS_TOUCH }, pinch: { enabled: false }, mode: 'x' },
      },
    } as any,
    scales: {
      x: { grid: { display: false }, ticks: { maxRotation: 45, color: '#6a6a6a' } },
      y: {
        position: 'right',
        title: { display: true, text: 'Mensile (€)', color: '#6a6a6a' },
        ticks: {
          color: '#6a6a6a',
          callback: v => {
            const n = Number(v);
            return (n >= 0 ? '+' : '') + `€ ${(n / 1000).toFixed(0)}k`;
          },
        },
        grid: { drawOnChartArea: false },
        border: { display: false },
      },
    },
  };

  toggleFullscreen() {
    const el = this.chartWrap.nativeElement;
    if (document.fullscreenElement !== el) {
      el.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  @HostListener('document:fullscreenchange')
  onFullscreenChange() {
    this.isFullscreen = document.fullscreenElement === this.chartWrap.nativeElement;
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
          borderDash: [5, 5],
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
