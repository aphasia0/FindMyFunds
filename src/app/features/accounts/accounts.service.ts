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

  async setActive(id: string, isActive: boolean): Promise<void> {
    const { error } = await this.supabase
      .from('accounts')
      .update({ is_active: isActive })
      .eq('id', id)
      .eq('user_id', this.auth.userId);
    if (error) throw error;
  }
}
