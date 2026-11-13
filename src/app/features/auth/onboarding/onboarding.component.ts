// src/app/features/auth/onboarding/onboarding.component.ts
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { CardModule } from 'primeng/card';
import { FormsModule } from '@angular/forms';
import { ProfileService } from '../../../core/profile.service';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [FormsModule, TranslateModule, ButtonModule, DropdownModule, CardModule],
  template: `
    <div class="auth-page">
      <p-card>
        <div class="auth-logo">FindMyFunds</div>
        <h2>{{ 'auth.onboarding.title' | translate }}</h2>
        <p class="subtitle">{{ 'auth.onboarding.subtitle' | translate }}</p>

        <div class="field">
          <label>{{ 'auth.onboarding.day_label' | translate }}</label>
          <p-dropdown [options]="dayOptions" [(ngModel)]="selectedDay"
                      optionLabel="label" optionValue="value"
                      styleClass="w-full" />
        </div>

        <p-button [label]="'auth.onboarding.submit' | translate"
                  [loading]="loading" (onClick)="onSubmit()" styleClass="w-full mt-3" />
      </p-card>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: 100dvh; display: flex; align-items: center;
      justify-content: center; background: var(--canvas); padding: 1rem;
    }
    :host ::ng-deep .p-card { width: 100%; max-width: 440px; }
    :host ::ng-deep .p-card .p-card-body { padding: 2rem; }
    .auth-logo {
      font-size: 1.5rem; font-weight: 700; color: var(--primary);
      text-align: center; margin-bottom: 0.5rem; letter-spacing: -0.02em;
    }
    h2 {
      text-align: center; color: var(--ink);
      font-size: 1.375rem; font-weight: 600;
      margin: 0 0 0.5rem; letter-spacing: -0.01em;
    }
    .subtitle { text-align: center; color: var(--muted); font-size: 0.875rem; margin-bottom: 1.5rem; }
    .field { display: flex; flex-direction: column; gap: 0.35rem; }
  `],
})
export class OnboardingComponent {
  private profileService = inject(ProfileService);
  private router = inject(Router);

  selectedDay = 27;
  loading = false;

  dayOptions = Array.from({ length: 28 }, (_, i) => ({
    label: String(i + 1),
    value: i + 1,
  }));

  async onSubmit() {
    this.loading = true;
    try {
      await this.profileService.updateProfile({
        preferred_day: this.selectedDay,
        onboarding_completed: true,
      });
      this.router.navigate(['/dashboard']);
    } finally {
      this.loading = false;
    }
  }
}
