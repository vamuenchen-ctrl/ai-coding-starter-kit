// ---------------------------------------------------------------------------
// Guest-ID: Anonyme Kennung für Gast-Nutzerinnen
//
// Wird bei der Ersteinrichtung im Gast-Modus erzeugt und identifiziert,
// WELCHE Person als Gast auf diesem Gerät Daten erfasst hat.
// Beim Login wird die guest_id mit dem Supabase-Account verglichen,
// um fremde Gaeste-Daten zu erkennen (PROJ-4, AC-9).
// ---------------------------------------------------------------------------

const GUEST_ID_KEY = 'rotermond_guest_id'

/**
 * Erzeugt eine neue zufällige Guest-ID im Format "g_<hex>".
 */
export function erzeugeGuestId() {
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  return `g_${hex}`
}

/**
 * Lädt die gespeicherte Guest-ID aus localStorage.
 * Gibt null zurück wenn keine vorhanden.
 */
export function ladeGuestId() {
  try {
    return localStorage.getItem(GUEST_ID_KEY) || null
  } catch {
    return null
  }
}

/**
 * Speichert eine Guest-ID in localStorage.
 */
export function speichereGuestId(id) {
  try {
    localStorage.setItem(GUEST_ID_KEY, id)
  } catch {
    // localStorage voll – ignorieren
  }
}

/**
 * Stellt sicher, dass eine Guest-ID vorhanden ist.
 * Erzeugt eine neue, falls keine existiert.
 * Gibt die (bestehende oder neue) ID zurück.
 */
export function stelleGuestIdSicher() {
  let id = ladeGuestId()
  if (!id) {
    id = erzeugeGuestId()
    speichereGuestId(id)
  }
  return id
}

/**
 * Löscht die Guest-ID aus localStorage.
 */
export function loescheGuestId() {
  try {
    localStorage.removeItem(GUEST_ID_KEY)
  } catch {
    // ignorieren
  }
}
