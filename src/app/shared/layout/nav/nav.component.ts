// src/app/shared/layout/nav/nav.component.ts
import { Component, Input, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { DemoModeService } from '../../../core/demo-mode.service';

interface NavItem {
  path: string;
  icon: string;
  labelKey: string;
}

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslateModule],
  template: `
    @if (mode === 'top') {
      <a class="brand" routerLink="/dashboard">
        <span class="brand-mark">€</span>
        <span class="brand-name">FindMyFunds</span>
        @if (demoMode.isDemo) {
          <span class="demo-badge">DEMO</span>
        }
      </a>
    }

    <nav class="nav-items">
      @for (item of items; track item.path) {
        <a [routerLink]="item.path" routerLinkActive="active"
           class="nav-item"
           [class.top-item]="mode === 'top'"
           [class.bottom-item]="mode === 'bottom'">
          <i [class]="item.icon + ' nav-icon'"></i>
          <span class="nav-label">{{ item.labelKey | translate }}</span>
        </a>
      }
    </nav>

    @if (demoMode.isDemo) {
      <button class="nav-item exit-demo-btn"
              [class.top-item]="mode === 'top'"
              [class.bottom-item]="mode === 'bottom'"
              (click)="demoMode.exit()">
        <i class="pi pi-sign-out nav-icon"></i>
        <span class="nav-label">{{ mode === 'bottom' ? 'Esci' : 'Esci dalla demo' }}</span>
      </button>
    }
  `,
  styles: [`
    :host { display: contents; }

    .brand {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      text-decoration: none;
      justify-self: start;
      white-space: nowrap;
    }

    .brand:hover { text-decoration: none; }

    .brand-mark {
      width: 30px;
      height: 30px;
      background: var(--primary);
      border-radius: 50%;
      color: var(--on-primary);
      font-weight: 700;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .brand-name {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--primary);
      letter-spacing: -0.02em;
    }

    .nav-items {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.25rem;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--muted);
      text-decoration: none;
      font-size: 0.95rem;
      font-weight: 500;
      transition: color 0.15s ease, background-color 0.15s ease;
    }

    .nav-item:hover {
      color: var(--ink);
      text-decoration: none;
    }

    .top-item {
      position: relative;
      height: 72px;
      padding: 0 0.9rem;
      font-size: 1rem;
      font-weight: 600;
      color: var(--muted);
      background: transparent;
      border: 0;
      cursor: pointer;
    }

    .top-item:hover { color: var(--ink); }

    .top-item.active {
      color: var(--ink);
      font-weight: 600;
    }

    .top-item.active::after {
      content: '';
      position: absolute;
      left: 0.9rem;
      right: 0.9rem;
      bottom: 0;
      height: 2px;
      background: var(--ink);
      border-radius: 2px;
    }

    .top-item .nav-icon { font-size: 1rem; }

    .bottom-item {
      position: relative;
      flex: 1;
      flex-direction: column;
      justify-content: center;
      gap: 0.2rem;
      padding: 0.55rem 0.25rem;
      font-size: 0.6875rem;
      font-weight: 500;
      height: 58px;
      border-radius: 0;
      background: transparent;
      border: 0;
      cursor: pointer;
    }

    .bottom-item.active {
      color: var(--ink);
      font-weight: 600;
    }

    .bottom-item.active::after {
      content: '';
      position: absolute;
      top: 0;
      left: 30%;
      right: 30%;
      height: 2px;
      background: var(--ink);
      border-radius: 2px;
    }

    .nav-icon { font-size: 1.15rem; }
    .bottom-item .nav-icon { font-size: 1.25rem; }

    .demo-badge {
      font-size: 0.625rem;
      font-weight: 700;
      background: var(--primary-soft);
      color: var(--primary);
      border: 1px solid var(--primary-disabled);
      padding: 0.1rem 0.4rem;
      border-radius: var(--radius-full);
      letter-spacing: 0.06em;
    }

    .exit-demo-btn {
      color: var(--muted);
      background: transparent;
      border: 0;
      cursor: pointer;
      text-align: left;
    }

    .exit-demo-btn:hover {
      color: var(--error);
      background: var(--negative-soft);
    }

    .exit-demo-btn.top-item {
      justify-self: end;
      padding: 0 0.75rem;
      font-size: 0.875rem;
      height: 40px;
      border-radius: var(--radius-full);
      background: var(--surface-soft);
      border: 1px solid var(--hairline);
    }

    .exit-demo-btn.top-item:hover {
      background: var(--negative-soft);
      border-color: #f1c4b9;
    }

    .exit-demo-btn.bottom-item { color: var(--muted); }

    @media (max-width: 743px) {
      .nav-item.top-item { display: none; }
      .exit-demo-btn.top-item { display: none; }
      .brand-name { font-size: 1.05rem; }
    }
  `],
})
export class NavComponent {
  @Input() mode: 'top' | 'bottom' = 'top';
  demoMode = inject(DemoModeService);

  items: NavItem[] = [
    { path: '/dashboard', icon: 'pi pi-home',        labelKey: 'nav.dashboard' },
    { path: '/entry',     icon: 'pi pi-plus-circle', labelKey: 'nav.entry'     },
    { path: '/accounts',  icon: 'pi pi-wallet',      labelKey: 'nav.accounts'  },
    { path: '/settings',  icon: 'pi pi-cog',         labelKey: 'nav.settings'  },
  ];
}
