// src/app/features/dashboard/dashboard.service.ts
import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../../core/supabase.service';
import { AuthService } from '../../core/auth.service';
import { MonthlySnapshot, IncomeTransaction, AccountType } from '../../core/models';

export interface MonthSummary {
  year: number;
  month: number;
  total: number;
  delta: number | null;
  income: number;
  savingPct: number | null;
}

export interface CompositionItem {
  type: AccountType;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private supabase = inject(SupabaseService).client;
  private auth = inject(AuthService);

  buildSummaries(
    snapshots: MonthlySnapshot[],
    income: IncomeTransaction[],
    months: { year: number; month: number }[]
  ): MonthSummary[] {
    return months.map((m, i) => {
      const monthSnaps = snapshots.filter(s => s.year === m.year && s.month === m.month);
      const total = monthSnaps.reduce((sum, s) => sum + Number(s.value), 0);

      let delta: number | null = null;
      if (i > 0) {
        const prev = months[i - 1];
        const prevSnaps = snapshots.filter(s => s.year === prev.year && s.month === prev.month);
        const prevTotal = prevSnaps.reduce((sum, s) => sum + Number(s.value), 0);
        delta = total - prevTotal;
      }

      const monthIncome = income
        .filter(t => t.year === m.year && t.month === m.month)
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const savingPct =
        delta !== null && monthIncome > 0 ? (delta / monthIncome) * 100 : null;

      return { year: m.year, month: m.month, total, delta, income: monthIncome, savingPct };
    });
  }

  /** Returns the 10 months whose last entry is `end`. */
  getMonthsWindow(end: { year: number; month: number }): { year: number; month: number }[] {
    return Array.from({ length: 10 }, (_, i) => {
      const d = new Date(end.year, end.month - 1 - 9 + i, 1);
      return { year: d.getFullYear(), month: d.getMonth() + 1 };
    });
  }

  /** Fetches all snapshots and income for this user (no date filter — data is small). */
  async loadAllData(): Promise<{ snapshots: any[]; income: IncomeTransaction[] }> {
    const [snapshotsRes, incomeRes] = await Promise.all([
      this.supabase
        .from('monthly_snapshots')
        .select('*, accounts(type)')
        .eq('user_id', this.auth.userId),
      this.supabase
        .from('income_transactions')
        .select('*')
        .eq('user_id', this.auth.userId),
    ]);
    if (snapshotsRes.error) throw snapshotsRes.error;
    if (incomeRes.error) throw incomeRes.error;
    return {
      snapshots: snapshotsRes.data ?? [],
      income: (incomeRes.data ?? []) as IncomeTransaction[],
    };
  }

  /** Computes summaries and composition for the 10-month window ending at `windowEnd`.
   *  One extra context month is prepended so the first displayed month has a delta. */
  computeWindow(
    snapshots: any[],
    income: IncomeTransaction[],
    windowEnd: { year: number; month: number }
  ): { summaries: MonthSummary[]; composition: CompositionItem[] } {
    const displayMonths = this.getMonthsWindow(windowEnd);

    // One month before the window for delta context
    const d0 = new Date(displayMonths[0].year, displayMonths[0].month - 2, 1);
    const contextMonth = { year: d0.getFullYear(), month: d0.getMonth() + 1 };

    const allSummaries = this.buildSummaries(
      snapshots as MonthlySnapshot[],
      income,
      [contextMonth, ...displayMonths]
    );
    const summaries = allSummaries.slice(1); // drop context prefix

    const lastWithData = [...summaries].reverse().find(s => s.total > 0);
    const composition = this.buildComposition(
      snapshots,
      lastWithData ?? summaries[summaries.length - 1]
    );

    return { summaries, composition };
  }

  private buildComposition(
    snapshots: (MonthlySnapshot & { accounts?: { type: AccountType } })[],
    month: MonthSummary
  ): CompositionItem[] {
    const monthSnaps = snapshots.filter(s => s.year === month.year && s.month === month.month);
    const byType: Partial<Record<AccountType, number>> = {};
    for (const s of monthSnaps) {
      const type: AccountType = (s as any).accounts?.type ?? 'asset';
      byType[type] = (byType[type] ?? 0) + Number(s.value);
    }
    return Object.entries(byType).map(([type, total]) => ({
      type: type as AccountType,
      total: total as number,
    }));
  }
}
