export type AccountType = 'cash' | 'bond' | 'etf' | 'stock' | 'asset';

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  asset_description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface AccountFormData {
  name: string;
  type: AccountType;
  asset_description: string | null;
}
