# Roter Mond - Zyklus-Tracking App

> Eine mobile-first Web-App zur Begleitung des weiblichen Zyklus mit archetypen-basierter Beratung.

## Aktueller Status

PROJ-1 bis PROJ-5 implementiert und deployed. App ist produktionsbereit mit Realtime-Sync, Field-Level-Merge, Offline-Queue, verbesserter Gaeste-Migration und Menstruationsbeginn-Datum-Korrektur.

---

## Tech Stack

### Frontend
- **Framework:** React 19 + Vite 7
- **Routing:** react-router-dom 7
- **Sprache:** JavaScript (kein TypeScript)
- **Styling:** Plain CSS (App.css), CSS Custom Properties
- **Design:** Mobile-first (max-width 480px)

### Backend
- **Database:** Supabase (PostgreSQL + Realtime WebSocket)
- **Auth:** Supabase Magic Link, Gast-Modus ohne Login
- **Sync:** Write-through-Cache (localStorage + Supabase)

### Deployment
- **Hosting:** Vercel
- **Deploy:** `NODE_OPTIONS="--dns-result-order=ipv4first" npx vercel --prod`
- **PWA:** Service Worker mit Offline-Support

---

## Features Roadmap

- [PROJ-1] Realtime Sync Engine → ✅ Implemented → [Spec](/features/PROJ-1-realtime-sync-engine.md)
- [PROJ-2] Field-Level Merge → ✅ Implemented → [Spec](/features/PROJ-2-field-level-merge.md)
- [PROJ-3] Offline Queue & Retry → ✅ Implemented → [Spec](/features/PROJ-3-offline-queue-retry.md)
- [PROJ-4] Improved Guest Migration → ✅ Implemented → [Spec](/features/PROJ-4-improved-guest-migration.md)
- [PROJ-5] Menstruationsbeginn-Datum korrigieren → ✅ Implemented → [Spec](/features/PROJ-5-menstruationsbeginn-datum-korrektur.md)
- [PROJ-6] Freemium & Monetarisierung → 🔵 Planned → [Spec](/features/PROJ-6-freemium-monetarisierung.md)

---

## Architektur

### Seiten (5)
- **Heute** - Tagesansicht mit Archetyp, Symboltier, Orakeltexten
- **Orakel** - Tageskarte ziehen
- **Chronik** - Tageseintraege (4 Tabs: Koerper, Stimmung, Traeume, Kreativitaet)
- **Wissen** - Informationstexte zu Zyklusphasen
- **Einstellungen** - Zyklusdaten, Cloud-Sicherung, Datenverwaltung

### Datenpersistenz
```
speicher.js (Fassade)
├── speicherLocal.js (localStorage - synchron)
├── speicherSupabase.js (Supabase Cloud - async)
├── offlineQueue.js (Queue bei Netzwerkfehlern)
└── mergeLogik.js (Feld-Level-Merge)
```

### 7 Datenstores
1. `zyklusdaten` - Zyklusstart, Zykluslaenge, Zyklustyp
2. `korrekturen` - Manuelle Phasenkorrekturen
3. `zyklushistorie` - Vergangene Zyklen
4. `chronik` - Tageseintraege (Stimmung, Energie, Koerper, Traeume, etc.)
5. `tageskarten` - Gezogene Orakelkarten
6. `zyklustyp_hinweis` - Hinweis-Status (gezeigt/abgelehnt)
7. `angepasste_grenzen` - Benutzerdefinierte Phasengrenzen

### Sync-Architektur
```
Schreibvorgang:
  speicher.js → localStorage (sync) → Supabase (async)
                                        ↓ bei Fehler
                                    offlineQueue.js → Retry

Realtime-Sync:
  SyncEngineContext.jsx → Supabase WebSocket
    ↓ Remote-Event
  mergeLogik.js → Feld-Level-Merge → localStorage + UI-Update

Gaeste-Migration (Login):
  migrationsManager.js → 4 Pfade:
    1. Hochladen (nur lokal)
    2. Herunterladen (nur Cloud)
    3. Zusammenfuehren (Feld-Level-Merge)
    4. Fremddaten (Cloud gewinnt)
```

### Supabase-Migrationen
Muessen in der Supabase SQL-Konsole ausgefuehrt werden:
1. `roter-mond/supabase-migration.sql` - Basis-Schema (7 Tabellen)
2. `roter-mond/migration-proj2.sql` - `feld_zeitstempel` JSONB-Spalten
3. `roter-mond/migration-proj4.sql` - `guest_id` TEXT-Spalte in zyklusdaten

---

## Design System

### Farben
- **Bordeaux:** `#C94963` (Zauberin-Archetyp)
- **Olivgruen:** `#677E3D` (Junge Frau)
- **Gold/Orange:** `#FFA500` (Mutter)
- **Indigo:** `#26496F` (Alte Weise)
- **Hintergrund:** `#F4EFEE`
- **Rahmen:** `#E5DAD1`
- **Text:** `#2B3A4A`

---

## Ordnerstruktur

```
redmoon-app/
├── .claude/
│   └── agents/              ← 6 AI Agents
├── features/                ← Feature Specs (PROJ-1 bis PROJ-6)
├── roter-mond/
│   ├── src/
│   │   ├── components/      ← React-Komponenten (TabBar, SyncStatus, CloudBanner, MergeToast, MigrationsOverlay, ...)
│   │   ├── context/         ← React Context (AuthContext, SyncEngineContext)
│   │   ├── pages/           ← Seiten-Komponenten (Heute, Orakel, Chronik, Wissen, Einstellungen, ...)
│   │   ├── utils/           ← Logik (speicher, mergeLogik, offlineQueue, zyklus, mondphasen, zyklusKorrektur, guestId, migrationsManager, ...)
│   │   ├── App.jsx          ← App-Root mit Routing
│   │   └── App.css          ← Globale Styles
│   ├── public/              ← Statische Dateien
│   ├── supabase-migration.sql
│   ├── migration-proj2.sql
│   ├── migration-proj4.sql
│   └── package.json
└── PROJECT_CONTEXT.md       ← Diese Datei
```

---

## Entwicklung

```bash
# Dependencies installieren
cd roter-mond && npm install

# Dev-Server starten
npm run dev

# Tests ausfuehren
npx vitest run

# Production-Build
npx vite build

# Deploy
NODE_OPTIONS="--dns-result-order=ipv4first" npx vercel --prod
```

---

## Environment Variables

```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```
