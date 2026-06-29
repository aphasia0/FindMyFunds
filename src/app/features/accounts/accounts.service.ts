// src/app/features/accounts/accounts.service.ts
import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../../core/supabase.service';
import { AuthService } from '../../core/auth.service';
import { Account, AccountFormData } from '../../core/models';

@Injectable({ providedIn: 'root' })
export class AccountsService {
  private supabase = inject(SupabaseService).client;
  private auth = inject(AuthService);

  async getActiveAccounts(): Promise<Account[]> {
    const { data, error } = await this.supabase
      .from('accounts')
      .select('*')
      .eq('user_id', this.auth.userId)
      .eq('is_active', true)
      .order('created_at');
    if (error) throw error;
    return data as Account[];
  }

  async getAllAccounts(): Promise<Account[]> {
    const { data, error } = await this.supabase
      .from('accounts')
      .select('*')
      .eq('user_id', this.auth.userId)
      .order('is_active', { ascending: false })
      .order('created_at');
    if (error) throw error;
    return data as Account[];
  }

  async createAccount(dto: AccountFormData): Promise<Account> {
    const { data, error } = await this.supabase
      .from('accounts')
      .insert({ ...dto, user_id: this.auth.userId })
      .select()
      .single();
    if (error) throw error;
    return data as Account;
  }

  async updateAccount(id: string, dto: AccountFormData): Promise<void> {
    const { error } = await this.supabase
      .from('accounts')
      .update({ name: dto.name, type: dto.type, asset_description: dto.asset_description })
      .eq('id', id)
      .eq('user_id', this.auth.userId);
    if (error) throw error;
  }

  async getLatestBalances(): Promise<Map<string, number>> {
    const { data, error } = await this.supabase
      .from('monthly_snapshots')
      .select('account_id, value, year, month')
      .eq('user_id', this.auth.userId)
      .order('year', { ascending: false })
      .order('month', { ascending: false });
    if (error) throw error;
    const map = new Map<string, number>();
    for (const row of (data ?? [])) {
      if (!map.has(row.account_id)) map.set(row.account_id, Number(row.value));
    }
    return map;
  }

  async deleteAccount(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('accounts')
      .delete()
      .eq('id', id)
      .eq('user_id', this.auth.userId);
    if (error) throw error;
  }

  async setActive(id: string, isActive: boolean): Promise<void> {
    const { error } = await this.supabase
      .from('accounts')
      .update({ is_active: isActive })
      .eq('id', id)
      .eq('user_id', this.auth.userId);
    if (error) throw error;
  }
}
