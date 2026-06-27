// src/app/features/accounts/accounts.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { AccountsService } from './accounts.service';
import { AccountFormComponent } from './account-form/account-form.component';
import { Account, AccountFormData } from '../../core/models';

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [TranslateModule, ButtonModule, AccountFormComponent],
  template: `
    <h1 class="page-title">{{ 'accounts.title' | translate }}</h1>

    <div class="add-row">
      <p-button icon="pi pi-plus" [label]="'accounts.add' | translate"
                (onClick)="openForm(null)" />
    </div>

    @if (activeAccounts.length === 0) {
      <p class="text-muted">{{ 'accounts.no_accounts' | translate }}</p>
    }

    @for (account of activeAccounts; track account.id) {
      <div class="fmf-card account-row">
        <div class="account-info">
          <span class="account-name">{{ account.name }}</span>
          <span class="type-badge type-{{ account.type }}">
            {{ ('accounts.types.' + account.type) | translate }}
          </span>
          @if (account.asset_description) {
            <span class="text-muted">— {{ account.asset_description }}</span>
          }
        </div>
        <div class="account-actions">
          <p-button icon="pi pi-pencil" [label]="'accounts.edit' | translate"
                    severity="secondary" size="small" (onClick)="openForm(account)" />
          <p-button icon="pi pi-inbox" [label]="'accounts.archive' | translate"
                    severity="secondary" size="small" (onClick)="archive(account.id)" />
        </div>
      </div>
    }

    @if (archivedAccounts.length > 0) {
      <h2 class="section-title">{{ 'accounts.archived_section' | translate }}</h2>
      @for (account of archivedAccounts; track account.id) {
        <div class="fmf-card account-row archived">
          <span class="account-name">{{ account.name }}</span>
          <p-button icon="pi pi-refresh" [label]="'accounts.reactivate' | translate"
                    severity="secondary" size="small" (onClick)="reactivate(account.id)" />
        </div>
      }
    }

    <app-account-form [(visible)]="formVisible" [editAccount]="editingAccount"
                      (saved)="onSaved($event)" />
  `,
  styles: [`
    .add-row { margin-bottom: 1rem; }
    .account-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem; }
    .account-info { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
    .account-name { font-weight: 500; }
    .account-actions { display: flex; gap: 0.5rem; }
    .archived { opacity: 0.6; }
    .type-badge {
      font-size: 0.75rem; font-weight: 600;
      padding: 0.2rem 0.6rem;
      border-radius: 999px;
      white-space: nowrap;
    }
    .type-cash  { background: #dcfce7; color: #15803d; }
    .type-bond  { background: #dbeafe; color: #1d4ed8; }
    .type-etf   { background: #fef3c7; color: #92400e; }
    .type-stock { background: #ede9fe; color: #5b21b6; }
    .type-asset { background: #ffedd5; color: #9a3412; }
  `],
})
export class AccountsComponent implements OnInit {
  private service = inject(AccountsService);

  activeAccounts: Account[] = [];
  archivedAccounts: Account[] = [];
  formVisible = false;
  editingAccount: Account | null = null;

  async ngOnInit() {
    await this.load();
  }

  async load() {
    const all = await this.service.getAllAccounts();
    this.activeAccounts = all.filter(a => a.is_active);
    this.archivedAccounts = all.filter(a => !a.is_active);
  }

  openForm(account: Account | null) {
    this.editingAccount = account;
    this.formVisible = true;
  }

  async onSaved(dto: AccountFormData) {
    if (this.editingAccount) {
      await this.service.updateAccount(this.editingAccount.id, dto);
    } else {
      await this.service.createAccount(dto);
    }
    this.formVisible = false;
    await this.load();
  }

  async archive(id: string) {
    await this.service.setActive(id, false);
    await this.load();
  }

  async reactivate(id: string) {
    await this.service.setActive(id, true);
    await this.load();
  }

}
