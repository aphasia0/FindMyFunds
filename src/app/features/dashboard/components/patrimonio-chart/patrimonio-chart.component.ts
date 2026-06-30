import { Component, Input, OnChanges, ViewChild, ElementRef, HostListener } from '@angular/core';
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
          label: (ctx: any) => `  Patrimonio: € ${Number(ctx.raw).toLocaleString('it-IT')}`,
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
