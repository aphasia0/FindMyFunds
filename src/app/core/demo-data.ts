import { Account, MonthlySnapshot, IncomeTransaction } from './models';

export const DEMO_ACCOUNTS: Account[] = [
  { id: 'demo-acc-1', user_id: 'demo', name: 'Conto BancaIntesa', type: 'cash',  asset_description: null, is_active: true, created_at: '2025-01-01T00:00:00Z' },
  { id: 'demo-acc-2', user_id: 'demo', name: 'BTP 2030',          type: 'bond',  asset_description: null, is_active: true, created_at: '2025-01-01T00:00:00Z' },
  { id: 'demo-acc-3', user_id: 'demo', name: 'ETF S&P500',        type: 'etf',   asset_description: null, is_active: true, created_at: '2025-01-01T00:00:00Z' },
  { id: 'demo-acc-4', user_id: 'demo', name: 'Azioni ENI',        type: 'stock', asset_description: null, is_active: true, created_at: '2025-01-01T00:00:00Z' },
  { id: 'demo-acc-5', user_id: 'demo', name: 'Oro fisico',        type: 'asset', asset_description: null, is_active: true, created_at: '2025-01-01T00:00:00Z' },
];

// [year, month, [cash, bond, etf, stock, asset]]
const RAW_SNAPSHOTS: Array<[number, number, [number, number, number, number, number]]> = [
  [2025,  6, [8200, 15000, 24500, 5200, 12000]], // mese contesto per delta
  [2025,  7, [8400, 15050, 25200, 5100, 12150]],
  [2025,  8, [8200, 15100, 25900, 5400, 12300]],
  [2025,  9, [8700, 15150, 26600, 5200, 12450]],
  [2025, 10, [8300, 15200, 25800, 4700, 12600]],
  [2025, 11, [8900, 15250, 27100, 5000, 12750]],
  [2025, 12, [9400, 15300, 28200, 5300, 12900]],
  [2026,  1, [8700, 15350, 28600, 5500, 13050]],
  [2026,  2, [9100, 15400, 29400, 5100, 13200]],
  [2026,  3, [9500, 15450, 30500, 5600, 13350]],
  [2026,  4, [9000, 15500, 29200, 4900, 13500]],
  [2026,  5, [9600, 15550, 30800, 5400, 13650]],
  [2026,  6, [10000, 15600, 31500, 5700, 13800]],
];

const ACC_IDS = DEMO_ACCOUNTS.map(a => a.id);

export const DEMO_SNAPSHOTS: MonthlySnapshot[] = RAW_SNAPSHOTS.flatMap(([year, month, values]) =>
  ACC_IDS.map((account_id, i) => ({
    id: `demo-snap-${year}-${month}-${account_id}`,
    user_id: 'demo',
    account_id,
    year,
    month,
    snapshot_date: `${year}-${String(month).padStart(2, '0')}-27`,
    value: values[i],
    created_at: `${year}-${String(month).padStart(2, '0')}-27T00:00:00Z`,
  }))
);

// Income dal lug 2025 a giu 2026 (12 mesi visualizzati)
const INCOME_MONTHS: Array<[number, number]> = [
  [2025, 7], [2025, 8], [2025, 9], [2025, 10], [2025, 11], [2025, 12],
  [2026, 1], [2026, 2], [2026, 3], [2026, 4],  [2026, 5],  [2026, 6],
];

export const DEMO_INCOME: IncomeTransaction[] = INCOME_MONTHS.map(([year, month]) => ({
  id: `demo-inc-${year}-${month}`,
  user_id: 'demo',
  year,
  month,
  amount: 3500,
  description: 'Stipendio',
  created_at: `${year}-${String(month).padStart(2, '0')}-27T00:00:00Z`,
}));
