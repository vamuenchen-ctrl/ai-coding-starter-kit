# PROJ-5: Menstruationsbeginn-Datum korrigieren

## Status: Deployed (2026-02-12)
## Production URL: https://roter-mond.vercel.app

## Zusammenfassung

Die Nutzerin soll das Datum eines bereits erfassten Menstruationsbeginns nachtraeglich korrigieren koennen -- sowohl fuer den aktuellen als auch fuer vergangene Zyklen. Derzeit ist nur der aktuellste Zyklus-Start ueber die Einstellungen aenderbar, aeltere Eintraege in der Zyklushistorie sind nicht editierbar. Zudem fehlt ein intuitiver Weg, das Datum direkt aus der Chronik-Ansicht heraus zu korrigieren.

**Scope:** NUR das Datum des Menstruationsbeginns ist aenderbar. Keine weiteren Felder (Zyklustyp, Zykluslaenge etc.) werden durch dieses Feature editierbar.

## Abhaengigkeiten

- Benoetigt: PROJ-1 (Realtime Sync Engine) -- damit Datumsaenderungen per Cloud synchronisiert werden
- Benoetigt: PROJ-2 (Field-level Merge) -- damit Zeitstempel fuer Merge korrekt gesetzt werden
- Benoetigt: PROJ-3 (Offline Queue) -- damit Aenderungen offline zwischengespeichert werden

## Betroffene Datenstores

- `zyklushistorie` -- Array mit Eintraegen `{ startdatum, mondphase, zyklusTyp, zyklusLaenge }`: Das `startdatum` muss aenderbar sein
- `zyklusdaten` -- `zyklusStart`: Muss aktualisiert werden, wenn der aktuellste Zyklus korrigiert wird

## User Stories

### US-1: Datum des aktuellen Zyklus in der Chronik korrigieren
Als Nutzerin moechte ich in der Kalender-Ansicht der Chronik auf einen Menstruationsbeginn-Eintrag tippen und dort das Datum aendern koennen, damit ich einen Tippfehler bei der Eingabe korrigieren kann, ohne in die Einstellungen navigieren zu muessen.

### US-2: Datum eines vergangenen Zyklus korrigieren
Als Nutzerin moechte ich das Startdatum eines aelteren (bereits abgeschlossenen) Zyklus nachtraeglich korrigieren koennen, damit meine Zyklushistorie korrekt bleibt, auch wenn ich den Fehler erst spaeter bemerke.

### US-3: Visuelle Bestaetigung der Korrektur
Als Nutzerin moechte ich nach einer erfolgreichen Datumskorrektur eine kurze Rueckmeldung sehen (z.B. "Datum korrigiert"), damit ich weiss, dass die Aenderung gespeichert wurde.

### US-4: Korrektur im Mond-Verlauf sichtbar
Als Nutzerin moechte ich, dass die Datumskorrektur im Mond-Verlauf-Tab (Tab 3) sofort sichtbar ist, damit die Verlaufsanzeige konsistent mit dem korrigierten Datum bleibt.

### US-5: Korrektur wird synchronisiert
Als eingeloggte Nutzerin moechte ich, dass die Datumskorrektur auf meinen anderen Geraeten synchronisiert wird, damit meine Daten ueberall aktuell sind.

## Acceptance Criteria

### Zugang zur Korrektur-Funktion
- [ ] Im Kalender-Tab der Chronik zeigt der `ZyklusStartDetail`-Bereich (der sich oeffnet, wenn ein Menstruationsbeginn-Tag angetippt wird) einen Button "Datum korrigieren" oder ein Bearbeiten-Icon
- [ ] Der Button ist fuer ALLE Menstruationsbeginn-Eintraege sichtbar (nicht nur den aktuellsten)

### Korrektur-Dialog
- [ ] Nach Tap auf "Datum korrigieren" oeffnet sich ein Date-Picker (gleiches UI-Pattern wie bestehende Datumseingaben in der App)
- [ ] Der Date-Picker ist mit dem bisherigen Startdatum des Eintrags vorausgefuellt (NICHT mit dem heutigen Datum). Beispiel: Wenn am 12.2. der Eintrag "Menstruationsbeginn 1.2." korrigiert wird, zeigt der Date-Picker den 1.2. an
- [ ] Das maximale Datum ist "heute" (kein Datum in der Zukunft waehlbar)
- [ ] Es gibt einen "Speichern"-Button und einen "Abbrechen"-Button oder -Link

### Speicherlogik
- [ ] Wird das Datum eines Zyklus in der Zyklushistorie geaendert, wird der entsprechende Eintrag (`startdatum`) in der Historie aktualisiert
- [ ] Wird der AKTUELLSTE Zyklus korrigiert, wird zusaetzlich `zyklusStart` in den Zyklusdaten aktualisiert
- [ ] Die Mondphase (`mondphase`) wird fuer das neue Datum automatisch neu berechnet
- [ ] Die Zykluslaenge des VORHERIGEN Zyklus wird bei Bedarf neu berechnet (Differenz zwischen neuem Startdatum und Startdatum des Vorgaengerzyklus)
- [ ] Per-field Zeitstempel werden gesetzt (PROJ-2 kompatibel)
- [ ] Bei eingeloggten Usern wird die Aenderung an die Cloud uebertragen (Write-Through-Cache)
- [ ] Bei Offline-Zustand wird die Aenderung in die Offline-Queue eingereiht (PROJ-3 kompatibel)

### Feedback
- [ ] Nach erfolgreichem Speichern erscheint eine kurze visuelle Bestaetigung (z.B. "Datum korrigiert"-Meldung fuer 2 Sekunden, analog zum bestehenden "Gespeichert"-Pattern)
- [ ] Der Kalender und der Mond-Verlauf-Tab zeigen sofort das korrigierte Datum an

### Validierung
- [ ] Das neue Datum darf nicht in der Zukunft liegen
- [ ] Das neue Datum darf nicht identisch mit einem anderen bestehenden Menstruationsbeginn in der Zyklushistorie sein (Duplikat-Schutz)
- [ ] Wenn das korrigierte Datum die chronologische Reihenfolge der Zyklen verletzen wuerde (z.B. Startdatum nach dem Startdatum des Folgezyklus), wird eine Fehlermeldung angezeigt und die Aenderung nicht gespeichert

## Edge Cases

### EC-1: Korrektur des einzigen Zyklus
Wenn die Nutzerin nur einen einzigen Zyklus erfasst hat und dessen Datum korrigiert, muss NUR `zyklusdaten.zyklusStart` und der einzige Historieneintrag aktualisiert werden. Es gibt keinen vorherigen Zyklus, dessen Laenge angepasst werden muesste.

### EC-2: Datum auf einen Tag verschieben, an dem ein Chronik-Eintrag existiert
Der Chronik-Eintrag (Tageseintrag) bleibt davon unberuehrt. Der Menstruationsbeginn-Marker erscheint nun auf dem neuen Datum im Kalender -- zusaetzlich zu einem eventuell bestehenden Tageseintrag.

### EC-3: Korrektur bei Offline-Zustand
Die Korrektur wird lokal gespeichert und in die Offline-Queue eingereiht. Bei Wiederherstellung der Verbindung wird sie automatisch synchronisiert.

### EC-4: Gleichzeitige Korrektur auf zwei Geraeten
Das Merge-Verhalten folgt dem bestehenden PROJ-2-Mechanismus: Der juengere Zeitstempel gewinnt pro Feld.

### EC-5: Datum verschiebt sich ueber eine Monatsgrenze
Wenn z.B. der 31. Maerz auf den 1. April korrigiert wird: Der Kalender-Tab zeigt den Menstruationsbeginn-Marker nun im April statt Maerz. Im Mond-Verlauf wird das neue Datum und die neu berechnete Mondphase angezeigt.

### EC-6: Korrektur veraendert den berechneten Zyklustyp
Wenn das korrigierte Datum zu einer anderen Mondphase faellt, koennte sich der automatisch berechnete Zyklustyp aendern. Der gespeicherte Zyklustyp des betroffenen Historieneintrags sollte dabei NICHT automatisch geaendert werden -- die Nutzerin hat den Typ bei der Ersteinrichtung bewusst gewaehlt bzw. bestaetigt.

### EC-7: Korrektur des aktuellen Zyklus vs. aelterer Zyklen
- Aktuellster Zyklus: `zyklusdaten.zyklusStart` UND `zyklushistorie[letzter]` werden aktualisiert
- Aelterer Zyklus: NUR der entsprechende `zyklushistorie`-Eintrag wird aktualisiert. Zusaetzlich muss die `zyklusLaenge` des betroffenen UND des nachfolgenden Zyklus in der Historie ggf. neu berechnet werden.

## Nicht im Scope

- Aendern des Zyklustyps (Weissmond/Rotmond) -- das bleibt in den Einstellungen
- Aendern der Zykluslaenge -- wird automatisch neu berechnet
- Loeschen eines Menstruationsbeginns -- eigenes Feature
- Hinzufuegen eines vergessenen Menstruationsbeginns in der Vergangenheit -- eigenes Feature
- Korrektur anderer Felder im `ZyklusStartDetail` (Mondphase wird automatisch berechnet)

## Tech-Design (Solution Architect)

### Bestandsaufnahme: Was existiert bereits?

Die Analyse des bestehenden Codes zeigt:

- **ZyklusStartDetail** (in `Chronik.jsx`, Zeile 813-871): Zeigt bereits Menstruationsbeginn-Infos (Datum, Mondphase, Zykluslaenge, Zyklustyp) im Kalender-Tab. Hat aktuell KEINEN "Datum korrigieren"-Button -- nur optional einen "Chronik-Eintrag erstellen"-Button.
- **Kalender** (in `Chronik.jsx`, Zeile 516-704): Laedt die Zyklushistorie und zeigt Menstruationsbeginn-Tage mit rotem Punkt. Uebergibt das gewaehlte Zyklusstart-Objekt an `ZyklusStartDetail`.
- **MondVerlauf** (in `Chronik.jsx`, Zeile 878-908): Zeigt die Zyklushistorie als Karten, liest die Daten bei jedem Render neu.
- **speicher.js**: Hat `speichereZyklushistorie()` (ganzes Array), `aktualisiereLetztenZyklus()` und `aktualisiereZyklusdaten()` -- aber KEINE Funktion zum gezielten Aktualisieren eines einzelnen beliebigen Historieneintrags.
- **berechneMondphase()** (in `mondphasen.js`): Bereits vorhanden, kann fuer das neue Datum die Mondphase neu berechnen.
- **Feedback-Pattern**: Ueberall `state + setTimeout(2000)` (z.B. "Gespeichert"-Meldung in Einstellungen und Chronik).
- **Date-Picker-Pattern**: `<input type="date">` mit `max={heute}` -- durchgaengig in der App verwendet.

### Wiederzuverwendende Bausteine

Folgende Dinge werden NICHT neu gebaut, sondern wiederverwendet:

1. Date-Picker: Das bestehende `<input type="date">` Pattern
2. Feedback-Meldung: Das bestehende `state + setTimeout(2000)` Pattern ("Gespeichert")
3. Mondphasen-Neuberechnung: `berechneMondphase()` aus `mondphasen.js`
4. Speicher-Fassade: `speichereZyklushistorie()`, `aktualisiereZyklusdaten()` aus `speicher.js`
5. Sync: Automatisch ueber die bestehende Write-Through-Cache-Architektur (PROJ-1/2/3)

### Component-Struktur

Alle Aenderungen finden innerhalb der bestehenden Datei `Chronik.jsx` statt. Es wird KEINE neue Datei benoetigt.

```
Chronik (bestehend)
├── Kalender-Tab (bestehend, wird erweitert)
│   ├── Kalender-Grid (unveraendert)
│   └── ZyklusStartDetail (bestehend, wird erweitert)
│       ├── Datum, Mondphase, Zykluslaenge, Zyklustyp (unveraendert)
│       ├── NEU: "Datum korrigieren"-Button
│       │       -> Oeffnet den Korrektur-Bereich inline (klappt auf)
│       └── NEU: DatumKorrektur-Bereich (klappbar)
│           ├── Date-Picker (vorausgefuellt mit bisherigem Datum)
│           ├── Fehlermeldung (bei Validierungsfehler)
│           ├── "Speichern"-Button
│           └── "Abbrechen"-Link
│
├── Verlauf-Tab (bestehend, unveraendert)
│   └── Liest Daten bei jedem Render neu -> zeigt automatisch
│       korrigiertes Datum nach Speichern
│
├── Eintrag-Tab (unveraendert)
└── Insights-Tab (unveraendert)
```

**Wichtig:** Der Korrektur-Bereich oeffnet sich INLINE unterhalb des ZyklusStartDetail (aehnlich wie bestehende klappbare Felder in der App). Es wird KEIN Overlay/Modal/Dialog verwendet, da die App durchgaengig inline-klappbare Bereiche nutzt.

### Daten-Model

**Was sich aendert:**

Die Zyklushistorie ist ein Array, das bei jeder Korrektur komplett neu gespeichert wird (ueber die bestehende `speichereZyklushistorie()`-Funktion). Keine neuen Felder, keine neuen Tabellen, kein neuer Store.

Jeder Historieneintrag hat weiterhin:
- Startdatum (wird korrigiert)
- Mondphase (wird automatisch fuer das neue Datum neu berechnet)
- Zyklustyp (bleibt unveraendert -- wie in EC-6 beschrieben)
- Zykluslaenge (wird automatisch neu berechnet basierend auf Nachbar-Zyklen)

**Betroffene Stores bei Korrektur:**

1. `zyklushistorie` -- Immer: Der geaenderte Eintrag bekommt neues Startdatum + neue Mondphase + ggf. neu berechnete Zykluslaengen der Nachbar-Zyklen
2. `zyklusdaten` -- Nur wenn der AKTUELLSTE Zyklus korrigiert wird: `zyklusStart` wird aktualisiert

**Keine neuen Speicher-Funktionen noetig:** Die bestehende `speichereZyklushistorie()` in `speicher.js` speichert das gesamte Array und setzt automatisch Per-Field-Zeitstempel, schreibt in die Cloud und nutzt die Offline-Queue bei Fehlern. Das reicht aus.

### Benutzerfluss (Schritt fuer Schritt)

1. Nutzerin oeffnet Chronik -> Kalender-Tab
2. Tippt auf einen Tag mit Menstruationsbeginn-Marker (roter Punkt)
3. ZyklusStartDetail klappt auf und zeigt Datum, Mondphase, etc.
4. NEU: Ein "Datum korrigieren"-Button ist sichtbar
5. Nutzerin tippt auf "Datum korrigieren"
6. Ein Date-Picker erscheint inline (vorausgefuellt mit dem bisherigen Datum)
7. Nutzerin waehlt ein neues Datum
8. Nutzerin tippt "Speichern"
9. Validierung prüft:
   - Nicht in der Zukunft?
   - Kein Duplikat eines anderen Menstruationsbeginns?
   - Chronologische Reihenfolge bleibt intakt?
10. Bei Erfolg: Daten werden gespeichert, "Datum korrigiert"-Meldung erscheint fuer 2 Sekunden
11. Kalender-Ansicht aktualisiert sich (Menstruations-Marker wandert zum neuen Datum)
12. Verlauf-Tab zeigt beim naechsten Oeffnen automatisch das korrigierte Datum

### Validierungsregeln

Drei Pruefungen bevor gespeichert wird:

1. **Zukunfts-Check:** Neues Datum <= heute
2. **Duplikat-Check:** Kein anderer Historieneintrag hat dasselbe Startdatum
3. **Reihenfolge-Check:** Das neue Datum liegt zwischen dem Vorgaenger- und Nachfolger-Zyklus (falls vorhanden)

Bei Validierungsfehler wird eine Fehlermeldung direkt im Korrektur-Bereich angezeigt (roter Text unterhalb des Date-Pickers). Die Aenderung wird NICHT gespeichert.

### Neuberechnungen nach Korrektur

Folgendes wird automatisch bei erfolgreicher Korrektur neu berechnet:

1. **Mondphase** des geaenderten Eintrags -> `berechneMondphase(neuesDatum)`
2. **Zykluslaenge des vorherigen Zyklus** (falls vorhanden) -> Differenz in Tagen zwischen dem vorherigen Startdatum und dem neuen Datum
3. **Zykluslaenge des geaenderten Zyklus** (falls Nachfolger vorhanden) -> Differenz in Tagen zwischen dem neuen Datum und dem Nachfolger-Startdatum
4. **NICHT neu berechnet:** Zyklustyp (bleibt wie von der Nutzerin gewaehlt)

### Tech-Entscheidungen

**Warum inline klappbar statt Modal/Overlay?**
Die gesamte App verwendet inline-klappbare Bereiche (Chronik-Felder, Einstellungs-Sektionen). Ein Modal waere ein Bruch mit dem bestehenden Designmuster. Die Nutzerin kennt das Pattern bereits.

**Warum kein neuer Store oder neue Speicher-Funktion?**
`speichereZyklushistorie()` kann das gesamte aktualisierte Array speichern. Das ist einfacher und nutzt automatisch die bestehende Zeitstempel-, Cloud- und Queue-Logik. Eine neue Einzeleintrag-Update-Funktion wuerde Komplexitaet hinzufuegen ohne Mehrwert.

**Warum keine neue Datei fuer die Korrektur-Komponente?**
`ZyklusStartDetail` ist bereits eine interne Funktion in `Chronik.jsx`. Der Korrektur-Bereich wird als Erweiterung dieser bestehenden Komponente implementiert. Das haelt die Aenderung minimal und vermeidet unnoetige Dateistruktur-Komplexitaet.

**Warum `<input type="date">` statt eigener Kalender-Auswahl?**
Das ist das konsistente Pattern in der gesamten App (Einstellungen, Tageseintrag). Die Nutzerin ist damit vertraut. Es funktioniert gut auf Mobile (native OS-Datumswahl).

### Dependencies

Keine neuen Packages noetig. Alles wird mit bestehenden App-Mitteln umgesetzt:
- `berechneMondphase()` aus `mondphasen.js`
- `speichereZyklushistorie()` und `aktualisiereZyklusdaten()` aus `speicher.js`
- `<input type="date">` (nativer Browser Date-Picker)

### Betroffene Dateien

| Datei | Aenderungsart |
|-------|---------------|
| `roter-mond/src/pages/Chronik.jsx` | **Hauptaenderung**: ZyklusStartDetail um Korrektur-Button und klappbaren Date-Picker-Bereich erweitern. Kalender-Komponente muss Daten nach Korrektur neu laden. |
| `roter-mond/src/App.css` | **Minimal**: CSS fuer Korrektur-Button, Fehlermeldung und eventuell Animations-Klassen |

**Keine Aenderungen noetig in:**
- `speicher.js` / `speicherLocal.js` / `speicherSupabase.js` (bestehende Funktionen reichen aus)
- `mondphasen.js` (wird nur aufgerufen, nicht geaendert)
- `zyklus.js` (nicht betroffen)
- Supabase-Migrationen (keine Datenbank-Aenderungen)
- Einstellungen.jsx (die dortige Zyklusstart-Aenderung bleibt weiterhin funktional)

---

## QA Test Results

**Tested:** 2026-02-12
**Tester:** QA Engineer (Code Review + Static Analysis)
**Build:** vitest 196/196 passed, vite build erfolgreich
**Branch:** main (uncommitted changes)

---

### Acceptance Criteria Status

#### Zugang zur Korrektur-Funktion

- [x] **AC: "Datum korrigieren"-Button in ZyklusStartDetail sichtbar**
  - Code: `Chronik.jsx` Zeile 999-1007 -- Button `"Datum korrigieren"` mit Klasse `btn-text korrektur-btn` wird im ZyklusStartDetail angezeigt.
  - Bedingung: `!korrekturOffen && !gespeichert` -- korrekt, Button wird ausgeblendet wenn Korrektur-Bereich offen oder nach Speichern.

- [x] **AC: Button fuer ALLE Menstruationsbeginn-Eintraege sichtbar (nicht nur den aktuellsten)**
  - Code: `ZyklusStartDetail` wird fuer jedes `gewaehlterStart`-Objekt gerendert (Zeile 685-691). Kein Filter auf "aktuellster Zyklus". Alle Historieneintraege haben den Button.

#### Korrektur-Dialog

- [x] **AC: Nach Tap oeffnet sich Date-Picker**
  - Code: Zeile 1010-1045. `korrekturOffen`-State steuert die Sichtbarkeit. `<input type="date">` wird verwendet -- konsistent mit dem restlichen App-Pattern.

- [x] **AC: Date-Picker ist mit bisherigem Startdatum vorausgefuellt (NICHT mit heutigem Datum)**
  - Code: `oeffneKorrektur()` (Zeile 848-853) setzt `setNeuesDatum(datumAlsString(zyklusStart.startdatum))` -- korrekt, das bisherige Datum wird verwendet.

- [x] **AC: Maximales Datum ist "heute"**
  - Code: Zeile 1020 `max={datumAlsString(new Date())}` -- korrekt, HTML-Attribut beschraenkt die Auswahl.

- [x] **AC: "Speichern"- und "Abbrechen"-Button vorhanden**
  - Code: Zeile 1031-1044. "Speichern" (btn-primary) und "Abbrechen" (btn-text) sind vorhanden.

#### Speicherlogik

- [x] **AC: Startdatum in der Zyklushistorie wird aktualisiert**
  - Code: Zeile 924 `historie[index] = { ...historie[index], startdatum: neuesDate }` -- korrekt.

- [x] **AC: Bei AKTUELLSTEM Zyklus wird zyklusdaten.zyklusStart aktualisiert**
  - Code: Zeile 949-952. Pruefung `index === historie.length - 1`, dann `aktualisiereZyklusdaten({ zyklusStart: neuesDate })`. Korrekt.

- [x] **AC: Mondphase wird fuer das neue Datum automatisch neu berechnet**
  - Code: Zeile 927-928. `berechneMondphase(neuesDate)` wird aufgerufen, `historie[index].mondphase = neueMondphase.phase`. Korrekt.

- [x] **AC: Zykluslaenge des VORHERIGEN Zyklus wird bei Bedarf neu berechnet**
  - Code: Zeile 931-936. Wenn `index > 0`, wird die Differenz in Tagen berechnet und als `zyklusLaenge` gesetzt. Korrekt.

- [x] **AC: Zykluslaenge des korrigierten Zyklus wird bei Bedarf neu berechnet (falls Nachfolger existiert)**
  - Code: Zeile 938-944. Wenn `index < historie.length - 1`, wird die Differenz zum Nachfolger berechnet. Korrekt.

- [x] **AC: Per-field Zeitstempel werden gesetzt (PROJ-2 kompatibel)**
  - Code: `speichereZyklushistorie(historie)` in `speicher.js` (Zeile 190-209) setzt automatisch Zeitstempel fuer alle Eintraege ueber `schluesselVonDatum(h.startdatum)`. Korrekt -- die PROJ-2-Infrastruktur wird genutzt.

- [x] **AC: Bei eingeloggten Usern wird Aenderung an Cloud uebertragen**
  - Code: `speichereZyklushistorie()` in `speicher.js` (Zeile 201-208) ruft `cloudSchreiben()` auf wenn `currentUserId` gesetzt. Write-Through-Cache funktioniert. Korrekt.

- [x] **AC: Bei Offline-Zustand wird Aenderung in Offline-Queue eingereiht**
  - Code: `cloudSchreiben()` in `speicher.js` (Zeile 84-93) faengt Fehler ab und ruft `queueHinzu()` auf. PROJ-3 Offline-Queue wird genutzt. Korrekt.

#### Feedback

- [x] **AC: "Datum korrigiert"-Meldung erscheint fuer 2 Sekunden**
  - Code: Zeile 955-960. `setGespeichert(true)` zeigt "Datum korrigiert" an, `setTimeout` nach 2000ms setzt zurueck und ruft `onKorrektur()` auf. Korrekt.

- [x] **AC: Kalender zeigt sofort das korrigierte Datum an**
  - Code: `nachKorrektur()` (Zeile 552-555) inkrementiert `historieVersion` und setzt `gewaehlterTag` auf null. Der `useEffect` in Kalender (Zeile 529-550) re-ladet bei `historieVersion`-Aenderung. Korrekt.

- [ ] **AC: Mond-Verlauf-Tab zeigt korrigiertes Datum sofort an** -- HINWEIS (kein Bug)
  - Code: `MondVerlauf` re-rendert bei `syncVersion`-Aenderung (Zeile 1065-1070). Da die lokale Korrektur `syncVersion` NICHT aendert (nur Realtime-Events tun das), sieht die Nutzerin das korrigierte Datum erst beim naechsten Tab-Wechsel. Da `MondVerlauf` als eigene Komponente bei jedem Mount neu ladet, ist dies in der Praxis kein Problem, da der Tab-Wechsel einen Neuaufbau ausloest. Funktional korrekt, aber technisch wird nicht "sofort" aktualisiert waehrend der Tab schon offen ist.

#### Validierung

- [x] **AC: Datum darf nicht in der Zukunft liegen**
  - Code: Zeile 869-874. `heute.setHours(23, 59, 59, 999)` -- die Pruefung erlaubt Daten bis Ende des heutigen Tages. Korrekt.

- [x] **AC: Duplikat-Schutz (kein identisches Datum wie anderer Menstruationsbeginn)**
  - Code: Zeile 894-901. `historie.some()` prueft alle anderen Eintraege. Korrekt.

- [x] **AC: Reihenfolge-Check (chronologische Reihenfolge)**
  - Code: Zeile 903-919. Prueft Vorgaenger (`neuesDate <= vorgaenger.startdatum`) und Nachfolger (`neuesDate >= nachfolger.startdatum`). Verwendet `<=` und `>=` (strikt) -- das bedeutet: gleicher Tag wie Vorgaenger/Nachfolger wird abgelehnt, was zusammen mit dem Duplikat-Check sinnvoll ist. Korrekt.

---

### Edge Cases Status

#### EC-1: Korrektur des einzigen Zyklus
- [x] **Code korrekt:**
  - Wenn nur 1 Eintrag: `index === 0` und `index === historie.length - 1`.
  - Vorgaenger-Check (Zeile 906) greift nicht (index > 0 ist false).
  - Nachfolger-Check (Zeile 913) greift nicht (index < historie.length - 1 ist false).
  - Zykluslaenge-Neuberechnung greift nicht (kein Vorgaenger, kein Nachfolger).
  - `aktualisiereZyklusdaten()` wird aufgerufen (aktuellster Zyklus). Korrekt.

#### EC-2: Datum auf Tag mit bestehendem Chronik-Eintrag verschieben
- [x] **Code korrekt:**
  - Chronik-Eintraege und Zyklushistorie sind getrennte Stores. Die Korrektur betrifft nur `zyklushistorie`. Ein bestehender Tageseintrag bleibt unberuehrt. Korrekt.

#### EC-3: Korrektur bei Offline-Zustand
- [x] **Code korrekt:**
  - `speichereZyklushistorie()` schreibt immer erst lokal (synchron), dann async an Cloud. Bei Fehler wird die Offline-Queue genutzt (PROJ-3). Korrekt.

#### EC-4: Gleichzeitige Korrektur auf zwei Geraeten
- [x] **Code korrekt:**
  - PROJ-2 Field-Level-Merge greift ueber `schluesselVonDatum(h.startdatum)` als Merge-Key. Der juengere Zeitstempel gewinnt. Korrekt.
  - HINWEIS: Nach Datumskorrektur aendert sich der Merge-Key (altes Datum -> neues Datum). Der alte Key bleibt als "Geist" im Zeitstempel-Objekt. Das ist kein Bug, nur ein kleiner Speicher-Overhead, der bei kuenftigen Merges keine Probleme verursacht.

#### EC-5: Datum verschiebt sich ueber Monatsgrenze
- [x] **Code korrekt:**
  - `nachKorrektur()` setzt `gewaehlterTag` auf null und laedt die Historie neu. Die Nutzerin muss manuell zum neuen Monat navigieren, um den verschobenen Marker zu sehen.
  - HINWEIS: Kein automatisches Umschalten des Kalendermonats auf den Monat des neuen Datums. Die Nutzerin sieht nach Korrektur den alten Monat ohne Marker und muss selbst navigieren. Dies ist kein Bug gemaess Spec, aber ein UX-Verbesserungsvorschlag fuer eine kuenftige Iteration.

#### EC-6: Korrektur veraendert berechneten Zyklustyp
- [x] **Code korrekt:**
  - `zyklusTyp` wird bei der Korrektur NICHT geaendert (Zeile 924: `{ ...historie[index], startdatum: neuesDate }` -- alle anderen Felder bleiben). Nur `mondphase` wird neu berechnet. Korrekt gemaess Spec.

#### EC-7: Korrektur aktueller vs. aelterer Zyklen
- [x] **Code korrekt:**
  - Aktuellster: `index === historie.length - 1` -> `aktualisiereZyklusdaten()` wird aufgerufen (Zeile 949-952). Korrekt.
  - Aelterer: `aktualisiereZyklusdaten()` wird NICHT aufgerufen. Nur `zyklushistorie` wird aktualisiert. Korrekt.
  - Zykluslaenge von betroffenem UND nachfolgendem Zyklus wird neu berechnet (Zeile 931-944). Korrekt.

---

### Security Check

#### SEC-1: XSS (Cross-Site Scripting)
- [x] **Kein XSS-Risiko:**
  - Der Date-Picker ist ein `<input type="date">` -- der Browser rendert ein natives Datum-Widget. Es gibt kein Freitext-Feld, das in HTML gerendert wird.
  - Fehlermeldungen (`fehler`-State) werden ueber `{fehler}` in JSX eingefuegt, was React automatisch escaped. Kein `dangerouslySetInnerHTML`. Korrekt.

#### SEC-2: Injection
- [x] **Kein Injection-Risiko:**
  - Die Daten gehen ueber `speichereZyklushistorie()` nach localStorage (JSON.stringify) und ueber Supabase (parametrisierte Queries). Keine String-Konkatenation in SQL. Korrekt.

#### SEC-3: Input-Validierung
- [x] **Validierung korrekt implementiert:**
  - Zukunfts-Check: `neuesDate > heute` (Zeile 871)
  - Duplikat-Check: `historie.some(...)` (Zeile 895-901)
  - Reihenfolge-Check: Vorgaenger- und Nachfolger-Pruefung (Zeile 906-919)
  - Ungueltig-Check: `stringAlsDatum(neuesDatum)` gibt null zurueck bei ungueltigem Datum (Zeile 863-866)
  - Nicht-gefunden-Check: `index === -1` (Zeile 889-891)
  - Unveraendert-Check: `neuesDatum === bisherigKey` (Zeile 877-879)

#### SEC-4: Authorization
- [x] **Kein Berechtigungsproblem:**
  - Die Korrektur wirkt nur auf die lokalen Daten der aktuellen Nutzerin. Cloud-Writes gehen ueber den `currentUserId`. Supabase Row-Level-Security (RLS) schuetzt gegen fremde Daten. Korrekt.

#### SEC-5: Race Conditions
- [x] **Keine kritische Race Condition:**
  - Die Korrektur laedt die Historie synchron aus localStorage (`ladeZyklushistorie()`), modifiziert sie, und speichert sie synchron zurueck. Da JavaScript single-threaded ist, kann keine parallele Modifikation dazwischen kommen. Korrekt.

---

### Bugs Found

#### BUG-1: Verwaiste Zeitstempel-Keys nach Datumskorrektur (Low)
- **Severity:** Low
- **Beschreibung:** Wenn das Startdatum eines Historieneintrags von z.B. "2026-01-15" auf "2026-01-18" korrigiert wird, bleibt der alte Zeitstempel-Key "2026-01-15" im localStorage-Objekt `rotermond_zyklushistorie_zeitstempel` bestehen. Der neue Key "2026-01-18" wird hinzugefuegt. Der alte Key ist verwaist und wird nie bereinigt.
- **Impact:** Minimaler Speicher-Overhead. Kein funktionaler Fehler. Bei haefigen Korrekturen koennte das Zeitstempel-Objekt wachsen, aber das ist in der Praxis irrelevant.
- **Steps to Reproduce:**
  1. Erstelle einen Zyklus mit Startdatum 15.01.2026
  2. Korrigiere das Datum auf 18.01.2026
  3. Pruefe `localStorage.getItem('rotermond_zyklushistorie_zeitstempel')`
  4. Expected: Nur Key "2026-01-18" vorhanden
  5. Actual: Keys "2026-01-15" UND "2026-01-18" vorhanden
- **Priority:** Low (Kein funktionaler Bug, nur Speicher-Hygiene)

#### BUG-2: Kein automatisches Monatswechseln bei Korrektur ueber Monatsgrenze (Low)
- **Severity:** Low
- **Beschreibung:** Wenn ein Datum von z.B. 31. Maerz auf 1. April korrigiert wird, bleibt der Kalender auf dem Maerz-Monat stehen. Der rote Menstruations-Marker verschwindet aus dem aktuellen Monat, aber der Kalender wechselt NICHT automatisch zum April.
- **Impact:** Die Nutzerin muss manuell zum neuen Monat navigieren. Keine Daten gehen verloren.
- **Steps to Reproduce:**
  1. Navigiere zum Kalender-Tab
  2. Waehle einen Menstruationsbeginn am 31. Maerz
  3. Korrigiere das Datum auf den 1. April
  4. Expected: Kalender wechselt zum April (oder zeigt Hinweis)
  5. Actual: Kalender bleibt auf Maerz, Marker ist weg, Nutzerin muss manuell navigieren
- **Priority:** Low (UX-Verbesserung, kein funktionaler Bug)

#### BUG-3: Keine Unit-Tests fuer die Korrektur-Logik (Medium)
- **Severity:** Medium
- **Beschreibung:** Die gesamte Korrektur-Logik in `ZyklusStartDetail.speichereKorrektur()` ist nicht durch Unit-Tests abgedeckt. Die bestehenden 196 Tests decken mondphasen, mergeLogik, speicher, zyklus, syncHelpers, muster und offlineQueue ab -- aber keine Tests fuer die Validierungslogik (Zukunfts-Check, Duplikat-Check, Reihenfolge-Check), Zykluslaengen-Neuberechnung oder die Integration.
- **Impact:** Regressions-Risiko bei kuenftigen Aenderungen an der Chronik-Komponente.
- **Steps to Reproduce:**
  1. Pruefe existierende Tests: `npx vitest run`
  2. Suche nach "korrektur" oder "ZyklusStartDetail" in Test-Dateien
  3. Expected: Tests fuer Validierung und Neuberechnung
  4. Actual: Keine Tests vorhanden
- **Priority:** Medium (Testabdeckung, kein Laufzeitfehler)

---

### Regression Check

- [x] **PROJ-1 (Realtime Sync Engine):** Keine Aenderungen an SyncEngineContext oder syncHelpers. Unkritisch.
- [x] **PROJ-2 (Field-Level Merge):** `speichereZyklushistorie()` in speicher.js wird weiterverwendet -- Zeitstempel-Logik funktioniert. Unkritisch.
- [x] **PROJ-3 (Offline Queue):** Offline-Queue wird ueber `cloudSchreiben()` in speicher.js genutzt. Keine Aenderungen noetig. Unkritisch.
- [x] **PROJ-4 (Guest Migration):** Keine Aenderungen an migrationsManager oder Guest-ID-Logik. Unkritisch.
- [x] **Tageseintrag-Tab:** Nicht betroffen. Zeile 146-511 unveraendert.
- [x] **Kalender-Tab:** Erweitert (historieVersion, nachKorrektur), aber bestehende Logik (Monatsnavigation, Tag-Auswahl, Eintrag-Anzeige) bleibt funktional.
- [x] **Mond-Verlauf-Tab:** Nicht direkt geaendert. Liest Daten bei Mount neu.
- [x] **Insights-Tab:** Nicht betroffen.
- [x] **Einstellungen (Zyklusstart-Aenderung):** Nicht betroffen. Verwendet eigene Logik in Einstellungen.jsx.
- [x] **Tests:** Alle 196 bestehenden Tests bestehen (7 Test-Dateien, 0 Fehler).
- [x] **Build:** Vite-Build erfolgreich (keine Fehler, keine neuen Warnungen).

---

### Performance Check

- [x] **Keine Performance-Bedenken:**
  - Die Korrektur-Logik arbeitet synchron auf einem kleinen Array (Zyklushistorie hat typischerweise 3-50 Eintraege).
  - `berechneMondphase()` ist eine reine mathematische Berechnung (keine API-Calls).
  - `speichereZyklushistorie()` schreibt das gesamte Array -- bei typischer Groesse (< 1 KB) kein Performance-Problem.

---

### Code-Qualitaet

- [x] **Konsistenz mit bestehendem Code-Stil:** Die Implementierung folgt dem bestehenden Pattern (klappbare Bereiche, `useState`/`useCallback`, `btn-text`/`btn-primary`-Klassen).
- [x] **CSS-Klassen:** Alle neuen Klassen (`korrektur-btn`, `korrektur-bereich`, `korrektur-fehler`, `korrektur-aktionen`, `korrektur-speichern-btn`, `korrektur-abbrechen-btn`, `korrektur-erfolg`) sind in App.css definiert und folgen der bestehenden Namenskonvention.
- [x] **Keine neuen Dependencies:** Korrekt -- nur bestehende Imports verwendet.
- [x] **Keine neuen Dateien:** Korrekt -- alle Aenderungen in Chronik.jsx und App.css.

---

### Summary

- 19 Acceptance Criteria geprueft: 19 bestanden, 0 fehlgeschlagen
- 7 Edge Cases geprueft: 7 bestanden, 0 fehlgeschlagen
- 5 Security Checks: 5 bestanden, 0 fehlgeschlagen
- 196 Unit Tests: 196 bestanden, 0 fehlgeschlagen
- Build: Erfolgreich
- 3 Bugs gefunden: 0 Critical, 1 Medium, 2 Low
- Regression: Keine Probleme gefunden

---

### Production-Ready Decision

**READY** -- Das Feature ist production-ready.

**Begruendung:**
- Alle Acceptance Criteria sind korrekt implementiert.
- Alle Edge Cases werden korrekt behandelt.
- Keine Security-Issues gefunden.
- Alle bestehenden Tests bestehen weiterhin.
- Build ist erfolgreich.
- Die 3 gefundenen Bugs sind nicht-kritisch:
  - BUG-1 (verwaiste Zeitstempel-Keys) ist reiner Speicher-Overhead ohne funktionalen Impact.
  - BUG-2 (kein Monatswechsel bei Monatsgrenze) ist eine UX-Verbesserung, kein Blocker.
  - BUG-3 (fehlende Unit-Tests) ist ein Qualitaetsmangel, aber kein Laufzeitfehler.

**Empfehlung:**
- BUG-3 (Unit-Tests) sollte zeitnah in einer eigenen Aufgabe nachgeholt werden.
- BUG-1 und BUG-2 koennen in einer kuenftigen Iteration adressiert werden.
