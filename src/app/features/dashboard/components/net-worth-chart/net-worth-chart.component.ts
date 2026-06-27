// src/app/features/dashboard/components/net-worth-chart/net-worth-chart.component.ts
import { Component, Input, OnChanges } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { MonthSummary } from '../../dashboard.service';

const MONTHS = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];

const PATRIMONIO_COLOR   = '#4ade80'; // green-400
const PATRIMONIO_LAST    = '#16a34a'; // green-700 — last bar
const DELTA_LINE         = '#f97316'; // orange-500
const DELTA_DOT_POSITIVE = '#22c55e'; // green-500
const DELTA_DOT_NEGATIVE = '#ef4444'; // red-500

@Component({
  selector: 'app-net-worth-chart',
  standalone: true,
  imports: [BaseChartDirective],
  template: `
    <div class="fmf-card chart-wrap">
      <canvas baseChart [data]="chartData" [options]="chartOptions" type="bar"></canvas>
    </div>
  `,
  styles: [`.chart-wrap { margin-bottom: 1.25rem; } canvas { max-height: 300px; }`],
})
export class NetWorthChartComponent implements OnChanges {
  @Input() summaries: MonthSummary[] = [];

  chartData: ChartData = { labels: [], datasets: [] };

  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
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
          label: ctx => {
            const val = Number(ctx.raw);
            if (ctx.datasetIndex === 1) {
              const sign = val > 0 ? '+' : '';
              return `  Delta: ${sign}€ ${val.toLocaleString('it-IT')}`;
            }
            return `  Patrimonio: € ${val.toLocaleString('it-IT')}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { maxRotation: 45 },
      },
      y: {
        position: 'left',
        title: { display: true, text: 'Patrimonio (€)', color: '#16a34a' },
        ticks: {
          color: '#16a34a',
          callback: v => `€ ${(Number(v) / 1000).toFixed(0)}k`,
        },
        grid: { color: '#f0fdf4' },
      },
      y1: {
        position: 'right',
        title: { display: true, text: 'Delta (€)', color: '#f97316' },
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

  ngOnChanges() {
    const lastIdx = this.summaries.length - 1;

    this.chartData = {
      labels: this.summaries.map(s => `${MONTHS[s.month - 1]} ${String(s.year).slice(2)}`),
      datasets: [
        {
          type: 'bar' as const,
          label: 'Patrimonio',
          data: this.summaries.map(s => s.total),
          backgroundColor: this.summaries.map((_, i) =>
            i === lastIdx ? PATRIMONIO_LAST : PATRIMONIO_COLOR
          ),
          borderRadius: 6,
          yAxisID: 'y',
          order: 2,
        },
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
            s.delta >= 0    ? DELTA_DOT_POSITIVE : DELTA_DOT_NEGATIVE
          ),
          pointBorderColor: this.summaries.map(s =>
            s.delta === null ? 'transparent' :
            s.delta >= 0    ? DELTA_DOT_POSITIVE : DELTA_DOT_NEGATIVE
          ),
          yAxisID: 'y1',
          order: 1,
        },
      ],
    };
  }
}
