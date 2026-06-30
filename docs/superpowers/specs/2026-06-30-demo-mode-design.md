# Demo Mode — Design Spec
**Date:** 2026-06-30  
**Status:** Approved

## Overview

Aggiunge una modalità demo all'app FindMyFunds. Gli utenti non autenticati possono esplorare l'intera app con dati statici realistici senza registrarsi. La demo è accessibile tramite un bottone nella pagina di login e un URL diretto `/demo`. Tutte le sezioni sono navigabili in sola lettura.

---

## Entry Point

- **URL diretto:** `/demo` — route pubblica (senza `authGuard`) che invoca `DemoModeService.enter()` e redirige immediatamente a `/dashboard`
- **Login page:** bottone "Prova la demo →" sotto il form esistente; porta a `/demo`

---

## DemoModeService

Nuovo servizio `src/app/core/demo-mode.service.ts`, `providedIn: 'root'`.

```
isDemo: boolean           // true quando si è in demo
enter(): void             // imposta isDemo, salva in sessionStorage, naviga a /dashboard
exit(): void              // pulisce sessionStorage, naviga a /auth/login
```

Lo stato è persistito in `sessionStorage` (chiave `fmf_demo`) così un refresh della pagina non espelle l'utente dalla demo. Al caricamento dell'app il servizio legge `sessionStorage` e ripristina `isDemo`.

---

## Auth Guard

`authGuard` viene aggiornato: se `DemoModeService.isDemo === true`, la guardia restituisce `true` direttamente senza controllare la sessione Supabase.

---

## Routing

Nuova route pubblica (fuori dal gruppo protetto):

```
{ path: 'demo', loadComponent: () => DemoEntryComponent }
```

`DemoEntryComponent` è un componente minimale (nessun template visibile) che nel costruttore chiama `DemoModeService.enter()` e naviga a `/dashboard`.

---

## Shell

`ShellComponent.ngOnInit()` salta il controllo `profileService.getProfile()` quando `isDemo === true`, evitando il redirect a `/onboarding`.

---

## Demo Data

File: `src/app/core/demo-data.ts`

### 5 Conti

| Nome | Tipo |
|---|---|
| Conto BancaIntesa | cash |
| BTP 2030 | bond |
| ETF S&P500 | etf |
| Azioni ENI | stock |
| Oro fisico | asset |

### 13 Mesi di Snapshot (Giu 2025 → Giu 2026)

13 mesi perché `DashboardService` prepende un mese di contesto per calcolare il primo delta. La finestra visualizzata è sempre 10 mesi.

Valori indicativi per mese (somma totale):

| Mese | Patrimonio totale |
|---|---|
| Giu 25 (contesto) | ~63.500 € |
| Lug 25 | ~65.200 € |
| Ago 25 | ~66.800 € |
| Set 25 | ~68.500 € |
| Ott 25 | ~67.200 € |
| Nov 25 | ~69.400 € |
| Dic 25 | ~71.000 € |
| Gen 26 | ~72.800 € |
| Feb 26 | ~74.500 € |
| Mar 26 | ~76.100 € |
| Apr 26 | ~75.300 € |
| Mag 26 | ~77.800 € |
| Giu 26 | ~79.500 € |

Ogni mese ha valori per tutti e 5 i conti. I dati sono definiti staticamente come array di `MonthlySnapshot` e `IncomeTransaction`.

### Entrate mensili

3.500 €/mese fissi per tutti i mesi (un'unica voce "Stipendio"). Saving rate risultante: varia tra ~15% e ~50% a seconda del delta mensile.

---

## Servizi Aggiornati

### DashboardService

`loadAllData()` controlla `DemoModeService.isDemo`:
- **demo:** restituisce `{ snapshots: DEMO_SNAPSHOTS, income: DEMO_INCOME }` senza chiamare Supabase
- **normale:** comportamento invariato

### AccountsService

- `getAccounts()`: in demo restituisce `DEMO_ACCOUNTS`
- `saveAccount()`, `archiveAccount()`, `deleteAccount()`: in demo lanciano un errore controllato o non-op (il componente mostra un toast "Non disponibile in demo")

### MonthlyEntryService

- `loadData()`: in demo restituisce i dati demo dell'ultimo mese
- `save()`: in demo è un no-op; il componente disabilita il tasto Salva e mostra tooltip "Non disponibile in modalità demo"

---

## UI Indicator — Badge DEMO

La `NavComponent` riceve `isDemoMode` come segnale dal servizio e mostra:
- Badge verde `DEMO` accanto al testo "FindMyFunds" nel brand della sidebar
- Nella nav bottom: badge `DEMO` sotto il logo (solo sidebar, non ogni voce)
- Voce aggiuntiva in fondo alla nav: "Esci dalla demo" (icona `pi-sign-out`) che chiama `DemoModeService.exit()`

---

## Settings in Demo

`SettingsComponent` mostra un avviso inline al posto del form:

> "Sei in modalità demo. [Registrati gratis →] per salvare le tue impostazioni."

---

## Entry (Inserimento mensile) in Demo

Il form è pre-compilato con i dati dell'ultimo mese demo. Il tasto "Salva" è disabilitato con `title="Non disponibile in modalità demo"`. I campi sono in sola lettura (`[disabled]="isDemoMode"`).

---

## Spec Self-Review

- **Placeholder:** nessuno — tutti i valori numerici e nomi file sono specificati
- **Consistenza:** `DemoModeService.isDemo` è la sola fonte di verità; tutti i servizi lo iniettano
- **Scope:** contenuto in un singolo ciclo spec → plan → implementazione
- **Ambiguità:**
  - "sola lettura" in MonthlyEntry significa campi visibili ma disabilitati (non nascosti) — esplicito nella sezione Entry
  - La route `/demo` non è nella navbar: l'utente arriva solo da login o link diretto — corretto, nessuna voce nav per entrare in demo dall'interno dell'app
