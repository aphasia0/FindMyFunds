import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../../core/supabase.service';
import { AuthService } from '../../core/auth.service';
import { MonthlySnapshot, IncomeTransaction, AccountType, Account } from '../../core/models';
import { DemoModeService } from '../../core/demo-mode.service';
import { DEMO_SNAPSHOTS, DEMO_INCOME, DEMO_ACCOUNTS } from '../../core/demo-data';

export interface MonthSummary {
  year: number;
  month: number;
  total: number;
  delta: number | null;
  income: number;
  savingPct: number | null;
  /** False when the month has no snapshot at all (not yet entered). */
  hasData: boolean;
}

export interface CompositionItem {
  type: AccountType;
  total: number;
}

export interface DashboardSelection {
  type?: AccountType | null;
  accountId?: string | null;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private supabase = inject(SupabaseService).client;
  private auth = inject(AuthService);
  private demoMode = inject(DemoModeService);

  buildSummaries(
    snapshots: MonthlySnapshot[],
    income: IncomeTransaction[],
    months: { year: number; month: number }[],
    selection: DashboardSelection = {}
  ): MonthSummary[] {
    const filteredSnapshots = this.filterSnapshots(snapshots, selection);

    let prevTotal: number | null = null;
    let prevMonthHadData = false;

    return months.map(m => {
      const monthSnaps = filteredSnapshots.filter(s => s.year === m.year && s.month === m.month);
      const hasData = monthSnaps.length > 0;
      const total = monthSnaps.reduce((sum, s) => sum + Number(s.value), 0);

      // Compare against the last month that actually has data, so an
      // un-entered month never produces a fake collapse to zero.
      const delta = hasData && prevTotal !== null ? total - prevTotal : null;
      if (hasData) prevTotal = total;

      const monthIncome = selection.type || selection.accountId
        ? 0
        : income
            .filter(t => t.year === m.year && t.month === m.month)
            .reduce((sum, t) => sum + Number(t.amount), 0);

      // Saving rate makes sense only for a one-month delta, otherwise the
      // variation spans multiple months while income is for one month.
      const savingPct =
        delta !== null && prevMonthHadData && monthIncome > 0
          ? (delta / monthIncome) * 100
          : null;

      prevMonthHadData = hasData;

      return { year: m.year, month: m.month, total, delta, income: monthIncome, savingPct, hasData };
    });
  }

  /** Returns the 10 months whose last entry is `end`. */
  getMonthsWindow(end: { year: number; month: number }): { year: number; month: number }[] {
    return Array.from({ length: 10 }, (_, i) => {
      const d = new Date(end.year, end.month - 1 - 9 + i, 1);
      return { year: d.getFullYear(), month: d.getMonth() + 1 };
    });
  }

  /** Latest month that has at least one snapshot for the given selection. */
  getLatestDataMonth(
    snapshots: MonthlySnapshot[],
    selection: DashboardSelection = {}
  ): { year: number; month: number } | null {
    const filtered = this.filterSnapshots(snapshots, selection);
    let latest: { year: number; month: number } | null = null;
    for (const s of filtered) {
      if (!latest || s.year > latest.year || (s.year === latest.year && s.month > latest.month)) {
        latest = { year: s.year, month: s.month };
      }
    }
    return latest;
  }

  /** Fetches all snapshots and income for this user (no date filter — data is small). */
  async loadAllData(): Promise<{ snapshots: any[]; income: IncomeTransaction[]; accounts: Account[] }> {
    if (this.demoMode.isDemo) {
      const accountTypeMap = new Map(DEMO_ACCOUNTS.map(a => [a.id, a.type]));
      const snapshots = DEMO_SNAPSHOTS.map(s => ({
        ...s,
        accounts: { type: accountTypeMap.get(s.account_id) ?? 'asset' },
      }));
      return { snapshots, income: DEMO_INCOME, accounts: DEMO_ACCOUNTS };
    }

    const [snapshotsRes, incomeRes, accountsRes] = await Promise.all([
      this.supabase
        .from('monthly_snapshots')
        .select('*, accounts(type)')
        .eq('user_id', this.auth.userId),
      this.supabase
        .from('income_transactions')
        .select('*')
        .eq('user_id', this.auth.userId),
      this.supabase
        .from('accounts')
        .select('*')
        .eq('user_id', this.auth.userId)
        .eq('is_active', true)
        .order('created_at'),
    ]);
    if (snapshotsRes.error) throw snapshotsRes.error;
    if (incomeRes.error) throw incomeRes.error;
    if (accountsRes.error) throw accountsRes.error;
    return {
      snapshots: snapshotsRes.data ?? [],
      income: (incomeRes.data ?? []) as IncomeTransaction[],
      accounts: (accountsRes.data ?? []) as Account[],
    };
  }

  /** Computes summaries and composition for the 10-month window ending at `windowEnd`. */
  computeWindow(
    snapshots: any[],
    income: IncomeTransaction[],
    windowEnd: { year: number; month: number },
    selection: DashboardSelection = {}
  ): { summaries: MonthSummary[]; composition: CompositionItem[] } {
    const displayMonths = this.getMonthsWindow(windowEnd);

    // One month before the window for delta context
    const d0 = new Date(displayMonths[0].year, displayMonths[0].month - 2, 1);
    const contextMonth = { year: d0.getFullYear(), month: d0.getMonth() + 1 };

    const allSummaries = this.buildSummaries(
      snapshots as MonthlySnapshot[],
      income,
      [contextMonth, ...displayMonths],
      selection
    );
    const summaries = allSummaries.slice(1); // drop context prefix

    const filteredSnapshots = this.filterSnapshots(snapshots as MonthlySnapshot[], selection);
    const lastWithData = [...summaries].reverse().find(s => s.hasData);
    const composition = this.buildComposition(
      filteredSnapshots,
      lastWithData ?? summaries[summaries.length - 1]
    );

    return { summaries, composition };
  }

  private filterSnapshots(
    snapshots: (MonthlySnapshot & { accounts?: { type: AccountType } })[],
    selection: DashboardSelection
  ): (MonthlySnapshot & { accounts?: { type: AccountType } })[] {
    return snapshots.filter(s => {
      const snapshotType = (s as any).accounts?.type ?? 'asset';
      if (selection.type && snapshotType !== selection.type) return false;
      if (selection.accountId && s.account_id !== selection.accountId) return false;
      return true;
    });
  }

  private buildComposition(
    snapshots: (MonthlySnapshot & { accounts?: { type: AccountType } })[],
    month: MonthSummary
  ): CompositionItem[] {
    if (!month) return [];

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
