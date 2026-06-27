// src/app/features/accounts/accounts.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { AccountsService } from './accounts.service';
import { SupabaseService } from '../../core/supabase.service';
import { AuthService } from '../../core/auth.service';

const mockData: any[] = [];
const mockQuery = {
  select: () => mockQuery,
  eq: () => mockQuery,
  order: () => mockQuery,
  insert: () => mockQuery,
  update: () => mockQuery,
  single: () => Promise.resolve({ data: mockData[0] ?? null, error: null }),
  then: (fn: any) => Promise.resolve({ data: mockData, error: null }).then(fn),
};
const mockClient = { from: () => mockQuery };
const mockSupabase = { client: mockClient };
const mockAuth = { userId: 'user-1' };

describe('AccountsService', () => {
  let service: AccountsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AccountsService,
        { provide: SupabaseService, useValue: mockSupabase },
        { provide: AuthService, useValue: mockAuth },
      ],
    });
    service = TestBed.inject(AccountsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
