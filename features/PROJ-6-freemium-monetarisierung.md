# PROJ-6: Freemium & Monetarisierung

## Status: 🔵 Planned

## Zusammenfassung

Die Roter Mond App wird als Freemium-Modell in den App Stores (Apple App Store & Google Play Store) angeboten. Nutzerinnen erhalten 14 Tage Vollzugang als Trial, danach steht ein Free Tier dauerhaft zur Verfügung. Premium-Features werden per Einmalkauf (2,99€) freigeschaltet.

## Abhängigkeiten

- Benötigt: Capacitor/Native App Wrapper (separates PROJ - noch nicht spezifiziert)
- Benötigt: Apple Developer Account + Google Play Developer Account
- Nutzt: Bestehende Auth-Infrastruktur (PROJ-1 bis PROJ-4) für Cloud-Sync als Premium-Feature

## Monetarisierungs-Modell

### Trial-Phase (14 Tage)
- **Start:** Beginnt mit der Ersteinrichtung (wenn Zyklusdaten zum ersten Mal gespeichert werden)
- **Umfang:** Alle Features freigeschaltet (Free + Premium)
- **Ziel:** ~halber Zyklus erleben, inkl. Orakel und alle Heute-Karten

### Free Tier (dauerhaft, nach Trial)
| Bereich | Umfang |
|---------|--------|
| **Heute** | 2 von 5 Tageskarten: Energie des Tages + Symboltier flüstert. Gesperrt: Tagesimpuls, Affirmation, Kreativ-Tipp (Premium-Badge + Modal) |
| **Wissen** | Komplett – alle Abschnitte (Archetypen, Zyklustypen, Symboltiere, Mond-Zyklus, Mond-Chronik) |
| **Chronik** | 3 von 4 Tabs: Eintrag, Kalender, Verlauf |
| **Einstellungen** | Komplett – Zyklusdaten, neuer Zyklus, Phasenaufteilung, Phase anpassen |
| **Orakel** | Gesperrt (Teaser: letzte 3 gezogene Karten sichtbar) |
| **Cloud-Sync** | Gesperrt (nur lokale Datenhaltung) |

### Premium Tier (Einmalkauf 2,99€)
| Feature | Beschreibung |
|---------|-------------|
| **Heute (3 Karten)** | Tagesimpuls, Affirmation, Kreativ-Tipp |
| **Orakel** | Tägliches Kartenziehen, volle Kartenhistorie |
| **Chronik Insights** | Muster-Analyse über mehrere Zyklen (Tab 4) |
| **Cloud-Sync** | Account-Erstellung, Cross-Device-Sync, automatisches Backup, Offline-Queue |

### Preisgestaltung
- **Einmalkauf:** 2,99€ (kein Abo)
- **Abwicklung:** In-App Purchase über Apple App Store / Google Play Store
- **Hinweis:** Apple/Google behalten 15–30% Provision

---

## User Stories

### Trial-Erlebnis
- Als **neue Nutzerin** möchte ich **die App 14 Tage lang vollständig testen**, um zu entscheiden ob sich der Kauf lohnt.
- Als **neue Nutzerin** möchte ich **sehen wie viele Trial-Tage mir noch bleiben**, damit ich rechtzeitig entscheiden kann.
- Als **Nutzerin am Trial-Ende** möchte ich **freundlich auf den Ablauf hingewiesen werden**, ohne mich unter Druck gesetzt zu fühlen.

### Free Tier
- Als **Gratis-Nutzerin** möchte ich **dauerhaft meine Zyklen tracken und 2 tägliche Texte lesen** (Energie + Symboltier), damit die App auch ohne Bezahlung wertvoll bleibt.
- Als **Gratis-Nutzerin** möchte ich **das komplette Wissen lesen können**, um die Archetypen-Philosophie zu verstehen.
- Als **Gratis-Nutzerin** möchte ich **klar sehen welche Features Premium sind**, ohne dass mich die App nervt oder manipuliert.

### Premium-Kauf
- Als **interessierte Nutzerin** möchte ich **mit einem Tap Premium kaufen können**, ohne komplizierte Registrierung.
- Als **Käuferin** möchte ich **sofort nach dem Kauf alle Features nutzen können**, ohne Neustart oder Wartezeit.
- Als **Premium-Nutzerin** möchte ich **dauerhaft alle Features behalten** (Einmalkauf = kein Ablaufdatum).

### Paywall-Interaktion
- Als **Gratis-Nutzerin** möchte ich **auf gesperrte Features tippen können und dann eine freundliche Erklärung sehen**, statt dass die Navigation komplett blockiert wird.
- Als **Nutzerin nach Trial-Ende** möchte ich **meine letzten 3 Orakelkarten noch sehen können** (Teaser), damit ich weiß was mir fehlt.

### Bestandsschutz
- Als **bestehende Nutzerin** (vor Einführung der Paywall) möchte ich **alle Features weiterhin kostenlos nutzen können**, weil ich die App schon vor der Monetarisierung verwendet habe.

---

## Acceptance Criteria

### Trial-Management
- [ ] Trial startet automatisch bei Ersteinrichtung (`ersteinrichtungAbgeschlossen = true`)
- [ ] Trial-Startdatum wird persistent gespeichert (localStorage: `rotermond_trial_start`)
- [ ] Trial dauert exakt 14 Tage ab Startdatum
- [ ] Während der Trial-Phase sind alle Premium-Features freigeschaltet
- [ ] Trial-Status ist jederzeit abfragbar (Tage verbleibend, abgelaufen ja/nein)
- [ ] Trial-Countdown ist in den Einstellungen sichtbar (z.B. "Premium-Test: noch 12 Tage")
- [ ] Am letzten Trial-Tag erscheint ein freundlicher Hinweis (kein aggressives Pop-up)
- [ ] Nach Trial-Ablauf werden Premium-Features sanft gesperrt (nächster App-Start)

### Feature-Gating
- [ ] **Orakel-Seite:** Nach Trial gesperrt, Teaser mit letzten 3 Karten + Premium-Hinweis
- [ ] **Chronik Insights Tab:** Nach Trial gesperrt, Premium-Badge auf Tab
- [ ] **Cloud-Sync/Anmelden:** Nach Trial gesperrt, CloudBanner zeigt Premium-Hinweis
- [ ] **Heute-Seite (Free):** Energie des Tages + Symboltier flüstert immer verfügbar
- [ ] **Heute-Seite (Premium):** Tagesimpuls, Affirmation, Kreativ-Tipp nach Trial gesperrt, Premium-Badge auf den 3 Karten
- [ ] **Wissen-Seite:** Immer komplett verfügbar
- [ ] **Chronik Eintrag/Kalender/Verlauf:** Immer verfügbar
- [ ] **Einstellungen:** Immer verfügbar (außer Cloud-Bereich)
- [ ] Feature-Gating-Status wird zentral verwaltet (ein Hook/Context für Premium-Status)

### Paywall UI (Badge + Modal)
- [ ] Gesperrte Features zeigen ein dezentes Premium-Badge (z.B. kleines Schloss-Icon oder Stern)
- [ ] Bei Tap auf gesperrtes Feature öffnet sich ein Modal (kein Seitenwechsel)
- [ ] Modal enthält: Feature-Beschreibung, Preis (2,99€), Kauf-Button, "Später"-Button
- [ ] Modal-Design passt zum App-Stil (Farben, Schriftarten, Rundungen)
- [ ] Modal ist nicht aggressiv oder manipulativ (kein Dark Pattern)
- [ ] Orakel-Navigation in der TabBar zeigt Premium-Badge nach Trial-Ende
- [ ] Chronik Insights-Tab zeigt Premium-Badge nach Trial-Ende

### Orakel-Teaser (nach Trial)
- [ ] Orakel-Seite zeigt die letzten 3 gezogenen Karten (aus Trial-Zeit)
- [ ] Karten sind sichtbar aber leicht visuell abgesetzt (z.B. leichter Blur oder Opacity)
- [ ] Unter den Karten: "Täglich neue Karten ziehen – mit Premium" + Kauf-Button
- [ ] Wenn keine Karten gezogen wurden (Trial nicht für Orakel genutzt): Nur Premium-Hinweis

### In-App Purchase
- [ ] Kauf wird über nativen In-App Purchase abgewickelt (Apple StoreKit / Google Billing)
- [ ] Kauf-Status wird lokal persistent gespeichert
- [ ] Kauf kann wiederhergestellt werden ("Kauf wiederherstellen" Button in Einstellungen)
- [ ] Nach erfolgreichem Kauf: Sofortige Freischaltung aller Premium-Features
- [ ] Kauf-Fehler werden benutzerfreundlich behandelt (Netzwerk, Abbruch, etc.)
- [ ] Kauf ist geräteübergreifend wiederherstellbar (über Apple/Google Account)

### Bestandsschutz
- [ ] Nutzerinnen, die die App VOR Einführung der Paywall installiert haben, behalten vollen Zugang
- [ ] Bestandsschutz wird über lokales Flag erkannt (z.B. `rotermond_legacy_user = true`)
- [ ] Bestandsschutz-Flag wird bei App-Update gesetzt, wenn `ersteinrichtungAbgeschlossen = true` UND kein `trial_start` existiert
- [ ] Legacy-Nutzerinnen sehen keinen Trial-Countdown und keine Paywall
- [ ] Bestandsschutz ist nicht übertragbar auf neue Geräte (nur lokale Daten)

### Web-Version
- [ ] Die Web-Version (Vercel) ist von der Paywall nicht betroffen
- [ ] Entscheidung ob Web-Version eigenes Freemium bekommt: OFFEN (separates PROJ)

---

## Edge Cases

### Trial
- **Nutzerin ändert Systemzeit vorwärts:** Trial-Check basiert auf gespeichertem Startdatum vs. aktuellem Datum. Manipulation möglich, aber bei 2,99€ Einmalkauf nicht lohnend → kein Schutz nötig.
- **App-Neuinstallation:** Neuer Trial startet (kein Anti-Abuse-Mechanismus). Bei 2,99€ ist der Aufwand einer Neuinstallation (Datenverlust!) bereits ausreichende Hürde.
- **Nutzerin richtet Zyklus ein, deinstalliert, installiert nach 30 Tagen neu:** Neuer Trial startet, da `trial_start` nicht mehr existiert.
- **Trial läuft ab während Nutzerin Orakelkarte ansieht:** Feature bleibt bis zum nächsten App-Start nutzbar (kein Mid-Session-Lock).
- **Trial läuft ab während Chronik-Insights geöffnet:** Analog – bleibt bis Seitenwechsel nutzbar.

### Kauf
- **Kauf während Trial:** Sofortige Premium-Freischaltung, Trial wird irrelevant.
- **Kauf-Abbruch:** Nichts passiert, Nutzerin bleibt im aktuellen Status (Trial oder Free).
- **Kauf auf Gerät A, Nutzung auf Gerät B:** "Kauf wiederherstellen" in Einstellungen nutzt Apple/Google Account zur Verifizierung.
- **Nutzerin kauft Premium, nutzt aber keinen Cloud-Sync:** Kein Problem – Premium schaltet die *Option* frei, erzwingt keinen Account.
- **Refund über Apple/Google:** Premium-Status wird entzogen (Store-seitig gehandhabt).

### Bestandsschutz
- **Legacy-Nutzerin wechselt Gerät:** Bestandsschutz geht verloren (nur lokal). Nutzerin muss kaufen oder nutzt Free Tier. → Hinweis in Release Notes!
- **Legacy-Nutzerin löscht App-Daten:** Bestandsschutz geht verloren (Flag gelöscht).
- **Nutzerin mit Cloud-Sync wechselt Gerät:** Cloud-Sync funktioniert nur mit Premium. Da Legacy-Nutzerinnen Cloud-Sync hatten, müssten sie auf neuem Gerät kaufen. → Empfehlung: Legacy-Flag auch in Cloud speichern (Supabase), damit es beim Login wiederhergestellt wird.
- **Zeitpunkt des Bestandsschutz-Flags:** Wird beim App-Update gesetzt, das die Paywall einführt. Erkennung: `ersteinrichtungAbgeschlossen === true` UND `trial_start` existiert nicht.

### Feature-Gating
- **Chronik-Seite mit gemischten Tabs:** Tabs Eintrag/Kalender/Verlauf sind frei, Insights hat Badge. Kein Tab-Wechsel nötig um Badge zu sehen.
- **Cloud-Banner in Einstellungen:** Zeigt nach Trial "Cloud-Sync ist ein Premium-Feature" statt des bisherigen "Anmelden"-Buttons. Premium-Nutzerinnen sehen den normalen Anmelde-Flow.
- **Heute-Seite mit gemischten Karten:** 2 Karten (Energie, Symboltier) sind frei, 3 Karten (Tagesimpuls, Affirmation, Kreativ-Tipp) haben Premium-Badge. Gesperrte Karten zeigen Titel + Badge, bei Tap öffnet Premium-Modal.
- **"Phase anpassen" in Heute:** Bleibt frei (gehört zum Tracking, nicht zu Premium).
- **Zyklustyp-Trend-Banner:** Bleibt frei (gehört zum Tracking).
- **Personalisierte Phasengrenzen:** Bleiben frei (basiert auf Korrekturen = Tracking).

---

## Offene Fragen

1. **Web-Version:** Soll die Web-Version auf Vercel das gleiche Freemium-Modell bekommen? Oder bleibt sie komplett kostenlos? → Separates PROJ empfohlen.
2. **Preis-Lokalisierung:** Soll der Preis je nach Land variieren (Apple/Google bieten das an)?
3. **Künftige Preiserhöhung:** Behalten Käuferinnen ihren Status, auch wenn der Preis später steigt? (Ja, Standard bei Einmalkauf)
4. **Analytics:** Sollen Trial-Conversion-Rates getrackt werden? Wenn ja, welches Tool?

---

## Technische Anforderungen (Rahmenbedingungen für Solution Architect)

- **Kein Server-Side-Check nötig:** Trial und Premium-Status können lokal verwaltet werden (Einmalkauf, kein Abo)
- **In-App Purchase:** Apple StoreKit 2 + Google Play Billing Library (oder Capacitor-Plugin)
- **Zentrale Premium-Logik:** Ein `PremiumContext` oder Hook (`usePremium`) der Trial-Status, Kauf-Status und Legacy-Status zusammenführt
- **Feature-Flags:** Gating soll über Konfiguration steuerbar sein (welche Features sind Premium), nicht hardcoded in jeder Komponente
- **Kein Netzwerk für Gating:** Premium-Check muss offline funktionieren (lokaler Status)
- **Receipt Validation:** Optional – bei 2,99€ Einmalkauf ist Server-Side-Validation nice-to-have, nicht zwingend
