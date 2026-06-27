// src/app/features/settings/settings.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { ProfileService } from '../../core/profile.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule, TranslateModule, ButtonModule, DropdownModule, InputTextModule, MessageModule],
  template: `
    <h1 class="page-title">{{ 'settings.title' | translate }}</h1>

    <div class="fmf-card settings-form">
      <div class="field">
        <label>{{ 'settings.email' | translate }}</label>
        <input pInputText [value]="email" readonly class="w-full" />
      </div>

      <div class="field">
        <label>{{ 'settings.preferred_day' | translate }}</label>
        <p-dropdown [options]="dayOptions" [(ngModel)]="preferredDay"
                    optionLabel="label" optionValue="value" styleClass="w-full" />
        <small class="text-muted">{{ 'settings.preferred_day_hint' | translate }}</small>
      </div>

      <div class="field">
        <label>{{ 'settings.language' | translate }}</label>
        <p-dropdown [options]="langOptions" [(ngModel)]="language"
                    optionLabel="label" optionValue="value" styleClass="w-full" />
      </div>

      @if (savedMsg) {
        <p-message severity="success" [text]="'settings.saved' | translate" styleClass="w-full" />
      }

      <p-button [label]="saving ? ('settings.saving' | translate) : ('settings.save' | translate)"
                [loading]="saving" (onClick)="onSave()" styleClass="w-full mt-2" />

      <hr style="border-color: #d1fae5; margin: 1.5rem 0;" />

      <p-button [label]="'settings.logout' | translate"
                icon="pi pi-sign-out" severity="secondary"
                (onClick)="onLogout()" styleClass="w-full" />
    </div>
  `,
  styles: [`
    .settings-form { display: flex; flex-direction: column; gap: 1.25rem; max-width: 480px; }
    .field { display: flex; flex-direction: column; gap: 0.25rem; }
  `],
})
export class SettingsComponent implements OnInit {
  private profileService = inject(ProfileService);
  private auth = inject(AuthService);
  private translate = inject(TranslateService);

  email = this.auth.userEmail ?? '';
  preferredDay = 27;
  language: 'it' | 'en' = 'it';
  saving = false;
  savedMsg = false;

  dayOptions = Array.from({ length: 28 }, (_, i) => ({ label: String(i + 1), value: i + 1 }));
  langOptions = [
    { label: 'Italiano', value: 'it' },
    { label: 'English', value: 'en' },
  ];

  async ngOnInit() {
    const profile = await this.profileService.getProfile();
    this.preferredDay = profile.preferred_day;
    this.language = profile.language;
  }

  async onSave() {
    this.saving = true;
    try {
      await this.profileService.updateProfile({ preferred_day: this.preferredDay, language: this.language });
      this.translate.use(this.language);
      this.savedMsg = true;
      setTimeout(() => (this.savedMsg = false), 3000);
    } finally {
      this.saving = false;
    }
  }

  onLogout() {
    this.auth.signOut();
  }
}
