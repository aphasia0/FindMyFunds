// src/app/shared/layout/nav/nav.component.ts
import { Component, Input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

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
    @for (item of items; track item.path) {
      <a [routerLink]="item.path" routerLinkActive="active"
         class="nav-item" [class.bottom-item]="mode === 'bottom'">
        <i [class]="item.icon + ' nav-icon'"></i>
        <span class="nav-label">{{ item.labelKey | translate }}</span>
      </a>
    }
    @if (mode === 'sidebar') {
      <div class="brand">
        <span class="brand-mark">€</span>
        <span class="brand-name">FindMyFunds</span>
      </div>
    }
  `,
  styles: [`
    :host { display: contents; }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.25rem 0.75rem 1.5rem;
      order: -1;
    }

    .brand-mark {
      width: 30px;
      height: 30px;
      background: #22c55e;
      border-radius: 8px;
      color: #ffffff;
      font-weight: 800;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .brand-name {
      font-size: 1rem;
      font-weight: 700;
      color: #15803d;
      letter-spacing: -0.01em;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.65rem 0.75rem;
      border-radius: 0.5rem;
      color: #374151;
      text-decoration: none;
      font-size: 0.95rem;
      transition: background 0.15s, box-shadow 0.15s;

      &:hover { background: #dcfce7; }
      &.active {
        background: #f0fdf4;
        color: #15803d;
        font-weight: 600;
        box-shadow: inset 3px 0 0 #22c55e;
      }
    }

    .bottom-item {
      position: relative;
      flex: 1;
      flex-direction: column;
      justify-content: center;
      gap: 0.2rem;
      padding: 0.75rem 0.25rem;
      font-size: 0.7rem;
      border-radius: 0;
      height: 64px;

      &.active {
        background: transparent;
        box-shadow: none;
        color: #15803d;
        font-weight: 600;
      }
      &.active::after {
        content: '';
        position: absolute;
        top: 8px;
        left: 50%;
        transform: translateX(-50%);
        width: 5px;
        height: 5px;
        background: #22c55e;
        border-radius: 50%;
      }
    }

    .nav-icon { font-size: 1.25rem; }
    .bottom-item .nav-icon { font-size: 1.4rem; }
  `],
})
export class NavComponent {
  @Input() mode: 'sidebar' | 'bottom' = 'sidebar';

  items: NavItem[] = [
    { path: '/dashboard', icon: 'pi pi-home',       labelKey: 'nav.dashboard' },
    { path: '/entry',     icon: 'pi pi-plus-circle', labelKey: 'nav.entry'     },
    { path: '/accounts',  icon: 'pi pi-wallet',      labelKey: 'nav.accounts'  },
    { path: '/settings',  icon: 'pi pi-cog',         labelKey: 'nav.settings'  },
  ];
}
