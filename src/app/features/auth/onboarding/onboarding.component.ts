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
    .auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f0fdf4; padding: 1rem; }
    :host ::ng-deep .p-card { width: 100%; max-width: 420px; }
    .auth-logo { font-size: 1.5rem; font-weight: 700; color: #15803d; text-align: center; margin-bottom: 0.5rem; }
    h2 { text-align: center; color: #166534; margin-bottom: 0.5rem; }
    .subtitle { text-align: center; color: #4b7a4b; margin-bottom: 1.5rem; }
    .field { display: flex; flex-direction: column; gap: 0.25rem; }
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
