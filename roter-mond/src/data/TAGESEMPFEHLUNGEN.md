# Tagesempfehlungen - Inhaltsstruktur

## Aufbau

`tagesempfehlungen.json` enthält tägliche Empfehlungstexte für die Heute-Seite, basierend auf Miranda Grays "Roter Mond".

### Phasen (4)

| Phase | Archetyp | Jahreszeit | Mondphase |
|-------|----------|------------|-----------|
| `jungeFrau` | Die Junge Frau | Frühling | Zunehmender Mond |
| `mutter` | Die Mutter | Sommer | Vollmond |
| `zauberin` | Die Zauberin | Herbst | Abnehmender Mond |
| `alteWeise` | Die Alte Weise | Winter | Neumond / Dunkelmond |

### Kategorien (5 pro Phase)

| Kategorie | Kartentyp | Format |
|-----------|-----------|--------|
| `energie` | Energie des Tages | String |
| `uebung` | Tagesimpuls | String |
| `affirmation` | Affirmation | String |
| `kreativ` | Kreativ-Tipp | String |
| `symboltier` | Tier flüstert | `{ tier, emoji, text }` |

### Varianten

14 Varianten pro Kategorie pro Phase = **280 Texte** (energie, uebung, affirmation, kreativ).

## Symboltiere

### Verteilung pro Phase

| Phase | Primärtier | Sekundärtier | Primär | Sekundär | Gesamt |
|-------|------------|--------------|--------|----------|--------|
| jungeFrau | Schmetterling 🦋 | Einhorn 🦄 | 8 | 9 | 17 |
| mutter | Taube 🕊️ | Pferd 🐴 | 8 | 9 | 17 |
| zauberin | Eule 🦉 | Kranich 🦩 | 11 | 6 | 17 |
| alteWeise | Hase 🐇 | – | 14 | 0 | 14 |

### Übergangstiere (Konzept, noch nicht implementiert)

An Phasen-Grenztagen soll statt des Primärtiers ein Übergangstier angezeigt werden:

| Übergang | Tier | Wo sichtbar |
|----------|------|-------------|
| Alte Weise → Junge Frau | Einhorn 🦄 | Erster Tag Junge Frau |
| Junge Frau → Mutter | Einhorn 🦄 | Letzter Tag Junge Frau |
| Mutter → Zauberin | Pferd 🐴 | Letzter Tag Mutter + Erster Tag Zauberin |
| Zauberin → Alte Weise | Eule 🦉 | Letzter Tag Zauberin + Erster Tag Alte Weise |

Die Logik erkennt Grenztage via `phaseInfo.phaseTag === 1` (erster Tag) bzw. `phaseInfo.phaseTag === phaseInfo.phaseLaenge` (letzter Tag) und zeigt dann das Übergangstier in Header und Symboltier-Karte. Texte werden nach Tiername gefiltert (`UEBERGANGSTIERE` in `symboltiere.js`).

## Zufällige Rotation (implementiert)

Deterministischer Shuffle (Fisher-Yates mit Mulberry32-PRNG) pro Phase pro Zyklusstart:

- **Seed**: `${zyklusStart}-${phasenName}` (z.B. `2026-02-01-jungeFrau`)
- Jede Phase bekommt eine eigene, reproduzierbare Reihenfolge
- Neuer Zyklus = neuer Seed = neue Reihenfolge
- Keine Wiederholungen innerhalb von 14 Tagen
- Über mehrere Zyklen hinweg hohe Abwechslung

Implementierung: `mischeIndizes()` in `Heute.jsx`
