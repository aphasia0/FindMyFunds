// src/app/features/monthly-entry/monthly-entry.service.ts
import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../../core/supabase.service';
import { AuthService } from '../../core/auth.service';
import { MonthlySnapshot, SnapshotUpsertData, IncomeTransaction, IncomeFormData } from '../../core/models';
import { DemoModeService } from '../../core/demo-mode.service';
import { DEMO_SNAPSHOTS, DEMO_INCOME } from '../../core/demo-data';

@Injectable({ providedIn: 'root' })
export class MonthlyEntryService {
  private supabase = inject(SupabaseService).client;
  private auth = inject(AuthService);
  private demoMode = inject(DemoModeService);

  computeSnapshotDate(year: number, month: number, preferredDay: number): string {
    const mm = String(month).padStart(2, '0');
    const dd = String(preferredDay).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  }

  async getSnapshotsForMonth(year: number, month: number): Promise<MonthlySnapshot[]> {
    if (this.demoMode.isDemo) {
      return DEMO_SNAPSHOTS.filter(s => s.year === year && s.month === month);
    }

    const { data, error } = await this.supabase
      .from('monthly_snapshots')
      .select('*')
      .eq('user_id', this.auth.userId)
      .eq('year', year)
      .eq('month', month);
    if (error) throw error;
    return (data ?? []) as MonthlySnapshot[];
  }

  async getIncomeForMonth(year: number, month: number): Promise<IncomeTransaction[]> {
    if (this.demoMode.isDemo) {
      return DEMO_INCOME.filter(i => i.year === year && i.month === month);
    }

    const { data, error } = await this.supabase
      .from('income_transactions')
      .select('*')
      .eq('user_id', this.auth.userId)
      .eq('year', year)
      .eq('month', month);
    if (error) throw error;
    return (data ?? []) as IncomeTransaction[];
  }

  async saveSnapshots(snapshots: SnapshotUpsertData[]): Promise<void> {
    if (this.demoMode.isDemo) return;

    if (snapshots.length === 0) return;
    const rows = snapshots.map(s => ({ ...s, user_id: this.auth.userId }));
    const { error } = await this.supabase
      .from('monthly_snapshots')
      .upsert(rows, { onConflict: 'user_id,account_id,year,month' });
    if (error) throw error;
  }

  async saveIncome(year: number, month: number, items: IncomeFormData[]): Promise<void> {
    if (this.demoMode.isDemo) return;

    const { error: delError } = await this.supabase
      .from('income_transactions')
      .delete()
      .eq('user_id', this.auth.userId)
      .eq('year', year)
      .eq('month', month);
    if (delError) throw delError;

    if (items.length === 0) return;

    const rows = items.map(i => ({ ...i, year, month, user_id: this.auth.userId }));
    const { error } = await this.supabase
      .from('income_transactions')
      .insert(rows);
    if (error) throw error;
  }
}
