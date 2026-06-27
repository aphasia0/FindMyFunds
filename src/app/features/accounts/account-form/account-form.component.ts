// src/app/features/accounts/account-form/account-form.component.ts
import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';
import { Account, AccountFormData, AccountType } from '../../../core/models';

@Component({
  selector: 'app-account-form',
  standalone: true,
  imports: [ReactiveFormsModule, TranslateModule, ButtonModule, InputTextModule, DropdownModule, DialogModule],
  template: `
    <p-dialog [header]="(editAccount ? 'accounts.form.edit_title' : 'accounts.form.add_title') | translate"
              [(visible)]="visible" (visibleChange)="visibleChange.emit($event)"
              [modal]="true" [draggable]="false" [resizable]="false"
              [style]="{ width: '560px' }"
              [breakpoints]="{ '640px': '95vw' }"
              [contentStyle]="{ overflow: 'visible' }">
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form">
        <div class="field">
          <label>{{ 'accounts.form.name' | translate }}</label>
          <input pInputText formControlName="name"
                 [placeholder]="'accounts.form.name_placeholder' | translate" class="w-full" />
        </div>
        <div class="field">
          <label>{{ 'accounts.form.type' | translate }}</label>
          <p-dropdown [options]="typeOptions" formControlName="type"
                      optionLabel="label" optionValue="value" styleClass="w-full"
                      appendTo="body" scrollHeight="200px" />
        </div>
        @if (form.value.type === 'asset') {
          <div class="field">
            <label>{{ 'accounts.form.asset_description' | translate }}</label>
            <input pInputText formControlName="asset_description"
                   [placeholder]="'accounts.form.asset_placeholder' | translate" class="w-full" />
          </div>
        }
        <div class="form-actions">
          <p-button type="button" [label]="'accounts.form.cancel' | translate"
                    severity="secondary" (onClick)="onCancel()" />
          <p-button type="submit" [label]="'accounts.form.save' | translate"
                    [loading]="loading" [disabled]="form.invalid" />
        </div>
      </form>
    </p-dialog>
  `,
  styles: [`
    .form { display: flex; flex-direction: column; gap: 1rem; }
    .field { display: flex; flex-direction: column; gap: 0.25rem; }
    .form-actions { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 0.5rem; }
  `],
})
export class AccountFormComponent implements OnChanges {
  @Input() visible = false;
  @Input() editAccount: Account | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<AccountFormData>();

  loading = false;
  private translate = inject(TranslateService);

  get typeOptions() {
    return (['cash', 'bond', 'etf', 'stock', 'asset'] as AccountType[]).map(t => ({
      label: this.translate.instant('accounts.types.' + t),
      value: t,
    }));
  }

  form = new FormGroup({
    name: new FormControl('', [Validators.required]),
    type: new FormControl<AccountType>('cash', [Validators.required]),
    asset_description: new FormControl<string | null>(null),
  });

  ngOnChanges() {
    if (this.editAccount) {
      this.form.setValue({
        name: this.editAccount.name,
        type: this.editAccount.type,
        asset_description: this.editAccount.asset_description,
      });
    } else {
      this.form.reset({ type: 'cash' });
    }
  }

  onSubmit() {
    if (this.form.invalid) return;
    const value = this.form.value;
    this.saved.emit({
      name: value.name!,
      type: value.type!,
      asset_description: value.type === 'asset' ? value.asset_description ?? null : null,
    });
  }

  onCancel() {
    this.visibleChange.emit(false);
  }
}
