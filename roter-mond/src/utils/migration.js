// ---------------------------------------------------------------------------
// Migration: Hilfsfunktionen für Daten-Erkennung
// ---------------------------------------------------------------------------

import * as local from './speicherLocal.js'
import * as cloud from './speicherSupabase.js'

/**
 * Prüft ob die Nutzerin bereits Daten in Supabase hat.
 */
export async function hatCloudDaten(userId) {
  const daten = await cloud.ladeZyklusdaten(userId)
  return daten.ersteinrichtungAbgeschlossen === true
}

/**
 * Prüft ob lokal eingerichtete Daten vorhanden sind.
 */
export function hatLokaleDaten() {
  const daten = local.ladeZyklusdaten()
  return daten.ersteinrichtungAbgeschlossen === true
}
