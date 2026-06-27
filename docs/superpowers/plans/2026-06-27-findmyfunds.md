# FindMyFunds Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build FindMyFunds — a bilingual (IT/EN) personal finance tracker with Angular + PrimeNG + Supabase that snapshots monthly wealth across typed accounts and shows a 10-month dashboard with saving rate.

**Architecture:** Standalone Angular 17 app with lazy-loaded feature routes. Business logic lives in injectable services (thin components, fat services). Supabase handles auth + PostgreSQL with Row Level Security. PrimeNG provides UI components; ng2-charts renders the bar chart. ngx-translate drives all i18n.

**Tech Stack:** Angular 17+, PrimeNG 17+, @primeng/themes (Aura preset), ng2-charts 6+, chart.js 4+, @ngx-translate/core 15+, @ngx-translate/http-loader, @supabase/supabase-js 2+, Karma + Jasmine (default Angular test runner), SCSS.

## Global Constraints

- All user-facing strings must go through ngx-translate keys — never hardcode Italian or English text in templates
- All DB access via Supabase JS client only — no raw SQL from the frontend
- Angular standalone components only — no NgModules
- preferred_day is always clamped to 1–28 (avoids February issues)
- All monetary values stored as `numeric(15,2)` in Supabase; displayed with `€` and `toLocaleString('it-IT')`
- RLS enforces user isolation at the DB level; always also filter `user_id = auth.userId` on the client side for clarity
- Language preference is stored in `profiles.language`; applied via `TranslateService.use()` on session load

---

## File Map

```
FindMyFunds/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── supabase.service.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.guard.ts
│   │   │   ├── profile.service.ts
│   │   │   └── models/
│   │   │       ├── account.model.ts
│   │   │       ├── snapshot.model.ts
│   │   │       ├── income.model.ts
│   │   │       └── profile.model.ts
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   │   ├── auth.routes.ts
│   │   │   │   ├── login/
│   │   │   │   │   └── login.component.ts
│   │   │   │   ├── register/
│   │   │   │   │   └── register.component.ts
│   │   │   │   └── onboarding/
│   │   │   │       └── onboarding.component.ts
│   │   │   ├── dashboard/
│   │   │   │   ├── dashboard.component.ts
│   │   │   │   ├── dashboard.service.ts
│   │   │   │   ├── dashboard.service.spec.ts
│   │   │   │   └── components/
│   │   │   │       ├── summary-card/summary-card.component.ts
│   │   │   │       ├── net-worth-chart/net-worth-chart.component.ts
│   │   │   │       └── composition-bar/composition-bar.component.ts
│   │   │   ├── monthly-entry/
│   │   │   │   ├── monthly-entry.component.ts
│   │   │   │   ├── monthly-entry.service.ts
│   │   │   │   └── monthly-entry.service.spec.ts
│   │   │   ├── accounts/
│   │   │   │   ├── accounts.component.ts
│   │   │   │   ├── accounts.service.ts
│   │   │   │   ├── accounts.service.spec.ts
│   │   │   │   └── account-form/
│   │   │   │       └── account-form.component.ts
│   │   │   └── settings/
│   │   │       └── settings.component.ts
│   │   ├── shared/
│   │   │   └── layout/
│   │   │       ├── shell/shell.component.ts
│   │   │       └── nav/nav.component.ts
│   │   ├── app.component.ts
│   │   ├── app.config.ts
│   │   └── app.routes.ts
│   ├── assets/
│   │   └── i18n/
│   │       ├── it.json
│   │       └── en.json
│   └── styles.scss
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
└── package.json
```

---

### Task 1: Project Scaffolding & Configuration

**Files:**
- Create: `src/environments/environment.ts`
- Create: `src/environments/environment.prod.ts`
- Create: `src/app/app.component.ts`
- Create: `src/app/app.config.ts`
- Create: `src/app/app.routes.ts`
- Modify: `src/styles.scss`
- Modify: `angular.json` (add primeicons stylesheet)

**Interfaces:**
- Produces: Angular app that compiles and serves with PrimeNG + ngx-translate + ng2-charts + Supabase JS available

- [ ] **Step 1: Scaffold the Angular project**

```bash
cd /Users/teammobile/FindMyFunds
npx @angular/cli@17 new findmyfunds --routing --style=scss --standalone --skip-git --directory .
```

Expected: Angular project created, `src/` and `angular.json` present.

- [ ] **Step 2: Install dependencies**

```bash
npm install primeng @primeng/themes primeicons ng2-charts chart.js @ngx-translate/core @ngx-translate/http-loader @supabase/supabase-js
```

Expected: all packages appear in `package.json` dependencies.

- [ ] **Step 3: Create environment files**

Create `src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  supabaseUrl: 'YOUR_SUPABASE_PROJECT_URL',
  supabaseAnonKey: 'YOUR_SUPABASE_ANON_KEY',
};
```

Create `src/environments/environment.prod.ts`:
```typescript
export const environment = {
  production: true,
  supabaseUrl: 'YOUR_SUPABASE_PROJECT_URL',
  supabaseAnonKey: 'YOUR_SUPABASE_ANON_KEY',
};
```

- [ ] **Step 4: Write `app.config.ts`**

```typescript
// src/app/app.config.ts
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient } from '@angular/common/http';
import { providePrimeNG } from 'primeng/config';
import { definePreset } from '@primeng/themes';
import Aura from '@primeng/themes/aura';
import { routes } from './app.routes';

const FmfPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
      950: '#052e16',
    },
  },
});

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: { preset: FmfPreset, options: { darkModeSelector: false } },
    }),
    importProvidersFrom(
      TranslateModule.forRoot({
        defaultLanguage: 'it',
        loader: {
          provide: TranslateLoader,
          useFactory: createTranslateLoader,
          deps: [HttpClient],
        },
      })
    ),
  ],
};
```

- [ ] **Step 5: Write stub `app.routes.ts`**

```typescript
// src/app/app.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [];
```

(Will be filled in Task 3 once guards exist.)

- [ ] **Step 6: Write `app.component.ts`**

```typescript
// src/app/app.component.ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class AppComponent {}
```

- [ ] **Step 7: Add PrimeIcons to `angular.json` styles array**

In `angular.json`, find `"styles"` under `projects.findmyfunds.architect.build.options` and add:
```json
"node_modules/primeicons/primeicons.css"
```

So it reads:
```json
"styles": [
  "node_modules/primeicons/primeicons.css",
  "src/styles.scss"
]
```

- [ ] **Step 8: Create i18n asset folders**

```bash
mkdir -p src/assets/i18n
echo '{}' > src/assets/i18n/it.json
echo '{}' > src/assets/i18n/en.json
```

- [ ] **Step 9: Verify the project builds**

```bash
npx ng build --configuration=development
```

Expected: Build succeeds with no errors. (Warnings about unused variables are OK at this stage.)

- [ ] **Step 10: Commit**

```bash
git init
git add .
git commit -m "feat: scaffold Angular project with PrimeNG, ng2-charts, ngx-translate, Supabase"
```

---

### Task 2: Supabase Database Schema

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

**Interfaces:**
- Produces: 4 tables (`profiles`, `accounts`, `monthly_snapshots`, `income_transactions`) with RLS, constraints, and auto-profile trigger

- [ ] **Step 1: Create the migration file**

```bash
mkdir -p supabase/migrations
```

Create `supabase/migrations/001_initial_schema.sql`:

```sql
-- ============================================================
-- profiles: extends auth.users, created automatically on signup
-- ============================================================
create table public.profiles (
  id                   uuid primary key references auth.users(id) on delete cascade,
  preferred_day        int  not null default 27 check (preferred_day between 1 and 28),
  language             text not null default 'it' check (language in ('it', 'en')),
  onboarding_completed boolean not null default false,
  created_at           timestamptz not null default now()
);

alter table public.profiles enable row level security;
create policy "profiles: own row" on public.profiles for all using (auth.uid() = id);

-- Auto-create profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- accounts: user's financial accounts
-- ============================================================
create table public.accounts (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  name              text not null,
  type              text not null check (type in ('cash', 'bond', 'etf', 'stock', 'asset')),
  asset_description text,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now()
);

alter table public.accounts enable row level security;
create policy "accounts: own rows" on public.accounts for all using (auth.uid() = user_id);

-- ============================================================
-- monthly_snapshots: one balance per account per month
-- ============================================================
create table public.monthly_snapshots (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  account_id    uuid not null references public.accounts(id) on delete cascade,
  year          int  not null,
  month         int  not null check (month between 1 and 12),
  snapshot_date date not null,
  value         numeric(15,2) not null default 0,
  created_at    timestamptz not null default now(),
  unique (user_id, account_id, year, month)
);

alter table public.monthly_snapshots enable row level security;
create policy "snapshots: own rows" on public.monthly_snapshots for all using (auth.uid() = user_id);

-- ============================================================
-- income_transactions: positive cash flows per month
-- ============================================================
create table public.income_transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  year        int  not null,
  month       int  not null check (month between 1 and 12),
  amount      numeric(15,2) not null check (amount > 0),
  description text not null,
  created_at  timestamptz not null default now()
);

alter table public.income_transactions enable row level security;
create policy "income: own rows" on public.income_transactions for all using (auth.uid() = user_id);
```

- [ ] **Step 2: Apply the migration to Supabase**

Go to your Supabase project dashboard → SQL Editor → paste the content of `001_initial_schema.sql` → Run.

Or if using Supabase CLI:
```bash
supabase db push
```

- [ ] **Step 3: Verify tables in Supabase dashboard**

In the Supabase Table Editor, confirm these tables exist with the correct columns:
- `profiles` (id, preferred_day, language, onboarding_completed, created_at)
- `accounts` (id, user_id, name, type, asset_description, is_active, created_at)
- `monthly_snapshots` (id, user_id, account_id, year, month, snapshot_date, value, created_at)
- `income_transactions` (id, user_id, year, month, amount, description, created_at)

- [ ] **Step 4: Fill in real Supabase credentials in environment files**

Open Supabase dashboard → Settings → API. Copy Project URL and anon key into `src/environments/environment.ts` and `src/environments/environment.prod.ts`.

- [ ] **Step 5: Commit**

```bash
git add supabase/ src/environments/
git commit -m "feat: add Supabase schema with RLS and auto-profile trigger"
```

---

### Task 3: Core Infrastructure — Services, Guard, Routes

**Files:**
- Create: `src/app/core/supabase.service.ts`
- Create: `src/app/core/auth.service.ts`
- Create: `src/app/core/auth.guard.ts`
- Modify: `src/app/app.routes.ts`
- Modify: `src/app/app.component.ts`

**Interfaces:**
- Produces:
  - `SupabaseService.client: SupabaseClient`
  - `AuthService.session$: BehaviorSubject<Session | null>`
  - `AuthService.userId: string | null`
  - `AuthService.signIn(email, password): Promise<void>`
  - `AuthService.signUp(email, password): Promise<void>`
  - `AuthService.signOut(): Promise<void>`
  - `authGuard: CanActivateFn`

- [ ] **Step 1: Create `supabase.service.ts`**

```typescript
// src/app/core/supabase.service.ts
import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  readonly client: SupabaseClient = createClient(
    environment.supabaseUrl,
    environment.supabaseAnonKey
  );
}
```

- [ ] **Step 2: Create `auth.service.ts`**

```typescript
// src/app/core/auth.service.ts
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { Session } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private supabase = inject(SupabaseService).client;
  private router = inject(Router);

  session$ = new BehaviorSubject<Session | null>(null);

  constructor() {
    this.supabase.auth.getSession().then(({ data }) => {
      this.session$.next(data.session);
    });
    this.supabase.auth.onAuthStateChange((_, session) => {
      this.session$.next(session);
    });
  }

  get userId(): string | null {
    return this.session$.value?.user.id ?? null;
  }

  get userEmail(): string | null {
    return this.session$.value?.user.email ?? null;
  }

  async signIn(email: string, password: string): Promise<void> {
    const { error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async signUp(email: string, password: string): Promise<void> {
    const { error } = await this.supabase.auth.signUp({ email, password });
    if (error) throw error;
  }

  async signOut(): Promise<void> {
    await this.supabase.auth.signOut();
    this.router.navigate(['/auth/login']);
  }
}
```

- [ ] **Step 3: Create `auth.guard.ts`**

```typescript
// src/app/core/auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.session$.pipe(
    take(1),
    map(session => (session ? true : router.createUrlTree(['/auth/login'])))
  );
};
```

- [ ] **Step 4: Update `app.routes.ts` with all routes**

```typescript
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
```

- [ ] **Step 5: Commit**

```bash
git add src/app/core/ src/app/app.routes.ts
git commit -m "feat: add Supabase service, auth service, auth guard, and lazy routes"
```

---

### Task 4: Domain Models + Profile Service

**Files:**
- Create: `src/app/core/models/account.model.ts`
- Create: `src/app/core/models/snapshot.model.ts`
- Create: `src/app/core/models/income.model.ts`
- Create: `src/app/core/models/profile.model.ts`
- Create: `src/app/core/models/index.ts`
- Create: `src/app/core/profile.service.ts`

**Interfaces:**
- Produces:
  - `AccountType = 'cash' | 'bond' | 'etf' | 'stock' | 'asset'`
  - `Account`, `AccountFormData`
  - `MonthlySnapshot`, `SnapshotUpsertData`
  - `IncomeTransaction`, `IncomeFormData`
  - `Profile`
  - `ProfileService.getProfile(): Promise<Profile>`
  - `ProfileService.updateProfile(updates): Promise<void>`

- [ ] **Step 1: Create model files**

```typescript
// src/app/core/models/account.model.ts
export type AccountType = 'cash' | 'bond' | 'etf' | 'stock' | 'asset';

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  asset_description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface AccountFormData {
  name: string;
  type: AccountType;
  asset_description: string | null;
}
```

```typescript
// src/app/core/models/profile.model.ts
export interface Profile {
  id: string;
  preferred_day: number;
  language: 'it' | 'en';
  onboarding_completed: boolean;
  created_at: string;
}
```

```typescript
// src/app/core/models/snapshot.model.ts
export interface MonthlySnapshot {
  id: string;
  user_id: string;
  account_id: string;
  year: number;
  month: number;
  snapshot_date: string;
  value: number;
  created_at: string;
}

export interface SnapshotUpsertData {
  account_id: string;
  year: number;
  month: number;
  snapshot_date: string;
  value: number;
}
```

```typescript
// src/app/core/models/income.model.ts
export interface IncomeTransaction {
  id: string;
  user_id: string;
  year: number;
  month: number;
  amount: number;
  description: string;
  created_at: string;
}

export interface IncomeFormData {
  amount: number;
  description: string;
}
```

```typescript
// src/app/core/models/index.ts
export * from './account.model';
export * from './profile.model';
export * from './snapshot.model';
export * from './income.model';
```

- [ ] **Step 2: Create `profile.service.ts`**

```typescript
// src/app/core/profile.service.ts
import { Injectable, inject } from '@angular/core';
import { from, Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { Profile } from './models';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private supabase = inject(SupabaseService).client;
  private auth = inject(AuthService);

  async getProfile(): Promise<Profile> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', this.auth.userId)
      .single();
    if (error) throw error;
    return data as Profile;
  }

  async updateProfile(
    updates: Partial<Pick<Profile, 'preferred_day' | 'language' | 'onboarding_completed'>>
  ): Promise<void> {
    const { error } = await this.supabase
      .from('profiles')
      .update(updates)
      .eq('id', this.auth.userId);
    if (error) throw error;
  }

  getProfile$(): Observable<Profile> {
    return from(this.getProfile());
  }
}
```

- [ ] **Step 3: Update `app.component.ts` to apply language on session**

```typescript
// src/app/app.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { filter, switchMap } from 'rxjs/operators';
import { AuthService } from './core/auth.service';
import { ProfileService } from './core/profile.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class AppComponent implements OnInit {
  private translate = inject(TranslateService);
  private auth = inject(AuthService);
  private profileService = inject(ProfileService);

  ngOnInit() {
    this.translate.setDefaultLang('it');
    this.auth.session$
      .pipe(
        filter(Boolean),
        switchMap(() => this.profileService.getProfile$())
      )
      .subscribe(profile => {
        this.translate.use(profile.language);
      });
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/core/models/ src/app/core/profile.service.ts src/app/app.component.ts
git commit -m "feat: add domain models and profile service"
```

---

### Task 5: i18n Translation Files

**Files:**
- Create: `src/assets/i18n/it.json`
- Create: `src/assets/i18n/en.json`

**Interfaces:**
- Produces: Complete translation keys for all screens; consumed by all components via `{{ key | translate }}`

- [ ] **Step 1: Write `it.json`**

```json
{
  "app": { "name": "FindMyFunds" },
  "nav": {
    "dashboard": "Dashboard",
    "entry": "Inserimento",
    "accounts": "Conti",
    "settings": "Impostazioni"
  },
  "auth": {
    "login": {
      "title": "Accedi",
      "email": "Email",
      "password": "Password",
      "submit": "Accedi",
      "no_account": "Non hai un account?",
      "register_link": "Registrati"
    },
    "register": {
      "title": "Registrati",
      "email": "Email",
      "password": "Password",
      "submit": "Crea account",
      "has_account": "Hai già un account?",
      "login_link": "Accedi"
    },
    "onboarding": {
      "title": "Benvenuto in FindMyFunds!",
      "subtitle": "Scegli il giorno del mese in cui vuoi fare il riepilogo mensile.",
      "day_label": "Giorno del mese",
      "submit": "Inizia"
    }
  },
  "dashboard": {
    "title": "Dashboard",
    "net_worth": "Patrimonio netto",
    "delta_label": "Variazione",
    "saving_rate": "Tasso di risparmio",
    "na": "N/D",
    "no_data_title": "Nessun dato per questo mese",
    "no_data_cta": "Inserisci i dati del mese",
    "composition": "Composizione del patrimonio",
    "months": ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"]
  },
  "entry": {
    "title": "Inserimento mensile",
    "month": "Mese",
    "snapshot_date": "Data snapshot",
    "accounts_section": "Conti",
    "income_section": "Entrate del mese",
    "add_income": "Aggiungi entrata",
    "description": "Descrizione",
    "amount": "Importo (€)",
    "save": "Salva",
    "saving": "Salvataggio...",
    "saved": "Dati salvati!",
    "remove": "Rimuovi",
    "no_accounts": "Nessun conto attivo. Aggiungine uno nella sezione Conti."
  },
  "accounts": {
    "title": "Gestione Conti",
    "add": "Aggiungi conto",
    "edit": "Modifica",
    "archive": "Archivia",
    "reactivate": "Riattiva",
    "archived_section": "Conti archiviati",
    "no_accounts": "Nessun conto attivo. Aggiungine uno!",
    "form": {
      "name": "Nome conto",
      "name_placeholder": "Es. Conto BancaIntesa",
      "type": "Tipo",
      "asset_description": "Descrizione asset",
      "asset_placeholder": "Es. Bitcoin, Oro",
      "save": "Salva",
      "cancel": "Annulla",
      "add_title": "Nuovo conto",
      "edit_title": "Modifica conto"
    },
    "types": {
      "cash": "Liquidità",
      "bond": "Obbligazioni",
      "etf": "ETF",
      "stock": "Azioni",
      "asset": "Asset"
    }
  },
  "settings": {
    "title": "Impostazioni",
    "preferred_day": "Giorno di inserimento mensile",
    "preferred_day_hint": "Il giorno del mese in cui fai il riepilogo (1–28)",
    "language": "Lingua",
    "lang_it": "Italiano",
    "lang_en": "English",
    "email": "Email",
    "logout": "Esci",
    "save": "Salva",
    "saving": "Salvataggio...",
    "saved": "Impostazioni salvate!"
  },
  "errors": {
    "generic": "Si è verificato un errore. Riprova.",
    "required": "Campo obbligatorio",
    "invalid_email": "Email non valida",
    "min_password": "Minimo 6 caratteri",
    "positive_amount": "Importo deve essere positivo"
  }
}
```

- [ ] **Step 2: Write `en.json`**

```json
{
  "app": { "name": "FindMyFunds" },
  "nav": {
    "dashboard": "Dashboard",
    "entry": "Monthly Entry",
    "accounts": "Accounts",
    "settings": "Settings"
  },
  "auth": {
    "login": {
      "title": "Sign In",
      "email": "Email",
      "password": "Password",
      "submit": "Sign In",
      "no_account": "Don't have an account?",
      "register_link": "Register"
    },
    "register": {
      "title": "Register",
      "email": "Email",
      "password": "Password",
      "submit": "Create account",
      "has_account": "Already have an account?",
      "login_link": "Sign In"
    },
    "onboarding": {
      "title": "Welcome to FindMyFunds!",
      "subtitle": "Choose the day of the month you want to record your monthly snapshot.",
      "day_label": "Day of the month",
      "submit": "Get started"
    }
  },
  "dashboard": {
    "title": "Dashboard",
    "net_worth": "Net worth",
    "delta_label": "Change",
    "saving_rate": "Saving rate",
    "na": "N/A",
    "no_data_title": "No data for this month",
    "no_data_cta": "Enter this month's data",
    "composition": "Portfolio composition",
    "months": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  },
  "entry": {
    "title": "Monthly Entry",
    "month": "Month",
    "snapshot_date": "Snapshot date",
    "accounts_section": "Accounts",
    "income_section": "Income this month",
    "add_income": "Add income",
    "description": "Description",
    "amount": "Amount (€)",
    "save": "Save",
    "saving": "Saving...",
    "saved": "Data saved!",
    "remove": "Remove",
    "no_accounts": "No active accounts. Add one in the Accounts section."
  },
  "accounts": {
    "title": "Manage Accounts",
    "add": "Add account",
    "edit": "Edit",
    "archive": "Archive",
    "reactivate": "Reactivate",
    "archived_section": "Archived accounts",
    "no_accounts": "No active accounts. Add one!",
    "form": {
      "name": "Account name",
      "name_placeholder": "E.g. Savings account",
      "type": "Type",
      "asset_description": "Asset description",
      "asset_placeholder": "E.g. Bitcoin, Gold",
      "save": "Save",
      "cancel": "Cancel",
      "add_title": "New account",
      "edit_title": "Edit account"
    },
    "types": {
      "cash": "Cash",
      "bond": "Bond",
      "etf": "ETF",
      "stock": "Stock",
      "asset": "Asset"
    }
  },
  "settings": {
    "title": "Settings",
    "preferred_day": "Monthly snapshot day",
    "preferred_day_hint": "The day of the month you record your snapshot (1–28)",
    "language": "Language",
    "lang_it": "Italiano",
    "lang_en": "English",
    "email": "Email",
    "logout": "Sign out",
    "save": "Save",
    "saving": "Saving...",
    "saved": "Settings saved!"
  },
  "errors": {
    "generic": "An error occurred. Please try again.",
    "required": "Required field",
    "invalid_email": "Invalid email",
    "min_password": "Minimum 6 characters",
    "positive_amount": "Amount must be positive"
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/assets/i18n/
git commit -m "feat: add Italian and English translation files"
```

---

### Task 6: PrimeNG Theme + Global Styles

**Files:**
- Modify: `src/styles.scss`

**Interfaces:**
- Produces: Global responsive styles; type color constants used by composition bar

- [ ] **Step 1: Write `styles.scss`**

```scss
/* src/styles.scss */

/* PrimeNG base */
@import "primeng/resources/primeng.css";

/* Global reset & layout */
*, *::before, *::after { box-sizing: border-box; }

html, body {
  margin: 0;
  padding: 0;
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  background-color: #f6fef9;
  color: #1a2e1a;
  height: 100%;
}

/* Shell layout */
.shell {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.shell-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  padding-bottom: 5rem; /* space for bottom nav on mobile */

  @media (min-width: 768px) {
    padding-bottom: 1.5rem;
  }
}

/* Sidebar nav — desktop only */
.nav-sidebar {
  display: none;

  @media (min-width: 768px) {
    display: flex;
    flex-direction: column;
    width: 220px;
    background: #ffffff;
    border-right: 1px solid #d1fae5;
    padding: 1.5rem 1rem;
    gap: 0.25rem;
  }
}

/* Bottom nav — mobile only */
.nav-bottom {
  display: flex;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #ffffff;
  border-top: 1px solid #d1fae5;
  z-index: 100;

  @media (min-width: 768px) {
    display: none;
  }
}

/* Utility */
.text-positive { color: #16a34a; }
.text-negative { color: #dc2626; }
.text-muted    { color: #6b7280; }

/* Type colors for composition bar */
:root {
  --color-cash:  #22c55e;
  --color-bond:  #3b82f6;
  --color-etf:   #f59e0b;
  --color-stock: #8b5cf6;
  --color-asset: #f97316;
}

/* Card base */
.fmf-card {
  background: #ffffff;
  border-radius: 1rem;
  padding: 1.25rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

/* Page title */
.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #15803d;
  margin-bottom: 1.25rem;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/styles.scss
git commit -m "feat: global styles, shell layout, type color variables"
```

---

### Task 7: Shell Layout + Navigation

**Files:**
- Create: `src/app/shared/layout/shell/shell.component.ts`
- Create: `src/app/shared/layout/nav/nav.component.ts`

**Interfaces:**
- Produces: `ShellComponent` (router-outlet + sidebar + bottom nav), `NavComponent` (nav items with routerLink)
- Consumes: `authGuard` (already wired in routes), `ProfileService.getProfile()`

- [ ] **Step 1: Create `nav.component.ts`**

```typescript
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
      <div class="nav-logo">{{ 'app.name' | translate }}</div>
    }
  `,
  styles: [`
    :host { display: contents; }

    .nav-logo {
      font-size: 1.1rem;
      font-weight: 700;
      color: #15803d;
      padding: 0.5rem 0.75rem 1.25rem;
      order: -1;
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
      transition: background 0.15s;

      &:hover { background: #dcfce7; }
      &.active { background: #d1fae5; color: #15803d; font-weight: 600; }
    }

    .bottom-item {
      flex: 1;
      flex-direction: column;
      justify-content: center;
      gap: 0.2rem;
      padding: 0.5rem 0.25rem;
      font-size: 0.7rem;
      border-radius: 0;
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
```

- [ ] **Step 2: Create `shell.component.ts`**

```typescript
// src/app/shared/layout/shell/shell.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { NavComponent } from '../nav/nav.component';
import { ProfileService } from '../../../core/profile.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, NavComponent],
  template: `
    <div class="shell">
      <div class="nav-sidebar">
        <app-nav mode="sidebar" />
      </div>
      <main class="shell-content">
        <router-outlet />
      </main>
      <div class="nav-bottom">
        <app-nav mode="bottom" />
      </div>
    </div>
  `,
})
export class ShellComponent implements OnInit {
  private profileService = inject(ProfileService);
  private router = inject(Router);

  async ngOnInit() {
    try {
      const profile = await this.profileService.getProfile();
      if (!profile.onboarding_completed) {
        this.router.navigate(['/onboarding']);
      }
    } catch {
      // Profile not yet available — auth state may still be settling
    }
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/shared/
git commit -m "feat: shell layout with sidebar (desktop) and bottom nav (mobile)"
```

---

### Task 8: Auth Feature — Login, Register, Onboarding

**Files:**
- Create: `src/app/features/auth/auth.routes.ts`
- Create: `src/app/features/auth/login/login.component.ts`
- Create: `src/app/features/auth/register/register.component.ts`
- Create: `src/app/features/auth/onboarding/onboarding.component.ts`

**Interfaces:**
- Consumes: `AuthService.signIn()`, `AuthService.signUp()`, `ProfileService.updateProfile()`
- Produces: Working login → dashboard flow; register → onboarding → dashboard flow

- [ ] **Step 1: Create `auth.routes.ts`**

```typescript
// src/app/features/auth/auth.routes.ts
import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./register/register.component').then(m => m.RegisterComponent),
  },
];
```

- [ ] **Step 2: Create `login.component.ts`**

```typescript
// src/app/features/auth/login/login.component.ts
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
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslateModule, ButtonModule, InputTextModule, CardModule, MessageModule],
  template: `
    <div class="auth-page">
      <p-card>
        <div class="auth-logo">FindMyFunds</div>
        <h2>{{ 'auth.login.title' | translate }}</h2>

        @if (errorMsg) {
          <p-message severity="error" [text]="errorMsg" styleClass="mb-3 w-full" />
        }

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form">
          <div class="field">
            <label>{{ 'auth.login.email' | translate }}</label>
            <input pInputText formControlName="email" type="email" class="w-full" />
          </div>
          <div class="field">
            <label>{{ 'auth.login.password' | translate }}</label>
            <input pInputText formControlName="password" type="password" class="w-full" />
          </div>
          <p-button type="submit" [label]="'auth.login.submit' | translate"
                    [loading]="loading" styleClass="w-full mt-2" />
        </form>

        <p class="auth-link">
          {{ 'auth.login.no_account' | translate }}
          <a routerLink="/auth/register">{{ 'auth.login.register_link' | translate }}</a>
        </p>
      </p-card>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f0fdf4;
      padding: 1rem;
    }
    :host ::ng-deep .p-card { width: 100%; max-width: 400px; }
    .auth-logo { font-size: 1.5rem; font-weight: 700; color: #15803d; text-align: center; margin-bottom: 0.5rem; }
    h2 { text-align: center; color: #166534; margin-bottom: 1.5rem; }
    .auth-form { display: flex; flex-direction: column; gap: 1rem; }
    .field { display: flex; flex-direction: column; gap: 0.25rem; }
    .auth-link { text-align: center; margin-top: 1rem; }
    a { color: #16a34a; }
  `],
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
  });

  loading = false;
  errorMsg = '';

  async onSubmit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.errorMsg = '';
    try {
      await this.auth.signIn(this.form.value.email!, this.form.value.password!);
      this.router.navigate(['/dashboard']);
    } catch (e: any) {
      this.errorMsg = e.message;
    } finally {
      this.loading = false;
    }
  }
}
```

- [ ] **Step 3: Create `register.component.ts`**

```typescript
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
          <p-message severity="success" text="Registrazione completata! Controlla la tua email." styleClass="mb-3 w-full" />
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
```

- [ ] **Step 4: Create `onboarding.component.ts`**

```typescript
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
```

- [ ] **Step 5: Commit**

```bash
git add src/app/features/auth/
git commit -m "feat: auth screens — login, register, onboarding"
```

---

### Task 9: Accounts Feature

**Files:**
- Create: `src/app/features/accounts/accounts.service.ts`
- Create: `src/app/features/accounts/accounts.service.spec.ts`
- Create: `src/app/features/accounts/accounts.component.ts`
- Create: `src/app/features/accounts/account-form/account-form.component.ts`

**Interfaces:**
- Consumes: `Account`, `AccountFormData`, `SupabaseService`, `AuthService`
- Produces:
  - `AccountsService.getActiveAccounts(): Promise<Account[]>`
  - `AccountsService.getAllAccounts(): Promise<Account[]>`
  - `AccountsService.createAccount(dto: AccountFormData): Promise<Account>`
  - `AccountsService.updateAccount(id: string, dto: AccountFormData): Promise<void>`
  - `AccountsService.setActive(id: string, isActive: boolean): Promise<void>`

- [ ] **Step 1: Write the failing test for `AccountsService`**

```typescript
// src/app/features/accounts/accounts.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { AccountsService } from './accounts.service';
import { SupabaseService } from '../../core/supabase.service';
import { AuthService } from '../../core/auth.service';

const mockData: any[] = [];
const mockQuery = {
  select: () => mockQuery,
  eq: () => mockQuery,
  order: () => mockQuery,
  insert: () => mockQuery,
  update: () => mockQuery,
  single: () => Promise.resolve({ data: mockData[0] ?? null, error: null }),
  then: (fn: any) => Promise.resolve({ data: mockData, error: null }).then(fn),
};
const mockClient = { from: () => mockQuery };
const mockSupabase = { client: mockClient };
const mockAuth = { userId: 'user-1' };

describe('AccountsService', () => {
  let service: AccountsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AccountsService,
        { provide: SupabaseService, useValue: mockSupabase },
        { provide: AuthService, useValue: mockAuth },
      ],
    });
    service = TestBed.inject(AccountsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails with "AccountsService not found"**

```bash
npx ng test --include='src/app/features/accounts/accounts.service.spec.ts' --watch=false
```

Expected: Error — `AccountsService` class does not exist yet.

- [ ] **Step 3: Create `accounts.service.ts`**

```typescript
// src/app/features/accounts/accounts.service.ts
import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../../core/supabase.service';
import { AuthService } from '../../core/auth.service';
import { Account, AccountFormData } from '../../core/models';

@Injectable({ providedIn: 'root' })
export class AccountsService {
  private supabase = inject(SupabaseService).client;
  private auth = inject(AuthService);

  async getActiveAccounts(): Promise<Account[]> {
    const { data, error } = await this.supabase
      .from('accounts')
      .select('*')
      .eq('user_id', this.auth.userId)
      .eq('is_active', true)
      .order('created_at');
    if (error) throw error;
    return data as Account[];
  }

  async getAllAccounts(): Promise<Account[]> {
    const { data, error } = await this.supabase
      .from('accounts')
      .select('*')
      .eq('user_id', this.auth.userId)
      .order('is_active', { ascending: false })
      .order('created_at');
    if (error) throw error;
    return data as Account[];
  }

  async createAccount(dto: AccountFormData): Promise<Account> {
    const { data, error } = await this.supabase
      .from('accounts')
      .insert({ ...dto, user_id: this.auth.userId })
      .select()
      .single();
    if (error) throw error;
    return data as Account;
  }

  async updateAccount(id: string, dto: AccountFormData): Promise<void> {
    const { error } = await this.supabase
      .from('accounts')
      .update({ name: dto.name, type: dto.type, asset_description: dto.asset_description })
      .eq('id', id)
      .eq('user_id', this.auth.userId);
    if (error) throw error;
  }

  async setActive(id: string, isActive: boolean): Promise<void> {
    const { error } = await this.supabase
      .from('accounts')
      .update({ is_active: isActive })
      .eq('id', id)
      .eq('user_id', this.auth.userId);
    if (error) throw error;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx ng test --include='src/app/features/accounts/accounts.service.spec.ts' --watch=false
```

Expected: `PASS` — 1 spec, 0 failures.

- [ ] **Step 5: Create `account-form.component.ts`**

```typescript
// src/app/features/accounts/account-form/account-form.component.ts
import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
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
              [modal]="true" [style]="{ width: '400px' }">
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form">
        <div class="field">
          <label>{{ 'accounts.form.name' | translate }}</label>
          <input pInputText formControlName="name"
                 [placeholder]="'accounts.form.name_placeholder' | translate" class="w-full" />
        </div>
        <div class="field">
          <label>{{ 'accounts.form.type' | translate }}</label>
          <p-dropdown [options]="typeOptions" formControlName="type"
                      optionLabel="label" optionValue="value" styleClass="w-full" />
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

  typeOptions = (['cash', 'bond', 'etf', 'stock', 'asset'] as AccountType[]).map(t => ({
    label: t.toUpperCase(),
    value: t,
  }));

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
```

- [ ] **Step 6: Create `accounts.component.ts`**

```typescript
// src/app/features/accounts/accounts.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { AccountsService } from './accounts.service';
import { AccountFormComponent } from './account-form/account-form.component';
import { Account, AccountFormData } from '../../core/models';

const TYPE_SEVERITY: Record<string, string> = {
  cash: 'success', bond: 'info', etf: 'warning', stock: 'danger', asset: 'secondary',
};

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [TranslateModule, ButtonModule, TagModule, AccountFormComponent],
  template: `
    <h1 class="page-title">{{ 'accounts.title' | translate }}</h1>

    <div class="mb-3">
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
          <p-tag [value]="('accounts.types.' + account.type) | translate"
                 [severity]="typeSeverity(account.type)" />
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
    .account-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem; }
    .account-info { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
    .account-name { font-weight: 500; }
    .account-actions { display: flex; gap: 0.5rem; }
    .archived { opacity: 0.6; }
    .section-title { color: #6b7280; font-size: 1rem; margin: 1.5rem 0 0.75rem; }
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

  typeSeverity(type: string): string {
    return TYPE_SEVERITY[type] ?? 'secondary';
  }
}
```

- [ ] **Step 7: Commit**

```bash
git add src/app/features/accounts/
git commit -m "feat: accounts feature with CRUD, archive/reactivate, and form dialog"
```

---

### Task 10: Monthly Entry Feature

**Files:**
- Create: `src/app/features/monthly-entry/monthly-entry.service.ts`
- Create: `src/app/features/monthly-entry/monthly-entry.service.spec.ts`
- Create: `src/app/features/monthly-entry/monthly-entry.component.ts`

**Interfaces:**
- Consumes: `Account`, `MonthlySnapshot`, `SnapshotUpsertData`, `IncomeTransaction`, `IncomeFormData`, `AccountsService`, `ProfileService`
- Produces:
  - `MonthlyEntryService.computeSnapshotDate(year, month, preferredDay): string`
  - `MonthlyEntryService.getSnapshotsForMonth(year, month): Promise<MonthlySnapshot[]>`
  - `MonthlyEntryService.getIncomeForMonth(year, month): Promise<IncomeTransaction[]>`
  - `MonthlyEntryService.saveSnapshots(snapshots: SnapshotUpsertData[]): Promise<void>`
  - `MonthlyEntryService.saveIncome(year, month, items: IncomeFormData[]): Promise<void>`

- [ ] **Step 1: Write the failing tests for `MonthlyEntryService.computeSnapshotDate`**

```typescript
// src/app/features/monthly-entry/monthly-entry.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { MonthlyEntryService } from './monthly-entry.service';
import { SupabaseService } from '../../core/supabase.service';
import { AuthService } from '../../core/auth.service';

const mockClient = { from: () => ({ select: () => {}, delete: () => {}, upsert: () => {}, insert: () => {} }) };
const mockSupabase = { client: mockClient };
const mockAuth = { userId: 'user-1' };

describe('MonthlyEntryService', () => {
  let service: MonthlyEntryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MonthlyEntryService,
        { provide: SupabaseService, useValue: mockSupabase },
        { provide: AuthService, useValue: mockAuth },
      ],
    });
    service = TestBed.inject(MonthlyEntryService);
  });

  describe('computeSnapshotDate', () => {
    it('returns ISO date string YYYY-MM-DD', () => {
      expect(service.computeSnapshotDate(2026, 6, 27)).toBe('2026-06-27');
    });

    it('pads month and day with leading zeros', () => {
      expect(service.computeSnapshotDate(2026, 1, 5)).toBe('2026-01-05');
    });

    it('handles month 12', () => {
      expect(service.computeSnapshotDate(2025, 12, 28)).toBe('2025-12-28');
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx ng test --include='src/app/features/monthly-entry/monthly-entry.service.spec.ts' --watch=false
```

Expected: FAIL — `MonthlyEntryService` not found.

- [ ] **Step 3: Create `monthly-entry.service.ts`**

```typescript
// src/app/features/monthly-entry/monthly-entry.service.ts
import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../../core/supabase.service';
import { AuthService } from '../../core/auth.service';
import { MonthlySnapshot, SnapshotUpsertData, IncomeTransaction, IncomeFormData } from '../../core/models';

@Injectable({ providedIn: 'root' })
export class MonthlyEntryService {
  private supabase = inject(SupabaseService).client;
  private auth = inject(AuthService);

  computeSnapshotDate(year: number, month: number, preferredDay: number): string {
    const mm = String(month).padStart(2, '0');
    const dd = String(preferredDay).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  }

  async getSnapshotsForMonth(year: number, month: number): Promise<MonthlySnapshot[]> {
    const { data, error } = await this.supabase
      .from('monthly_snapshots')
      .select('*')
      .eq('user_id', this.auth.userId)
      .eq('year', year)
      .eq('month', month);
    if (error) throw error;
    return (data ?? []) as MonthlySnapshot[];
  }

  async getIncomeForMonth(year: number, month: number): Promise<IncomeTransaction[]> {
    const { data, error } = await this.supabase
      .from('income_transactions')
      .select('*')
      .eq('user_id', this.auth.userId)
      .eq('year', year)
      .eq('month', month);
    if (error) throw error;
    return (data ?? []) as IncomeTransaction[];
  }

  async saveSnapshots(snapshots: SnapshotUpsertData[]): Promise<void> {
    if (snapshots.length === 0) return;
    const rows = snapshots.map(s => ({ ...s, user_id: this.auth.userId }));
    const { error } = await this.supabase
      .from('monthly_snapshots')
      .upsert(rows, { onConflict: 'user_id,account_id,year,month' });
    if (error) throw error;
  }

  async saveIncome(year: number, month: number, items: IncomeFormData[]): Promise<void> {
    const { error: delError } = await this.supabase
      .from('income_transactions')
      .delete()
      .eq('user_id', this.auth.userId)
      .eq('year', year)
      .eq('month', month);
    if (delError) throw delError;

    if (items.length === 0) return;

    const rows = items.map(i => ({ ...i, year, month, user_id: this.auth.userId }));
    const { error } = await this.supabase
      .from('income_transactions')
      .insert(rows);
    if (error) throw error;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx ng test --include='src/app/features/monthly-entry/monthly-entry.service.spec.ts' --watch=false
```

Expected: PASS — 3 specs, 0 failures.

- [ ] **Step 5: Create `monthly-entry.component.ts`**

```typescript
// src/app/features/monthly-entry/monthly-entry.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { MessageModule } from 'primeng/message';
import { MonthlyEntryService } from './monthly-entry.service';
import { AccountsService } from '../accounts/accounts.service';
import { ProfileService } from '../../core/profile.service';
import { Account, IncomeFormData } from '../../core/models';

interface AccountRow {
  account: Account;
  value: number;
}

@Component({
  selector: 'app-monthly-entry',
  standalone: true,
  imports: [FormsModule, TranslateModule, ButtonModule, InputNumberModule, InputTextModule, DropdownModule, MessageModule],
  template: `
    <h1 class="page-title">{{ 'entry.title' | translate }}</h1>

    <div class="fmf-card mb-3 entry-header">
      <div class="field">
        <label>{{ 'entry.month' | translate }}</label>
        <p-dropdown [options]="monthOptions" [(ngModel)]="selectedMonth"
                    optionLabel="label" (onChange)="onMonthChange()"
                    styleClass="w-full" />
      </div>
      <div class="snapshot-date">
        <span class="text-muted">{{ 'entry.snapshot_date' | translate }}:</span>
        <strong>{{ snapshotDate }}</strong>
      </div>
    </div>

    @if (noAccounts) {
      <p class="text-muted">{{ 'entry.no_accounts' | translate }}</p>
    } @else {
      <div class="fmf-card mb-3">
        <h3 class="section-title">{{ 'entry.accounts_section' | translate }}</h3>
        @for (row of accountRows; track row.account.id) {
          <div class="account-entry-row">
            <div class="account-entry-label">
              <span>{{ row.account.name }}</span>
              @if (row.account.asset_description) {
                <span class="text-muted">{{ row.account.asset_description }}</span>
              }
            </div>
            <p-inputNumber [(ngModel)]="row.value" mode="decimal"
                           [minFractionDigits]="2" [maxFractionDigits]="2"
                           prefix="€ " [min]="0" styleClass="amount-input" />
          </div>
        }
      </div>

      <div class="fmf-card mb-3">
        <h3 class="section-title">{{ 'entry.income_section' | translate }}</h3>
        @for (item of incomeRows; track $index) {
          <div class="income-row">
            <input pInputText [(ngModel)]="item.description"
                   [placeholder]="'entry.description' | translate" class="flex-1" />
            <p-inputNumber [(ngModel)]="item.amount" mode="decimal"
                           [minFractionDigits]="2" [maxFractionDigits]="2"
                           prefix="€ " [min]="0.01" styleClass="amount-input" />
            <p-button icon="pi pi-trash" severity="danger" size="small"
                      (onClick)="removeIncome($index)" />
          </div>
        }
        <p-button icon="pi pi-plus" [label]="'entry.add_income' | translate"
                  severity="secondary" size="small" (onClick)="addIncome()" styleClass="mt-2" />
      </div>

      @if (savedMsg) {
        <p-message severity="success" [text]="'entry.saved' | translate" styleClass="mb-3 w-full" />
      }

      <p-button [label]="saving ? ('entry.saving' | translate) : ('entry.save' | translate)"
                [loading]="saving" (onClick)="onSave()" styleClass="w-full" />
    }
  `,
  styles: [`
    .entry-header { display: flex; align-items: flex-end; gap: 1.5rem; flex-wrap: wrap; }
    .snapshot-date { display: flex; gap: 0.5rem; align-items: center; }
    .section-title { font-size: 1rem; font-weight: 600; color: #15803d; margin-bottom: 1rem; }
    .account-entry-row { display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #f0fdf4; flex-wrap: wrap; gap: 0.5rem; }
    .account-entry-label { display: flex; flex-direction: column; }
    :host ::ng-deep .amount-input { width: 160px; }
    .income-row { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; flex-wrap: wrap; }
    .flex-1 { flex: 1; min-width: 120px; }
  `],
})
export class MonthlyEntryComponent implements OnInit {
  private entryService = inject(MonthlyEntryService);
  private accountsService = inject(AccountsService);
  private profileService = inject(ProfileService);

  accountRows: AccountRow[] = [];
  incomeRows: IncomeFormData[] = [];
  noAccounts = false;
  saving = false;
  savedMsg = false;
  snapshotDate = '';
  preferredDay = 27;

  selectedMonth = { label: '', year: 0, month: 0 };
  monthOptions: { label: string; year: number; month: number }[] = [];

  private MONTHS_IT = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];

  async ngOnInit() {
    const now = new Date();
    this.monthOptions = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      return {
        label: `${this.MONTHS_IT[d.getMonth()]} ${d.getFullYear()}`,
        year: d.getFullYear(),
        month: d.getMonth() + 1,
      };
    });
    this.selectedMonth = this.monthOptions[this.monthOptions.length - 1];

    const profile = await this.profileService.getProfile();
    this.preferredDay = profile.preferred_day;

    await this.load();
  }

  async onMonthChange() {
    await this.load();
  }

  private async load() {
    const { year, month } = this.selectedMonth;
    this.snapshotDate = this.entryService.computeSnapshotDate(year, month, this.preferredDay);

    const accounts = await this.accountsService.getActiveAccounts();
    this.noAccounts = accounts.length === 0;
    if (this.noAccounts) return;

    const snapshots = await this.entryService.getSnapshotsForMonth(year, month);

    // Pre-fill with last month's values if no current data
    let prevSnapshots = snapshots;
    if (snapshots.length === 0) {
      const prevDate = new Date(year, month - 2, 1);
      prevSnapshots = await this.entryService.getSnapshotsForMonth(
        prevDate.getFullYear(), prevDate.getMonth() + 1
      );
    }

    this.accountRows = accounts.map(account => {
      const snap = snapshots.find(s => s.account_id === account.id)
        ?? prevSnapshots.find(s => s.account_id === account.id);
      return { account, value: snap ? Number(snap.value) : 0 };
    });

    const income = await this.entryService.getIncomeForMonth(year, month);
    this.incomeRows = income.map(i => ({ amount: Number(i.amount), description: i.description }));
  }

  addIncome() {
    this.incomeRows.push({ amount: 0, description: '' });
  }

  removeIncome(index: number) {
    this.incomeRows.splice(index, 1);
  }

  async onSave() {
    const { year, month } = this.selectedMonth;
    this.saving = true;
    try {
      const snapshotDate = this.entryService.computeSnapshotDate(year, month, this.preferredDay);
      const snapshots = this.accountRows.map(row => ({
        account_id: row.account.id,
        year, month, snapshot_date: snapshotDate,
        value: row.value,
      }));
      const validIncome = this.incomeRows.filter(i => i.amount > 0 && i.description.trim());

      await Promise.all([
        this.entryService.saveSnapshots(snapshots),
        this.entryService.saveIncome(year, month, validIncome),
      ]);

      this.savedMsg = true;
      setTimeout(() => (this.savedMsg = false), 3000);
    } finally {
      this.saving = false;
    }
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add src/app/features/monthly-entry/
git commit -m "feat: monthly entry screen with snapshot + income entry and TDD service"
```

---

### Task 11: Dashboard Feature

**Files:**
- Create: `src/app/features/dashboard/dashboard.service.ts`
- Create: `src/app/features/dashboard/dashboard.service.spec.ts`
- Create: `src/app/features/dashboard/dashboard.component.ts`
- Create: `src/app/features/dashboard/components/summary-card/summary-card.component.ts`
- Create: `src/app/features/dashboard/components/net-worth-chart/net-worth-chart.component.ts`
- Create: `src/app/features/dashboard/components/composition-bar/composition-bar.component.ts`

**Interfaces:**
- Consumes: `MonthlySnapshot`, `IncomeTransaction`, `AccountType`, `SupabaseService`, `AuthService`
- Produces:
  - `MonthSummary { year, month, total, delta, income, savingPct }`
  - `DashboardService.buildSummaries(snapshots, income, months): MonthSummary[]` (pure function)
  - `DashboardService.loadDashboard(): Promise<{ summaries, composition }>`
  - `CompositionItem { type: AccountType; total: number }`

- [ ] **Step 1: Write the failing tests for `DashboardService.buildSummaries`**

```typescript
// src/app/features/dashboard/dashboard.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { DashboardService } from './dashboard.service';
import { SupabaseService } from '../../core/supabase.service';
import { AuthService } from '../../core/auth.service';
import { MonthlySnapshot, IncomeTransaction } from '../../core/models';

const mockClient = { from: () => ({ select: () => ({ eq: () => ({ gte: () => ({ lte: () => ({}) }) }) }) }) };
const mockSupabase = { client: mockClient };
const mockAuth = { userId: 'user-1' };

describe('DashboardService', () => {
  let service: DashboardService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DashboardService,
        { provide: SupabaseService, useValue: mockSupabase },
        { provide: AuthService, useValue: mockAuth },
      ],
    });
    service = TestBed.inject(DashboardService);
  });

  describe('buildSummaries', () => {
    const months = [
      { year: 2026, month: 4 },
      { year: 2026, month: 5 },
      { year: 2026, month: 6 },
    ];

    function snap(accountId: string, year: number, month: number, value: number): Partial<MonthlySnapshot> {
      return { account_id: accountId, year, month, value } as MonthlySnapshot;
    }

    function inc(year: number, month: number, amount: number): Partial<IncomeTransaction> {
      return { year, month, amount } as IncomeTransaction;
    }

    it('sums all account values per month', () => {
      const snapshots = [
        snap('a1', 2026, 4, 5000), snap('a2', 2026, 4, 3000),
        snap('a1', 2026, 5, 6000), snap('a2', 2026, 5, 3500),
        snap('a1', 2026, 6, 7000), snap('a2', 2026, 6, 4000),
      ];
      const result = service.buildSummaries(snapshots as MonthlySnapshot[], [], months);
      expect(result[0].total).toBe(8000);
      expect(result[1].total).toBe(9500);
      expect(result[2].total).toBe(11000);
    });

    it('sets delta to null for the first month', () => {
      const result = service.buildSummaries([snap('a1', 2026, 4, 8000)] as MonthlySnapshot[], [], [months[0]]);
      expect(result[0].delta).toBeNull();
    });

    it('computes delta as difference from previous month total', () => {
      const snapshots = [snap('a1', 2026, 5, 9500), snap('a1', 2026, 6, 11000)];
      const result = service.buildSummaries(snapshots as MonthlySnapshot[], [], months.slice(1));
      expect(result[1].delta).toBe(1500);
    });

    it('computes saving rate as (delta / income) * 100', () => {
      const snapshots = [snap('a1', 2026, 5, 9500), snap('a1', 2026, 6, 10500)];
      const income = [inc(2026, 6, 2000)];
      const result = service.buildSummaries(snapshots as MonthlySnapshot[], income as IncomeTransaction[], months.slice(1));
      expect(result[1].savingPct).toBe(50);
    });

    it('returns null saving rate when income is zero', () => {
      const snapshots = [snap('a1', 2026, 5, 9500), snap('a1', 2026, 6, 10500)];
      const result = service.buildSummaries(snapshots as MonthlySnapshot[], [], months.slice(1));
      expect(result[1].savingPct).toBeNull();
    });

    it('returns null saving rate for the first month even with income', () => {
      const snapshots = [snap('a1', 2026, 4, 8000)];
      const income = [inc(2026, 4, 3000)];
      const result = service.buildSummaries(snapshots as MonthlySnapshot[], income as IncomeTransaction[], [months[0]]);
      expect(result[0].savingPct).toBeNull();
    });

    it('returns negative delta when wealth decreases', () => {
      const snapshots = [snap('a1', 2026, 5, 10000), snap('a1', 2026, 6, 9000)];
      const result = service.buildSummaries(snapshots as MonthlySnapshot[], [], months.slice(1));
      expect(result[1].delta).toBe(-1000);
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx ng test --include='src/app/features/dashboard/dashboard.service.spec.ts' --watch=false
```

Expected: FAIL — `DashboardService` not found.

- [ ] **Step 3: Create `dashboard.service.ts`**

```typescript
// src/app/features/dashboard/dashboard.service.ts
import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../../core/supabase.service';
import { AuthService } from '../../core/auth.service';
import { MonthlySnapshot, IncomeTransaction, AccountType } from '../../core/models';

export interface MonthSummary {
  year: number;
  month: number;
  total: number;
  delta: number | null;
  income: number;
  savingPct: number | null;
}

export interface CompositionItem {
  type: AccountType;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private supabase = inject(SupabaseService).client;
  private auth = inject(AuthService);

  buildSummaries(
    snapshots: MonthlySnapshot[],
    income: IncomeTransaction[],
    months: { year: number; month: number }[]
  ): MonthSummary[] {
    return months.map((m, i) => {
      const monthSnaps = snapshots.filter(s => s.year === m.year && s.month === m.month);
      const total = monthSnaps.reduce((sum, s) => sum + Number(s.value), 0);

      let delta: number | null = null;
      if (i > 0) {
        const prev = months[i - 1];
        const prevSnaps = snapshots.filter(s => s.year === prev.year && s.month === prev.month);
        const prevTotal = prevSnaps.reduce((sum, s) => sum + Number(s.value), 0);
        delta = total - prevTotal;
      }

      const monthIncome = income
        .filter(t => t.year === m.year && t.month === m.month)
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const savingPct =
        delta !== null && monthIncome > 0 ? (delta / monthIncome) * 100 : null;

      return { year: m.year, month: m.month, total, delta, income: monthIncome, savingPct };
    });
  }

  getLast10Months(): { year: number; month: number }[] {
    const now = new Date();
    return Array.from({ length: 10 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 9 + i, 1);
      return { year: d.getFullYear(), month: d.getMonth() + 1 };
    });
  }

  async loadDashboard(): Promise<{ summaries: MonthSummary[]; composition: CompositionItem[] }> {
    const months = this.getLast10Months();
    const years = [...new Set(months.map(m => m.year))];

    const [snapshotsRes, incomeRes] = await Promise.all([
      this.supabase
        .from('monthly_snapshots')
        .select('*')
        .eq('user_id', this.auth.userId)
        .in('year', years),
      this.supabase
        .from('income_transactions')
        .select('*')
        .eq('user_id', this.auth.userId)
        .in('year', years),
    ]);

    if (snapshotsRes.error) throw snapshotsRes.error;
    if (incomeRes.error) throw incomeRes.error;

    const allSnapshots = (snapshotsRes.data ?? []) as MonthlySnapshot[];
    const allIncome = (incomeRes.data ?? []) as IncomeTransaction[];

    // Filter to only the 10 relevant months
    const relevant = (s: { year: number; month: number }) =>
      months.some(m => m.year === s.year && m.month === s.month);
    const snapshots = allSnapshots.filter(relevant);
    const income = allIncome.filter(relevant);

    const summaries = this.buildSummaries(snapshots, income, months);

    // Build composition for the latest month that has data
    const lastWithData = [...summaries].reverse().find(s => s.total > 0);
    const composition = this.buildComposition(
      snapshots,
      lastWithData ?? summaries[summaries.length - 1]
    );

    return { summaries, composition };
  }

  private buildComposition(
    snapshots: (MonthlySnapshot & { accounts?: { type: AccountType } })[],
    month: MonthSummary
  ): CompositionItem[] {
    const monthSnaps = snapshots.filter(s => s.year === month.year && s.month === month.month);
    const byType: Partial<Record<AccountType, number>> = {};
    for (const s of monthSnaps) {
      const type: AccountType = (s as any).accounts?.type ?? 'asset';
      byType[type] = (byType[type] ?? 0) + Number(s.value);
    }
    return Object.entries(byType).map(([type, total]) => ({
      type: type as AccountType,
      total: total as number,
    }));
  }

  async loadDashboardWithTypes(): Promise<{ summaries: MonthSummary[]; composition: CompositionItem[] }> {
    const months = this.getLast10Months();
    const years = [...new Set(months.map(m => m.year))];

    const [snapshotsRes, incomeRes] = await Promise.all([
      this.supabase
        .from('monthly_snapshots')
        .select('*, accounts(type)')
        .eq('user_id', this.auth.userId)
        .in('year', years),
      this.supabase
        .from('income_transactions')
        .select('*')
        .eq('user_id', this.auth.userId)
        .in('year', years),
    ]);

    if (snapshotsRes.error) throw snapshotsRes.error;
    if (incomeRes.error) throw incomeRes.error;

    const allSnapshots = (snapshotsRes.data ?? []) as any[];
    const allIncome = (incomeRes.data ?? []) as IncomeTransaction[];

    const relevant = (s: { year: number; month: number }) =>
      months.some(m => m.year === s.year && m.month === s.month);
    const snapshots = allSnapshots.filter(relevant) as MonthlySnapshot[];
    const income = allIncome.filter(relevant);

    const summaries = this.buildSummaries(snapshots, income, months);

    const lastWithData = [...summaries].reverse().find(s => s.total > 0);
    const composition = this.buildComposition(
      allSnapshots.filter(relevant),
      lastWithData ?? summaries[summaries.length - 1]
    );

    return { summaries, composition };
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx ng test --include='src/app/features/dashboard/dashboard.service.spec.ts' --watch=false
```

Expected: PASS — 7 specs, 0 failures.

- [ ] **Step 5: Create `summary-card.component.ts`**

```typescript
// src/app/features/dashboard/components/summary-card/summary-card.component.ts
import { Component, Input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { MonthSummary } from '../../dashboard.service';

@Component({
  selector: 'app-summary-card',
  standalone: true,
  imports: [TranslateModule],
  template: `
    @if (summary) {
      <div class="fmf-card summary-card">
        <div class="summary-item">
          <span class="label">{{ 'dashboard.net_worth' | translate }}</span>
          <span class="value total">{{ summary.total | number:'1.2-2' | currency:'EUR':'symbol':'1.2-2':'it' }}</span>
        </div>
        <div class="summary-item">
          <span class="label">{{ 'dashboard.delta_label' | translate }}</span>
          <span class="value" [class.text-positive]="(summary.delta ?? 0) >= 0"
                              [class.text-negative]="(summary.delta ?? 0) < 0">
            {{ summary.delta !== null ? formatDelta(summary.delta) : ('dashboard.na' | translate) }}
          </span>
        </div>
        <div class="summary-item">
          <span class="label">{{ 'dashboard.saving_rate' | translate }}</span>
          <span class="value" [class.text-positive]="(summary.savingPct ?? 0) >= 0"
                              [class.text-negative]="(summary.savingPct ?? 0) < 0">
            {{ summary.savingPct !== null ? (summary.savingPct | number:'1.1-1') + '%' : ('dashboard.na' | translate) }}
          </span>
        </div>
      </div>
    }
  `,
  styles: [`
    .summary-card { display: flex; gap: 2rem; flex-wrap: wrap; margin-bottom: 1.25rem; }
    .summary-item { display: flex; flex-direction: column; gap: 0.25rem; }
    .label { font-size: 0.8rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
    .value { font-size: 1.5rem; font-weight: 700; color: #1a2e1a; }
    .total { font-size: 1.75rem; }
  `],
})
export class SummaryCardComponent {
  @Input() summary: MonthSummary | null = null;

  formatDelta(delta: number): string {
    const sign = delta >= 0 ? '+' : '';
    return `${sign}${delta.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
  }
}
```

- [ ] **Step 6: Create `net-worth-chart.component.ts`**

```typescript
// src/app/features/dashboard/components/net-worth-chart/net-worth-chart.component.ts
import { Component, Input, OnChanges } from '@angular/core';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { MonthSummary } from '../../dashboard.service';

const MONTH_LABELS_IT = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];

@Component({
  selector: 'app-net-worth-chart',
  standalone: true,
  imports: [NgChartsModule],
  template: `
    <div class="fmf-card chart-wrap">
      <canvas baseChart [data]="chartData" [options]="chartOptions" type="bar"></canvas>
    </div>
  `,
  styles: [`.chart-wrap { margin-bottom: 1.25rem; } canvas { max-height: 260px; }`],
})
export class NetWorthChartComponent implements OnChanges {
  @Input() summaries: MonthSummary[] = [];

  chartData: ChartData<'bar'> = { labels: [], datasets: [] };

  chartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    animation: { duration: 800, easing: 'easeInOutQuart' },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: ctx => `€ ${Number(ctx.raw).toLocaleString('it-IT', { minimumFractionDigits: 2 })}`,
        },
      },
    },
    scales: {
      y: {
        ticks: {
          callback: value => `€ ${Number(value).toLocaleString('it-IT')}`,
        },
      },
    },
  };

  ngOnChanges() {
    this.chartData = {
      labels: this.summaries.map(s => `${MONTH_LABELS_IT[s.month - 1]} ${s.year}`),
      datasets: [{
        data: this.summaries.map(s => s.total),
        backgroundColor: this.summaries.map((s, i) =>
          i === this.summaries.length - 1 ? '#16a34a' : '#86efac'
        ),
        borderRadius: 8,
        label: 'Net Worth',
      }],
    };
  }
}
```

- [ ] **Step 7: Create `composition-bar.component.ts`**

```typescript
// src/app/features/dashboard/components/composition-bar/composition-bar.component.ts
import { Component, Input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { CompositionItem } from '../../dashboard.service';

const TYPE_COLORS: Record<string, string> = {
  cash: '#22c55e', bond: '#3b82f6', etf: '#f59e0b', stock: '#8b5cf6', asset: '#f97316',
};

@Component({
  selector: 'app-composition-bar',
  standalone: true,
  imports: [TranslateModule],
  template: `
    @if (items.length > 0) {
      <div class="fmf-card composition-card">
        <div class="comp-title">{{ 'dashboard.composition' | translate }}</div>
        <div class="comp-bar">
          @for (item of items; track item.type) {
            <div class="comp-segment"
                 [style.width.%]="pct(item.total)"
                 [style.background]="color(item.type)"
                 [title]="('accounts.types.' + item.type | translate) + ': €' + item.total.toLocaleString('it-IT')">
            </div>
          }
        </div>
        <div class="comp-legend">
          @for (item of items; track item.type) {
            <div class="legend-item">
              <span class="legend-dot" [style.background]="color(item.type)"></span>
              <span>{{ 'accounts.types.' + item.type | translate }} — {{ pct(item.total) | number:'1.1-1' }}%</span>
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .composition-card { margin-bottom: 1.25rem; }
    .comp-title { font-size: 0.85rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.75rem; }
    .comp-bar { display: flex; height: 24px; border-radius: 12px; overflow: hidden; gap: 2px; }
    .comp-segment { transition: width 0.4s ease; }
    .comp-legend { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 0.75rem; font-size: 0.85rem; }
    .legend-item { display: flex; align-items: center; gap: 0.35rem; }
    .legend-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
  `],
})
export class CompositionBarComponent {
  @Input() items: CompositionItem[] = [];

  get grandTotal(): number {
    return this.items.reduce((s, i) => s + i.total, 0);
  }

  pct(total: number): number {
    return this.grandTotal > 0 ? (total / this.grandTotal) * 100 : 0;
  }

  color(type: string): string {
    return TYPE_COLORS[type] ?? '#9ca3af';
  }
}
```

- [ ] **Step 8: Create `dashboard.component.ts`**

```typescript
// src/app/features/dashboard/dashboard.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DashboardService, MonthSummary, CompositionItem } from './dashboard.service';
import { SummaryCardComponent } from './components/summary-card/summary-card.component';
import { NetWorthChartComponent } from './components/net-worth-chart/net-worth-chart.component';
import { CompositionBarComponent } from './components/composition-bar/composition-bar.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, TranslateModule, ButtonModule, SummaryCardComponent, NetWorthChartComponent, CompositionBarComponent],
  template: `
    <h1 class="page-title">{{ 'dashboard.title' | translate }}</h1>

    @if (currentSummary) {
      <app-summary-card [summary]="currentSummary" />
    }

    @if (showNoCta) {
      <div class="fmf-card cta-banner mb-3">
        <span>{{ 'dashboard.no_data_title' | translate }}</span>
        <p-button routerLink="/entry" [label]="'dashboard.no_data_cta' | translate"
                  icon="pi pi-plus" size="small" />
      </div>
    }

    @if (summaries.length > 0) {
      <app-net-worth-chart [summaries]="summaries" />
      <app-composition-bar [items]="composition" />
    }
  `,
  styles: [`
    .cta-banner { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem; background: #dcfce7; border: 1px solid #86efac; }
  `],
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);

  summaries: MonthSummary[] = [];
  composition: CompositionItem[] = [];
  currentSummary: MonthSummary | null = null;
  showNoCta = false;

  async ngOnInit() {
    try {
      const { summaries, composition } = await this.dashboardService.loadDashboardWithTypes();
      this.summaries = summaries;
      this.composition = composition;
      this.currentSummary = summaries[summaries.length - 1] ?? null;
      this.showNoCta = this.currentSummary?.total === 0;
    } catch (e) {
      console.error('Dashboard load error', e);
    }
  }
}
```

- [ ] **Step 9: Register ng2-charts in the app**

In `src/app/app.config.ts`, add to providers:

```typescript
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

// inside providers array:
provideCharts(withDefaultRegisterables()),
```

- [ ] **Step 10: Run all tests to verify the full suite passes**

```bash
npx ng test --watch=false
```

Expected: All specs PASS, 0 failures.

- [ ] **Step 11: Verify the app builds**

```bash
npx ng build --configuration=development
```

Expected: Build succeeds.

- [ ] **Step 12: Commit**

```bash
git add src/app/features/dashboard/
git commit -m "feat: dashboard with summary card, 10-month bar chart, composition bar, and TDD service"
```

---

### Task 12: Settings Feature

**Files:**
- Create: `src/app/features/settings/settings.component.ts`

**Interfaces:**
- Consumes: `ProfileService.getProfile()`, `ProfileService.updateProfile()`, `AuthService.signOut()`, `AuthService.userEmail`, `TranslateService.use()`

- [ ] **Step 1: Create `settings.component.ts`**

```typescript
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
```

- [ ] **Step 2: Run the full test suite and build one final time**

```bash
npx ng test --watch=false && npx ng build --configuration=development
```

Expected: All tests pass, build succeeds.

- [ ] **Step 3: Final commit**

```bash
git add src/app/features/settings/
git commit -m "feat: settings screen with preferred day, language toggle, and logout"
```

---

## Spec Coverage Check

| Spec requirement | Task |
|---|---|
| Angular + Supabase + PrimeNG + ng2-charts + ngx-translate | Task 1 |
| 4 DB tables with RLS and unique constraint | Task 2 |
| Supabase Auth (login, register, logout) | Tasks 3, 8 |
| Onboarding (set preferred_day on first login) | Task 8 |
| profiles + preferred_day + language | Tasks 2, 4, 12 |
| Accounts: CRUD, types, asset_description, archive | Task 9 |
| Monthly snapshots with upsert | Task 10 |
| Income transactions (delete+reinsert per month) | Task 10 |
| `computeSnapshotDate` always uses preferred_day | Task 10 |
| Pre-fill from last month's values | Task 10 |
| Dashboard: last 10 months bar chart | Task 11 |
| Summary card: total, delta, saving rate | Task 11 |
| Saving rate = null if income = 0 | Tasks 11 (tested) |
| Composition bar by account type | Task 11 |
| CTA if current month has no data | Task 11 |
| Bottom nav (mobile) + sidebar (desktop) | Tasks 6, 7 |
| i18n IT + EN | Tasks 5 |
| Pastel green PrimeNG theme | Tasks 1, 6 |
| Settings: preferred_day + language + logout | Task 12 |
