// ---------------------------------------------------------------------------
// Sync-Engine Hilfsfunktionen (pure Logik, testbar ohne React)
// ---------------------------------------------------------------------------

export const TABELLEN = [
  'zyklusdaten',
  'korrekturen',
  'zyklushistorie',
  'chronik',
  'tageskarten',
  'zyklustyp_hinweis',
  'angepasste_grenzen',
]

export const DEBOUNCE_MS = 500
export const EIGENES_EVENT_FENSTER_MS = 3000
export const EIGENES_EVENT_AUFRAEUM_MS = 5000
export const SICHTBARKEIT_MIN_ABSTAND_MS = 30000
export const MAX_BACKOFF_MS = 16000
export const FULL_PULL_RETRIES = 2
export const FULL_PULL_RETRY_DELAY_MS = 2000

// ---------------------------------------------------------------------------
// Eigene-Event-Erkennung
// Prüft ob ein eingehendes Realtime-Event von diesem Gerät stammt.
// Gibt den Index des Matches zurück, oder -1 wenn es ein fremdes Event ist.
// ---------------------------------------------------------------------------

export function findeEigenesEvent(eigene, tabelle, jetzt) {
  return eigene.findIndex(
    (e) => e.table === tabelle && jetzt - e.zeit < EIGENES_EVENT_FENSTER_MS,
  )
}

// ---------------------------------------------------------------------------
// Backoff-Berechnung für Reconnection
// ---------------------------------------------------------------------------

export function berechneBackoffDelay(attempt) {
  return Math.min(1000 * Math.pow(2, attempt), MAX_BACKOFF_MS)
}
