// src/app/features/monthly-entry/monthly-entry.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { MonthlyEntryService } from './monthly-entry.service';
import { SupabaseService } from '../../core/supabase.service';
import { AuthService } from '../../core/auth.service';

const mockClient = { from: () => ({ select: () => {}, delete: () => {}, upsert: () => {}, insert: () => {} }) };
const mockSupabase = { client: mockClient };
const mockAuth = { userId: 'user-1' };

describe('MonthlyEntryService', () => {
  let service: MonthlyEntryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MonthlyEntryService,
        { provide: SupabaseService, useValue: mockSupabase },
        { provide: AuthService, useValue: mockAuth },
      ],
    });
    service = TestBed.inject(MonthlyEntryService);
  });

  describe('computeSnapshotDate', () => {
    it('returns ISO date string YYYY-MM-DD', () => {
      expect(service.computeSnapshotDate(2026, 6, 27)).toBe('2026-06-27');
    });

    it('pads month and day with leading zeros', () => {
      expect(service.computeSnapshotDate(2026, 1, 5)).toBe('2026-01-05');
    });

    it('handles month 12', () => {
      expect(service.computeSnapshotDate(2025, 12, 28)).toBe('2025-12-28');
    });
  });
});
