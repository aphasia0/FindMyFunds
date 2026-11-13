import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AccountType } from '../../../../core/models';
import { CompositionItem } from '../../dashboard.service';

const TYPE_COLORS: Record<string, string> = {
  cash: '#222222', bond: '#6a6a6a', etf: '#929292', stock: '#c1c1c1', asset: '#ff385c',
};

@Component({
  selector: 'app-composition-bar',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    @if (items.length > 0) {
      <div class="fmf-card composition-card">
        <div class="comp-title">{{ 'dashboard.composition' | translate }}</div>
        <div class="comp-bar">
          @for (item of items; track item.type) {
            <button type="button" class="comp-segment"
                    [class.selected]="selectedType === item.type"
                    [style.width.%]="pct(item.total)"
                    [style.background]="color(item.type)"
                    [title]="('accounts.types.' + item.type | translate) + ': €' + item.total.toLocaleString('it-IT')"
                    (click)="toggleType(item.type)">
            </button>
          }
        </div>
        <div class="comp-legend">
          @for (item of items; track item.type) {
            <button type="button" class="legend-item" [class.selected]="selectedType === item.type" (click)="toggleType(item.type)">
              <span class="legend-dot" [style.background]="color(item.type)"></span>
              <span>{{ 'accounts.types.' + item.type | translate }} — {{ pct(item.total) | number:'1.1-1' }}%</span>
            </button>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .composition-card { margin-bottom: 1.25rem; }
    .comp-title { font-size: 0.8125rem; font-weight: 500; color: var(--muted); margin-bottom: 0.75rem; }
    .comp-bar { display: flex; height: 24px; border-radius: var(--radius-full); overflow: hidden; gap: 2px; background: var(--surface-soft); }
    .comp-segment { transition: width 0.4s ease, opacity 0.15s ease; border: 0; cursor: pointer; padding: 0; }
    .comp-segment:hover { opacity: 0.85; }
    .comp-segment.selected { box-shadow: inset 0 0 0 2px var(--canvas); }
    .comp-legend { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.85rem; font-size: 0.8125rem; }
    .legend-item {
      display: inline-flex; align-items: center; gap: 0.4rem;
      border: 1px solid var(--hairline); background: var(--canvas);
      border-radius: var(--radius-full); padding: 0.3rem 0.65rem;
      cursor: pointer; color: var(--ink); font-size: 0.8125rem;
      transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
    }
    .legend-item:hover { background: var(--surface-soft); border-color: var(--border-strong); }
    .legend-item.selected { background: var(--ink); border-color: var(--ink); color: #ffffff; }
    .legend-dot { width: 9px; height: 9px; border-radius: 50%; display: inline-block; }
  `],
})
export class CompositionBarComponent {
  @Input() items: CompositionItem[] = [];
  @Input() selectedType: AccountType | null = null;
  @Output() typeSelected = new EventEmitter<AccountType | null>();

  get grandTotal(): number {
    return this.items.reduce((s, i) => s + i.total, 0);
  }

  pct(total: number): number {
    return this.grandTotal > 0 ? (total / this.grandTotal) * 100 : 0;
  }

  color(type: string): string {
    return TYPE_COLORS[type] ?? '#9ca3af';
  }

  toggleType(type: AccountType): void {
    const next = this.selectedType === type ? null : type;
    this.typeSelected.emit(next);
  }
}
