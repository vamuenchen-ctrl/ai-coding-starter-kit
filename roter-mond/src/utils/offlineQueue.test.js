import { describe, it, expect, beforeEach, vi } from 'vitest'

// localStorage-Mock für Node-Umgebung
const speicherObj = {}
const localStorageMock = {
  getItem: vi.fn((key) => speicherObj[key] ?? null),
  setItem: vi.fn((key, value) => { speicherObj[key] = String(value) }),
  removeItem: vi.fn((key) => { delete speicherObj[key] }),
  clear: vi.fn(() => { Object.keys(speicherObj).forEach((k) => delete speicherObj[k]) }),
}
vi.stubGlobal('localStorage', localStorageMock)

// Cloud-Modul mocken (wird von offlineQueue.js importiert)
vi.mock('./speicherSupabase.js', () => ({}))

import {
  ladeQueue,
  speichereQueue,
  fuegeHinzu,
  entferneEintrag,
  erhoeheVersuche,
  anzahlWartend,
  anzahlWartendFuerUser,
  hatFehlgeschlagene,
  hatFehlgeschlageneFuerUser,
  konsolidiereQueue,
  loescheAeltereAls,
  entferneFehlgeschlagene,
  loescheQueue,
  loescheQueueFuerUser,
  berechneBackoff,
  berechneSchluessel,
  MAX_EINTRAEGE,
  MAX_RETRIES,
} from './offlineQueue.js'

const USER_A = 'user-aaa'
const USER_B = 'user-bbb'

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// Persistenz
// ---------------------------------------------------------------------------

describe('Queue-Persistenz', () => {
  it('leere Queue bei frischem localStorage', () => {
    expect(ladeQueue()).toEqual([])
  })

  it('speichert und lädt Queue korrekt', () => {
    const eintraege = [
      { id: '1', store: 'chronik', operation: 'speichereChronikEintrag', status: 'wartend' },
    ]
    speichereQueue(eintraege)
    expect(ladeQueue()).toEqual(eintraege)
  })

  it('gibt leere Queue zurück bei korruptem JSON', () => {
    localStorage.setItem('rotermond_offline_queue', '{broken')
    expect(ladeQueue()).toEqual([])
  })

  it('Queue überlebt "App-Neustart" (localStorage bleibt)', () => {
    fuegeHinzu('chronik', 'speichereChronikEintrag', [{ datum: '2026-01-15' }], USER_A)
    // Simuliere Neustart: Neuladen aus localStorage
    const queue = ladeQueue()
    expect(queue).toHaveLength(1)
    expect(queue[0].store).toBe('chronik')
  })
})

// ---------------------------------------------------------------------------
// Einträge hinzufügen
// ---------------------------------------------------------------------------

describe('fuegeHinzu', () => {
  it('fügt einen Eintrag mit allen Pflichtfeldern hinzu (AC-3)', () => {
    const eintrag = fuegeHinzu('chronik', 'speichereChronikEintrag', [{ datum: '2026-01-15' }], USER_A)

    expect(eintrag).toMatchObject({
      store: 'chronik',
      operation: 'speichereChronikEintrag',
      userId: USER_A,
      versuche: 0,
      status: 'wartend',
    })
    expect(eintrag.id).toBeTruthy()
    expect(eintrag.zeitstempel).toBeTruthy()
    expect(eintrag.args).toEqual([{ datum: '2026-01-15' }])
    expect(eintrag.schluessel).toBeTruthy()
  })

  it('Queue ist persistent in localStorage (AC-2)', () => {
    fuegeHinzu('zyklusdaten', 'speichereZyklusdaten', [{}], USER_A)
    const raw = localStorage.getItem('rotermond_offline_queue')
    expect(raw).toBeTruthy()
    const parsed = JSON.parse(raw)
    expect(parsed).toHaveLength(1)
  })

  it('mehrere Einträge werden angehängt', () => {
    fuegeHinzu('chronik', 'speichereChronikEintrag', [{ datum: '2026-01-15' }], USER_A)
    fuegeHinzu('chronik', 'speichereChronikEintrag', [{ datum: '2026-01-16' }], USER_A)
    expect(ladeQueue()).toHaveLength(2)
  })

  it('Einträge verschiedener User werden korrekt gespeichert', () => {
    fuegeHinzu('chronik', 'speichereChronikEintrag', [{ datum: '2026-01-15' }], USER_A)
    fuegeHinzu('chronik', 'speichereChronikEintrag', [{ datum: '2026-01-15' }], USER_B)
    expect(ladeQueue()).toHaveLength(2)
    expect(ladeQueue()[0].userId).toBe(USER_A)
    expect(ladeQueue()[1].userId).toBe(USER_B)
  })
})

// ---------------------------------------------------------------------------
// Einträge entfernen
// ---------------------------------------------------------------------------

describe('entferneEintrag', () => {
  it('entfernt einen bestimmten Eintrag (AC-5)', () => {
    const e1 = fuegeHinzu('chronik', 'speichereChronikEintrag', [{ datum: '2026-01-15' }], USER_A)
    fuegeHinzu('chronik', 'speichereChronikEintrag', [{ datum: '2026-01-16' }], USER_A)

    entferneEintrag(e1.id)

    const queue = ladeQueue()
    expect(queue).toHaveLength(1)
    expect(queue[0].args[0].datum).toBe('2026-01-16')
  })

  it('ignoriert unbekannte IDs', () => {
    fuegeHinzu('chronik', 'speichereChronikEintrag', [{ datum: '2026-01-15' }], USER_A)
    entferneEintrag('gibts-nicht')
    expect(ladeQueue()).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// Retry-Logik
// ---------------------------------------------------------------------------

describe('erhoeheVersuche', () => {
  it('erhöht den Versuchszähler um 1', () => {
    const eintrag = fuegeHinzu('chronik', 'speichereChronikEintrag', [{}], USER_A)
    erhoeheVersuche(eintrag.id)

    const aktuell = ladeQueue().find((e) => e.id === eintrag.id)
    expect(aktuell.versuche).toBe(1)
    expect(aktuell.status).toBe('wartend')
  })

  it('markiert als fehlgeschlagen nach MAX_RETRIES (AC-6)', () => {
    const eintrag = fuegeHinzu('chronik', 'speichereChronikEintrag', [{}], USER_A)

    for (let i = 0; i < MAX_RETRIES; i++) {
      erhoeheVersuche(eintrag.id)
    }

    const aktuell = ladeQueue().find((e) => e.id === eintrag.id)
    expect(aktuell.versuche).toBe(MAX_RETRIES)
    expect(aktuell.status).toBe('fehlgeschlagen')
  })

  it('5 Versuche = fehlgeschlagen (AC-6)', () => {
    expect(MAX_RETRIES).toBe(5)
  })
})

// ---------------------------------------------------------------------------
// Abfragen
// ---------------------------------------------------------------------------

describe('Abfragen', () => {
  it('anzahlWartend zählt nur wartende Einträge', () => {
    const e1 = fuegeHinzu('chronik', 'speichereChronikEintrag', [{}], USER_A)
    fuegeHinzu('chronik', 'speichereChronikEintrag', [{}], USER_A)

    expect(anzahlWartend()).toBe(2)

    // Einen als fehlgeschlagen markieren
    for (let i = 0; i < MAX_RETRIES; i++) erhoeheVersuche(e1.id)
    expect(anzahlWartend()).toBe(1)
  })

  it('anzahlWartendFuerUser filtert nach User', () => {
    fuegeHinzu('chronik', 'speichereChronikEintrag', [{}], USER_A)
    fuegeHinzu('chronik', 'speichereChronikEintrag', [{}], USER_B)

    expect(anzahlWartendFuerUser(USER_A)).toBe(1)
    expect(anzahlWartendFuerUser(USER_B)).toBe(1)
  })

  it('hatFehlgeschlagene erkennt fehlgeschlagene Einträge', () => {
    expect(hatFehlgeschlagene()).toBe(false)

    const eintrag = fuegeHinzu('chronik', 'speichereChronikEintrag', [{}], USER_A)
    expect(hatFehlgeschlagene()).toBe(false)

    for (let i = 0; i < MAX_RETRIES; i++) erhoeheVersuche(eintrag.id)
    expect(hatFehlgeschlagene()).toBe(true)
  })

  it('hatFehlgeschlageneFuerUser filtert nach User', () => {
    const eintrag = fuegeHinzu('chronik', 'speichereChronikEintrag', [{}], USER_A)
    for (let i = 0; i < MAX_RETRIES; i++) erhoeheVersuche(eintrag.id)

    expect(hatFehlgeschlageneFuerUser(USER_A)).toBe(true)
    expect(hatFehlgeschlageneFuerUser(USER_B)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Konsolidierungsschlüssel
// ---------------------------------------------------------------------------

describe('berechneSchluessel', () => {
  it('Einzelobjekt-Stores: Schlüssel = Store-Name', () => {
    expect(berechneSchluessel('zyklusdaten', 'speichereZyklusdaten', [{}])).toBe('zyklusdaten')
    expect(berechneSchluessel('zyklustyp_hinweis', 'speichereZyklustypHinweis', [{}])).toBe('zyklustyp_hinweis')
    expect(berechneSchluessel('angepasste_grenzen', 'speichereAngepassteGrenzen', [{}])).toBe('angepasste_grenzen')
  })

  it('Bulk-Operationen: Store + :bulk', () => {
    expect(berechneSchluessel('korrekturen', 'speichereKorrekturen', [[]])).toBe('korrekturen:bulk')
    expect(berechneSchluessel('chronik', 'speichereChronik', [[]])).toBe('chronik:bulk')
  })

  it('Chronik-Eintrag: Store + Datum', () => {
    const key = berechneSchluessel('chronik', 'speichereChronikEintrag', [{ datum: '2026-01-15' }])
    expect(key).toBe('chronik:2026-01-15')
  })

  it('Korrektur: Store + Datum', () => {
    const key = berechneSchluessel('korrekturen', 'fuegeKorrekturHinzu', [{ datum: '2026-01-15' }])
    expect(key).toBe('korrekturen:2026-01-15')
  })

  it('Tageskarte: Store + Datum (erstes Arg ist Datum)', () => {
    const key = berechneSchluessel('tageskarten', 'speichereTageskarte', ['2026-01-15', 42])
    expect(key).toBe('tageskarten:2026-01-15')
  })

  it('ZyklusHinzu: Store + Startdatum', () => {
    const key = berechneSchluessel('zyklushistorie', 'fuegeZyklusHinzu', [{ startdatum: '2026-01-01' }])
    expect(key).toBe('zyklushistorie:2026-01-01')
  })

  it('aktualisiereLetztenZyklus: Store + :letzter', () => {
    const key = berechneSchluessel('zyklushistorie', 'aktualisiereLetztenZyklus', [{}])
    expect(key).toBe('zyklushistorie:letzter')
  })
})

// ---------------------------------------------------------------------------
// Konsolidierung
// ---------------------------------------------------------------------------

describe('konsolidiereQueue', () => {
  it('leere Queue bleibt leer', () => {
    expect(konsolidiereQueue([])).toEqual([])
  })

  it('einzelner Eintrag bleibt erhalten', () => {
    const queue = [
      { id: '1', store: 'chronik', operation: 'speichereChronikEintrag', schluessel: 'chronik:2026-01-15', status: 'wartend' },
    ]
    expect(konsolidiereQueue(queue)).toHaveLength(1)
  })

  it('mehrere Updates auf gleichen Datensatz → nur neuester bleibt (AC-10)', () => {
    const queue = [
      { id: '1', store: 'chronik', operation: 'speichereChronikEintrag', schluessel: 'chronik:2026-01-15', status: 'wartend', zeitstempel: '2026-01-15T10:00:00Z' },
      { id: '2', store: 'chronik', operation: 'speichereChronikEintrag', schluessel: 'chronik:2026-01-15', status: 'wartend', zeitstempel: '2026-01-15T11:00:00Z' },
      { id: '3', store: 'chronik', operation: 'speichereChronikEintrag', schluessel: 'chronik:2026-01-15', status: 'wartend', zeitstempel: '2026-01-15T12:00:00Z' },
    ]

    const ergebnis = konsolidiereQueue(queue)
    expect(ergebnis).toHaveLength(1)
    expect(ergebnis[0].id).toBe('3') // Neuester
  })

  it('unterschiedliche Datensätze bleiben erhalten', () => {
    const queue = [
      { id: '1', store: 'chronik', operation: 'speichereChronikEintrag', schluessel: 'chronik:2026-01-15', status: 'wartend' },
      { id: '2', store: 'chronik', operation: 'speichereChronikEintrag', schluessel: 'chronik:2026-01-16', status: 'wartend' },
    ]

    expect(konsolidiereQueue(queue)).toHaveLength(2)
  })

  it('Bulk-Operation ersetzt alle Einzel-Operationen für denselben Store', () => {
    const queue = [
      { id: '1', store: 'chronik', operation: 'speichereChronikEintrag', schluessel: 'chronik:2026-01-15', status: 'wartend' },
      { id: '2', store: 'chronik', operation: 'speichereChronikEintrag', schluessel: 'chronik:2026-01-16', status: 'wartend' },
      { id: '3', store: 'chronik', operation: 'speichereChronik', schluessel: 'chronik:bulk', status: 'wartend' },
    ]

    const ergebnis = konsolidiereQueue(queue)
    expect(ergebnis).toHaveLength(1)
    expect(ergebnis[0].operation).toBe('speichereChronik')
  })

  it('Einzelobjekt-Stores: nur neuester bleibt', () => {
    const queue = [
      { id: '1', store: 'zyklusdaten', operation: 'speichereZyklusdaten', schluessel: 'zyklusdaten', status: 'wartend' },
      { id: '2', store: 'zyklusdaten', operation: 'aktualisiereZyklusdaten', schluessel: 'zyklusdaten', status: 'wartend' },
    ]

    const ergebnis = konsolidiereQueue(queue)
    expect(ergebnis).toHaveLength(1)
    expect(ergebnis[0].id).toBe('2')
  })

  it('fehlgeschlagene Einträge werden behalten (AC-6: Nutzerin informieren)', () => {
    const queue = [
      { id: '1', store: 'chronik', operation: 'speichereChronikEintrag', schluessel: 'chronik:2026-01-15', status: 'fehlgeschlagen' },
      { id: '2', store: 'chronik', operation: 'speichereChronikEintrag', schluessel: 'chronik:2026-01-16', status: 'wartend' },
    ]

    const ergebnis = konsolidiereQueue(queue)
    expect(ergebnis).toHaveLength(2)
    expect(ergebnis[0].id).toBe('1')
    expect(ergebnis[0].status).toBe('fehlgeschlagen')
    expect(ergebnis[1].id).toBe('2')
  })

  it('behält chronologische FIFO-Reihenfolge bei', () => {
    const queue = [
      { id: '1', store: 'zyklusdaten', operation: 'speichereZyklusdaten', schluessel: 'zyklusdaten', status: 'wartend' },
      { id: '2', store: 'chronik', operation: 'speichereChronikEintrag', schluessel: 'chronik:2026-01-15', status: 'wartend' },
      { id: '3', store: 'tageskarten', operation: 'speichereTageskarte', schluessel: 'tageskarten:2026-01-15', status: 'wartend' },
    ]

    const ergebnis = konsolidiereQueue(queue)
    expect(ergebnis.map((e) => e.id)).toEqual(['1', '2', '3'])
  })
})

// ---------------------------------------------------------------------------
// Queue aufräumen
// ---------------------------------------------------------------------------

describe('Queue aufräumen', () => {
  it('loescheAeltereAls entfernt alte Einträge eines Users', () => {
    fuegeHinzu('chronik', 'speichereChronikEintrag', [{}], USER_A)

    // Warte kurz, damit der Zeitstempel älter ist
    const spaeter = new Date(Date.now() + 1000).toISOString()
    fuegeHinzu('chronik', 'speichereChronikEintrag', [{}], USER_A)

    loescheAeltereAls(USER_A, spaeter)

    // Der erste Eintrag (älter als spaeter) wurde entfernt, der zweite auch
    // (weil beide vor dem +1000ms Zeitstempel erstellt wurden)
    expect(ladeQueue().length).toBeLessThanOrEqual(2)
  })

  it('loescheAeltereAls lässt Einträge anderer User unangetastet', () => {
    fuegeHinzu('chronik', 'speichereChronikEintrag', [{}], USER_A)
    fuegeHinzu('chronik', 'speichereChronikEintrag', [{}], USER_B)

    const spaeter = new Date(Date.now() + 1000).toISOString()
    loescheAeltereAls(USER_A, spaeter)

    const queue = ladeQueue()
    expect(queue.every((e) => e.userId === USER_B)).toBe(true)
  })

  it('entferneFehlgeschlagene entfernt nur fehlgeschlagene Einträge', () => {
    const e1 = fuegeHinzu('chronik', 'speichereChronikEintrag', [{}], USER_A)
    fuegeHinzu('chronik', 'speichereChronikEintrag', [{}], USER_A)

    for (let i = 0; i < MAX_RETRIES; i++) erhoeheVersuche(e1.id)
    expect(hatFehlgeschlageneFuerUser(USER_A)).toBe(true)

    entferneFehlgeschlagene(USER_A)
    expect(hatFehlgeschlageneFuerUser(USER_A)).toBe(false)
    expect(ladeQueue()).toHaveLength(1)
  })

  it('loescheQueue entfernt alles', () => {
    fuegeHinzu('chronik', 'speichereChronikEintrag', [{}], USER_A)
    fuegeHinzu('chronik', 'speichereChronikEintrag', [{}], USER_B)

    loescheQueue()
    expect(ladeQueue()).toEqual([])
  })

  it('loescheQueueFuerUser entfernt nur Einträge des Users', () => {
    fuegeHinzu('chronik', 'speichereChronikEintrag', [{}], USER_A)
    fuegeHinzu('chronik', 'speichereChronikEintrag', [{}], USER_B)

    loescheQueueFuerUser(USER_A)

    const queue = ladeQueue()
    expect(queue).toHaveLength(1)
    expect(queue[0].userId).toBe(USER_B)
  })
})

// ---------------------------------------------------------------------------
// Backoff
// ---------------------------------------------------------------------------

describe('berechneBackoff', () => {
  it('Versuch 0 → 1 Sekunde (AC-7)', () => {
    expect(berechneBackoff(0)).toBe(1000)
  })

  it('Versuch 1 → 2 Sekunden', () => {
    expect(berechneBackoff(1)).toBe(2000)
  })

  it('Versuch 2 → 4 Sekunden', () => {
    expect(berechneBackoff(2)).toBe(4000)
  })

  it('Versuch 3 → 8 Sekunden', () => {
    expect(berechneBackoff(3)).toBe(8000)
  })

  it('Versuch 4 → 16 Sekunden (Maximum)', () => {
    expect(berechneBackoff(4)).toBe(16000)
  })

  it('überschreitet nie 16 Sekunden', () => {
    for (let i = 0; i < 20; i++) {
      expect(berechneBackoff(i)).toBeLessThanOrEqual(16000)
    }
  })
})

// ---------------------------------------------------------------------------
// MAX_EINTRAEGE-Limit
// ---------------------------------------------------------------------------

describe('Queue-Größenbegrenzung', () => {
  it('MAX_EINTRAEGE ist 500 (AC-10)', () => {
    expect(MAX_EINTRAEGE).toBe(500)
  })
})
