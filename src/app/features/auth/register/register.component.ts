// src/app/features/auth/register/register.component.ts
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
  selector: 'app-register',
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
        <h2>{{ 'auth.register.title' | translate }}</h2>

        @if (errorMsg) {
          <p-message severity="error" [text]="errorMsg" styleClass="mb-3 w-full" />
        }
        @if (success) {
          <p-message severity="success" [text]="'auth.register.success_message' | translate" styleClass="mb-3 w-full" />
        }

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form">
          <div class="field">
            <label>{{ 'auth.register.email' | translate }}</label>
            <input pInputText formControlName="email" type="email" class="w-full" />
          </div>
          <div class="field">
            <label>{{ 'auth.register.password' | translate }}</label>
            <input pInputText formControlName="password" type="password" class="w-full" />
          </div>
          <p-button type="submit" [label]="'auth.register.submit' | translate"
                    [loading]="loading" styleClass="w-full mt-2" />
        </form>

        <p class="auth-link">
          {{ 'auth.register.has_account' | translate }}
          <a routerLink="/auth/login">{{ 'auth.register.login_link' | translate }}</a>
        </p>
      </p-card>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: 100vh; display: flex; align-items: flex-start;
      justify-content: center; background: #eef2ff;
      padding: 1rem; padding-top: clamp(3rem, 10vh, 6rem);
    }
    :host ::ng-deep .p-card { width: 100%; max-width: 400px; }
    :host ::ng-deep .p-inputtext { border-color: #c7d2fe !important; }
    :host ::ng-deep .p-inputtext:focus { border-color: #6366f1 !important; }
    .auth-logo {
      display: flex; align-items: center; justify-content: center;
      gap: 0.6rem; margin-bottom: 0.35rem;
    }
    .logo-mark {
      width: 34px; height: 34px; background: #6366f1; border-radius: 9px;
      color: #fff; font-weight: 800; font-size: 1rem;
      display: flex; align-items: center; justify-content: center;
    }
    .logo-text { font-size: 1.4rem; font-weight: 700; color: #4338ca; }
    .auth-tagline {
      text-align: center; color: #6b7280; font-size: 0.85rem;
      margin: 0 0 1.25rem;
    }
    h2 { text-align: center; color: #3730a3; margin-bottom: 1.5rem; }
    .auth-form { display: flex; flex-direction: column; gap: 1rem; }
    .field { display: flex; flex-direction: column; gap: 0.25rem; }
    .auth-link { text-align: center; margin-top: 1rem; }
    a { color: #4f46e5; }
  `],
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
  });

  loading = false;
  errorMsg = '';
  success = false;

  async onSubmit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.errorMsg = '';
    try {
      await this.auth.signUp(this.form.value.email!, this.form.value.password!);
      this.success = true;
      // After email confirmation user will log in; redirect to login
      setTimeout(() => this.router.navigate(['/auth/login']), 3000);
    } catch (e: any) {
      this.errorMsg = e.message;
    } finally {
      this.loading = false;
    }
  }
}
