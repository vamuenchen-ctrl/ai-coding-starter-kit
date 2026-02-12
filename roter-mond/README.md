# Roter Mond

Mobile-first Zyklus-Tracking Web-App mit archetypen-basierter Beratung.

## Tech Stack

- React 19 + Vite 7 + react-router-dom 7
- Plain JavaScript (kein TypeScript)
- Plain CSS mit CSS Custom Properties
- Supabase (PostgreSQL, Auth, Realtime WebSocket)
- Vercel (Hosting + PWA)

## Entwicklung

```bash
npm install
npm run dev
```

## Tests

```bash
npx vitest run
```

## Build & Deploy

```bash
npx vite build
NODE_OPTIONS="--dns-result-order=ipv4first" npx vercel --prod
```

## Supabase-Migrationen

Vor dem ersten Deployment in der Supabase SQL-Konsole ausfuehren:

1. `supabase-migration.sql` - Basis-Schema (7 Tabellen + RLS-Policies)
2. `migration-proj2.sql` - `feld_zeitstempel` JSONB-Spalten fuer Merge
3. `migration-proj4.sql` - `guest_id` TEXT-Spalte fuer Gaeste-Erkennung

## Architektur

```
src/
├── components/   UI-Komponenten (TabBar, SyncStatus, CloudBanner, MergeToast, MigrationsOverlay)
├── context/      React Context (AuthContext, SyncEngineContext)
├── pages/        Seiten (Heute, Orakel, Chronik, Wissen, Einstellungen)
├── utils/        Logik (speicher, mergeLogik, offlineQueue, migrationsManager, zyklus, mondphasen)
├── App.jsx       App-Root
└── App.css       Globale Styles
```

### Datenpersistenz

Write-through-Cache: Alle Schreibvorgaenge gehen synchron in localStorage und async an Supabase. Bei Netzwerkfehlern werden Operationen in einer Offline-Queue gepuffert und spaeter wiederholt.

### Sync-Features

- **PROJ-1:** Realtime Sync Engine (Supabase WebSocket, Cross-Device-Updates)
- **PROJ-2:** Field-Level Merge (4 Strategien, Per-Feld-Zeitstempel)
- **PROJ-3:** Offline Queue & Retry (persistente Queue, exponentieller Backoff)
- **PROJ-4:** Verbesserte Gaeste-Migration (4 Pfade, Fortschrittsanzeige, Fremddaten-Erkennung)
