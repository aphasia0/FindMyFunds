// src/app/features/dashboard/dashboard.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { DashboardService } from './dashboard.service';
import { SupabaseService } from '../../core/supabase.service';
import { AuthService } from '../../core/auth.service';
import { MonthlySnapshot, IncomeTransaction } from '../../core/models';

const mockClient = { from: () => ({ select: () => ({ eq: () => ({ gte: () => ({ lte: () => ({}) }) }) }) }) };
const mockSupabase = { client: mockClient };
const mockAuth = { userId: 'user-1' };

describe('DashboardService', () => {
  let service: DashboardService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DashboardService,
        { provide: SupabaseService, useValue: mockSupabase },
        { provide: AuthService, useValue: mockAuth },
      ],
    });
    service = TestBed.inject(DashboardService);
  });

  function snap(accountId: string, year: number, month: number, value: number): Partial<MonthlySnapshot> {
    return { account_id: accountId, year, month, value } as MonthlySnapshot;
  }

  function inc(year: number, month: number, amount: number): Partial<IncomeTransaction> {
    return { year, month, amount } as IncomeTransaction;
  }

  describe('buildSummaries', () => {
    const months = [
      { year: 2026, month: 4 },
      { year: 2026, month: 5 },
      { year: 2026, month: 6 },
    ];

    it('sums all account values per month', () => {
      const snapshots = [
        snap('a1', 2026, 4, 5000), snap('a2', 2026, 4, 3000),
        snap('a1', 2026, 5, 6000), snap('a2', 2026, 5, 3500),
        snap('a1', 2026, 6, 7000), snap('a2', 2026, 6, 4000),
      ];
      const result = service.buildSummaries(snapshots as MonthlySnapshot[], [], months);
      expect(result[0].total).toBe(8000);
      expect(result[1].total).toBe(9500);
      expect(result[2].total).toBe(11000);
    });

    it('sets delta to null for the first month', () => {
      const result = service.buildSummaries([snap('a1', 2026, 4, 8000)] as MonthlySnapshot[], [], [months[0]]);
      expect(result[0].delta).toBeNull();
    });

    it('computes delta as difference from previous month total', () => {
      const snapshots = [snap('a1', 2026, 5, 9500), snap('a1', 2026, 6, 11000)];
      const result = service.buildSummaries(snapshots as MonthlySnapshot[], [], months.slice(1));
      expect(result[1].delta).toBe(1500);
    });

    it('computes saving rate as (delta / income) * 100', () => {
      const snapshots = [snap('a1', 2026, 5, 9500), snap('a1', 2026, 6, 10500)];
      const income = [inc(2026, 6, 2000)];
      const result = service.buildSummaries(snapshots as MonthlySnapshot[], income as IncomeTransaction[], months.slice(1));
      expect(result[1].savingPct).toBe(50);
    });

    it('returns null saving rate when income is zero', () => {
      const snapshots = [snap('a1', 2026, 5, 9500), snap('a1', 2026, 6, 10500)];
      const result = service.buildSummaries(snapshots as MonthlySnapshot[], [], months.slice(1));
      expect(result[1].savingPct).toBeNull();
    });

    it('returns null saving rate for the first month even with income', () => {
      const snapshots = [snap('a1', 2026, 4, 8000)];
      const income = [inc(2026, 4, 3000)];
      const result = service.buildSummaries(snapshots as MonthlySnapshot[], income as IncomeTransaction[], [months[0]]);
      expect(result[0].savingPct).toBeNull();
    });

    it('returns negative delta when wealth decreases', () => {
      const snapshots = [snap('a1', 2026, 5, 10000), snap('a1', 2026, 6, 9000)];
      const result = service.buildSummaries(snapshots as MonthlySnapshot[], [], months.slice(1));
      expect(result[1].delta).toBe(-1000);
    });

    it('marks months without snapshots and does not collapse their delta to zero', () => {
      const snapshots = [snap('a1', 2026, 4, 8000), snap('a1', 2026, 5, 9000)];
      const result = service.buildSummaries(snapshots as MonthlySnapshot[], [], months);
      expect(result[2].hasData).toBeFalse();
      expect(result[2].total).toBe(0);
      expect(result[2].delta).toBeNull();
      expect(result[0].hasData).toBeTrue();
    });

    it('computes delta against the last month with data across gaps', () => {
      const snapshots = [
        snap('a1', 2026, 4, 8000),
        snap('a1', 2026, 6, 11000),
      ];
      const result = service.buildSummaries(snapshots as MonthlySnapshot[], [], months);
      expect(result[1].delta).toBeNull();
      expect(result[1].hasData).toBeFalse();
      expect(result[2].delta).toBe(3000);
    });
  });

  describe('getLatestDataMonth', () => {
    it('returns null when there are no snapshots', () => {
      expect(service.getLatestDataMonth([])).toBeNull();
    });

    it('returns the most recent month with data regardless of order', () => {
      const snapshots = [
        snap('a1', 2026, 6, 11000),
        snap('a1', 2025, 12, 9000),
        snap('a2', 2026, 5, 4000),
      ] as MonthlySnapshot[];
      expect(service.getLatestDataMonth(snapshots)).toEqual({ year: 2026, month: 6 });
    });
  });

  describe('computeWindow', () => {
    const end = { year: 2026, month: 6 };

    it('keeps the requested window but marks the empty final month', () => {
      const { summaries, composition } = service.computeWindow(
        [snap('a1', 2026, 5, 9500)] as MonthlySnapshot[],
        [],
        end
      );
      expect(summaries.length).toBe(10);
      expect(summaries[summaries.length - 1]).toEqual(jasmine.objectContaining({
        year: 2026, month: 6, total: 0, delta: null, hasData: false,
      }));
      expect(composition).toEqual([{ type: 'asset', total: 9500 }]);
    });
  });
});
