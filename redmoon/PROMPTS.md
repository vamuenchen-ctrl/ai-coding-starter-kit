# Prompts für Claude Code – „Roter Mond" App

Diese Datei enthält alle Prompts in der Reihenfolge, in der du sie an Claude Code geben solltest.

**Wichtig:**
- Gib immer nur EINEN Prompt auf einmal.
- Warte, bis Claude Code fertig ist, und teste das Ergebnis im Browser.
- Erst wenn alles funktioniert, gehe zum nächsten Prompt.
- Wenn etwas nicht funktioniert, beschreibe Claude Code das Problem, bevor du weitermachst.
- Nach jedem erfolgreichen Schritt: `git add . && git commit -m "Schritt X fertig"` (Claude Code kann das auch für dich machen).

---

## Prompt 1: Projekt aufsetzen und Grundstruktur

```
Lies bitte die Dateien KONZEPT.md und INHALTE.md im Ordner redmoon.

Erstelle ein neues React-Projekt mit Vite (JavaScript, kein TypeScript) für die "Roter Mond" App. Die App-Sprache ist Deutsch.

Baue folgende Grundstruktur:
1. Eine Navigation (unten als Tab-Bar, wie bei einer Mobile-App) mit 5 Bereichen:
   - "Heute" (Tägliche Empfehlungen – Hauptscreen, Startseite)
   - "Orakel" (Tägliche Orakelkarte)
   - "Chronik" (Mond-Chronik / Zyklustagebuch)
   - "Wissen" (Wissensbereich)
   - "Einstellungen" (Zyklus-Einrichtung)

2. Jeder Bereich soll vorerst nur eine Platzhalter-Seite mit dem Bereichsnamen zeigen.

3. Richte React Router für die Navigation ein.

4. Erstelle ein ansprechendes, feminines Design mit CSS:
   - Grundfarben: Bordeaux (#C94963), Olivgrün (#677E3D), Indigo (#26496F), weiches Weiß (#F4EFEE)
   - Schrift: Eine gut lesbare Schrift, z.B. system-ui
   - Abgerundete Ecken, sanfte Schatten
   - Mobile-first Design (max-width: 480px zentriert)
   - Responsive design; stelle nach Möglichkeit sicher, dass jede Seite auf einen Screen passt ohne, dass Scrolling notwendig ist.


5. Richte Git ein und mache einen ersten Commit.

Installiere noch keine zusätzlichen Bibliotheken außer react-router-dom.
```

---

## Prompt 2: Mondphasen-Berechnung

```
Erstelle eine Utility-Datei src/utils/mondphasen.js mit folgenden Funktionen:

1. berechneMondphase(datum)
   - Berechnet die Mondphase für ein beliebiges Datum
   - Basierend auf dem 29,53-Tage-Zyklus
   - Referenz-Neumond: 6. Januar 2000
   - Gibt ein Objekt zurück mit:
     - phase: "neumond" | "zunehmend" | "vollmond" | "abnehmend"
     - tageImZyklus: Zahl (0-29)
     - beleuchtung: Zahl (0-100, Prozent)
     - naechsterVollmond: Datum
     - naechsterNeumond: Datum
     - anzeigeText: String, z.B. "Zunehmend – noch 5 Tage bis Vollmond"
     - symbol: passendes Mond-Emoji (🌑🌒🌓🌔🌕🌖🌗🌘)

2. Die Phase-Bestimmung soll so funktionieren:
   - Tag 0 (± 1 Tag): Neumond
   - Tag 1–13: Zunehmend
   - Tag 14 (± 1 Tag): Vollmond
   - Tag 15–28: Abnehmend

3. Schreibe Tests in src/utils/mondphasen.test.js die prüfen:
   - Bekannte Vollmond- und Neumond-Daten werden korrekt erkannt
   - Der Anzeigetext wird korrekt generiert
   - Die Beleuchtung ist bei Neumond ~0% und bei Vollmond ~100%

Keine externen Bibliotheken verwenden, alles selbst berechnen.
```

---

## Prompt 3: Zyklusberechnung

```
Erstelle eine Utility-Datei src/utils/zyklus.js mit folgenden Funktionen:

1. berechneZyklusPhase(zyklusStart, zyklusLaenge, heutigesDatum)
   - Berechnet den aktuellen Zyklustag und die aktuelle Phase
   - Standard-Phasenaufteilung:
     - Alte Weise: Tag 1 bis ca. 1/4 der Zykluslänge (bei 28 Tagen: Tag 1-7)
     - Junge Frau: ca. 1/4 bis 2/4 (Tag 8-14)
     - Mutter: ca. 2/4 bis 3/4 (Tag 15-21)
     - Zauberin: ca. 3/4 bis Ende (Tag 22-28)
   - Gibt zurück:
     - zyklusTag: Zahl
     - phase: "alteWeise" | "jungeFrau" | "mutter" | "zauberin"
     - phaseName: "Alte Weise" | "Junge Frau" | "Mutter" | "Zauberin"
     - phaseTag: Tag innerhalb der aktuellen Phase (z.B. Tag 3 von 7)
     - phaseLaenge: Gesamtlänge der aktuellen Phase
     - naechstePhase: Name der nächsten Phase
     - tageeBisNaechstePhase: Tage bis Phasenwechsel

2. berechneZyklusTyp(menstruationsStart)
   - Nutzt berechneMondphase() aus mondphasen.js
   - Prüft, welche Mondphase am Tag 1 der Menstruation herrschte
   - Gibt zurück:
     - vorschlag: "weissmond" | "rotmond" | "unklar"
     - mondphaseAnTag1: Ergebnis von berechneMondphase()
     - erklaerung: Erklärender Text, z.B. "Am 2. Februar war zunehmender Mond, 3 Tage nach Neumond."
   - Logik:
     - Mondphase-Tag 0-3 oder 26-29: "weissmond"
     - Mondphase-Tag 12-17: "rotmond"
     - Sonst: "unklar"

3. berechneAngepasstePhase(zyklusStart, zyklusLaenge, heutigesDatum, korrekturen)
   - Wie berechneZyklusPhase, aber berücksichtigt gespeicherte Korrekturen
   - korrekturen ist ein Array von {zyklusTag, korrigiertePhase}
   - Wenn für den aktuellen Zyklustag eine Korrektur vorliegt, wird diese verwendet
   - Wenn nach 3+ Zyklen ein Muster erkennbar ist (z.B. "Nutzerin korrigiert an Tag 7 immer zu alteWeise"), soll die Standardaufteilung angepasst werden

4. Speichere die Phasenbeschreibungen (Kurzname, Symbol, Farbe, Jahreszeit, Element) als Konstante PHASEN_INFO in dieser Datei, basierend auf den Daten aus INHALTE.md.
```

---

## Prompt 4: Datenspeicherung

```
Erstelle eine Utility-Datei src/utils/speicher.js die alle App-Daten in localStorage verwaltet.

Folgende Daten sollen gespeichert und geladen werden können:

1. Zyklusdaten:
   - zyklusStart: Datum (erster Tag der letzten Menstruation)
   - zyklusLaenge: Zahl (durchschnittliche Zykluslänge)
   - zyklusTyp: "weissmond" | "rotmond"
   - ersteinrichtungAbgeschlossen: boolean

2. Phasenkorrekturen:
   - Array von {datum, zyklusTag, berechnetePhase, korrigiertePhase}

3. Zyklushistorie:
   - Array von {startdatum, mondphase, zyklusTyp, zyklusLaenge}

4. Chronik-Einträge:
   - Array von {datum, koerper, stimmung, energie, traeume, kreativitaet, sexuellesEmpfinden, phase}

5. Gezogene Tageskarten:
   - Array von {datum, kartenId}

6. Zyklustyp-Hinweis:
   - letzterHinweis: Datum
   - nutzerinHatAbgelehnt: boolean
   - ablehnungsDatum: Datum

Erstelle für jede Datengruppe Funktionen zum Laden, Speichern und Aktualisieren.
Verwende JSON.stringify/parse für die Serialisierung.
Verwende sprechende Schlüsselnamen wie "rotermond_zyklusdaten", "rotermond_korrekturen" etc.
```

---

## Prompt 5: Inhalte als JSON

```
Lies die Datei INHALTE.md und erstelle daraus strukturierte JSON-Dateien im Ordner src/data/:

1. src/data/phasen.json
   Enthält die vier Phasenbeschreibungen mit allen Details (Kurzname, Symbol, Farbe, Jahreszeit, Element, Kurzbeschreibung, Ausführliche Beschreibung, Stärken, Herausforderungen, Symboltier).

2. src/data/tagesempfehlungen.json
   Struktur: { jungeFrau: { energie: [...], uebung: [...], affirmation: [...], kreativ: [...] }, mutter: { ... }, zauberin: { ... }, alteWeise: { ... } }
   Jede Kategorie enthält die 7 Varianten aus INHALTE.md.

3. src/data/orakelkarten.json
   Array mit 41 Karten. Jede Karte hat: id, titel, botschaft, bedeutung, archetyp ("zentral" | "jungeFrau" | "mutter" | "zauberin" | "alteWeise"), nummer.

4. src/data/wissen.json
   Enthält: symboltiere (Array), zyklustypen (weissmond, rotmond – jeweils mit Text), mondZusammenhang (Text), mondChronik (Text).

Achte darauf, dass alle Texte exakt aus INHALTE.md übernommen werden, keine Zusammenfassungen.
```

---

## Prompt 6: Einstellungen-Seite (Bereich 1 – Ersteinrichtung)

```
Baue die Einstellungen-Seite (src/pages/Einstellungen.jsx).

Wenn die Ersteinrichtung noch nicht abgeschlossen ist (ersteinrichtungAbgeschlossen === false), zeige den Onboarding-Flow:

Schritt 1: Willkommen
- Kurzer Willkommenstext: "Willkommen bei Roter Mond. Diese App begleitet dich durch deinen Zyklus und hilft dir, die Kraft deiner vier inneren Archetypen zu entdecken."
- Button "Los geht's"

Schritt 2: Zyklusdaten
- Datumspicker: "Wann hat deine letzte Menstruation begonnen?"
- Zahleneingabe: "Wie lang ist dein Zyklus durchschnittlich?" (Standard: 28, Bereich: 21-35)
- Button "Weiter"

Schritt 3: Zyklustyp
- Anzeige der Mondphase am eingegebenen Menstruationsbeginn, z.B. "Am 2. Februar war zunehmender Mond, 3 Tage nach Neumond."
- Vorschlag des Zyklustyps basierend auf berechneZyklusTyp()
- Zwei auswählbare Karten/Buttons: "Weißmond-Zyklus" und "Rotmond-Zyklus"
- Der Vorschlag ist vorausgewählt, aber die Nutzerin kann wechseln
- Neben jedem Typ ein Info-Symbol (ⓘ), das auf Klick einen Tooltip anzeigt:
  - Weißmond: "Deine Menstruation fällt in die Neumondphase und dein Eisprung in die Vollmondphase. Dieser Typ wird traditionell mit Fruchtbarkeit, Nähren und nach außen gerichteter Energie in Verbindung gebracht."
  - Rotmond: "Deine Menstruation fällt in die Vollmondphase und dein Eisprung in die Neumondphase. Dieser Typ wird traditionell mit Heilung, Intuition und nach innen gerichteter Kreativität verbunden."
- Der Tooltip schließt sich beim erneuten Klick auf das ⓘ oder beim Klick irgendwo anders
- Button "Fertig"

Schritt 4: Bestätigung
- Zusammenfassung: "Dein Zyklus: [Zykluslänge] Tage, Typ: [Weißmond/Rotmond], Aktuelle Phase: [Phasenname]"
- Button "App starten" → speichert alles und leitet zum Hauptscreen weiter

Wenn die Ersteinrichtung bereits abgeschlossen ist, zeige stattdessen eine Einstellungsansicht:
- Aktuelle Zyklusdaten anzeigen und bearbeiten
- Zyklustyp ändern (mit denselben Tooltips)
- Neuen Zyklus starten: "Menstruation hat begonnen" mit Datumspicker (Standard: heute)
- Letzte Zyklen anzeigen (aus der Zyklushistorie)

Nutze die Funktionen aus speicher.js, zyklus.js und mondphasen.js.
```

---

## Prompt 7: Hauptscreen (Bereich 2 – Tagesempfehlungen)

```
Baue den Hauptscreen / die "Heute"-Seite (src/pages/Heute.jsx).

Wenn die Ersteinrichtung noch nicht abgeschlossen ist, zeige einen Hinweis mit Link zu den Einstellungen: "Richte zuerst deinen Zyklus ein, um tägliche Empfehlungen zu erhalten."

Wenn die Ersteinrichtung abgeschlossen ist, zeige:

1. Header-Bereich:
   - Aktuelle Zyklusphase: Phasenname, Phasensymbol, Phasenfarbe als Hintergrundakzent
   - Zyklustag: "Tag 12 von 28"
   - Aktuelle Mondphase: Mondsymbol + Anzeigetext (z.B. "🌔 Zunehmend – noch 3 Tage bis Vollmond")
   - Button "Phase anpassen ✏️"

2. Beim Klick auf "Phase anpassen":
   - Modal/Overlay mit allen vier Phasen als auswählbare Karten
   - Jede Karte zeigt: Phasenname, Symbol, Kurzbeschreibung
   - Die aktuell berechnete Phase ist markiert
   - Die Nutzerin kann eine andere Phase wählen
   - Bei Auswahl: Phase wird sofort gewechselt, Korrektur wird gespeichert (über speicher.js), alle Empfehlungen aktualisieren sich
   - Schließen-Button

3. Empfehlungskarten (scrollbar, untereinander):

   Karte "Energie des Tages" (mit Phasenfarbe als Akzent):
   - Überschrift "✨ Energie des Tages"
   - Text aus tagesempfehlungen.json → [aktuellePhase].energie
   - Die Variante wird basierend auf dem Zyklustag ausgewählt (Tag modulo Anzahl Varianten)

   Karte "Tagesimpuls" (mit Phasenfarbe als Akzent):
   - Überschrift "🌿 Tagesimpuls"
   - Titel und Text der Übung aus tagesempfehlungen.json → [aktuellePhase].uebung
   - Gleiche Varianten-Logik

   Karte "Affirmation" (zentrierter, größerer Text, Phasenfarbe):
   - Überschrift "💫 Affirmation"
   - Affirmationstext aus tagesempfehlungen.json → [aktuellePhase].affirmation
   - Gleiche Varianten-Logik

   Karte "Kreativ-Tipp" (mit Phasenfarbe als Akzent):
   - Überschrift "🎨 Kreativ-Tipp"
   - Text aus tagesempfehlungen.json → [aktuellePhase].kreativ
   - Gleiche Varianten-Logik

Lade die Inhalte aus den JSON-Dateien in src/data/.
Nutze die Funktionen aus speicher.js, zyklus.js und mondphasen.js.
Berücksichtige manuelle Phasenkorrekturen: Wenn für heute eine Korrektur gespeichert ist, verwende die korrigierte Phase.
```

---

## Prompt 8: Orakelkarten-Seite (Bereich 3)

```
Baue die Orakel-Seite (src/pages/Orakel.jsx).

Zustand 1: Noch keine Karte heute gezogen
- Anzeige eines Kartenstapels (visuell: ein Rechteck mit schönem Rückseitendesign, z.B. Mondmotiv in Bordeaux/Gold)
- Text: "Ziehe deine Tageskarte"
- Beim Klick oder Wisch auf den Stapel wird eine zufällige Karte gezogen:
  - Animation: Karte dreht sich um (CSS-Flip-Animation)
  - Die Karte wird in speicher.js als heute gezogen gespeichert

Zustand 2: Karte wurde heute schon gezogen
- Die gezogene Karte wird direkt angezeigt (kein erneutes Ziehen möglich)
- Text: "Deine Tageskarte für heute"

Kartenanzeige:
- Kartentitel groß und zentriert
- Darunter ein farbiger Bereich (Farbe des zugehörigen Archetyps)
- Archetyp-Zugehörigkeit: z.B. "Karte der Zauberin"
- Kartenbotschaft in Anführungszeichen, etwas größer, kursiv
- Darunter: Bedeutung als normaler Text
- Optional (wenn Ersteinrichtung abgeschlossen): Kontextbezug zur aktuellen Phase:
  "Du bist gerade in der Phase der [Genitiv der aktuellen Phase, z.B. 'der Jungen Frau']. Diese Karte lädt dich ein, [kurzer Bezug]."
  Der Kontextbezug kann einfach sein: Wenn die Karte zum gleichen Archetyp gehört wie die aktuelle Phase → "Diese Karte verstärkt die Energie deiner aktuellen Phase."
  Wenn sie zu einem anderen Archetyp gehört → "Diese Karte bringt die Energie der [Genitiv des Karten-Archetyps] in deine aktuelle [Kompositum]-Phase."

Platzhalter-Bild:
- Da wir noch keine Kartenillustrationen haben, erstelle für jede Karte ein einfaches generiertes Platzhalterbild:
  Ein farbiges Rechteck (Farbe des Archetyps) mit dem Kartentitel in weißer Schrift und einem passenden Emoji.

Lade die Kartendaten aus src/data/orakelkarten.json.
```

---

## Prompt 9: Mond-Chronik (Bereich 4)

```
Baue die Chronik-Seite (src/pages/Chronik.jsx).

Die Seite hat zwei Tabs/Ansichten:

### Tab 1: "Tageseintrag"

Ein Formular für den täglichen Chronik-Eintrag:

- Datum (Standard: heute, änderbar per Datumspicker)
- Angezeigte Phase des Tages (berechnet oder korrigiert)

- Körperliche Empfindungen: Mehrfachauswahl-Chips aus:
  "Energiegeladen", "Müde", "Leicht", "Schwer", "Schmerzfrei", "Krämpfe", "Kopfschmerzen", "Empfindlich", "Entspannt", "Angespannt"

- Stimmung: Emoji-Auswahl (eine Reihe von 6 Emojis zum Antippen):
  😊 Fröhlich, 😌 Gelassen, 😢 Traurig, 😤 Gereizt, 🥰 Liebevoll, 🌀 Aufgewühlt

- Energie-Level: Slider von 1 (sehr niedrig) bis 10 (sehr hoch), mit Zahl-Anzeige

- Träume: Freitext-Eingabe (max 200 Zeichen), Placeholder: "Hattest du einen besonderen Traum?"

- Kreative Impulse: Freitext-Eingabe (max 200 Zeichen), Placeholder: "Was inspiriert dich heute?"

- Sexuelles Empfinden: Auswahl-Chips:
  "Kein Bedürfnis", "Sanft", "Leidenschaftlich", "Sinnlich", "Verbunden"

- Speichern-Button

Wenn für heute schon ein Eintrag existiert, lade ihn vor und zeige "Eintrag aktualisieren" statt "Speichern".

### Tab 2: "Mein Mond-Verlauf"

Chronologische Liste aller bisherigen Zyklen (neuester oben).

Jeder Eintrag zeigt:
- Startdatum der Menstruation
- Mondphase an diesem Tag (Mondsymbol + Text, z.B. "🌑 Neumond")
- Zyklustyp-Zuordnung: "Weißmond" oder "Rotmond" (basierend auf der Mondphase)
- Zykluslänge in Tagen

Wenn noch keine Zyklushistorie vorhanden ist, zeige: "Noch keine Zyklen erfasst. Dein Mond-Verlauf wird sich mit jedem neuen Zyklus füllen."

Nutze die Funktionen aus speicher.js.
```

---

## Prompt 10: Wissensbereich (Bereich 5)

```
Baue die Wissen-Seite (src/pages/Wissen.jsx).

Die Seite zeigt verschiedene Themen als aufklappbare Akkordeon-Elemente (Accordion):

1. "Die vier Archetypen"
   - Unterakkordeons für jede Phase:
     - "Die Junge Frau" (mit Phasenfarbe als Akzent)
     - "Die Mutter"
     - "Die Zauberin"
     - "Die Alte Weise"
   - Jedes Unterakkordeon zeigt: Symbol, Mondphase, Jahreszeit, Element, Ausführliche Beschreibung, Stärken, Herausforderungen, Symboltier mit Beschreibung
   - Lade Daten aus src/data/phasen.json und src/data/wissen.json

2. "Weißmond- und Rotmond-Zyklus"
   - Erklärt beide Zyklustypen (Texte aus wissen.json)
   - Zeige die Texte nacheinander mit einer kleinen Überschrift für jeden Typ

3. "Die Symboltiere"
   - Alle 7 Symboltiere mit Name, zugehöriger Phase und Beschreibung
   - Jedes Tier als eigene kleine Karte mit dem Phasen-Emoji

4. "Mond und Menstruationszyklus"
   - Der Erklärungstext zum Zusammenhang (aus wissen.json)

5. "Die Mond-Chronik"
   - Erklärungstext zur Mond-Chronik (aus wissen.json)

Design:
- Aufklappbare Bereiche mit einem Plus/Minus-Symbol oder Pfeil
- Nur ein Bereich gleichzeitig geöffnet (die anderen klappen zu)
- Sanfte Auf-/Zuklapp-Animation
- Phasenfarben als dezente Akzente bei den Archetypen-Beschreibungen
```

---

## Prompt 11: Muster-Erkennung und Insights

```
Erweitere die App um die Muster-Erkennung.

1. Erstelle src/utils/muster.js mit folgenden Funktionen:

   analysiereChronikMuster(chronikEintraege, zyklusLaenge)
   - Gruppiert die Einträge nach Zyklusphase
   - Berechnet Durchschnittswerte pro Phase für: Energie-Level, häufigste Stimmung, häufigste körperliche Empfindungen
   - Erkennt auffällige Muster, z.B.:
     - "In deiner Zauberin-Phase hast du oft intensive Träume" (wenn > 60% der Zauberin-Tage einen Traumeintrag haben)
     - "Dein Energie-Hoch liegt meist in der Jungen-Frau-Phase" (wenn der Durchschnitt dort am höchsten ist)
     - "In der Alten-Weisen-Phase brauchst du besonders viel Ruhe" (wenn Energie dort am niedrigsten und "Müde" häufig gewählt)
   - Gibt ein Array von Insight-Strings zurück
   - Braucht mindestens 2 volle Zyklen an Daten, sonst leeres Array

   analysiereZyklusTypEntwicklung(zyklusHistorie)
   - Prüft die letzten 3 Einträge in der Zyklushistorie
   - Erkennt Tendenz: wandert die Menstruation Richtung Neumond oder Vollmond?
   - Gibt zurück: { tendenz: "stabil" | "richtungWeissmond" | "richtungRotmond", hinweisAnzeigen: boolean, erklaerung: String }
   - hinweisAnzeigen ist true, wenn die letzten 2-3 Zyklen konsistent in eine andere Richtung zeigen als der aktuelle Zyklustyp

2. Erweitere die Heute-Seite:
   - Wenn analysiereZyklusTypEntwicklung().hinweisAnzeigen === true, zeige einen sanften Hinweis-Banner am oberen Rand:
     - Text: z.B. "Dein Zyklus bewegt sich Richtung Rotmond. Möchtest du deinen Zyklustyp anpassen?"
     - Zwei Buttons: "Ja, anpassen" und "Nein, beibehalten"
     - "Ja" → Zyklustyp in speicher.js ändern, Banner ausblenden
     - "Nein" → Ablehnung speichern, Banner ausblenden
   - Wenn die Nutzerin nicht reagiert und ein neuer Zyklus beginnt → Automatisch den Typ wechseln und einmalig eine Info anzeigen: "Dein Zyklustyp wurde automatisch auf [Typ] aktualisiert, basierend auf deinen letzten Zyklen. Du kannst das jederzeit in den Einstellungen ändern."

3. Erweitere die Chronik-Seite um einen dritten Tab "Insights":
   - Zeigt die erkannten Muster aus analysiereChronikMuster() als schöne Karten
   - Jede Insight-Karte hat ein passendes Emoji und den Text
   - Wenn noch nicht genug Daten vorhanden sind, zeige: "Trage regelmäßig in deine Mond-Chronik ein. Nach 2–3 Zyklen zeigt dir die App hier persönliche Muster und Erkenntnisse."
```

---

## Prompt 12: Anpassung der Phasenaufteilung

```
Erweitere die Phasen-Berechnung um das Dazulernen aus Korrekturen.

In src/utils/zyklus.js, erweitere die Funktion berechneAngepasstePhase():

1. Lade alle gespeicherten Phasenkorrekturen aus speicher.js

2. Gruppiere die Korrekturen nach Zyklustag (über alle vergangenen Zyklen)

3. Wenn für einen bestimmten Zyklustag in mindestens 3 verschiedenen Zyklen die gleiche Korrektur vorliegt, gilt das als stabiles Muster

4. Erstelle daraus eine personalisierte Phasenaufteilung:
   - Beispiel: Wenn die Nutzerin an Tag 7 regelmäßig zu "alteWeise" korrigiert (statt berechnet "jungeFrau"), verschiebe die Phasengrenze so, dass Tag 7 zur Alten Weisen gehört
   - Die Grenzen werden in speicher.js als "angepassteGrenzen" gespeichert

5. Die personalisierte Aufteilung hat Vorrang vor der Standardaufteilung, aber die Nutzerin kann sie jederzeit in den Einstellungen zurücksetzen

6. Erweitere die Einstellungen-Seite:
   - Zeige unter den Zyklusdaten: "Deine persönliche Phasenaufteilung" mit einer kleinen Grafik (z.B. ein farbiger Balken, der die vier Phasen zeigt)
   - Button "Phasenaufteilung zurücksetzen" → setzt auf Standard zurück
```

---

## Prompt 13: Feinschliff und Polish

```
Überarbeite die gesamte App für ein stimmiges, fertiges Erlebnis:

1. Design-Überarbeitung:
   - Prüfe, ob alle Seiten konsistent aussehen
   - Stelle sicher, dass die Phasenfarben überall korrekt verwendet werden:
     - Junge Frau: Olivgrün (#677E3D)
     - Mutter: Warmes Gold / Orange (#FFA500)
     - Zauberin: Lebhaftes Rosa / Bordeaux (#C94963)
     - Alte Weise: Tiefes Blau / Indigo (#26496F)
   - Füge sanfte Übergänge/Animationen hinzu beim Seitenwechsel
   - Stelle sicher, dass der Hauptscreen visuell ansprechend ist und die Phasenfarbe als Akzent verwendet

2. Leerer-Zustand-Handling:
   - Prüfe alle Seiten: Was passiert, wenn noch keine Daten vorhanden sind?
   - Überall freundliche Hinweise anzeigen, nicht leere Seiten

3. Fehlerbehandlung:
   - Was passiert, wenn localStorage voll ist?
   - Was passiert, wenn die Nutzerin ungültige Daten eingibt?
   - Alle Eingabefelder validieren

4. Responsive Design:
   - Die App soll auf Mobilgeräten (320px-480px) gut aussehen
   - Auf größeren Bildschirmen zentriert mit max-width angezeigt werden
   - Alle Touch-Targets mindestens 44x44px

5. Performance:
   - Stelle sicher, dass die App schnell lädt
   - Keine unnötigen Re-Renders

6. Favicon und Titel:
   - Setze den Browser-Tab-Titel auf "Roter Mond"
   - Erstelle ein einfaches Favicon (rotes Mondsymbol, kann ein SVG sein)

Mache einen Git-Commit nach diesem Schritt.
```

---

## Prompt 14 (Optional): PWA-Einrichtung

```
Mache die App zu einer Progressive Web App (PWA), damit sie auf dem Handy wie eine native App installiert werden kann:

1. Erstelle ein Web App Manifest (manifest.json):
   - name: "Roter Mond"
   - short_name: "Roter Mond"
   - description: "Deine Zyklus-Begleiterin"
   - theme_color: Bordeaux-Rot
   - background_color: Warmes Weiß
   - display: "standalone"
   - Icons in verschiedenen Größen (generiere einfache SVG-basierte Icons mit Mondsymbol)

2. Erstelle einen Service Worker für Offline-Funktionalität:
   - Cache die App-Shell (HTML, CSS, JS)
   - Cache die JSON-Daten
   - Die App soll komplett offline funktionieren (sie braucht kein Internet)

3. Registriere den Service Worker in main.jsx

4. Teste, dass die App als PWA installierbar ist
```

---

## Prompt 11: Deutsche Grammatik – Phasennamen korrekt deklinieren

```
Die vier Archetyp-Phasen haben im Deutschen unterschiedliche Deklinationsformen.
In src/utils/zyklus.js existiert ein PHASEN_KASUS-Mapping mit folgenden Formen:

- jungeFrau:  Nominativ "die Junge Frau", Genitiv "der Jungen Frau", Kompositum "Jungen-Frau"
- mutter:     Nominativ "die Mutter", Genitiv "der Mutter", Kompositum "Mutter"
- zauberin:   Nominativ "die Zauberin", Genitiv "der Zauberin", Kompositum "Zauberinnen"
- alteWeise:  Nominativ "die Alte Weise", Genitiv "der Alten Weisen", Kompositum "Alten-Weisen"

Regeln:
1. Nach "der Phase der..." → Genitiv verwenden (z.B. "der Phase der Jungen Frau")
2. Als Kompositum vor "-Phase" → Kompositum verwenden (z.B. "Jungen-Frau-Phase", "Zauberinnen-Phase")
3. NIEMALS "Jungfrau" verwenden – immer "Junge Frau"
4. NIEMALS "Weise" ohne "Alte" – immer "Alte Weise"
5. Importiere PHASEN_KASUS aus zyklus.js für alle Template-Strings, die Phasennamen in Sätzen verwenden
```

---

## Tipps für die Arbeit mit Claude Code

- **Ein Schritt nach dem anderen:** Gib immer nur einen Prompt, teste, dann weiter.
- **Fehler beschreiben:** Wenn etwas nicht funktioniert, kopiere die Fehlermeldung und sage Claude Code: "Ich bekomme folgenden Fehler: [Fehlermeldung]. Bitte behebe das."
- **Im Browser testen:** Nach jedem Schritt `npm run dev` ausführen und im Browser prüfen.
- **Git nutzen:** Nach jedem erfolgreichen Schritt committen. So kannst du zurückspringen.
- **Nicht alles auf einmal:** Wenn ein Prompt zu groß ist, bitte Claude Code, nur einen Teil zu machen.
- **Nachfragen erlaubt:** Wenn du etwas nicht verstehst, frag Claude Code: "Erkläre mir bitte, was du gerade gemacht hast."
