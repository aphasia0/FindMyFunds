export interface IncomeTransaction {
  id: string;
  user_id: string;
  year: number;
  month: number;
  amount: number;
  description: string;
  created_at: string;
}

export interface IncomeFormData {
  amount: number;
  description: string;
}
