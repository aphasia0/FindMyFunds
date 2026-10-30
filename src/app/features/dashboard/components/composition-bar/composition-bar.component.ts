import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AccountType } from '../../../core/models';
import { CompositionItem } from '../../dashboard.service';

const TYPE_COLORS: Record<string, string> = {
  cash: '#22c55e', bond: '#3b82f6', etf: '#f59e0b', stock: '#8b5cf6', asset: '#f97316',
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
    .comp-title { font-size: 0.8rem; font-weight: 600; color: #6b7280; margin-bottom: 0.75rem; }
    .comp-bar { display: flex; height: 24px; border-radius: 12px; overflow: hidden; gap: 2px; }
    .comp-segment { transition: width 0.4s ease; border: 0; cursor: pointer; padding: 0; }
    .comp-segment.selected { box-shadow: inset 0 0 0 2px rgba(255,255,255,0.9); }
    .comp-legend { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 0.75rem; font-size: 0.85rem; }
    .legend-item {
      display: inline-flex; align-items: center; gap: 0.35rem; border: 1px solid #e5e7eb; background: transparent;
      border-radius: 999px; padding: 0.3rem 0.55rem; cursor: pointer; color: inherit;
    }
    .legend-item.selected { background: #eef2ff; border-color: #c7d2fe; }
    .legend-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
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
