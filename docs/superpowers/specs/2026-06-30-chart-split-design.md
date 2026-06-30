# Chart Split — Design Spec
**Date:** 2026-06-30
**Status:** Approved

## Overview

Il grafico del patrimonio netto è troppo affollato (4 dataset, 2 assi Y visibili, 1 nascosto). La soluzione è dividere `NetWorthChartComponent` in due componenti separati, più leggibili, collegati alla stessa finestra temporale del dashboard.

---

## Componenti

### PatrimonioChartComponent
`src/app/features/dashboard/components/patrimonio-chart/patrimonio-chart.component.ts`

**Dataset:** un solo bar chart (Patrimonio, barre verdi). Ultimo mese in verde scuro.
**Assi:** un solo asse Y sinistro (`y`) in €k. Nessun asse destro.
**Toolbar:** pulsante fullscreen (stesso pattern esistente).
**Input:** `summaries: MonthSummary[]`

### MonthlyMetricsChartComponent
`src/app/features/dashboard/components/monthly-metrics-chart/monthly-metrics-chart.component.ts`

**Dataset:** due linee sull'asse Y destro (`y1`) in scala €:
- **Delta** (arancione `#f97316`) — punti colorati verde/rosso per positivo/negativo
- **Entrate** (cyan `#06b6d4`)

**Assi:** un solo asse Y destro (`y1`), etichetta "Mensile (€)". Nessun asse nascosto.
**Toolbar:** pulsante fullscreen.
**Input:** `summaries: MonthSummary[]`

### NetWorthChartComponent — eliminato
Il file esistente viene rimosso. I due nuovi componenti lo sostituiscono.

---

## Dashboard

`dashboard.component.ts` sostituisce `<app-net-worth-chart>` con i due nuovi selettori in sequenza:

```html
<app-patrimonio-chart [summaries]="summaries" />
<app-monthly-metrics-chart [summaries]="summaries" />
```

Entrambi ricevono lo stesso array `summaries` già calcolato dal dashboard, quindi la navigazione della finestra temporale li aggiorna insieme automaticamente — nessuna logica aggiuntiva necessaria.

---

## Risparmio%

Rimosso da entrambi i grafici. Già visibile come pill nella `SummaryCardComponent`. La costante `SAVING_LINE` e il dataset `Risparmio %` vengono eliminati.

---

## Zoom / Fullscreen

Entrambi i componenti mantengono:
- Pulsante fullscreen (SVG expand/collapse, stesso stile `fs-btn`)
- Zoom plugin già registrato globalmente (nessuna modifica necessaria)
- `touch-action: pan-y` di default, `touch-action: none` in fullscreen

---

## Stili condivisi

Entrambi i componenti usano la classe `.fmf-card` e `canvas { max-height: 280px }`. Nessun file di stile condiviso separato — stili inline nei componenti come da pattern esistente.

---

## Spec Self-Review

- **Placeholder:** nessuno — path, colori e input tipizzati esplicitamente
- **Consistenza:** entrambi i componenti usano lo stesso `summaries` input → navigazione automaticamente sincronizzata
- **Scope:** singolo ciclo spec → plan → implementazione, nessuna decomposizione necessaria
- **Ambiguità:** "eliminato" per NetWorthChartComponent significa cancellare il file e aggiornare tutti gli import — esplicito nel piano di implementazione
