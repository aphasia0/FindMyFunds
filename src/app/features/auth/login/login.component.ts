// src/app/features/auth/login/login.component.ts
import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { AuthService } from '../../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslateModule, ButtonModule, InputTextModule, CardModule, MessageModule],
  template: `
    <div class="auth-page">
      <p-card>
        <div class="auth-logo">
          <span class="logo-mark">€</span>
          <span class="logo-text">FindMyFunds</span>
        </div>
        <p class="auth-tagline">Traccia il tuo patrimonio, mese per mese</p>
        <h2>{{ 'auth.login.title' | translate }}</h2>

        @if (errorMsg) {
          <p-message severity="error" [text]="errorMsg" styleClass="mb-3 w-full" />
        }

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form">
          <div class="field">
            <label>{{ 'auth.login.email' | translate }}</label>
            <input pInputText formControlName="email" type="email" class="w-full" />
          </div>
          <div class="field">
            <label>{{ 'auth.login.password' | translate }}</label>
            <input pInputText formControlName="password" type="password" class="w-full" />
          </div>
          <p-button type="submit" [label]="'auth.login.submit' | translate"
                    [loading]="loading" styleClass="w-full mt-2" />
        </form>

        <p class="auth-link">
          {{ 'auth.login.no_account' | translate }}
          <a routerLink="/auth/register">{{ 'auth.login.register_link' | translate }}</a>
        </p>
        <div class="demo-divider"><span>oppure</span></div>
        <p-button label="Prova la demo →" severity="secondary"
                  styleClass="w-full" (onClick)="goToDemo()" />
      </p-card>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: 100dvh;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      background: var(--canvas);
      padding: 1rem;
      padding-top: clamp(3rem, 10vh, 6rem);
    }
    :host ::ng-deep .p-card { width: 100%; max-width: 420px; }
    :host ::ng-deep .p-card .p-card-body { padding: 2rem; }
    :host ::ng-deep .p-inputtext { width: 100%; }
    .auth-logo {
      display: flex; align-items: center; justify-content: center;
      gap: 0.55rem; margin-bottom: 0.35rem;
    }
    .logo-mark {
      width: 34px; height: 34px; background: var(--primary); border-radius: var(--radius-full);
      color: var(--on-primary); font-weight: 700; font-size: 1rem;
      display: flex; align-items: center; justify-content: center;
    }
    .logo-text { font-size: 1.5rem; font-weight: 700; color: var(--primary); letter-spacing: -0.02em; }
    .auth-tagline {
      text-align: center; color: var(--muted); font-size: 0.875rem;
      margin: 0 0 1.5rem;
    }
    h2 {
      text-align: center; color: var(--ink);
      font-size: 1.375rem; font-weight: 600;
      margin: 0 0 1.5rem; letter-spacing: -0.01em;
    }
    .auth-form { display: flex; flex-direction: column; gap: 1rem; }
    .field { display: flex; flex-direction: column; gap: 0.35rem; }
    .auth-link { text-align: center; margin-top: 1.25rem; font-size: 0.875rem; color: var(--body); }
    a { color: var(--primary); font-weight: 500; }
    .demo-divider {
      display: flex; align-items: center; gap: 0.75rem;
      margin: 1.25rem 0 0.85rem; color: var(--muted); font-size: 0.8125rem;
    }
    .demo-divider::before, .demo-divider::after {
      content: ''; flex: 1; height: 1px; background: var(--hairline-soft);
    }
  `],
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
  });

  loading = false;
  errorMsg = '';

  goToDemo() {
    this.router.navigate(['/demo']);
  }

  async onSubmit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.errorMsg = '';
    try {
      await this.auth.signIn(this.form.value.email!, this.form.value.password!);
      this.router.navigate(['/dashboard']);
    } catch (e: any) {
      this.errorMsg = e.message;
    } finally {
      this.loading = false;
    }
  }
}
