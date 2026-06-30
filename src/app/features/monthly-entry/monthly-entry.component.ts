// src/app/features/monthly-entry/monthly-entry.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageModule } from 'primeng/message';
import { MonthlyEntryService } from './monthly-entry.service';
import { AccountsService } from '../accounts/accounts.service';
import { ProfileService } from '../../core/profile.service';
import { Account, IncomeFormData } from '../../core/models';
import { DemoModeService } from '../../core/demo-mode.service';

interface AccountRow {
  account: Account;
  value: number;
}

@Component({
  selector: 'app-monthly-entry',
  standalone: true,
  imports: [FormsModule, TranslateModule, ButtonModule, InputNumberModule,
            InputTextModule, DatePickerModule, MessageModule],
  template: `
    <h1 class="page-title">{{ 'entry.title' | translate }}</h1>

    <div class="fmf-card mb-3 entry-header">
      <div class="field">
        <label>{{ 'entry.month' | translate }}</label>
        <p-datepicker [(ngModel)]="selectedDate" view="month" dateFormat="mm/yy"
                      [showIcon]="true" [maxDate]="maxDate"
                      (ngModelChange)="onMonthChange()"
                      styleClass="w-full" />
      </div>
      <div class="snapshot-date">
        <span class="text-muted">{{ 'entry.snapshot_date' | translate }}:</span>
        <strong>{{ snapshotDate }}</strong>
      </div>
    </div>

    @if (noAccounts) {
      <p class="text-muted">{{ 'entry.no_accounts' | translate }}</p>
    } @else {
      <div class="fmf-card mb-3">
        <div class="section-header">
          <h3 class="section-title">{{ 'entry.accounts_section' | translate }}</h3>
          <p-button icon="pi pi-copy" [label]="'entry.copy_prev' | translate"
                    severity="secondary" size="small" [loading]="copying"
                    [disabled]="demoMode.isDemo"
                    (onClick)="copyFromPreviousMonth()" />
        </div>
        @for (row of accountRows; track row.account.id) {
          <div class="account-entry-row">
            <div class="account-entry-label">
              <span>{{ row.account.name }}</span>
              @if (row.account.asset_description) {
                <span class="text-muted">{{ row.account.asset_description }}</span>
              }
            </div>
            <p-inputNumber [(ngModel)]="row.value" mode="decimal"
                           [minFractionDigits]="2" [maxFractionDigits]="2"
                           prefix="€ " styleClass="amount-input" />
          </div>
        }
      </div>

      <div class="fmf-card mb-3">
        <h3 class="section-title">{{ 'entry.income_section' | translate }}</h3>
        @for (item of incomeRows; track $index) {
          <div class="income-row">
            <input pInputText [(ngModel)]="item.description"
                   [placeholder]="'entry.description' | translate" class="flex-1" />
            <p-inputNumber [(ngModel)]="item.amount" mode="decimal"
                           [minFractionDigits]="2" [maxFractionDigits]="2"
                           prefix="€ " [min]="0.01" styleClass="amount-input" />
            <p-button icon="pi pi-trash" severity="danger" size="small"
                      (onClick)="removeIncome($index)" />
          </div>
        }
        <p-button icon="pi pi-plus" [label]="'entry.add_income' | translate"
                  severity="secondary" size="small" (onClick)="addIncome()" styleClass="mt-2" />
      </div>

      @if (savedMsg) {
        <p-message severity="success" [text]="'entry.saved' | translate" styleClass="mb-3 w-full" />
      }

      <p-button [label]="saving ? ('entry.saving' | translate) : ('entry.save' | translate)"
                [loading]="saving" (onClick)="onSave()"
                [disabled]="demoMode.isDemo"
                [title]="demoMode.isDemo ? 'Non disponibile in modalità demo' : ''"
                styleClass="w-full" />
    }
  `,
  styles: [`
    .entry-header { display: flex; align-items: flex-end; gap: 1.5rem; flex-wrap: wrap; }
    .snapshot-date { display: flex; gap: 0.5rem; align-items: center; }
    .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
    .section-header .section-title { margin-bottom: 0; }
    .section-title { font-size: 0.875rem; font-weight: 600; color: #374151; margin-bottom: 1rem; }
    .account-entry-row { display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #f0fdf4; flex-wrap: wrap; gap: 0.5rem; }
    .account-entry-label { display: flex; flex-direction: column; }
    :host ::ng-deep .amount-input { width: 160px; }
    .income-row { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; flex-wrap: wrap; }
    .flex-1 { flex: 1; min-width: 120px; }
  `],
})
export class MonthlyEntryComponent implements OnInit {
  private entryService = inject(MonthlyEntryService);
  private accountsService = inject(AccountsService);
  private profileService = inject(ProfileService);
  demoMode = inject(DemoModeService);

  accountRows: AccountRow[] = [];
  incomeRows: IncomeFormData[] = [];
  noAccounts = false;
  saving = false;
  copying = false;
  savedMsg = false;
  snapshotDate = '';
  preferredDay = 27;

  selectedDate: Date = new Date();
  maxDate: Date = new Date();

  async ngOnInit() {
    if (this.demoMode.isDemo) {
      this.preferredDay = 27;
      this.selectedDate = new Date(2026, 5, 1); // Giu 2026 — ultimo mese demo
      await this.load();
      return;
    }
    const profile = await this.profileService.getProfile();
    this.preferredDay = profile.preferred_day;
    await this.load();
  }

  async onMonthChange() {
    await this.load();
  }

  private get year() { return this.selectedDate.getFullYear(); }
  private get month() { return this.selectedDate.getMonth() + 1; }

  private async load() {
    this.snapshotDate = this.entryService.computeSnapshotDate(this.year, this.month, this.preferredDay);

    const accounts = await this.accountsService.getActiveAccounts();
    this.noAccounts = accounts.length === 0;
    if (this.noAccounts) return;

    const snapshots = await this.entryService.getSnapshotsForMonth(this.year, this.month);

    // Pre-fill from previous month when no current data
    let prevSnapshots: typeof snapshots = [];
    if (snapshots.length === 0) {
      const prev = new Date(this.year, this.month - 2, 1);
      prevSnapshots = await this.entryService.getSnapshotsForMonth(
        prev.getFullYear(), prev.getMonth() + 1
      );
    }

    this.accountRows = accounts.map(account => {
      const snap = snapshots.find(s => s.account_id === account.id)
        ?? prevSnapshots.find(s => s.account_id === account.id);
      return { account, value: snap ? Number(snap.value) : 0 };
    });

    const income = await this.entryService.getIncomeForMonth(this.year, this.month);
    this.incomeRows = income.map(i => ({ amount: Number(i.amount), description: i.description }));
  }

  async copyFromPreviousMonth() {
    this.copying = true;
    try {
      const prev = new Date(this.year, this.month - 2, 1);
      const prevSnapshots = await this.entryService.getSnapshotsForMonth(
        prev.getFullYear(), prev.getMonth() + 1
      );
      if (prevSnapshots.length === 0) return;
      this.accountRows = this.accountRows.map(row => {
        const snap = prevSnapshots.find(s => s.account_id === row.account.id);
        return { account: row.account, value: snap ? Number(snap.value) : row.value };
      });
    } finally {
      this.copying = false;
    }
  }

  addIncome() {
    this.incomeRows.push({ amount: 0, description: '' });
  }

  removeIncome(index: number) {
    this.incomeRows.splice(index, 1);
  }

  async onSave() {
    this.saving = true;
    try {
      const snapshotDate = this.entryService.computeSnapshotDate(this.year, this.month, this.preferredDay);
      const snapshots = this.accountRows.map(row => ({
        account_id: row.account.id,
        year: this.year, month: this.month,
        snapshot_date: snapshotDate,
        value: row.value,
      }));
      const validIncome = this.incomeRows.filter(i => i.amount > 0 && i.description.trim());

      await Promise.all([
        this.entryService.saveSnapshots(snapshots),
        this.entryService.saveIncome(this.year, this.month, validIncome),
      ]);

      this.savedMsg = true;
      setTimeout(() => (this.savedMsg = false), 3000);
    } finally {
      this.saving = false;
    }
  }
}
