import { describe, it, expect } from 'vitest'
import { korrigiereZyklusStartDatum, datumAlsString, stringAlsDatum } from './zyklusKorrektur'

// Hilfsfunktion: Datum-Shortcut (lokale Zeit, konsistent mit der App)
function datum(jahr, monat, tag) {
  return new Date(jahr, monat - 1, tag)
}

// Hilfsfunktion: Einfache Historie erstellen
function erstelleHistorie(eintraege) {
  return eintraege.map(([j, m, t, extras]) => ({
    startdatum: datum(j, m, t),
    mondphase: 'neumond',
    zyklusTyp: 'rotmond',
    zyklusLaenge: 28,
    ...extras,
  }))
}

// =========================================================================
// datumAlsString / stringAlsDatum
// =========================================================================

describe('datumAlsString', () => {
  it('formatiert ein Datum als YYYY-MM-DD', () => {
    expect(datumAlsString(datum(2026, 2, 12))).toBe('2026-02-12')
  })

  it('padded einstellige Monate und Tage mit Nullen', () => {
    expect(datumAlsString(datum(2026, 1, 5))).toBe('2026-01-05')
  })
})

describe('stringAlsDatum', () => {
  it('parst einen YYYY-MM-DD String als Date', () => {
    const d = stringAlsDatum('2026-02-12')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(1) // 0-basiert
    expect(d.getDate()).toBe(12)
  })

  it('gibt null zurück bei leerem String', () => {
    expect(stringAlsDatum('')).toBeNull()
    expect(stringAlsDatum(null)).toBeNull()
    expect(stringAlsDatum(undefined)).toBeNull()
  })
})

// =========================================================================
// Validierung
// =========================================================================

describe('korrigiereZyklusStartDatum – Validierung', () => {
  it('lehnt ungültiges Datum ab', () => {
    const historie = erstelleHistorie([[2026, 1, 15]])
    const ergebnis = korrigiereZyklusStartDatum({
      neuesDatumStr: '',
      bisherigStartdatum: datum(2026, 1, 15),
      historie,
    })
    expect(ergebnis.erfolg).toBe(false)
    expect(ergebnis.fehler).toContain('gültiges Datum')
  })

  it('lehnt Datum in der Zukunft ab', () => {
    const morgen = new Date()
    morgen.setDate(morgen.getDate() + 1)
    const morgenStr = datumAlsString(morgen)

    const historie = erstelleHistorie([[2026, 1, 15]])
    const ergebnis = korrigiereZyklusStartDatum({
      neuesDatumStr: morgenStr,
      bisherigStartdatum: datum(2026, 1, 15),
      historie,
    })
    expect(ergebnis.erfolg).toBe(false)
    expect(ergebnis.fehler).toContain('Zukunft')
  })

  it('lehnt unverändertes Datum ab', () => {
    const historie = erstelleHistorie([[2026, 1, 15]])
    const ergebnis = korrigiereZyklusStartDatum({
      neuesDatumStr: '2026-01-15',
      bisherigStartdatum: datum(2026, 1, 15),
      historie,
    })
    expect(ergebnis.erfolg).toBe(false)
    expect(ergebnis.fehler).toContain('unverändert')
  })

  it('lehnt Duplikat mit anderem Eintrag ab', () => {
    const historie = erstelleHistorie([
      [2025, 12, 1],
      [2026, 1, 1],
      [2026, 2, 1],
    ])
    // Versuche den mittleren Eintrag (1.1.) auf 1.12. zu ändern → Duplikat
    const ergebnis = korrigiereZyklusStartDatum({
      neuesDatumStr: '2025-12-01',
      bisherigStartdatum: datum(2026, 1, 1),
      historie,
    })
    expect(ergebnis.erfolg).toBe(false)
    expect(ergebnis.fehler).toContain('existiert bereits')
  })

  it('lehnt ab wenn neues Datum vor dem Vorgänger liegt', () => {
    const historie = erstelleHistorie([
      [2025, 12, 15],
      [2026, 1, 15],
    ])
    // Versuche den zweiten Eintrag (15.1.) auf 10.12. zu ändern → vor Vorgänger (15.12.)
    const ergebnis = korrigiereZyklusStartDatum({
      neuesDatumStr: '2025-12-10',
      bisherigStartdatum: datum(2026, 1, 15),
      historie,
    })
    expect(ergebnis.erfolg).toBe(false)
    expect(ergebnis.fehler).toContain('nach dem vorherigen')
  })

  it('lehnt ab wenn neues Datum gleich dem Vorgänger ist', () => {
    const historie = erstelleHistorie([
      [2025, 12, 15],
      [2026, 1, 15],
    ])
    const ergebnis = korrigiereZyklusStartDatum({
      neuesDatumStr: '2025-12-15',
      bisherigStartdatum: datum(2026, 1, 15),
      historie,
    })
    expect(ergebnis.erfolg).toBe(false)
  })

  it('lehnt ab wenn neues Datum nach dem Nachfolger liegt', () => {
    const historie = erstelleHistorie([
      [2025, 12, 1],
      [2026, 1, 1],
      [2026, 2, 1],
    ])
    // Versuche den mittleren (1.1.) auf 5.2. zu ändern → nach Nachfolger (1.2.)
    const ergebnis = korrigiereZyklusStartDatum({
      neuesDatumStr: '2026-02-05',
      bisherigStartdatum: datum(2026, 1, 1),
      historie,
    })
    expect(ergebnis.erfolg).toBe(false)
    expect(ergebnis.fehler).toContain('vor dem nächsten')
  })

  it('lehnt ab wenn neues Datum gleich dem Nachfolger ist', () => {
    const historie = erstelleHistorie([
      [2025, 12, 1],
      [2026, 1, 1],
      [2026, 2, 1],
    ])
    const ergebnis = korrigiereZyklusStartDatum({
      neuesDatumStr: '2026-02-01',
      bisherigStartdatum: datum(2026, 1, 1),
      historie,
    })
    expect(ergebnis.erfolg).toBe(false)
  })

  it('gibt Fehler wenn Eintrag nicht in Historie gefunden wird', () => {
    const historie = erstelleHistorie([[2026, 1, 15]])
    const ergebnis = korrigiereZyklusStartDatum({
      neuesDatumStr: '2026-01-18',
      bisherigStartdatum: datum(2025, 6, 1), // existiert nicht
      historie,
    })
    expect(ergebnis.erfolg).toBe(false)
    expect(ergebnis.fehler).toContain('nicht gefunden')
  })
})

// =========================================================================
// Erfolgreiche Korrektur
// =========================================================================

describe('korrigiereZyklusStartDatum – Erfolgreiche Korrektur', () => {
  it('aktualisiert das Startdatum', () => {
    const historie = erstelleHistorie([[2026, 1, 15]])
    const ergebnis = korrigiereZyklusStartDatum({
      neuesDatumStr: '2026-01-18',
      bisherigStartdatum: datum(2026, 1, 15),
      historie,
    })
    expect(ergebnis.erfolg).toBe(true)
    expect(datumAlsString(ergebnis.historie[0].startdatum)).toBe('2026-01-18')
  })

  it('berechnet die Mondphase für das neue Datum neu', () => {
    const historie = erstelleHistorie([[2026, 1, 15]])
    const ergebnis = korrigiereZyklusStartDatum({
      neuesDatumStr: '2026-01-18',
      bisherigStartdatum: datum(2026, 1, 15),
      historie,
    })
    expect(ergebnis.erfolg).toBe(true)
    // Mondphase muss gesetzt sein (egal welcher Wert)
    expect(ergebnis.historie[0].mondphase).toBeTruthy()
  })

  it('lässt den Zyklustyp unverändert (EC-6)', () => {
    const historie = erstelleHistorie([[2026, 1, 15, { zyklusTyp: 'weissmond' }]])
    const ergebnis = korrigiereZyklusStartDatum({
      neuesDatumStr: '2026-01-18',
      bisherigStartdatum: datum(2026, 1, 15),
      historie,
    })
    expect(ergebnis.erfolg).toBe(true)
    expect(ergebnis.historie[0].zyklusTyp).toBe('weissmond')
  })

  it('mutiert die Original-Historie nicht', () => {
    const historie = erstelleHistorie([[2026, 1, 15]])
    const originalDatum = historie[0].startdatum
    korrigiereZyklusStartDatum({
      neuesDatumStr: '2026-01-18',
      bisherigStartdatum: datum(2026, 1, 15),
      historie,
    })
    expect(historie[0].startdatum).toBe(originalDatum)
  })
})

// =========================================================================
// Zykluslängen-Neuberechnung
// =========================================================================

describe('korrigiereZyklusStartDatum – Zykluslängen-Neuberechnung', () => {
  it('berechnet die Zykluslänge des Vorgängers neu', () => {
    // Vorgänger: 1.12., Aktuell: 1.1. (31 Tage) → Korrektur auf 5.1. (35 Tage)
    const historie = erstelleHistorie([
      [2025, 12, 1, { zyklusLaenge: 31 }],
      [2026, 1, 1, { zyklusLaenge: 28 }],
    ])
    const ergebnis = korrigiereZyklusStartDatum({
      neuesDatumStr: '2026-01-05',
      bisherigStartdatum: datum(2026, 1, 1),
      historie,
    })
    expect(ergebnis.erfolg).toBe(true)
    expect(ergebnis.historie[0].zyklusLaenge).toBe(35) // 1.12. → 5.1. = 35 Tage
  })

  it('berechnet die Zykluslänge des korrigierten Zyklus neu (wenn Nachfolger existiert)', () => {
    // Aktuell: 1.1., Nachfolger: 1.2. (31 Tage) → Korrektur auf 5.1. (27 Tage)
    const historie = erstelleHistorie([
      [2026, 1, 1, { zyklusLaenge: 31 }],
      [2026, 2, 1, { zyklusLaenge: 28 }],
    ])
    const ergebnis = korrigiereZyklusStartDatum({
      neuesDatumStr: '2026-01-05',
      bisherigStartdatum: datum(2026, 1, 1),
      historie,
    })
    expect(ergebnis.erfolg).toBe(true)
    expect(ergebnis.historie[0].zyklusLaenge).toBe(27) // 5.1. → 1.2. = 27 Tage
  })

  it('berechnet beide Nachbar-Zykluslängen korrekt bei mittlerem Eintrag', () => {
    // 3 Zyklen: 1.12., 1.1., 1.2. → Korrektur mittlerer auf 10.1.
    const historie = erstelleHistorie([
      [2025, 12, 1, { zyklusLaenge: 31 }],
      [2026, 1, 1, { zyklusLaenge: 31 }],
      [2026, 2, 1, { zyklusLaenge: 28 }],
    ])
    const ergebnis = korrigiereZyklusStartDatum({
      neuesDatumStr: '2026-01-10',
      bisherigStartdatum: datum(2026, 1, 1),
      historie,
    })
    expect(ergebnis.erfolg).toBe(true)
    expect(ergebnis.historie[0].zyklusLaenge).toBe(40) // 1.12. → 10.1. = 40 Tage
    expect(ergebnis.historie[1].zyklusLaenge).toBe(22) // 10.1. → 1.2. = 22 Tage
  })

  it('ändert keine Zykluslänge wenn einziger Eintrag (EC-1)', () => {
    const historie = erstelleHistorie([[2026, 1, 15, { zyklusLaenge: 28 }]])
    const ergebnis = korrigiereZyklusStartDatum({
      neuesDatumStr: '2026-01-18',
      bisherigStartdatum: datum(2026, 1, 15),
      historie,
    })
    expect(ergebnis.erfolg).toBe(true)
    // Zykluslänge bleibt 28, da kein Nachbar vorhanden
    expect(ergebnis.historie[0].zyklusLaenge).toBe(28)
  })
})

// =========================================================================
// istAktuellsterZyklus
// =========================================================================

describe('korrigiereZyklusStartDatum – istAktuellsterZyklus', () => {
  it('gibt true zurück wenn letzter Eintrag korrigiert wird', () => {
    const historie = erstelleHistorie([
      [2025, 12, 1],
      [2026, 1, 1],
    ])
    const ergebnis = korrigiereZyklusStartDatum({
      neuesDatumStr: '2026-01-05',
      bisherigStartdatum: datum(2026, 1, 1),
      historie,
    })
    expect(ergebnis.erfolg).toBe(true)
    expect(ergebnis.istAktuellsterZyklus).toBe(true)
  })

  it('gibt false zurück wenn älterer Eintrag korrigiert wird', () => {
    const historie = erstelleHistorie([
      [2025, 12, 1],
      [2026, 1, 1],
    ])
    const ergebnis = korrigiereZyklusStartDatum({
      neuesDatumStr: '2025-12-05',
      bisherigStartdatum: datum(2025, 12, 1),
      historie,
    })
    expect(ergebnis.erfolg).toBe(true)
    expect(ergebnis.istAktuellsterZyklus).toBe(false)
  })

  it('gibt true zurück bei einzigem Eintrag (EC-1)', () => {
    const historie = erstelleHistorie([[2026, 1, 15]])
    const ergebnis = korrigiereZyklusStartDatum({
      neuesDatumStr: '2026-01-18',
      bisherigStartdatum: datum(2026, 1, 15),
      historie,
    })
    expect(ergebnis.erfolg).toBe(true)
    expect(ergebnis.istAktuellsterZyklus).toBe(true)
  })
})

// =========================================================================
// Edge Cases aus der Spec
// =========================================================================

describe('korrigiereZyklusStartDatum – Edge Cases', () => {
  it('EC-5: Korrektur über Monatsgrenze funktioniert', () => {
    // 31. Dezember 2025 → 1. Januar 2026
    const historie = erstelleHistorie([
      [2025, 12, 1, { zyklusLaenge: 30 }],
      [2025, 12, 31, { zyklusLaenge: 28 }],
    ])
    const ergebnis = korrigiereZyklusStartDatum({
      neuesDatumStr: '2026-01-01',
      bisherigStartdatum: datum(2025, 12, 31),
      historie,
    })
    expect(ergebnis.erfolg).toBe(true)
    expect(datumAlsString(ergebnis.historie[1].startdatum)).toBe('2026-01-01')
    // Vorgänger-Zykluslänge: 1.12. → 1.1. = 31 Tage
    expect(ergebnis.historie[0].zyklusLaenge).toBe(31)
  })

  it('Korrektur um nur einen Tag (minimale Änderung)', () => {
    const historie = erstelleHistorie([
      [2025, 12, 1, { zyklusLaenge: 31 }],
      [2026, 1, 1, { zyklusLaenge: 28 }],
    ])
    const ergebnis = korrigiereZyklusStartDatum({
      neuesDatumStr: '2026-01-02',
      bisherigStartdatum: datum(2026, 1, 1),
      historie,
    })
    expect(ergebnis.erfolg).toBe(true)
    expect(ergebnis.historie[0].zyklusLaenge).toBe(32) // 1.12. → 2.1. = 32 Tage
  })

  it('Korrektur des ältesten Eintrags (kein Vorgänger)', () => {
    const historie = erstelleHistorie([
      [2025, 12, 1, { zyklusLaenge: 31 }],
      [2026, 1, 1, { zyklusLaenge: 28 }],
    ])
    const ergebnis = korrigiereZyklusStartDatum({
      neuesDatumStr: '2025-12-05',
      bisherigStartdatum: datum(2025, 12, 1),
      historie,
    })
    expect(ergebnis.erfolg).toBe(true)
    // Zykluslänge des ältesten: 5.12. → 1.1. = 27 Tage
    expect(ergebnis.historie[0].zyklusLaenge).toBe(27)
  })
})
