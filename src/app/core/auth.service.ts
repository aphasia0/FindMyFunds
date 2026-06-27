// src/app/core/auth.service.ts
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { Session } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private supabase = inject(SupabaseService).client;
  private router = inject(Router);

  session$ = new BehaviorSubject<Session | null | undefined>(undefined);

  constructor() {
    this.supabase.auth.getSession().then(({ data }) => {
      this.session$.next(data.session);
    });
    this.supabase.auth.onAuthStateChange((_, session) => {
      this.session$.next(session);
    });
  }

  get userId(): string | null {
    return this.session$.value?.user.id ?? null;
  }

  get userEmail(): string | null {
    return this.session$.value?.user.email ?? null;
  }

  async signIn(email: string, password: string): Promise<void> {
    const { error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async signUp(email: string, password: string): Promise<void> {
    const { error } = await this.supabase.auth.signUp({ email, password });
    if (error) throw error;
  }

  async signOut(): Promise<void> {
    await this.supabase.auth.signOut();
    this.router.navigate(['/auth/login']);
  }
}
