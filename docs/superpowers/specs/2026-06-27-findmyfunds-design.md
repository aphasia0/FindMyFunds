# FindMyFunds — Design Specification
**Date:** 2026-06-27  
**Status:** Approved

---

## Overview

FindMyFunds is a personal finance tracking app that lets users take a monthly "snapshot" of their total wealth across multiple accounts and track income. It provides a 10-month trend dashboard with net worth evolution and a savings rate calculation.

**Languages:** Italian (primary) and English  
**Frontend:** Angular 17+ (standalone components)  
**Backend:** Supabase (Auth + PostgreSQL + Row Level Security)  
**UI Library:** PrimeNG 17+  
**Charts:** ng2-charts (Chart.js)  
**i18n:** ngx-translate  
**Theme:** Pastel green, responsive (mobile + desktop)

---

## Core Concept

On a user-defined fixed day each month (e.g., the 27th), the user enters the current balance of each account. This constitutes the monthly "snapshot." The app also records income transactions for that month. All data is attributed to the fixed day regardless of when it is actually entered.

---

## Data Model (Supabase PostgreSQL)

### `profiles`
Extends Supabase Auth users.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK, FK → auth.users |
| preferred_day | int | 1–28, the fixed snapshot day |
| language | text | 'it' or 'en' |
| created_at | timestamptz | |

### `accounts`
The user's financial accounts (bank accounts, investment portfolios, etc.).

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK → profiles.id |
| name | text | e.g., "Conto BancaIntesa", "Portafoglio Degiro" |
| type | text | enum: cash / bond / etf / stock / asset |
| asset_description | text | Only for type = 'asset' (e.g., "Bitcoin", "Gold") |
| is_active | bool | false = archived, hidden from entry but history preserved |
| created_at | timestamptz | |

### `monthly_snapshots`
The balance of each account on the fixed snapshot day.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK → profiles.id |
| account_id | uuid | FK → accounts.id |
| year | int | |
| month | int | 1–12 |
| snapshot_date | date | Always = preferred_day of that month |
| value | numeric | Account balance on that date |
| created_at | timestamptz | |

**Unique constraint:** `(user_id, account_id, year, month)` — one value per account per month.

### `income_transactions`
Positive cash flows for a given month (salary, investment returns, etc.).

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK → profiles.id |
| year | int | |
| month | int | 1–12 |
| amount | numeric | Positive value only |
| description | text | e.g., "Stipendio", "Dividendo ETF" |
| created_at | timestamptz | |

---

## Key Calculations

**Total net worth (month M):**  
`total(M) = SUM of all account values in monthly_snapshots for (year, month) = M`

**Monthly delta:**  
`delta(M) = total(M) − total(M−1)`

**Total income (month M):**  
`income(M) = SUM of income_transactions.amount for (year, month) = M`

**Saving rate:**  
`saving_pct(M) = delta(M) / income(M) × 100`  
Show "N/A" if `income(M) = 0`. Show in red if negative (wealth decreased).

---

## Screens

### 1. Auth
- Email + password login and registration via Supabase Auth
- On first login: onboarding step to set preferred snapshot day before entering the app
- Pastel green branded UI with FindMyFunds logo

### 2. Dashboard
- **Summary card** at the top: current month total, delta vs previous month (green if positive, red if negative), saving %
- **Bar chart** (ng2-charts): last 10 months of total net worth, one bar per month with animation on load
- **Composition bar**: horizontal stacked bar showing breakdown of current month total by account type (cash / bond / etf / stock / asset)
- **CTA banner**: if current month has no snapshot yet, show a prominent "Inserisci dati del mese" button

### 3. Monthly Entry
- Month/year selector (defaults to current month)
- Snapshot date shown as read-only (= preferred_day of selected month)
- List of all active accounts, each with a numeric input for current balance
- Pre-filled with last month's values as a starting point (editable)
- **Income section**: list of income transactions with description + amount fields; "Aggiungi entrata" button to add rows
- **Save button**: upserts all snapshot values and income transactions to Supabase

### 4. Account Management
- List of active accounts with name, type chip (color-coded), and asset description if applicable
- "Aggiungi conto" button → PrimeNG dialog with:
  - Name (text input)
  - Type (dropdown: cash / bond / etf / stock / asset)
  - Asset description (text input, visible only when type = asset)
- Edit and archive actions per account (no hard delete)
- Archived accounts section (collapsed by default), can be reactivated

### 5. Settings
- Preferred snapshot day selector (1–28, dropdown)
- Language toggle: IT / EN
- Account email (read-only)
- Logout button

---

## Navigation

Bottom navigation bar on mobile, sidebar on desktop:
- Dashboard (home icon)
- Inserimento / Entry (plus icon)
- Conti / Accounts (wallet icon)
- Impostazioni / Settings (gear icon)

---

## Internationalization

All UI text uses ngx-translate with two JSON translation files:
- `assets/i18n/it.json`
- `assets/i18n/en.json`

Language preference is stored in `profiles.language` and applied on login.

---

## Security

- Supabase Row Level Security (RLS) enabled on all tables
- All queries include `user_id = auth.uid()` policy
- No user can read or write another user's data

---

## Theme

- PrimeNG custom theme with pastel green primary palette
- Accent: soft white and light grey backgrounds
- Error/negative values: muted red
- Positive values: deeper green
- Fully responsive: PrimeNG's responsive grid, mobile-first breakpoints
- Smooth PrimeNG built-in animations on cards, dialogs, and transitions
