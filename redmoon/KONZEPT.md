# App-Konzept: „Roter Mond" – Zyklus-Begleiterin

## Projektübersicht

Eine Web-App (React mit Vite), die Frauen dabei unterstützt, ihren Menstruationszyklus bewusst zu erleben. Basierend auf dem Buch „Roter Mond" und dem Kartenset „Roter Mond – Das Orakel" von Miranda Gray.

Die App besteht aus fünf Bereichen:
1. Zyklus-Einrichtung und Phasen-Berechnung
2. Tägliche Empfehlungen (Hauptscreen)
3. Tägliche Orakelkarte
4. Mond-Chronik (Digitales Zyklustagebuch)
5. Wissensbereich

Sprache der App: Deutsch.

---

## Grundlage: Das Vier-Phasen-Modell

Der weibliche Menstruationszyklus wird in vier Archetypen-Phasen unterteilt:

### Phase 1: Junge Frau (Maiden)
- Zyklusphase: Präovulatorisch (nach der Menstruation)
- Mondphase: Zunehmender Mond
- Jahreszeit: Frühling
- Kernenergie: Aufbruch, Dynamik, Selbstvertrauen, Unabhängigkeit
- Beschreibung: Die Frau fühlt sich nach außen gerichtet, energiegeladen und klar im Denken.

### Phase 2: Mutter (Mother)
- Zyklusphase: Ovulation / Eisprung
- Mondphase: Vollmond
- Jahreszeit: Sommer
- Kernenergie: Fürsorge, Ausstrahlung, Empathie, Nähren
- Beschreibung: Die Frau strahlt, ist kommunikativ und empfindet starke Verbundenheit mit anderen.

### Phase 3: Zauberin (Enchantress)
- Zyklusphase: Prämenstruell / Lutealphase
- Mondphase: Abnehmender Mond
- Jahreszeit: Herbst
- Kernenergie: Kreative Kraft, Intuition, Wandlung, wilde innere Energie
- Beschreibung: Die Frau wird introspektiver, Kreativität und Intuition sind besonders stark, aber auch herausfordernde Emotionen können auftreten.

### Phase 4: Alte Weise / Alte Frau (Crone)
- Zyklusphase: Menstruation
- Mondphase: Neumond / Dunkelmond
- Jahreszeit: Winter
- Kernenergie: Innenschau, Loslassen, Erneuerung, tiefe Spiritualität
- Beschreibung: Die kraftvollste Zeit für Rückzug, Reinigung und visionäre Einsichten.

### Zyklustypen

**Weißmond-Zyklus:** Menstruation bei Neumond, Eisprung bei Vollmond. Wird mit Fruchtbarkeit, Nähren und nach außen gerichteter Energie verbunden. Gilt als der häufigere Typ.

**Rotmond-Zyklus:** Menstruation bei Vollmond, Eisprung bei Neumond. Wird mit Heilung, Intuition und nach innen gerichteter Kreativität verbunden. Wird als Zyklus der Heilerinnen und Schamaninnen beschrieben.

Frauen können im Laufe ihres Lebens zwischen den Typen wechseln.

---

## Bereich 1: Zyklus-Einrichtung und Phasen-Berechnung

### Ersteinrichtung (Onboarding)

Die Nutzerin gibt zwei Daten ein:
- Erster Tag der letzten Menstruation (Datumspicker)
- Durchschnittliche Zykluslänge (Zahleneingabe, Standard: 28 Tage)

### Zyklustyp-Bestimmung

Aus dem eingegebenen Menstruationsbeginn berechnet die App die Mondphase an diesem Tag und zeigt sie an, z.B.: „Am 2. Februar war abnehmender Mond, 2 Tage nach Vollmond."

Automatischer Vorschlag:
- Menstruation innerhalb von 3 Tagen um Neumond → Vorschlag: Weißmond-Zyklus
- Menstruation innerhalb von 3 Tagen um Vollmond → Vorschlag: Rotmond-Zyklus
- Menstruation dazwischen → Anzeige: „Dein Zyklus liegt gerade zwischen den beiden Typen. Wähle den Typ, der sich für dich stimmiger anfühlt."

Die Nutzerin sieht den Vorschlag mit zwei Auswahlfeldern (Weißmond / Rotmond), wobei der Vorschlag vorausgewählt ist. Sie kann ihn jederzeit überschreiben.

### Tooltips für Zyklustypen

Neben beiden Begriffen „Weißmond-Zyklus" und „Rotmond-Zyklus" befindet sich ein Info-Symbol (ⓘ). Auf Tippen/Klick erscheint ein Tooltip:

- Weißmond-Tooltip: „Deine Menstruation fällt in die Neumondphase und dein Eisprung in die Vollmondphase. Dieser Typ wird traditionell mit Fruchtbarkeit, Nähren und nach außen gerichteter Energie in Verbindung gebracht."
- Rotmond-Tooltip: „Deine Menstruation fällt in die Vollmondphase und dein Eisprung in die Neumondphase. Dieser Typ wird traditionell mit Heilung, Intuition und nach innen gerichteter Kreativität verbunden."

Umsetzung: Nur Tooltip (kein Hover), funktioniert per Klick/Tipp, ein zweiter Klick schließt den Tooltip wieder.

### Phasenberechnung

Standard-Phasenaufteilung bei 28-Tage-Zyklus:
- Tag 1–6: Alte Weise (Menstruation)
- Tag 7–13: Junge Frau (präovulatorisch)
- Tag 14–20: Mutter (Ovulation)
- Tag 21–28: Zauberin (prämenstruell)

Bei anderen Zykluslängen werden die Phasen proportional angepasst (jede Phase ca. 1/4 der Zykluslänge, Alte Weise etwas kürzer, Zauberin etwas länger).

### Mondphasen-Anzeige

Auf dem Hauptscreen wird neben der aktuellen Zyklusphase die aktuelle Mondphase angezeigt.

Fünf Zustände:
- Neumond
- Zunehmend
- Vollmond
- Abnehmend
- Jeweils mit Tagesangabe, z.B. „noch 5 Tage bis Vollmond"

Dazu ein passendes Mondsymbol, das sich im Laufe des Monats visuell verändert.

Technische Umsetzung: Offline-Berechnung auf Basis des 29,53-Tage-Mondzyklus. Referenzpunkt: 6. Januar 2000 war Neumond. Alternativ JavaScript-Bibliothek „lune" oder „SunCalc".

### Manuelle Phasenkorrektur

Auf dem Hauptscreen gibt es einen Button „Phase anpassen" oder „Stimmt nicht ganz?". Auf Tippen öffnet sich eine Auswahl aller vier Phasen mit kurzer Beschreibung. Die Nutzerin wählt die Phase, die besser zu ihrem aktuellen Empfinden passt. Die App passt sofort alle Empfehlungen an.

Korrekturen werden pro Zyklustag gespeichert (berechnete Phase + korrigierte Phase). Nach 3–4 Zyklen erkennt die App persönliche Muster und passt die Standardaufteilung automatisch an die individuelle Nutzerin an.

### Zyklusaktualisierung

Nach jedem Zyklus kann die Nutzerin den tatsächlichen Beginn der nächsten Menstruation eintragen. Die Berechnung wird fortlaufend genauer.

---

## Bereich 2: Tägliche Empfehlungen (Hauptscreen)

Der Hauptscreen zeigt beim Öffnen:
- Aktuelle Zyklusphase mit Archetyp-Name und -Symbol
- Aktuelle Mondphase mit Mondsymbol und Tagesangabe
- Button „Phase anpassen"

Darunter vier Empfehlungskategorien:

### Energie des Tages
Kurze Beschreibung der heutigen Energie und wie die Nutzerin sie nutzen kann. Phasenspezifisch, variiert innerhalb einer Phase von Tag zu Tag.

### Tagesimpuls / Übung
Eine konkrete Übung oder Meditation passend zur Phase. Kann sein: Körperübung, kreative Anregung, Journaling-Frage, geführte Meditation.

### Affirmation
Phasenspezifische Affirmation, angelehnt an die Archetyp-Affirmationen.

### Kreativ-Tipp
Anregung für kreativen Ausdruck passend zur Energie der Phase.

Die Inhalte kommen aus der Datei INHALTE.md bzw. den daraus generierten JSON-Dateien.

---

## Bereich 3: Tägliche Orakelkarte

### Kartenzug
Die Nutzerin kann einmal pro Tag eine Karte ziehen (per Tippen oder Wisch-Geste). Die Karte wird zufällig aus dem Deck von 41 Karten ausgewählt, unabhängig von der aktuellen Zyklusphase.

### Kartenanzeige
Die gezogene Karte zeigt:
- Illustration (Platzhalterbild in der ersten Version)
- Kartentitel
- Kartenbotschaft / Affirmation
- Optional: Kontextbezug zur aktuellen Phase, z.B. „Du hast die Karte X gezogen. In deiner aktuellen Zauberin-Phase könnte das bedeuten…"

### Späteres Feature
Zyklus-Spread (Legemuster mit mehreren Karten) für fortgeschrittene Nutzerinnen.

---

## Bereich 4: Mond-Chronik (Digitales Zyklustagebuch)

### Tägliche Einträge
Die Nutzerin kann täglich kurze Einträge machen zu:
- Körperliche Empfindungen (Slider oder Mehrfachauswahl)
- Stimmung und Emotionen (Emoji-Auswahl)
- Energie-Level (Slider 1–10)
- Träume (Freitext, kurz)
- Kreative Impulse (Freitext, kurz)
- Sexuelles Empfinden (Slider oder Auswahl)

Die Eingabe soll schnell und unkompliziert sein (max. 1–2 Minuten).

### Muster-Erkennung
Nach einigen Zyklen zeigt die App persönliche Insights, z.B.:
- „In deiner Zauberin-Phase hast du regelmäßig intensive Träume"
- „Dein Energie-Hoch liegt meist um Tag 10"

### Mond-Verlauf (Mondphasen-Historie)

Eigene Ansicht „Mein Mond-Verlauf" innerhalb der Mond-Chronik. Chronologische Liste aller bisherigen Zyklen mit:
- Startdatum der Menstruation
- Mondphase an diesem Tag (mit Mondsymbol)
- Daraus abgeleiteter Zyklustyp
- Zykluslänge

Diese Ansicht ist jederzeit einsehbar und nachschlagbar.

### Automatische Zyklustyp-Anpassung

Bei jedem neuen Zyklus prüft die App die Mondphase am Tag 1 der Menstruation und speichert sie in der Historie.

Bei deutlicher Verschiebung über 2–3 Zyklen: Sanfter Hinweis auf dem Hauptscreen, z.B. „Dein Zyklus bewegt sich Richtung Rotmond. Möchtest du deinen Zyklustyp anpassen?"

Drei Szenarien:
1. Nutzerin bestätigt aktiv → Typ wird sofort gewechselt.
2. Nutzerin lehnt aktiv ab → Typ bleibt, App merkt sich die Entscheidung. Hinweis erscheint erst wieder nach 2–3 weiteren Zyklen mit erneuter Verschiebung.
3. Nutzerin reagiert nicht → App wartet bis zum Beginn des nächsten Zyklus, wechselt dann automatisch und zeigt einmalig: „Dein Zyklustyp wurde automatisch auf [Typ] aktualisiert, basierend auf deinen letzten Zyklen. Du kannst das jederzeit in den Einstellungen ändern."

---

## Bereich 5: Wissensbereich

Nachschlagebereich mit:
- Beschreibungen der vier Archetypen (Eigenschaften, Symboltiere, Energien)
- Erklärung Weißmond- und Rotmond-Zyklus
- Übersicht der Symboltiere und ihre Bedeutung (Schmetterling, Einhorn, Taube, Pferd, Kranich, Eule, Hase)
- Anleitungen für Meditationen und Rituale
- Informationen zum Zusammenhang Menstruations- und Mondzyklus

Dieser Bereich dient als Referenz und zum Vertiefen.

---

## Technische Vorgaben

### Stack
- React mit Vite als Build-Tool
- Lokaler Speicher (localStorage) für Nutzerdaten
- Keine Backend-Anbindung in der ersten Version
- Inhalte als JSON-Dateien (aus INHALTE.md generiert)

### Mondphasen-Berechnung
- Offline, kein API-Call nötig
- Mondzyklus: 29,53 Tage
- Referenz-Neumond: 6. Januar 2000
- Oder JavaScript-Bibliothek „lune" / „SunCalc"
- Fünf Zustände: Neumond, zunehmend, Vollmond, abnehmend + Tagesangabe

### Datenspeicherung (localStorage)
- Zyklusdaten: Startdatum, Zykluslänge, Zyklustyp
- Phasenkorrekturen: Array mit {zyklustag, berechnete_phase, korrigierte_phase, datum}
- Mond-Chronik-Einträge: Array mit {datum, koerper, stimmung, energie, traeume, kreativitaet, sexuelles_empfinden}
- Zyklushistorie: Array mit {startdatum, mondphase, zyklustyp, zykluslaenge}
- Gezogene Tageskarten: {datum, karten_id}

### Reihenfolge der Umsetzung
1. Projektgerüst: React-App mit Navigation zwischen 5 Bereichen
2. Bereich 1: Zykluseinrichtung, Phasenberechnung, Mondphasenberechnung, Zyklustyp-Vorschlag mit Tooltips
3. Bereich 2: Hauptscreen mit Phasenanzeige, Mondanzeige, Tagesempfehlungen
4. Bereich 3: Orakelkarten-Ziehung
5. Bereich 4: Mond-Chronik mit täglichen Einträgen
6. Bereich 5: Wissensbereich
7. Übergreifend: Dazulernen über Zyklen, automatische Zyklustyp-Anpassung, Muster-Erkennung

---

## Urheberrecht

Die Texte, Illustrationen und Kartenmotive aus Buch und Kartenset sind urheberrechtlich geschützt. Für die erste Prototyp-Version werden eigene, von den Konzepten inspirierte Texte und Platzhalter-Illustrationen verwendet. Vor einer Veröffentlichung muss eine Lizenzvereinbarung mit Miranda Gray / Stadelmann Verlag geklärt werden.
