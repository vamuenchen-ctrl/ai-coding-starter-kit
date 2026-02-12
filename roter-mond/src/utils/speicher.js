// ---------------------------------------------------------------------------
// Speicher-Fassade: Write-Through-Cache
//
// Reads  → immer synchron aus localStorage (speicherLocal.js)
// Writes → localStorage zuerst (synchron), dann async an Supabase
//          + Feld-Zeitstempel für Merge (PROJ-2)
//          + Offline-Queue bei Fehlern (PROJ-3)
//
// Die Seiten-Komponenten importieren weiterhin aus dieser Datei und
// bemerken keine API-Änderung.
// ---------------------------------------------------------------------------

import * as local from './speicherLocal.js'
import * as cloud from './speicherSupabase.js'
import { schluesselVonDatum } from './mergeLogik.js'
import { fuegeHinzu as queueHinzu, loescheQueueFuerUser } from './offlineQueue.js'
import { stelleGuestIdSicher } from './guestId.js'

// ---------------------------------------------------------------------------
// Aktuelle User-ID (wird von AuthContext gesetzt)
// ---------------------------------------------------------------------------

let currentUserId = null

export function setCurrentUser(userId) {
  currentUserId = userId
}

export function getCurrentUser() {
  return currentUserId
}

// ---------------------------------------------------------------------------
// Schreib-Callback (wird von SyncEngine gesetzt, um eigene Events zu erkennen)
// ---------------------------------------------------------------------------

let onWriteCallback = null

export function setOnWriteCallback(cb) {
  onWriteCallback = cb
}

// ---------------------------------------------------------------------------
// Queue-Change-Callback (wird von SyncEngine gesetzt für Badge-Updates)
// ---------------------------------------------------------------------------

let onQueueChangeCallback = null

export function setOnQueueChangeCallback(cb) {
  onQueueChangeCallback = cb
}

// ---------------------------------------------------------------------------
// Zeitstempel-Helfer
// ---------------------------------------------------------------------------

function jetzt() {
  return new Date().toISOString()
}

/**
 * Aktualisiert Zeitstempel für geänderte Felder eines Einzelobjekts.
 * Gibt den neuen Zeitstempel-Objekt zurück.
 */
function aktualisiereObjektZeitstempel(alt, neu, altTs, felder) {
  const ts = { ...altTs }
  const zeit = jetzt()
  for (const feld of felder) {
    if (JSON.stringify(neu[feld]) !== JSON.stringify(alt[feld])) {
      ts[feld] = zeit
    }
  }
  return ts
}

// ---------------------------------------------------------------------------
// Cloud-Schreiben mit Queue-Fallback (PROJ-3)
// ---------------------------------------------------------------------------

/**
 * Versucht einen Cloud-Schreibvorgang. Bei Fehler wird die Operation
 * in die Offline-Queue gelegt statt den Fehler zu verschlucken.
 */
function cloudSchreiben(store, operation, args) {
  const fn = cloud[operation]
  if (!fn) return

  fn(currentUserId, ...args).catch((err) => {
    console.error(`[Speicher] Cloud-Schreibfehler (${operation}):`, err)
    queueHinzu(store, operation, args, currentUserId)
    if (onQueueChangeCallback) onQueueChangeCallback()
  })
}

// ---------------------------------------------------------------------------
// 1) Zyklusdaten
// ---------------------------------------------------------------------------

const ZYKLUSDATEN_FELDER = ['zyklusStart', 'zyklusLaenge', 'zyklusTyp', 'ersteinrichtungAbgeschlossen']

export function ladeZyklusdaten() {
  return local.ladeZyklusdaten()
}

export function speichereZyklusdaten(daten) {
  const alt = local.ladeZyklusdaten()
  const altTs = local.ladeZeitstempel('ZYKLUSDATEN')
  const neueTs = aktualisiereObjektZeitstempel(alt, daten, altTs, ZYKLUSDATEN_FELDER)

  local.speichereZyklusdaten(daten)
  local.speichereZeitstempel('ZYKLUSDATEN', neueTs)

  // PROJ-4: Guest-ID bei Ersteinrichtung im Gast-Modus sicherstellen
  if (daten.ersteinrichtungAbgeschlossen && !currentUserId) {
    stelleGuestIdSicher()
  }

  if (currentUserId) {
    cloudSchreiben('zyklusdaten', 'speichereZyklusdaten', [{ ...daten, feldZeitstempel: neueTs }])
    if (onWriteCallback) onWriteCallback('zyklusdaten')
  }
}

export function aktualisiereZyklusdaten(teilDaten) {
  const alt = local.ladeZyklusdaten()
  const neu = { ...alt, ...teilDaten }
  const altTs = local.ladeZeitstempel('ZYKLUSDATEN')
  const neueTs = aktualisiereObjektZeitstempel(alt, neu, altTs, ZYKLUSDATEN_FELDER)

  local.aktualisiereZyklusdaten(teilDaten)
  local.speichereZeitstempel('ZYKLUSDATEN', neueTs)
  if (currentUserId) {
    cloudSchreiben('zyklusdaten', 'aktualisiereZyklusdaten', [{ ...teilDaten, feldZeitstempel: neueTs }])
    if (onWriteCallback) onWriteCallback('zyklusdaten')
  }
}

// ---------------------------------------------------------------------------
// 2) Phasenkorrekturen
// ---------------------------------------------------------------------------

export function ladeKorrekturen() {
  return local.ladeKorrekturen()
}

export function speichereKorrekturen(korrekturen) {
  const zeit = jetzt()
  const alleTs = local.ladeZeitstempel('KORREKTUREN')

  // Alle Einträge bekommen den aktuellen Zeitstempel
  for (const k of korrekturen) {
    const key = schluesselVonDatum(k.datum)
    if (key) alleTs[key] = zeit
  }

  local.speichereKorrekturen(korrekturen)
  local.speichereZeitstempel('KORREKTUREN', alleTs)
  if (currentUserId) {
    const mitTs = korrekturen.map((k) => {
      const key = schluesselVonDatum(k.datum)
      return { ...k, feldZeitstempel: { _updated: alleTs[key] || zeit } }
    })
    cloudSchreiben('korrekturen', 'speichereKorrekturen', [mitTs])
    if (onWriteCallback) onWriteCallback('korrekturen')
  }
}

export function fuegeKorrekturHinzu(korrektur) {
  const zeit = jetzt()
  const alleTs = local.ladeZeitstempel('KORREKTUREN')
  const key = schluesselVonDatum(korrektur.datum)
  if (key) alleTs[key] = zeit

  local.fuegeKorrekturHinzu(korrektur)
  local.speichereZeitstempel('KORREKTUREN', alleTs)
  if (currentUserId) {
    cloudSchreiben('korrekturen', 'fuegeKorrekturHinzu', [{ ...korrektur, feldZeitstempel: { _updated: zeit } }])
    if (onWriteCallback) onWriteCallback('korrekturen')
  }
}

// ---------------------------------------------------------------------------
// 3) Zyklushistorie
// ---------------------------------------------------------------------------

export function ladeZyklushistorie() {
  return local.ladeZyklushistorie()
}

export function speichereZyklushistorie(historie) {
  const zeit = jetzt()
  const alleTs = {}

  for (const h of historie) {
    const key = schluesselVonDatum(h.startdatum)
    if (key) alleTs[key] = zeit
  }

  local.speichereZyklushistorie(historie)
  local.speichereZeitstempel('HISTORIE', alleTs)
  if (currentUserId) {
    const mitTs = historie.map((h) => {
      const key = schluesselVonDatum(h.startdatum)
      return { ...h, feldZeitstempel: { _updated: alleTs[key] || zeit } }
    })
    cloudSchreiben('zyklushistorie', 'speichereZyklushistorie', [mitTs])
    if (onWriteCallback) onWriteCallback('zyklushistorie')
  }
}

export function fuegeZyklusHinzu(eintrag) {
  const zeit = jetzt()
  const alleTs = local.ladeZeitstempel('HISTORIE')
  const key = schluesselVonDatum(eintrag.startdatum)
  if (key) alleTs[key] = zeit

  local.fuegeZyklusHinzu(eintrag)
  local.speichereZeitstempel('HISTORIE', alleTs)
  if (currentUserId) {
    cloudSchreiben('zyklushistorie', 'fuegeZyklusHinzu', [{ ...eintrag, feldZeitstempel: { _updated: zeit } }])
    if (onWriteCallback) onWriteCallback('zyklushistorie')
  }
}

export function aktualisiereLetztenZyklus(teilDaten) {
  const zeit = jetzt()
  const historie = local.ladeZyklushistorie()
  if (historie.length > 0) {
    const letzter = historie[historie.length - 1]
    const key = schluesselVonDatum(letzter.startdatum)
    if (key) {
      const alleTs = local.ladeZeitstempel('HISTORIE')
      alleTs[key] = zeit
      local.speichereZeitstempel('HISTORIE', alleTs)
    }
  }

  local.aktualisiereLetztenZyklus(teilDaten)
  if (currentUserId) {
    cloudSchreiben('zyklushistorie', 'aktualisiereLetztenZyklus', [teilDaten])
    if (onWriteCallback) onWriteCallback('zyklushistorie')
  }
}

// ---------------------------------------------------------------------------
// 4) Chronik-Einträge
// ---------------------------------------------------------------------------

const CHRONIK_FELDER = ['stimmung', 'energie', 'koerper', 'traeume', 'kreativitaet', 'sexuellesEmpfinden', 'phase']

export function ladeChronik() {
  return local.ladeChronik()
}

export function speichereChronik(chronik) {
  const zeit = jetzt()
  const alleTs = {}

  // Bei Bulk-Speicherung alle Felder timestampen
  for (const e of chronik) {
    const key = schluesselVonDatum(e.datum)
    if (key) {
      const ts = {}
      for (const f of CHRONIK_FELDER) {
        ts[f] = zeit
      }
      alleTs[key] = ts
    }
  }

  local.speichereChronik(chronik)
  local.speichereZeitstempel('CHRONIK', alleTs)
  if (currentUserId) {
    const mitTs = chronik.map((e) => {
      const key = schluesselVonDatum(e.datum)
      return { ...e, feldZeitstempel: alleTs[key] || {} }
    })
    cloudSchreiben('chronik', 'speichereChronik', [mitTs])
    if (onWriteCallback) onWriteCallback('chronik')
  }
}

export function speichereChronikEintrag(eintrag) {
  const alter = local.ladeChronikEintrag(eintrag.datum)
  const alleTs = local.ladeZeitstempel('CHRONIK')
  const datumKey = schluesselVonDatum(eintrag.datum)
  const altTs = (datumKey && alleTs[datumKey]) || {}
  const zeit = jetzt()
  const neueTs = { ...altTs }

  for (const f of CHRONIK_FELDER) {
    if (JSON.stringify(eintrag[f]) !== JSON.stringify(alter?.[f])) {
      neueTs[f] = zeit
    }
  }

  if (datumKey) alleTs[datumKey] = neueTs

  local.speichereChronikEintrag(eintrag)
  local.speichereZeitstempel('CHRONIK', alleTs)
  if (currentUserId) {
    cloudSchreiben('chronik', 'speichereChronikEintrag', [{ ...eintrag, feldZeitstempel: neueTs }])
    if (onWriteCallback) onWriteCallback('chronik')
  }
}

export function ladeChronikEintrag(datum) {
  return local.ladeChronikEintrag(datum)
}

// ---------------------------------------------------------------------------
// 5) Gezogene Tageskarten
// ---------------------------------------------------------------------------

export function ladeTageskarten() {
  return local.ladeTageskarten()
}

export function speichereTageskarten(karten) {
  const zeit = jetzt()
  const alleTs = local.ladeZeitstempel('TAGESKARTEN')

  for (const k of karten) {
    const key = schluesselVonDatum(k.datum)
    if (key) alleTs[key] = zeit
  }

  local.speichereTageskarten(karten)
  local.speichereZeitstempel('TAGESKARTEN', alleTs)
  if (currentUserId) {
    const mitTs = karten.map((k) => {
      const key = schluesselVonDatum(k.datum)
      return { ...k, feldZeitstempel: { _updated: alleTs[key] || zeit } }
    })
    cloudSchreiben('tageskarten', 'speichereTageskarten', [mitTs])
    if (onWriteCallback) onWriteCallback('tageskarten')
  }
}

export function speichereTageskarte(datum, kartenId) {
  const zeit = jetzt()
  const alleTs = local.ladeZeitstempel('TAGESKARTEN')
  const key = schluesselVonDatum(datum)
  if (key) alleTs[key] = zeit

  local.speichereTageskarte(datum, kartenId)
  local.speichereZeitstempel('TAGESKARTEN', alleTs)
  if (currentUserId) {
    cloudSchreiben('tageskarten', 'speichereTageskarte', [datum, kartenId, { _updated: zeit }])
    if (onWriteCallback) onWriteCallback('tageskarten')
  }
}

export function ladeHeutigeTageskarte() {
  return local.ladeHeutigeTageskarte()
}

// ---------------------------------------------------------------------------
// 6) Zyklustyp-Hinweis
// ---------------------------------------------------------------------------

const HINWEIS_FELDER = ['letzterHinweis', 'nutzerinHatAbgelehnt', 'ablehnungsDatum']

export function ladeZyklustypHinweis() {
  return local.ladeZyklustypHinweis()
}

export function speichereZyklustypHinweis(daten) {
  const alt = local.ladeZyklustypHinweis()
  const altTs = local.ladeZeitstempel('ZYKLUSTYP_HINWEIS')
  const neueTs = aktualisiereObjektZeitstempel(alt, daten, altTs, HINWEIS_FELDER)

  local.speichereZyklustypHinweis(daten)
  local.speichereZeitstempel('ZYKLUSTYP_HINWEIS', neueTs)
  if (currentUserId) {
    cloudSchreiben('zyklustyp_hinweis', 'speichereZyklustypHinweis', [{ ...daten, feldZeitstempel: neueTs }])
    if (onWriteCallback) onWriteCallback('zyklustyp_hinweis')
  }
}

export function markiereHinweisAlsGezeigt() {
  const alt = local.ladeZyklustypHinweis()
  const altTs = local.ladeZeitstempel('ZYKLUSTYP_HINWEIS')
  const zeit = jetzt()
  const neueTs = { ...altTs, letzterHinweis: zeit }

  local.markiereHinweisAlsGezeigt()
  local.speichereZeitstempel('ZYKLUSTYP_HINWEIS', neueTs)
  if (currentUserId) {
    cloudSchreiben('zyklustyp_hinweis', 'markiereHinweisAlsGezeigt', [])
    if (onWriteCallback) onWriteCallback('zyklustyp_hinweis')
  }
}

export function markiereHinweisAlsAbgelehnt() {
  const zeit = jetzt()
  const neueTs = { letzterHinweis: zeit, nutzerinHatAbgelehnt: zeit, ablehnungsDatum: zeit }

  local.markiereHinweisAlsAbgelehnt()
  local.speichereZeitstempel('ZYKLUSTYP_HINWEIS', neueTs)
  if (currentUserId) {
    cloudSchreiben('zyklustyp_hinweis', 'markiereHinweisAlsAbgelehnt', [])
    if (onWriteCallback) onWriteCallback('zyklustyp_hinweis')
  }
}

export function setzeHinweisZurueck() {
  const zeit = jetzt()
  const neueTs = { letzterHinweis: zeit, nutzerinHatAbgelehnt: zeit, ablehnungsDatum: zeit }

  local.setzeHinweisZurueck()
  local.speichereZeitstempel('ZYKLUSTYP_HINWEIS', neueTs)
  if (currentUserId) {
    cloudSchreiben('zyklustyp_hinweis', 'setzeHinweisZurueck', [])
    if (onWriteCallback) onWriteCallback('zyklustyp_hinweis')
  }
}

// ---------------------------------------------------------------------------
// 7) Angepasste Phasengrenzen
// ---------------------------------------------------------------------------

export function ladeAngepassteGrenzen() {
  return local.ladeAngepassteGrenzen()
}

export function speichereAngepassteGrenzen(grenzen) {
  const zeit = jetzt()

  local.speichereAngepassteGrenzen(grenzen)
  local.speichereZeitstempel('ANGEPASSTE_GRENZEN', zeit)
  if (currentUserId) {
    cloudSchreiben('angepasste_grenzen', 'speichereAngepassteGrenzen', [grenzen, { _updated: zeit }])
    if (onWriteCallback) onWriteCallback('angepasste_grenzen')
  }
}

export function setzeGrenzenZurueck() {
  const zeit = jetzt()

  local.setzeGrenzenZurueck()
  local.speichereZeitstempel('ANGEPASSTE_GRENZEN', zeit)
  if (currentUserId) {
    cloudSchreiben('angepasste_grenzen', 'setzeGrenzenZurueck', [])
    if (onWriteCallback) onWriteCallback('angepasste_grenzen')
  }
}

// ---------------------------------------------------------------------------
// Alle Daten löschen
// ---------------------------------------------------------------------------

export async function loescheAlleDaten() {
  local.loescheAlleDaten()
  // Queue des aktuellen Users löschen (Einträge verweisen auf gelöschte Daten)
  if (currentUserId) {
    loescheQueueFuerUser(currentUserId)
    await cloud.loescheAlleDaten(currentUserId)
  }
}
