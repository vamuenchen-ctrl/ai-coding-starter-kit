import { berechneMondphase } from './mondphasen'

/**
 * Formatiert ein Date-Objekt als YYYY-MM-DD String.
 */
export function datumAlsString(datum) {
  const j = datum.getFullYear()
  const m = String(datum.getMonth() + 1).padStart(2, '0')
  const t = String(datum.getDate()).padStart(2, '0')
  return `${j}-${m}-${t}`
}

/**
 * Parst einen YYYY-MM-DD String als Date-Objekt (lokale Zeit).
 */
export function stringAlsDatum(str) {
  if (!str) return null
  const [j, m, t] = str.split('-').map(Number)
  return new Date(j, m - 1, t)
}

/**
 * Validiert und führt eine Startdatum-Korrektur in der Zyklushistorie durch.
 *
 * @param {Object} params
 * @param {string} params.neuesDatumStr - Neues Datum als 'YYYY-MM-DD' String
 * @param {Date}   params.bisherigStartdatum - Das bisherige Startdatum des Eintrags
 * @param {Array}  params.historie - Die aktuelle Zyklushistorie (wird NICHT mutiert)
 * @returns {{ erfolg: boolean, fehler?: string, historie?: Array, istAktuellsterZyklus: boolean }}
 */
export function korrigiereZyklusStartDatum({ neuesDatumStr, bisherigStartdatum, historie }) {
  const neuesDate = stringAlsDatum(neuesDatumStr)
  if (!neuesDate) {
    return { erfolg: false, fehler: 'Bitte ein gültiges Datum eingeben.', istAktuellsterZyklus: false }
  }

  // Zukunfts-Check
  const heute = new Date()
  heute.setHours(23, 59, 59, 999)
  if (neuesDate > heute) {
    return { erfolg: false, fehler: 'Das Datum darf nicht in der Zukunft liegen.', istAktuellsterZyklus: false }
  }

  // Unverändert-Check
  const bisherigKey = datumAlsString(bisherigStartdatum)
  if (neuesDatumStr === bisherigKey) {
    return { erfolg: false, fehler: 'Das Datum ist unverändert.', istAktuellsterZyklus: false }
  }

  // Kopie erstellen (nicht mutieren)
  const neueHistorie = historie.map((h) => ({ ...h }))

  // Finde den Index des zu korrigierenden Eintrags
  const index = neueHistorie.findIndex(
    (h) => h.startdatum && datumAlsString(h.startdatum) === bisherigKey
  )
  if (index === -1) {
    return { erfolg: false, fehler: 'Eintrag nicht gefunden.', istAktuellsterZyklus: false }
  }

  // Duplikat-Check
  const duplikat = neueHistorie.some(
    (h, i) => i !== index && h.startdatum && datumAlsString(h.startdatum) === neuesDatumStr
  )
  if (duplikat) {
    return { erfolg: false, fehler: 'An diesem Datum existiert bereits ein Menstruationsbeginn.', istAktuellsterZyklus: false }
  }

  // Reihenfolge-Check
  if (index > 0) {
    const vorgaenger = neueHistorie[index - 1]
    if (vorgaenger.startdatum && neuesDate <= vorgaenger.startdatum) {
      return { erfolg: false, fehler: 'Das Datum muss nach dem vorherigen Menstruationsbeginn liegen.', istAktuellsterZyklus: false }
    }
  }
  if (index < neueHistorie.length - 1) {
    const nachfolger = neueHistorie[index + 1]
    if (nachfolger.startdatum && neuesDate >= nachfolger.startdatum) {
      return { erfolg: false, fehler: 'Das Datum muss vor dem nächsten Menstruationsbeginn liegen.', istAktuellsterZyklus: false }
    }
  }

  // --- Alles valide, jetzt aktualisieren ---

  // 1. Startdatum aktualisieren
  neueHistorie[index] = { ...neueHistorie[index], startdatum: neuesDate }

  // 2. Mondphase neu berechnen
  const neueMondphase = berechneMondphase(neuesDate)
  neueHistorie[index].mondphase = neueMondphase.phase

  // 3. Zykluslänge des vorherigen Zyklus neu berechnen
  if (index > 0 && neueHistorie[index - 1].startdatum) {
    const diffVorher = Math.round(
      (neuesDate - neueHistorie[index - 1].startdatum) / (1000 * 60 * 60 * 24)
    )
    neueHistorie[index - 1] = { ...neueHistorie[index - 1], zyklusLaenge: diffVorher }
  }

  // 4. Zykluslänge des korrigierten Zyklus neu berechnen (falls Nachfolger existiert)
  if (index < neueHistorie.length - 1 && neueHistorie[index + 1].startdatum) {
    const diffNachher = Math.round(
      (neueHistorie[index + 1].startdatum - neuesDate) / (1000 * 60 * 60 * 24)
    )
    neueHistorie[index] = { ...neueHistorie[index], zyklusLaenge: diffNachher }
  }

  const istAktuellsterZyklus = index === neueHistorie.length - 1

  return { erfolg: true, historie: neueHistorie, istAktuellsterZyklus }
}
