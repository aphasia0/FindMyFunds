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
        <div class="auth-logo">FindMyFunds</div>
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
    .auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f0fdf4; padding: 1rem; }
    :host ::ng-deep .p-card { width: 100%; max-width: 400px; }
    .auth-logo { font-size: 1.5rem; font-weight: 700; color: #15803d; text-align: center; margin-bottom: 0.5rem; }
    h2 { text-align: center; color: #166534; margin-bottom: 1.5rem; }
    .auth-form { display: flex; flex-direction: column; gap: 1rem; }
    .field { display: flex; flex-direction: column; gap: 0.25rem; }
    .auth-link { text-align: center; margin-top: 1rem; }
    a { color: #16a34a; }
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
