import { describe, it, expect } from 'vitest'
import {
  TABELLEN,
  DEBOUNCE_MS,
  EIGENES_EVENT_FENSTER_MS,
  EIGENES_EVENT_AUFRAEUM_MS,
  SICHTBARKEIT_MIN_ABSTAND_MS,
  MAX_BACKOFF_MS,
  FULL_PULL_RETRIES,
  FULL_PULL_RETRY_DELAY_MS,
  findeEigenesEvent,
  berechneBackoffDelay,
} from './syncHelpers.js'

// ---------------------------------------------------------------------------
// Konstanten
// ---------------------------------------------------------------------------

describe('Sync-Konstanten', () => {
  it('TABELLEN enthält genau 7 Tabellen', () => {
    expect(TABELLEN).toHaveLength(7)
  })

  it('TABELLEN enthält alle erwarteten Tabellennamen', () => {
    const erwartet = [
      'zyklusdaten',
      'korrekturen',
      'zyklushistorie',
      'chronik',
      'tageskarten',
      'zyklustyp_hinweis',
      'angepasste_grenzen',
    ]
    expect(TABELLEN).toEqual(erwartet)
  })

  it('DEBOUNCE_MS ist mindestens 300ms (Schutz gegen Delete-Then-Insert)', () => {
    expect(DEBOUNCE_MS).toBeGreaterThanOrEqual(300)
  })

  it('EIGENES_EVENT_FENSTER_MS ist 3 Sekunden', () => {
    expect(EIGENES_EVENT_FENSTER_MS).toBe(3000)
  })

  it('EIGENES_EVENT_AUFRAEUM_MS > EIGENES_EVENT_FENSTER_MS (Cleanup nach Fenster)', () => {
    expect(EIGENES_EVENT_AUFRAEUM_MS).toBeGreaterThan(EIGENES_EVENT_FENSTER_MS)
  })

  it('FULL_PULL_RETRIES ist mindestens 1', () => {
    expect(FULL_PULL_RETRIES).toBeGreaterThanOrEqual(1)
  })

  it('FULL_PULL_RETRY_DELAY_MS ist positiv', () => {
    expect(FULL_PULL_RETRY_DELAY_MS).toBeGreaterThan(0)
  })

  it('SICHTBARKEIT_MIN_ABSTAND_MS ist mindestens 10 Sekunden', () => {
    expect(SICHTBARKEIT_MIN_ABSTAND_MS).toBeGreaterThanOrEqual(10000)
  })
})

// ---------------------------------------------------------------------------
// findeEigenesEvent
// ---------------------------------------------------------------------------

describe('findeEigenesEvent', () => {
  it('erkennt eigenes Event in derselben Tabelle innerhalb des Zeitfensters', () => {
    const jetzt = Date.now()
    const eigene = [{ table: 'chronik', zeit: jetzt - 1000 }]

    const index = findeEigenesEvent(eigene, 'chronik', jetzt)
    expect(index).toBe(0)
  })

  it('ignoriert Events aus einer anderen Tabelle', () => {
    const jetzt = Date.now()
    const eigene = [{ table: 'chronik', zeit: jetzt - 1000 }]

    const index = findeEigenesEvent(eigene, 'zyklusdaten', jetzt)
    expect(index).toBe(-1)
  })

  it('ignoriert Events ausserhalb des Zeitfensters (zu alt)', () => {
    const jetzt = Date.now()
    const eigene = [{ table: 'chronik', zeit: jetzt - 4000 }] // 4s > 3s Fenster

    const index = findeEigenesEvent(eigene, 'chronik', jetzt)
    expect(index).toBe(-1)
  })

  it('findet den ersten passenden Eintrag bei mehreren', () => {
    const jetzt = Date.now()
    const eigene = [
      { table: 'chronik', zeit: jetzt - 2000 },
      { table: 'chronik', zeit: jetzt - 500 },
    ]

    const index = findeEigenesEvent(eigene, 'chronik', jetzt)
    expect(index).toBe(0) // Erster Match
  })

  it('gibt -1 zurück bei leerer Liste', () => {
    const index = findeEigenesEvent([], 'chronik', Date.now())
    expect(index).toBe(-1)
  })

  it('erkennt Event genau an der Fenstergrenze als zu alt', () => {
    const jetzt = Date.now()
    // Genau 3000ms alt = nicht mehr im Fenster (jetzt - zeit < 3000 ist false)
    const eigene = [{ table: 'chronik', zeit: jetzt - EIGENES_EVENT_FENSTER_MS }]

    const index = findeEigenesEvent(eigene, 'chronik', jetzt)
    expect(index).toBe(-1)
  })

  it('erkennt Event knapp innerhalb des Fensters', () => {
    const jetzt = Date.now()
    // 2999ms alt = noch im Fenster
    const eigene = [{ table: 'chronik', zeit: jetzt - (EIGENES_EVENT_FENSTER_MS - 1) }]

    const index = findeEigenesEvent(eigene, 'chronik', jetzt)
    expect(index).toBe(0)
  })

  it('funktioniert für alle 7 Tabellen', () => {
    const jetzt = Date.now()

    TABELLEN.forEach((tabelle) => {
      const eigene = [{ table: tabelle, zeit: jetzt - 500 }]
      const index = findeEigenesEvent(eigene, tabelle, jetzt)
      expect(index).toBe(0)
    })
  })
})

// ---------------------------------------------------------------------------
// berechneBackoffDelay
// ---------------------------------------------------------------------------

describe('berechneBackoffDelay', () => {
  it('Versuch 0 → 1 Sekunde', () => {
    expect(berechneBackoffDelay(0)).toBe(1000)
  })

  it('Versuch 1 → 2 Sekunden', () => {
    expect(berechneBackoffDelay(1)).toBe(2000)
  })

  it('Versuch 2 → 4 Sekunden', () => {
    expect(berechneBackoffDelay(2)).toBe(4000)
  })

  it('Versuch 3 → 8 Sekunden', () => {
    expect(berechneBackoffDelay(3)).toBe(8000)
  })

  it('Versuch 4 → 16 Sekunden (Maximum)', () => {
    expect(berechneBackoffDelay(4)).toBe(16000)
  })

  it('Versuch 5 → 16 Sekunden (bleibt beim Maximum)', () => {
    expect(berechneBackoffDelay(5)).toBe(MAX_BACKOFF_MS)
  })

  it('Versuch 10 → bleibt beim Maximum', () => {
    expect(berechneBackoffDelay(10)).toBe(MAX_BACKOFF_MS)
  })

  it('gibt immer einen positiven Wert zurück', () => {
    for (let i = 0; i < 20; i++) {
      expect(berechneBackoffDelay(i)).toBeGreaterThan(0)
    }
  })

  it('überschreitet niemals MAX_BACKOFF_MS', () => {
    for (let i = 0; i < 20; i++) {
      expect(berechneBackoffDelay(i)).toBeLessThanOrEqual(MAX_BACKOFF_MS)
    }
  })

  it('Delay steigt monoton (oder bleibt gleich)', () => {
    let vorher = 0
    for (let i = 0; i < 10; i++) {
      const delay = berechneBackoffDelay(i)
      expect(delay).toBeGreaterThanOrEqual(vorher)
      vorher = delay
    }
  })
})
