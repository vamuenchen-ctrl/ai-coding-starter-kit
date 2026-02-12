import { describe, it, expect, beforeEach, vi } from 'vitest'

// localStorage-Mock für Node-Umgebung
const speicher = {}
const localStorageMock = {
  getItem: vi.fn((key) => speicher[key] ?? null),
  setItem: vi.fn((key, value) => { speicher[key] = String(value) }),
  removeItem: vi.fn((key) => { delete speicher[key] }),
  clear: vi.fn(() => { Object.keys(speicher).forEach((k) => delete speicher[k]) }),
}
vi.stubGlobal('localStorage', localStorageMock)

import {
  ladeZyklusdaten,
  speichereZyklusdaten,
  aktualisiereZyklusdaten,
  ladeKorrekturen,
  speichereKorrekturen,
  fuegeKorrekturHinzu,
  ladeZyklushistorie,
  speichereZyklushistorie,
  fuegeZyklusHinzu,
  ladeChronik,
  speichereChronikEintrag,
  ladeChronikEintrag,
  ladeTageskarten,
  speichereTageskarte,
  ladeHeutigeTageskarte,
  ladeZyklustypHinweis,
  markiereHinweisAlsGezeigt,
  markiereHinweisAlsAbgelehnt,
  setzeHinweisZurueck,
  loescheAlleDaten,
} from './speicher'

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
})

// =========================================================================
// Zyklusdaten
// =========================================================================

describe('Zyklusdaten', () => {
  it('gibt Standardwerte zurück wenn nichts gespeichert', () => {
    const daten = ladeZyklusdaten()
    expect(daten.zyklusStart).toBeNull()
    expect(daten.zyklusLaenge).toBe(28)
    expect(daten.zyklusTyp).toBeNull()
    expect(daten.ersteinrichtungAbgeschlossen).toBe(false)
  })

  it('speichert und lädt Zyklusdaten korrekt', () => {
    const startDatum = new Date(2025, 1, 1) // Lokale Mitternacht
    speichereZyklusdaten({
      zyklusStart: startDatum,
      zyklusLaenge: 30,
      zyklusTyp: 'weissmond',
      ersteinrichtungAbgeschlossen: true,
    })

    const geladen = ladeZyklusdaten()
    expect(geladen.zyklusStart).toBeInstanceOf(Date)
    // Kalender-Datum muss erhalten bleiben (nicht UTC-Repräsentation)
    expect(geladen.zyklusStart.getFullYear()).toBe(2025)
    expect(geladen.zyklusStart.getMonth()).toBe(1)
    expect(geladen.zyklusStart.getDate()).toBe(1)
    expect(geladen.zyklusLaenge).toBe(30)
    expect(geladen.zyklusTyp).toBe('weissmond')
    expect(geladen.ersteinrichtungAbgeschlossen).toBe(true)
  })

  it('aktualisiert einzelne Felder ohne andere zu überschreiben', () => {
    speichereZyklusdaten({
      zyklusStart: new Date(2025, 1, 1),
      zyklusLaenge: 28,
      zyklusTyp: 'weissmond',
      ersteinrichtungAbgeschlossen: true,
    })

    aktualisiereZyklusdaten({ zyklusLaenge: 32 })

    const geladen = ladeZyklusdaten()
    expect(geladen.zyklusLaenge).toBe(32)
    expect(geladen.zyklusTyp).toBe('weissmond')
    expect(geladen.ersteinrichtungAbgeschlossen).toBe(true)
  })
})

// =========================================================================
// Phasenkorrekturen
// =========================================================================

describe('Phasenkorrekturen', () => {
  it('gibt leeres Array zurück wenn nichts gespeichert', () => {
    expect(ladeKorrekturen()).toEqual([])
  })

  it('speichert und lädt Korrekturen mit Datum', () => {
    const korrektur = {
      datum: new Date(Date.UTC(2025, 1, 5)),
      zyklusTag: 5,
      berechnetePhase: 'alteWeise',
      korrigiertePhase: 'jungeFrau',
    }

    fuegeKorrekturHinzu(korrektur)

    const geladen = ladeKorrekturen()
    expect(geladen).toHaveLength(1)
    expect(geladen[0].datum).toBeInstanceOf(Date)
    expect(geladen[0].zyklusTag).toBe(5)
    expect(geladen[0].berechnetePhase).toBe('alteWeise')
    expect(geladen[0].korrigiertePhase).toBe('jungeFrau')
  })

  it('fügt mehrere Korrekturen hinzu', () => {
    fuegeKorrekturHinzu({
      datum: new Date(Date.UTC(2025, 1, 5)),
      zyklusTag: 5,
      berechnetePhase: 'alteWeise',
      korrigiertePhase: 'jungeFrau',
    })
    fuegeKorrekturHinzu({
      datum: new Date(Date.UTC(2025, 2, 5)),
      zyklusTag: 5,
      berechnetePhase: 'alteWeise',
      korrigiertePhase: 'jungeFrau',
    })

    expect(ladeKorrekturen()).toHaveLength(2)
  })

  it('kann Korrekturen komplett überschreiben', () => {
    fuegeKorrekturHinzu({
      datum: new Date(),
      zyklusTag: 1,
      berechnetePhase: 'alteWeise',
      korrigiertePhase: 'zauberin',
    })

    speichereKorrekturen([])
    expect(ladeKorrekturen()).toEqual([])
  })
})

// =========================================================================
// Zyklushistorie
// =========================================================================

describe('Zyklushistorie', () => {
  it('gibt leeres Array zurück wenn nichts gespeichert', () => {
    expect(ladeZyklushistorie()).toEqual([])
  })

  it('fügt Zykluseinträge hinzu und lädt sie', () => {
    fuegeZyklusHinzu({
      startdatum: new Date(Date.UTC(2025, 0, 1)),
      mondphase: 'neumond',
      zyklusTyp: 'weissmond',
      zyklusLaenge: 28,
    })
    fuegeZyklusHinzu({
      startdatum: new Date(Date.UTC(2025, 0, 29)),
      mondphase: 'neumond',
      zyklusTyp: 'weissmond',
      zyklusLaenge: 28,
    })

    const historie = ladeZyklushistorie()
    expect(historie).toHaveLength(2)
    expect(historie[0].startdatum).toBeInstanceOf(Date)
    expect(historie[0].mondphase).toBe('neumond')
    expect(historie[1].zyklusLaenge).toBe(28)
  })

  it('kann Historie komplett überschreiben', () => {
    fuegeZyklusHinzu({
      startdatum: new Date(),
      mondphase: 'vollmond',
      zyklusTyp: 'rotmond',
      zyklusLaenge: 30,
    })

    speichereZyklushistorie([])
    expect(ladeZyklushistorie()).toEqual([])
  })
})

// =========================================================================
// Chronik-Einträge
// =========================================================================

describe('Chronik-Einträge', () => {
  it('gibt leeres Array zurück wenn nichts gespeichert', () => {
    expect(ladeChronik()).toEqual([])
  })

  it('speichert einen Chronik-Eintrag', () => {
    speichereChronikEintrag({
      datum: new Date(Date.UTC(2025, 1, 10)),
      koerper: ['kopfschmerzen', 'muede'],
      stimmung: 'ausgeglichen',
      energie: 7,
      traeume: 'Traum von Wasser',
      kreativitaet: 'Hatte Idee für ein Bild',
      sexuellesEmpfinden: 5,
      phase: 'mutter',
    })

    const chronik = ladeChronik()
    expect(chronik).toHaveLength(1)
    expect(chronik[0].datum).toBeInstanceOf(Date)
    expect(chronik[0].energie).toBe(7)
    expect(chronik[0].phase).toBe('mutter')
  })

  it('überschreibt bestehenden Eintrag für denselben Tag', () => {
    const tag = new Date(Date.UTC(2025, 1, 10))

    speichereChronikEintrag({ datum: tag, energie: 5, phase: 'mutter' })
    speichereChronikEintrag({ datum: tag, energie: 8, phase: 'zauberin' })

    const chronik = ladeChronik()
    expect(chronik).toHaveLength(1)
    expect(chronik[0].energie).toBe(8)
    expect(chronik[0].phase).toBe('zauberin')
  })

  it('lädt einen einzelnen Chronik-Eintrag nach Datum', () => {
    const tag = new Date(Date.UTC(2025, 1, 10))
    speichereChronikEintrag({ datum: tag, energie: 6, phase: 'jungeFrau' })

    const eintrag = ladeChronikEintrag(tag)
    expect(eintrag).not.toBeNull()
    expect(eintrag.energie).toBe(6)
  })

  it('gibt null zurück für Tage ohne Eintrag', () => {
    const eintrag = ladeChronikEintrag(new Date(Date.UTC(2025, 5, 15)))
    expect(eintrag).toBeNull()
  })

  it('füllt fehlende Felder mit Standardwerten', () => {
    speichereChronikEintrag({
      datum: new Date(Date.UTC(2025, 1, 10)),
      energie: 5,
    })

    const chronik = ladeChronik()
    expect(chronik[0].traeume).toBe('')
    expect(chronik[0].kreativitaet).toBe('')
    expect(chronik[0].koerper).toBeNull()
    expect(chronik[0].stimmung).toBeNull()
  })
})

// =========================================================================
// Gezogene Tageskarten
// =========================================================================

describe('Gezogene Tageskarten', () => {
  it('gibt leeres Array zurück wenn nichts gespeichert', () => {
    expect(ladeTageskarten()).toEqual([])
  })

  it('speichert eine Tageskarte', () => {
    const tag = new Date(Date.UTC(2025, 1, 10))
    speichereTageskarte(tag, 17)

    const karten = ladeTageskarten()
    expect(karten).toHaveLength(1)
    expect(karten[0].datum).toBeInstanceOf(Date)
    expect(karten[0].kartenId).toBe(17)
  })

  it('überschreibt bestehende Karte für denselben Tag', () => {
    const tag = new Date(Date.UTC(2025, 1, 10))
    speichereTageskarte(tag, 5)
    speichereTageskarte(tag, 22)

    const karten = ladeTageskarten()
    expect(karten).toHaveLength(1)
    expect(karten[0].kartenId).toBe(22)
  })

  it('speichert Karten für verschiedene Tage separat', () => {
    speichereTageskarte(new Date(Date.UTC(2025, 1, 10)), 5)
    speichereTageskarte(new Date(Date.UTC(2025, 1, 11)), 12)

    expect(ladeTageskarten()).toHaveLength(2)
  })

  it('ladeHeutigeTageskarte gibt null wenn keine gezogen', () => {
    expect(ladeHeutigeTageskarte()).toBeNull()
  })

  it('ladeHeutigeTageskarte findet die heutige Karte', () => {
    const heute = new Date()
    speichereTageskarte(heute, 33)

    const karte = ladeHeutigeTageskarte()
    expect(karte).not.toBeNull()
    expect(karte.kartenId).toBe(33)
  })
})

// =========================================================================
// Zyklustyp-Hinweis
// =========================================================================

describe('Zyklustyp-Hinweis', () => {
  it('gibt Standardwerte zurück wenn nichts gespeichert', () => {
    const hinweis = ladeZyklustypHinweis()
    expect(hinweis.letzterHinweis).toBeNull()
    expect(hinweis.nutzerinHatAbgelehnt).toBe(false)
    expect(hinweis.ablehnungsDatum).toBeNull()
  })

  it('markiereHinweisAlsGezeigt setzt Datum', () => {
    markiereHinweisAlsGezeigt()

    const hinweis = ladeZyklustypHinweis()
    expect(hinweis.letzterHinweis).toBeInstanceOf(Date)
    expect(hinweis.nutzerinHatAbgelehnt).toBe(false)
  })

  it('markiereHinweisAlsAbgelehnt setzt Ablehnung', () => {
    markiereHinweisAlsAbgelehnt()

    const hinweis = ladeZyklustypHinweis()
    expect(hinweis.nutzerinHatAbgelehnt).toBe(true)
    expect(hinweis.ablehnungsDatum).toBeInstanceOf(Date)
    expect(hinweis.letzterHinweis).toBeInstanceOf(Date)
  })

  it('setzeHinweisZurueck setzt alles auf Standard', () => {
    markiereHinweisAlsAbgelehnt()
    setzeHinweisZurueck()

    const hinweis = ladeZyklustypHinweis()
    expect(hinweis.letzterHinweis).toBeNull()
    expect(hinweis.nutzerinHatAbgelehnt).toBe(false)
    expect(hinweis.ablehnungsDatum).toBeNull()
  })
})

// =========================================================================
// Alle Daten löschen
// =========================================================================

describe('loescheAlleDaten', () => {
  it('entfernt alle gespeicherten Daten', () => {
    speichereZyklusdaten({
      zyklusStart: new Date(),
      zyklusLaenge: 28,
      zyklusTyp: 'weissmond',
      ersteinrichtungAbgeschlossen: true,
    })
    fuegeKorrekturHinzu({
      datum: new Date(),
      zyklusTag: 1,
      berechnetePhase: 'alteWeise',
      korrigiertePhase: 'zauberin',
    })
    speichereTageskarte(new Date(), 5)

    loescheAlleDaten()

    expect(ladeZyklusdaten().ersteinrichtungAbgeschlossen).toBe(false)
    expect(ladeKorrekturen()).toEqual([])
    expect(ladeTageskarten()).toEqual([])
    expect(ladeZyklushistorie()).toEqual([])
    expect(ladeChronik()).toEqual([])
    expect(ladeZyklustypHinweis().nutzerinHatAbgelehnt).toBe(false)
  })
})

// =========================================================================
// Robustheit
// =========================================================================

describe('Robustheit', () => {
  it('behandelt korrupte JSON-Daten graceful', () => {
    localStorage.setItem('rotermond_zyklusdaten', 'kein-json{{{')
    const daten = ladeZyklusdaten()
    expect(daten.zyklusLaenge).toBe(28)
  })

  it('behandelt fehlende Felder im gespeicherten Objekt', () => {
    localStorage.setItem('rotermond_zyklusdaten', JSON.stringify({ zyklusLaenge: 30 }))
    const daten = ladeZyklusdaten()
    expect(daten.zyklusLaenge).toBe(30)
    expect(daten.ersteinrichtungAbgeschlossen).toBe(false)
    expect(daten.zyklusStart).toBeNull()
  })
})
