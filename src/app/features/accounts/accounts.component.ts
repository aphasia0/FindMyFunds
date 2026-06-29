// src/app/features/accounts/accounts.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { AccountsService } from './accounts.service';
import { AccountFormComponent } from './account-form/account-form.component';
import { Account, AccountFormData } from '../../core/models';

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [TranslateModule, ButtonModule, DialogModule, AccountFormComponent],
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
        <span class="account-balance" [class.negative]="(latestBalances.get(account.id) ?? 0) < 0">
          {{ formatBalance(latestBalances.get(account.id)) }}
        </span>
        <div class="account-actions">
          <p-button icon="pi pi-pencil" [label]="'accounts.edit' | translate"
                    severity="secondary" size="small" (onClick)="openForm(account)" />
          <p-button icon="pi pi-inbox" [label]="'accounts.archive' | translate"
                    severity="secondary" size="small" (onClick)="openArchiveConfirm(account.id)" />
        </div>
      </div>
    }

    @if (archivedAccounts.length > 0) {
      <h2 class="section-title">{{ 'accounts.archived_section' | translate }}</h2>
      @for (account of archivedAccounts; track account.id) {
        <div class="fmf-card account-row archived">
          <span class="account-name">{{ account.name }}</span>
          <div class="account-actions">
            <p-button icon="pi pi-refresh" [label]="'accounts.reactivate' | translate"
                      severity="secondary" size="small" (onClick)="reactivate(account.id)" />
            <p-button icon="pi pi-trash" [label]="'accounts.delete' | translate"
                      severity="danger" size="small" (onClick)="openDeleteConfirm(account.id)" />
          </div>
        </div>
      }
    }

    <p-dialog [(visible)]="archiveDialogVisible" [modal]="true"
              [header]="'accounts.confirm_archive_header' | translate"
              [style]="{ width: '420px' }" [breakpoints]="{ '640px': '90vw' }"
              [draggable]="false" [resizable]="false">
      <p class="dialog-msg">{{ 'accounts.confirm_archive_msg' | translate }}</p>
      <ng-template pTemplate="footer">
        <p-button [label]="'accounts.form.cancel' | translate"
                  severity="secondary" (onClick)="archiveDialogVisible = false" />
        <p-button [label]="'accounts.archive' | translate" icon="pi pi-inbox"
                  [loading]="archiving" (onClick)="executeArchive()" />
      </ng-template>
    </p-dialog>

    <p-dialog [(visible)]="deleteDialogVisible" [modal]="true"
              [header]="'accounts.confirm_delete_header' | translate"
              [style]="{ width: '420px' }" [breakpoints]="{ '640px': '90vw' }"
              [draggable]="false" [resizable]="false">
      <p class="dialog-msg">{{ 'accounts.confirm_delete_msg' | translate }}</p>
      <ng-template pTemplate="footer">
        <p-button [label]="'accounts.form.cancel' | translate"
                  severity="secondary" (onClick)="deleteDialogVisible = false" />
        <p-button [label]="'accounts.delete' | translate" icon="pi pi-trash"
                  severity="danger" [loading]="deleting" (onClick)="executeDelete()" />
      </ng-template>
    </p-dialog>

    <app-account-form [(visible)]="formVisible" [editAccount]="editingAccount"
                      (saved)="onSaved($event)" />
  `,
  styles: [`
    .add-row { margin-bottom: 1rem; }
    .account-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem; }
    .account-info { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
    .account-name { font-weight: 500; }
    .account-actions { display: flex; gap: 0.5rem; }
    .account-balance { font-weight: 600; font-size: 0.95rem; color: #1a2e1a; white-space: nowrap; margin-left: auto; padding-right: 1rem; }
    .account-balance.negative { color: #dc2626; }
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
    .dialog-msg { margin: 0; color: #374151; line-height: 1.5; }
  `],
})
export class AccountsComponent implements OnInit {
  private service = inject(AccountsService);

  activeAccounts: Account[] = [];
  archivedAccounts: Account[] = [];
  latestBalances = new Map<string, number>();
  formVisible = false;
  editingAccount: Account | null = null;
  archiveDialogVisible = false;
  pendingArchiveId: string | null = null;
  archiving = false;
  deleteDialogVisible = false;
  pendingDeleteId: string | null = null;
  deleting = false;

  async ngOnInit() {
    await this.load();
  }

  async load() {
    const [all, balances] = await Promise.all([
      this.service.getAllAccounts(),
      this.service.getLatestBalances(),
    ]);
    this.activeAccounts = all.filter(a => a.is_active);
    this.archivedAccounts = all.filter(a => !a.is_active);
    this.latestBalances = balances;
  }

  formatBalance(value: number | undefined): string {
    if (value === undefined) return '—';
    return '€ ' + value.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

  openArchiveConfirm(id: string) {
    this.pendingArchiveId = id;
    this.archiveDialogVisible = true;
  }

  async executeArchive() {
    if (!this.pendingArchiveId) return;
    this.archiving = true;
    try {
      await this.service.setActive(this.pendingArchiveId, false);
      this.archiveDialogVisible = false;
      this.pendingArchiveId = null;
      await this.load();
    } finally {
      this.archiving = false;
    }
  }

  openDeleteConfirm(id: string) {
    this.pendingDeleteId = id;
    this.deleteDialogVisible = true;
  }

  async executeDelete() {
    if (!this.pendingDeleteId) return;
    this.deleting = true;
    try {
      await this.service.deleteAccount(this.pendingDeleteId);
      this.deleteDialogVisible = false;
      this.pendingDeleteId = null;
      await this.load();
    } finally {
      this.deleting = false;
    }
  }

  async reactivate(id: string) {
    await this.service.setActive(id, true);
    await this.load();
  }

}
