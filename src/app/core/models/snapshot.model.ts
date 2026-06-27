export interface MonthlySnapshot {
  id: string;
  user_id: string;
  account_id: string;
  year: number;
  month: number;
  snapshot_date: string;
  value: number;
  created_at: string;
}

export interface SnapshotUpsertData {
  account_id: string;
  year: number;
  month: number;
  snapshot_date: string;
  value: number;
}
