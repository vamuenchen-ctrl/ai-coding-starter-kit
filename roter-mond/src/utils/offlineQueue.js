// ---------------------------------------------------------------------------
// Offline-Queue: Persistente Warteschlange für fehlgeschlagene Cloud-Writes
//
// PROJ-3: Fängt Netzwerkfehler bei Supabase-Schreibvorgängen ab und
// speichert die Operationen in localStorage. Wenn die App wieder online
// ist, werden sie automatisch in FIFO-Reihenfolge abgespielt.
// ---------------------------------------------------------------------------

import * as cloud from './speicherSupabase.js'

const QUEUE_KEY = 'rotermond_offline_queue'
export const MAX_EINTRAEGE = 500
export const MAX_RETRIES = 5
const BACKOFF_BASIS_MS = 1000

// ---------------------------------------------------------------------------
// Persistenz
// ---------------------------------------------------------------------------

export function ladeQueue() {
  try {
    const raw = localStorage.getItem(QUEUE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function speichereQueue(queue) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
  } catch {
    // localStorage voll → konsolidieren und erneut versuchen
    try {
      const konsolidiert = konsolidiereQueue(queue)
      localStorage.setItem(QUEUE_KEY, JSON.stringify(konsolidiert))
    } catch {
      // Speichern nicht möglich
    }
  }
}

// ---------------------------------------------------------------------------
// Konsolidierungsschlüssel
// ---------------------------------------------------------------------------

function datumStr(datum) {
  if (!datum) return ''
  if (datum instanceof Date) return datum.toISOString().slice(0, 10)
  return String(datum).slice(0, 10)
}

const BULK_OPS = [
  'speichereKorrekturen',
  'speichereZyklushistorie',
  'speichereChronik',
  'speichereTageskarten',
]

const EINZELOBJEKT_STORES = ['zyklusdaten', 'zyklustyp_hinweis', 'angepasste_grenzen']

export function berechneSchluessel(store, operation, args) {
  // Einzelobjekt-Stores: alle Operationen für denselben Store → neueste gewinnt
  if (EINZELOBJEKT_STORES.includes(store)) {
    return store
  }

  // Bulk-Operationen: ersetzen alle Einzeloperationen für den Store
  if (BULK_OPS.includes(operation)) {
    return `${store}:bulk`
  }

  // Eintragsbasierte Operationen: Schlüssel nach Datum
  let datum = null
  if (operation === 'speichereChronikEintrag' || operation === 'fuegeKorrekturHinzu') {
    datum = args[0]?.datum
  } else if (operation === 'speichereTageskarte') {
    datum = args[0] // Erstes Argument ist direkt das Datum
  } else if (operation === 'fuegeZyklusHinzu') {
    datum = args[0]?.startdatum
  } else if (operation === 'aktualisiereLetztenZyklus') {
    return `${store}:letzter`
  }

  if (datum) {
    return `${store}:${datumStr(datum)}`
  }

  // Fallback: kein Konsolidieren
  return `${store}:${operation}`
}

// ---------------------------------------------------------------------------
// Queue-Einträge verwalten
// ---------------------------------------------------------------------------

/**
 * Fügt eine fehlgeschlagene Cloud-Operation zur Queue hinzu.
 */
export function fuegeHinzu(store, operation, args, userId) {
  const queue = ladeQueue()

  const eintrag = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    zeitstempel: new Date().toISOString(),
    store,
    operation,
    args,
    userId,
    schluessel: berechneSchluessel(store, operation, args),
    versuche: 0,
    status: 'wartend',
  }

  queue.push(eintrag)

  // Bei Überschreitung konsolidieren
  if (queue.length > MAX_EINTRAEGE) {
    speichereQueue(konsolidiereQueue(queue))
  } else {
    speichereQueue(queue)
  }

  return eintrag
}

/**
 * Entfernt einen erfolgreich abgespielten Eintrag aus der Queue.
 */
export function entferneEintrag(id) {
  const queue = ladeQueue()
  speichereQueue(queue.filter((e) => e.id !== id))
}

/**
 * Erhöht den Versuchszähler eines Eintrags.
 * Markiert als 'fehlgeschlagen' wenn MAX_RETRIES erreicht.
 */
export function erhoeheVersuche(id) {
  const queue = ladeQueue()
  const eintrag = queue.find((e) => e.id === id)
  if (!eintrag) return

  eintrag.versuche += 1
  if (eintrag.versuche >= MAX_RETRIES) {
    eintrag.status = 'fehlgeschlagen'
  }
  speichereQueue(queue)
}

// ---------------------------------------------------------------------------
// Abfragen
// ---------------------------------------------------------------------------

export function anzahlWartend() {
  return ladeQueue().filter((e) => e.status === 'wartend').length
}

export function anzahlWartendFuerUser(userId) {
  return ladeQueue().filter((e) => e.userId === userId && e.status === 'wartend').length
}

export function hatFehlgeschlagene() {
  return ladeQueue().some((e) => e.status === 'fehlgeschlagen')
}

export function hatFehlgeschlageneFuerUser(userId) {
  return ladeQueue().some((e) => e.userId === userId && e.status === 'fehlgeschlagen')
}

export function anzahlFehlgeschlageneFuerUser(userId) {
  return ladeQueue().filter((e) => e.userId === userId && e.status === 'fehlgeschlagen').length
}

// ---------------------------------------------------------------------------
// Konsolidierung
// ---------------------------------------------------------------------------

/**
 * Fasst redundante Queue-Einträge zusammen:
 * - Mehrere Operationen für denselben Schlüssel → neueste gewinnt
 * - Bulk-Operationen ersetzen alle Einzeloperationen für denselben Store
 */
export function konsolidiereQueue(queue) {
  if (queue.length <= 1) return queue

  // Bulk-Stores identifizieren (von neuester zu ältester)
  const bulkStores = new Set()
  for (let i = queue.length - 1; i >= 0; i--) {
    if (BULK_OPS.includes(queue[i].operation)) {
      bulkStores.add(queue[i].store)
    }
  }

  // Von neuester zu ältester: pro Schlüssel nur den neuesten behalten
  const gesehen = new Set()
  const ergebnis = []

  for (let i = queue.length - 1; i >= 0; i--) {
    const e = queue[i]

    // Fehlgeschlagene Einträge behalten (werden separat angezeigt)
    if (e.status === 'fehlgeschlagen') {
      ergebnis.push(e)
      continue
    }

    // Einzeloperationen überspringen wenn Bulk für diesen Store existiert
    if (bulkStores.has(e.store) && !BULK_OPS.includes(e.operation)) {
      continue
    }

    if (!gesehen.has(e.schluessel)) {
      gesehen.add(e.schluessel)
      ergebnis.push(e)
    }
  }

  // Chronologische Reihenfolge wiederherstellen (FIFO)
  return ergebnis.reverse()
}

// ---------------------------------------------------------------------------
// Queue aufräumen
// ---------------------------------------------------------------------------

/**
 * Entfernt alle Einträge eines Users die vor dem angegebenen Zeitpunkt
 * erstellt wurden (nach erfolgreichem vollständigen Abgleich).
 */
export function loescheAeltereAls(userId, zeitstempel) {
  const queue = ladeQueue()
  speichereQueue(queue.filter(
    (e) => e.userId !== userId || e.zeitstempel > zeitstempel,
  ))
}

/**
 * Entfernt fehlgeschlagene Einträge eines Users aus der Queue.
 */
export function entferneFehlgeschlagene(userId) {
  const queue = ladeQueue()
  speichereQueue(queue.filter(
    (e) => !(e.userId === userId && e.status === 'fehlgeschlagen'),
  ))
}

/**
 * Löscht die gesamte Queue.
 */
export function loescheQueue() {
  localStorage.removeItem(QUEUE_KEY)
}

/**
 * Löscht alle Einträge eines bestimmten Users.
 */
export function loescheQueueFuerUser(userId) {
  const queue = ladeQueue()
  speichereQueue(queue.filter((e) => e.userId !== userId))
}

// ---------------------------------------------------------------------------
// Backoff-Berechnung
// ---------------------------------------------------------------------------

export function berechneBackoff(versuche) {
  return Math.min(BACKOFF_BASIS_MS * Math.pow(2, versuche), 16000)
}

// ---------------------------------------------------------------------------
// Queue-Verarbeitung (wird von SyncEngine aufgerufen)
// ---------------------------------------------------------------------------

/**
 * Verarbeitet die Queue für einen User: FIFO, konsolidiert, mit Retry.
 * Gibt ein Ergebnis-Objekt zurück.
 *
 * Stoppt beim ersten Fehler (FIFO-Reihenfolge beibehalten).
 */
export async function verarbeiteQueue(userId) {
  let queue = ladeQueue()
  if (queue.length === 0) return { verarbeitet: 0, verbleibend: 0, naechsterBackoff: 0 }

  // Nur Einträge dieses Users verarbeiten
  const wartend = queue.filter((e) => e.userId === userId && e.status === 'wartend')
  if (wartend.length === 0) return { verarbeitet: 0, verbleibend: 0, naechsterBackoff: 0 }

  // Konsolidieren
  queue = konsolidiereQueue(queue)
  speichereQueue(queue)

  let verarbeitet = 0
  const aktuellWartend = queue.filter((e) => e.userId === userId && e.status === 'wartend')

  for (const eintrag of aktuellWartend) {
    try {
      const fn = cloud[eintrag.operation]
      if (!fn) {
        // Unbekannte Operation → als fehlgeschlagen markieren
        erhoeheVersuche(eintrag.id)
        erhoeheVersuche(eintrag.id)
        erhoeheVersuche(eintrag.id)
        erhoeheVersuche(eintrag.id)
        erhoeheVersuche(eintrag.id) // 5x → fehlgeschlagen
        continue
      }

      await fn(userId, ...eintrag.args)
      entferneEintrag(eintrag.id)
      verarbeitet++
    } catch {
      erhoeheVersuche(eintrag.id)

      // Prüfe ob der Eintrag noch wartend ist (nicht fehlgeschlagen)
      const aktualisiert = ladeQueue().find((e) => e.id === eintrag.id)
      const istNochWartend = aktualisiert && aktualisiert.status === 'wartend'

      return {
        verarbeitet,
        verbleibend: anzahlWartendFuerUser(userId),
        naechsterBackoff: istNochWartend ? berechneBackoff(aktualisiert.versuche) : 0,
      }
    }
  }

  return {
    verarbeitet,
    verbleibend: anzahlWartendFuerUser(userId),
    naechsterBackoff: 0,
  }
}
