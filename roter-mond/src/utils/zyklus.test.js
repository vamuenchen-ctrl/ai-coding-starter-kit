import { describe, it, expect } from 'vitest'
import {
  berechneZyklusPhase,
  berechneZyklusTyp,
  berechneAngepasstePhase,
  berechnePhasenGrenzen,
  PHASEN_INFO,
} from './zyklus'

// Hilfsfunktion: Datum-Shortcut
function datum(jahr, monat, tag) {
  return new Date(Date.UTC(jahr, monat - 1, tag))
}

// =========================================================================
// PHASEN_INFO
// =========================================================================

describe('PHASEN_INFO', () => {
  it('enthält alle vier Phasen', () => {
    expect(PHASEN_INFO).toHaveProperty('alteWeise')
    expect(PHASEN_INFO).toHaveProperty('jungeFrau')
    expect(PHASEN_INFO).toHaveProperty('mutter')
    expect(PHASEN_INFO).toHaveProperty('zauberin')
  })

  it('jede Phase hat alle Pflichtfelder', () => {
    const pflichtfelder = [
      'kurzname', 'schluessel', 'symbol', 'farbe', 'jahreszeit',
      'element', 'mondphase', 'zyklusphase', 'kernenergie',
      'symboltier', 'kurzbeschreibung',
    ]
    for (const phase of Object.values(PHASEN_INFO)) {
      for (const feld of pflichtfelder) {
        expect(phase).toHaveProperty(feld)
        expect(phase[feld]).toBeTruthy()
      }
    }
  })

  it('hat korrekte Jahreszeiten-Zuordnung', () => {
    expect(PHASEN_INFO.alteWeise.jahreszeit).toBe('Winter')
    expect(PHASEN_INFO.jungeFrau.jahreszeit).toBe('Frühling')
    expect(PHASEN_INFO.mutter.jahreszeit).toBe('Sommer')
    expect(PHASEN_INFO.zauberin.jahreszeit).toBe('Herbst')
  })

  it('hat korrekte Elemente-Zuordnung', () => {
    expect(PHASEN_INFO.alteWeise.element).toBe('Wasser')
    expect(PHASEN_INFO.jungeFrau.element).toBe('Luft')
    expect(PHASEN_INFO.mutter.element).toBe('Erde')
    expect(PHASEN_INFO.zauberin.element).toBe('Feuer')
  })

  it('hat korrekte Symboltiere', () => {
    expect(PHASEN_INFO.alteWeise.symboltier).toBe('Hase')
    expect(PHASEN_INFO.jungeFrau.symboltier).toBe('Schmetterling')
    expect(PHASEN_INFO.mutter.symboltier).toBe('Taube')
    expect(PHASEN_INFO.zauberin.symboltier).toBe('Eule')
  })
})

// =========================================================================
// berechnePhasenGrenzen
// =========================================================================

describe('berechnePhasenGrenzen', () => {
  it('gibt 4 Phasen zurück, die den gesamten Zyklus abdecken', () => {
    const grenzen = berechnePhasenGrenzen(28)
    expect(grenzen).toHaveLength(4)
    expect(grenzen[0].start).toBe(1)
    expect(grenzen[3].ende).toBe(28)
  })

  it('erzeugt lückenlose Phasen', () => {
    const grenzen = berechnePhasenGrenzen(28)
    for (let i = 1; i < grenzen.length; i++) {
      expect(grenzen[i].start).toBe(grenzen[i - 1].ende + 1)
    }
  })

  it('beginnt mit Alte Weise und endet mit Zauberin', () => {
    const grenzen = berechnePhasenGrenzen(28)
    expect(grenzen[0].phase).toBe('alteWeise')
    expect(grenzen[1].phase).toBe('jungeFrau')
    expect(grenzen[2].phase).toBe('mutter')
    expect(grenzen[3].phase).toBe('zauberin')
  })

  it('Alte Weise ist etwas kürzer, Zauberin etwas länger bei 28 Tagen', () => {
    const grenzen = berechnePhasenGrenzen(28)
    const alteWeise = grenzen.find((g) => g.phase === 'alteWeise')
    const zauberin = grenzen.find((g) => g.phase === 'zauberin')
    expect(alteWeise.laenge).toBeLessThanOrEqual(zauberin.laenge)
  })

  it('funktioniert mit kürzeren Zyklen (25 Tage)', () => {
    const grenzen = berechnePhasenGrenzen(25)
    expect(grenzen[0].start).toBe(1)
    expect(grenzen[3].ende).toBe(25)
    const gesamt = grenzen.reduce((s, g) => s + g.laenge, 0)
    expect(gesamt).toBe(25)
  })

  it('funktioniert mit längeren Zyklen (35 Tage)', () => {
    const grenzen = berechnePhasenGrenzen(35)
    expect(grenzen[0].start).toBe(1)
    expect(grenzen[3].ende).toBe(35)
    const gesamt = grenzen.reduce((s, g) => s + g.laenge, 0)
    expect(gesamt).toBe(35)
  })
})

// =========================================================================
// berechneZyklusPhase
// =========================================================================

describe('berechneZyklusPhase', () => {
  const zyklusStart = datum(2025, 2, 1) // 1. Februar 2025
  const laenge = 28

  describe('Phasenbestimmung bei 28-Tage-Zyklus', () => {
    it('Tag 1 ist Alte Weise', () => {
      const ergebnis = berechneZyklusPhase(zyklusStart, laenge, datum(2025, 2, 1))
      expect(ergebnis.zyklusTag).toBe(1)
      expect(ergebnis.phase).toBe('alteWeise')
      expect(ergebnis.phaseName).toBe('Alte Weise')
    })

    it('Tag 7 ist Junge Frau', () => {
      const ergebnis = berechneZyklusPhase(zyklusStart, laenge, datum(2025, 2, 7))
      expect(ergebnis.zyklusTag).toBe(7)
      expect(ergebnis.phase).toBe('jungeFrau')
      expect(ergebnis.phaseName).toBe('Junge Frau')
    })

    it('Tag 14 ist Mutter', () => {
      const ergebnis = berechneZyklusPhase(zyklusStart, laenge, datum(2025, 2, 14))
      expect(ergebnis.zyklusTag).toBe(14)
      expect(ergebnis.phase).toBe('mutter')
      expect(ergebnis.phaseName).toBe('Mutter')
    })

    it('Tag 21 ist Zauberin', () => {
      const ergebnis = berechneZyklusPhase(zyklusStart, laenge, datum(2025, 2, 21))
      expect(ergebnis.zyklusTag).toBe(21)
      expect(ergebnis.phase).toBe('zauberin')
      expect(ergebnis.phaseName).toBe('Zauberin')
    })

    it('Tag 28 ist Zauberin (letzter Tag)', () => {
      const ergebnis = berechneZyklusPhase(zyklusStart, laenge, datum(2025, 2, 28))
      expect(ergebnis.zyklusTag).toBe(28)
      expect(ergebnis.phase).toBe('zauberin')
    })
  })

  describe('Rückgabefelder', () => {
    it('enthält alle erwarteten Felder', () => {
      const ergebnis = berechneZyklusPhase(zyklusStart, laenge, datum(2025, 2, 5))
      expect(ergebnis).toHaveProperty('zyklusTag')
      expect(ergebnis).toHaveProperty('phase')
      expect(ergebnis).toHaveProperty('phaseName')
      expect(ergebnis).toHaveProperty('phaseTag')
      expect(ergebnis).toHaveProperty('phaseLaenge')
      expect(ergebnis).toHaveProperty('naechstePhase')
      expect(ergebnis).toHaveProperty('tageBisNaechstePhase')
    })

    it('berechnet phaseTag korrekt (Tag innerhalb der Phase)', () => {
      // Tag 1 = Alte Weise Tag 1
      const tag1 = berechneZyklusPhase(zyklusStart, laenge, datum(2025, 2, 1))
      expect(tag1.phaseTag).toBe(1)

      // Tag 3 = Alte Weise Tag 3
      const tag3 = berechneZyklusPhase(zyklusStart, laenge, datum(2025, 2, 3))
      expect(tag3.phaseTag).toBe(3)
    })

    it('berechnet naechstePhase korrekt', () => {
      const alteWeise = berechneZyklusPhase(zyklusStart, laenge, datum(2025, 2, 1))
      expect(alteWeise.naechstePhase).toBe('Junge Frau')

      const zauberin = berechneZyklusPhase(zyklusStart, laenge, datum(2025, 2, 28))
      expect(zauberin.naechstePhase).toBe('Alte Weise')
    })

    it('berechnet tageBisNaechstePhase korrekt', () => {
      // Am letzten Tag der Phase sollte tageBisNaechstePhase = 1 sein
      const grenzen = berechnePhasenGrenzen(laenge)
      const letzterTagAlteWeise = grenzen[0].ende
      const ergebnis = berechneZyklusPhase(
        zyklusStart, laenge,
        datum(2025, 2, letzterTagAlteWeise),
      )
      expect(ergebnis.tageBisNaechstePhase).toBe(1)
    })
  })

  describe('Zyklusüberlauf', () => {
    it('wrappet nach Zyklusende zurück zu Tag 1', () => {
      // Tag 29 bei 28-Tage-Zyklus = Tag 1 des neuen Zyklus
      const ergebnis = berechneZyklusPhase(zyklusStart, laenge, datum(2025, 3, 1))
      expect(ergebnis.zyklusTag).toBe(1)
      expect(ergebnis.phase).toBe('alteWeise')
    })
  })
})

// =========================================================================
// berechneZyklusTyp
// =========================================================================

describe('berechneZyklusTyp', () => {
  it('erkennt Weißmond-Zyklus (Menstruation bei Neumond)', () => {
    // 29. Januar 2025 war Neumond
    const ergebnis = berechneZyklusTyp(datum(2025, 1, 29))
    expect(ergebnis.vorschlag).toBe('weissmond')
  })

  it('erkennt Rotmond-Zyklus (Menstruation bei Vollmond)', () => {
    // 12. Februar 2025 war Vollmond
    const ergebnis = berechneZyklusTyp(datum(2025, 2, 12))
    expect(ergebnis.vorschlag).toBe('rotmond')
  })

  it('gibt "unklar" zurück bei dazwischenliegenden Daten', () => {
    // 6. Februar 2025 – zunehmender Mond, ca. Tag 8
    const ergebnis = berechneZyklusTyp(datum(2025, 2, 6))
    expect(ergebnis.vorschlag).toBe('unklar')
  })

  it('enthält mondphaseAnTag1 mit Mondphasen-Details', () => {
    const ergebnis = berechneZyklusTyp(datum(2025, 1, 29))
    expect(ergebnis.mondphaseAnTag1).toHaveProperty('phase')
    expect(ergebnis.mondphaseAnTag1).toHaveProperty('tageImZyklus')
    expect(ergebnis.mondphaseAnTag1).toHaveProperty('symbol')
  })

  it('erzeugt einen verständlichen Erklärungstext', () => {
    const ergebnis = berechneZyklusTyp(datum(2025, 1, 29))
    expect(ergebnis.erklaerung).toMatch(/Am 29\. Januar/)
    expect(ergebnis.erklaerung).toMatch(/Neumond|Mond/)
  })

  it('Erklärungstext enthält Tag und Monat', () => {
    const ergebnis = berechneZyklusTyp(datum(2025, 6, 15))
    expect(ergebnis.erklaerung).toMatch(/Am 15\./)
    expect(ergebnis.erklaerung).toContain('Juni')
  })
})

// =========================================================================
// berechneAngepasstePhase
// =========================================================================

describe('berechneAngepasstePhase', () => {
  const zyklusStart = datum(2025, 2, 1)
  const laenge = 28

  it('verhält sich wie berechneZyklusPhase ohne Korrekturen', () => {
    const standard = berechneZyklusPhase(zyklusStart, laenge, datum(2025, 2, 10))
    const angepasst = berechneAngepasstePhase(zyklusStart, laenge, datum(2025, 2, 10), [])

    expect(angepasst.zyklusTag).toBe(standard.zyklusTag)
    expect(angepasst.phase).toBe(standard.phase)
    expect(angepasst.quelle).toBe('berechnung')
  })

  it('verwendet direkte Korrektur für den aktuellen Tag', () => {
    const korrekturen = [{ zyklusTag: 10, korrigiertePhase: 'alteWeise' }]
    const ergebnis = berechneAngepasstePhase(
      zyklusStart, laenge, datum(2025, 2, 10), korrekturen,
    )

    expect(ergebnis.phase).toBe('alteWeise')
    expect(ergebnis.phaseName).toBe('Alte Weise')
    expect(ergebnis.quelle).toBe('korrektur')
  })

  it('ignoriert Korrekturen für andere Tage', () => {
    const korrekturen = [{ zyklusTag: 15, korrigiertePhase: 'alteWeise' }]
    const ergebnis = berechneAngepasstePhase(
      zyklusStart, laenge, datum(2025, 2, 10), korrekturen,
    )

    expect(ergebnis.quelle).toBe('berechnung')
  })

  it('erkennt Muster nach 3+ gleichen Korrekturen', () => {
    // Nutzerin korrigiert immer an Tag 7 zu alteWeise (3x = Muster)
    const grenzen = berechnePhasenGrenzen(laenge)
    const alteWeiseEnde = grenzen[0].ende

    // Tag 7 liegt normalerweise in der Phase jungeFrau (alteWeise endet bei Tag 6)
    // Wir korrigieren Tag 7 drei Mal zu alteWeise
    const korrekturTag = alteWeiseEnde + 1
    const korrekturen = [
      { zyklusTag: korrekturTag, korrigiertePhase: 'alteWeise' },
      { zyklusTag: korrekturTag, korrigiertePhase: 'alteWeise' },
      { zyklusTag: korrekturTag, korrigiertePhase: 'alteWeise' },
    ]

    const ergebnis = berechneAngepasstePhase(
      zyklusStart, laenge,
      new Date(zyklusStart.getTime() + (korrekturTag - 1) * 86400000),
      korrekturen,
    )

    expect(ergebnis.phase).toBe('alteWeise')
    expect(ergebnis.quelle).toBe('muster')
  })

  it('wendet kein Muster an bei weniger als 3 Korrekturen', () => {
    const grenzen = berechnePhasenGrenzen(laenge)
    const korrekturTag = grenzen[0].ende + 1

    const korrekturen = [
      { zyklusTag: korrekturTag, korrigiertePhase: 'alteWeise' },
      { zyklusTag: korrekturTag, korrigiertePhase: 'alteWeise' },
    ]

    const ergebnis = berechneAngepasstePhase(
      zyklusStart, laenge,
      new Date(zyklusStart.getTime() + (korrekturTag - 1) * 86400000),
      korrekturen,
    )

    expect(ergebnis.quelle).toBe('berechnung')
    expect(ergebnis.phase).toBe('jungeFrau')
  })
})
