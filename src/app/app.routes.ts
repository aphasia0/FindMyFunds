// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES),
  },
  {
    path: 'onboarding',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/auth/onboarding/onboarding.component').then(
        m => m.OnboardingComponent
      ),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/layout/shell/shell.component').then(
        m => m.ShellComponent
      ),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(
            m => m.DashboardComponent
          ),
      },
      {
        path: 'entry',
        loadComponent: () =>
          import('./features/monthly-entry/monthly-entry.component').then(
            m => m.MonthlyEntryComponent
          ),
      },
      {
        path: 'accounts',
        loadComponent: () =>
          import('./features/accounts/accounts.component').then(
            m => m.AccountsComponent
          ),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings.component').then(
            m => m.SettingsComponent
          ),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
