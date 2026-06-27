import { Injectable, inject } from '@angular/core';
import { from, Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { Profile } from './models';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private supabase = inject(SupabaseService).client;
  private auth = inject(AuthService);

  async getProfile(): Promise<Profile> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', this.auth.userId)
      .single();

    if (!error) return data as Profile;

    // PGRST116 = no rows → first login without trigger, create default profile
    if (error.code === 'PGRST116') {
      const { data: created, error: insertErr } = await this.supabase
        .from('profiles')
        .insert({ id: this.auth.userId, preferred_day: 27, language: 'it', onboarding_completed: false })
        .select()
        .single();
      if (insertErr) throw insertErr;
      return created as Profile;
    }

    throw error;
  }

  async updateProfile(
    updates: Partial<Pick<Profile, 'preferred_day' | 'language' | 'onboarding_completed'>>
  ): Promise<void> {
    const { error } = await this.supabase
      .from('profiles')
      .update(updates)
      .eq('id', this.auth.userId);
    if (error) throw error;
  }

  getProfile$(): Observable<Profile> {
    return from(this.getProfile());
  }
}
