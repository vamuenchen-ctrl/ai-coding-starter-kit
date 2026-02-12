// ---------------------------------------------------------------------------
// MigrationsManager: Zentrale Steuerung der Gaeste-Migration (PROJ-4)
//
// Entscheidet den Migrationspfad (hochladen, herunterladen, merge, fremddaten),
// führt die Migration Store für Store durch und meldet Fortschritt an die UI.
// ---------------------------------------------------------------------------

import * as local from './speicherLocal.js'
import * as cloud from './speicherSupabase.js'
import { schluesselVonDatum, mergeAlleStores } from './mergeLogik.js'
import { ladeGuestId, stelleGuestIdSicher, loescheGuestId } from './guestId.js'
import { hatCloudDaten, hatLokaleDaten } from './migration.js'

// ---------------------------------------------------------------------------
// Store-Schritte (Reihenfolge für Fortschrittsanzeige)
// ---------------------------------------------------------------------------

export const STORE_SCHRITTE = [
  { key: 'zyklusdaten', label: 'Zyklusdaten' },
  { key: 'korrekturen', label: 'Korrekturen' },
  { key: 'historie', label: 'Zyklushistorie' },
  { key: 'chronik', label: 'Chronik' },
  { key: 'tageskarten', label: 'Tageskarten' },
  { key: 'hinweis', label: 'Zyklustyp-Hinweis' },
  { key: 'grenzen', label: 'Angepasste Grenzen' },
]

// ---------------------------------------------------------------------------
// Pfad-Erkennung
// ---------------------------------------------------------------------------

/**
 * Erkennt den Migrationspfad anhand lokaler/Cloud-Daten und Guest-ID.
 *
 * @returns {'nichts'|'hochladen'|'herunterladen'|'zusammenfuehren'|'fremddaten'}
 */
export async function erkennePfad(userId) {
  const cloudVorhanden = await hatCloudDaten(userId)
  const lokalVorhanden = hatLokaleDaten()

  if (!cloudVorhanden && !lokalVorhanden) return 'nichts'
  if (!cloudVorhanden && lokalVorhanden) return 'hochladen'
  if (cloudVorhanden && !lokalVorhanden) return 'herunterladen'

  // Beide Seiten haben Daten → Guest-ID prüfen
  const lokaleGuestId = ladeGuestId()
  const cloudDaten = await cloud.ladeZyklusdaten(userId)
  const cloudGuestId = cloudDaten.guestId

  // Fremde Gast-Daten: Beide IDs existieren, stimmen aber nicht überein
  if (cloudGuestId && lokaleGuestId && cloudGuestId !== lokaleGuestId) {
    return 'fremddaten'
  }

  return 'zusammenfuehren'
}

// ---------------------------------------------------------------------------
// Helfer für Timestamp-Generierung (analog zu migration.js)
// ---------------------------------------------------------------------------

function ohneTs(arr) {
  return arr.map(({ feldZeitstempel, ...rest }) => rest)
}

// ---------------------------------------------------------------------------
// Pfad 1: Hochladen (nur lokale Daten → Cloud)
// ---------------------------------------------------------------------------

async function hochladen(userId, fortschritt) {
  const zeit = new Date().toISOString()
  const guestId = stelleGuestIdSicher()

  // Store 1: Zyklusdaten
  fortschritt({ schritt: 1, label: STORE_SCHRITTE[0].label })
  const zyklusdaten = local.ladeZyklusdaten()
  if (zyklusdaten.ersteinrichtungAbgeschlossen) {
    const ts = {}
    for (const f of ['zyklusStart', 'zyklusLaenge', 'zyklusTyp', 'ersteinrichtungAbgeschlossen']) {
      ts[f] = zeit
    }
    local.speichereZeitstempel('ZYKLUSDATEN', ts)
    await cloud.speichereZyklusdaten(userId, { ...zyklusdaten, feldZeitstempel: ts, guestId })
  }

  // Store 2: Korrekturen
  fortschritt({ schritt: 2, label: STORE_SCHRITTE[1].label })
  const korrekturen = local.ladeKorrekturen()
  if (korrekturen.length > 0) {
    const ts = {}
    const mitTs = korrekturen.map((k) => {
      const key = schluesselVonDatum(k.datum)
      if (key) ts[key] = zeit
      return { ...k, feldZeitstempel: { _updated: zeit } }
    })
    local.speichereZeitstempel('KORREKTUREN', ts)
    await cloud.speichereKorrekturen(userId, mitTs)
  }

  // Store 3: Zyklushistorie
  fortschritt({ schritt: 3, label: STORE_SCHRITTE[2].label })
  const historie = local.ladeZyklushistorie()
  if (historie.length > 0) {
    const ts = {}
    const mitTs = historie.map((h) => {
      const key = schluesselVonDatum(h.startdatum)
      if (key) ts[key] = zeit
      return { ...h, feldZeitstempel: { _updated: zeit } }
    })
    local.speichereZeitstempel('HISTORIE', ts)
    await cloud.speichereZyklushistorie(userId, mitTs)
  }

  // Store 4: Chronik
  fortschritt({ schritt: 4, label: STORE_SCHRITTE[3].label })
  const chronik = local.ladeChronik()
  if (chronik.length > 0) {
    const alleTs = {}
    const FELDER = ['stimmung', 'energie', 'koerper', 'traeume', 'kreativitaet', 'sexuellesEmpfinden', 'phase']
    const mitTs = chronik.map((e) => {
      const key = schluesselVonDatum(e.datum)
      const feldTs = {}
      for (const f of FELDER) feldTs[f] = zeit
      if (key) alleTs[key] = feldTs
      return { ...e, feldZeitstempel: feldTs }
    })
    local.speichereZeitstempel('CHRONIK', alleTs)
    await cloud.speichereChronik(userId, mitTs)
  }

  // Store 5: Tageskarten
  fortschritt({ schritt: 5, label: STORE_SCHRITTE[4].label })
  const tageskarten = local.ladeTageskarten()
  if (tageskarten.length > 0) {
    const ts = {}
    const mitTs = tageskarten.map((k) => {
      const key = schluesselVonDatum(k.datum)
      if (key) ts[key] = zeit
      return { ...k, feldZeitstempel: { _updated: zeit } }
    })
    local.speichereZeitstempel('TAGESKARTEN', ts)
    await cloud.speichereTageskarten(userId, mitTs)
  }

  // Store 6: Zyklustyp-Hinweis
  fortschritt({ schritt: 6, label: STORE_SCHRITTE[5].label })
  const hinweis = local.ladeZyklustypHinweis()
  const hinweisTs = {}
  for (const f of ['letzterHinweis', 'nutzerinHatAbgelehnt', 'ablehnungsDatum']) {
    hinweisTs[f] = zeit
  }
  local.speichereZeitstempel('ZYKLUSTYP_HINWEIS', hinweisTs)
  await cloud.speichereZyklustypHinweis(userId, { ...hinweis, feldZeitstempel: hinweisTs })

  // Store 7: Angepasste Grenzen
  fortschritt({ schritt: 7, label: STORE_SCHRITTE[6].label })
  const grenzen = local.ladeAngepassteGrenzen()
  if (grenzen) {
    local.speichereZeitstempel('ANGEPASSTE_GRENZEN', zeit)
    await cloud.speichereAngepassteGrenzen(userId, grenzen, { _updated: zeit })
  }
}

// ---------------------------------------------------------------------------
// Pfad 2: Herunterladen (nur Cloud-Daten → lokal)
// ---------------------------------------------------------------------------

async function herunterladen(userId, fortschritt) {
  // Store 1: Zyklusdaten
  fortschritt({ schritt: 1, label: STORE_SCHRITTE[0].label })
  const zyklusdaten = await cloud.ladeZyklusdaten(userId)
  const { feldZeitstempel: zyklusdatenTs, guestId: _gid, ...zyklusdatenClean } = zyklusdaten
  local.speichereZyklusdaten(zyklusdatenClean)
  local.speichereZeitstempel('ZYKLUSDATEN', zyklusdatenTs || {})

  // Store 2: Korrekturen
  fortschritt({ schritt: 2, label: STORE_SCHRITTE[1].label })
  const korrekturen = await cloud.ladeKorrekturen(userId)
  const korrekturenTs = {}
  for (const k of korrekturen) {
    const key = schluesselVonDatum(k.datum)
    if (key) korrekturenTs[key] = k.feldZeitstempel?._updated || ''
  }
  local.speichereKorrekturen(ohneTs(korrekturen))
  local.speichereZeitstempel('KORREKTUREN', korrekturenTs)

  // Store 3: Zyklushistorie
  fortschritt({ schritt: 3, label: STORE_SCHRITTE[2].label })
  const historie = await cloud.ladeZyklushistorie(userId)
  const historieTs = {}
  for (const h of historie) {
    const key = schluesselVonDatum(h.startdatum)
    if (key) historieTs[key] = h.feldZeitstempel?._updated || ''
  }
  local.speichereZyklushistorie(ohneTs(historie))
  local.speichereZeitstempel('HISTORIE', historieTs)

  // Store 4: Chronik
  fortschritt({ schritt: 4, label: STORE_SCHRITTE[3].label })
  const chronik = await cloud.ladeChronik(userId)
  const chronikTs = {}
  for (const e of chronik) {
    const key = schluesselVonDatum(e.datum)
    if (key) chronikTs[key] = e.feldZeitstempel || {}
  }
  local.speichereChronik(ohneTs(chronik))
  local.speichereZeitstempel('CHRONIK', chronikTs)

  // Store 5: Tageskarten
  fortschritt({ schritt: 5, label: STORE_SCHRITTE[4].label })
  const tageskarten = await cloud.ladeTageskarten(userId)
  const tageskartenTs = {}
  for (const k of tageskarten) {
    const key = schluesselVonDatum(k.datum)
    if (key) tageskartenTs[key] = k.feldZeitstempel?._updated || ''
  }
  local.speichereTageskarten(ohneTs(tageskarten))
  local.speichereZeitstempel('TAGESKARTEN', tageskartenTs)

  // Store 6: Zyklustyp-Hinweis
  fortschritt({ schritt: 6, label: STORE_SCHRITTE[5].label })
  const hinweis = await cloud.ladeZyklustypHinweis(userId)
  const { feldZeitstempel: hinweisTs, ...hinweisClean } = hinweis
  local.speichereZyklustypHinweis(hinweisClean)
  local.speichereZeitstempel('ZYKLUSTYP_HINWEIS', hinweisTs || {})

  // Store 7: Angepasste Grenzen
  fortschritt({ schritt: 7, label: STORE_SCHRITTE[6].label })
  const grenzenResult = await cloud.ladeAngepassteGrenzen(userId)
  if (grenzenResult.grenzen) {
    local.speichereAngepassteGrenzen(grenzenResult.grenzen)
  } else {
    local.setzeGrenzenZurueck()
  }
  local.speichereZeitstempel('ANGEPASSTE_GRENZEN', grenzenResult.feldZeitstempel?._updated || '')
}

// ---------------------------------------------------------------------------
// Pfad 3: Zusammenführen (Feld-Level-Merge beider Seiten)
// ---------------------------------------------------------------------------

async function zusammenfuehren(userId, fortschritt) {
  const guestId = stelleGuestIdSicher()

  // Alle Cloud-Daten in einem Schritt laden
  fortschritt({ schritt: 0, label: 'Daten werden geladen' })
  const cloudRoh = await cloud.ladeAlleDaten(userId)
  if (!cloudRoh) return

  // Lokale Daten + Zeitstempel
  const lokaleDaten = {
    zyklusdaten: local.ladeZyklusdaten(),
    korrekturen: local.ladeKorrekturen(),
    historie: local.ladeZyklushistorie(),
    chronik: local.ladeChronik(),
    tageskarten: local.ladeTageskarten(),
    hinweis: local.ladeZyklustypHinweis(),
    grenzen: local.ladeAngepassteGrenzen(),
  }
  const lokaleTs = {
    zyklusdaten: local.ladeZeitstempel('ZYKLUSDATEN'),
    korrekturen: local.ladeZeitstempel('KORREKTUREN'),
    historie: local.ladeZeitstempel('HISTORIE'),
    chronik: local.ladeZeitstempel('CHRONIK'),
    tageskarten: local.ladeZeitstempel('TAGESKARTEN'),
    hinweis: local.ladeZeitstempel('ZYKLUSTYP_HINWEIS'),
    grenzen: local.ladeZeitstempel('ANGEPASSTE_GRENZEN'),
  }

  // Cloud-Zeitstempel extrahieren
  function arrayTs(eintraege, schluesselFn) {
    const ts = {}
    for (const e of eintraege) {
      const key = schluesselFn(e)
      if (key && e.feldZeitstempel) ts[key] = e.feldZeitstempel._updated || ''
    }
    return ts
  }
  function chronikTsFn(eintraege) {
    const ts = {}
    for (const e of eintraege) {
      const key = schluesselVonDatum(e.datum)
      if (key && e.feldZeitstempel) ts[key] = e.feldZeitstempel
    }
    return ts
  }

  const cloudTs = {
    zyklusdaten: cloudRoh.zyklusdaten?.feldZeitstempel || {},
    korrekturen: arrayTs(cloudRoh.korrekturen || [], (e) => schluesselVonDatum(e.datum)),
    historie: arrayTs(cloudRoh.historie || [], (e) => schluesselVonDatum(e.startdatum)),
    chronik: chronikTsFn(cloudRoh.chronik || []),
    tageskarten: arrayTs(cloudRoh.tageskarten || [], (e) => schluesselVonDatum(e.datum)),
    hinweis: cloudRoh.hinweis?.feldZeitstempel || {},
    grenzen: cloudRoh.grenzenMeta?.feldZeitstempel?._updated || '',
  }

  // Cloud-Daten bereinigen (feldZeitstempel entfernen)
  const { feldZeitstempel: _z, guestId: _gid, ...zyklusdatenClean } = cloudRoh.zyklusdaten || {}
  const { feldZeitstempel: _h, ...hinweisClean } = cloudRoh.hinweis || {}
  const cloudDaten = {
    zyklusdaten: zyklusdatenClean,
    korrekturen: ohneTs(cloudRoh.korrekturen || []),
    historie: ohneTs(cloudRoh.historie || []),
    chronik: ohneTs(cloudRoh.chronik || []),
    tageskarten: ohneTs(cloudRoh.tageskarten || []),
    hinweis: hinweisClean,
    grenzen: cloudRoh.grenzen,
  }

  // Merge durchführen
  const ergebnis = mergeAlleStores(lokaleDaten, lokaleTs, cloudDaten, cloudTs)
  const { daten, zeitstempel } = ergebnis

  // Merge-Ergebnis lokal speichern (Store für Store mit Fortschritt)
  fortschritt({ schritt: 1, label: STORE_SCHRITTE[0].label })
  local.speichereZyklusdaten(daten.zyklusdaten)
  local.speichereZeitstempel('ZYKLUSDATEN', zeitstempel.zyklusdaten)
  await cloud.speichereZyklusdaten(userId, {
    ...daten.zyklusdaten,
    feldZeitstempel: zeitstempel.zyklusdaten,
    guestId,
  })

  fortschritt({ schritt: 2, label: STORE_SCHRITTE[1].label })
  local.speichereKorrekturen(daten.korrekturen)
  local.speichereZeitstempel('KORREKTUREN', zeitstempel.korrekturen)
  await cloud.speichereKorrekturen(userId, daten.korrekturen.map((k) => ({
    ...k,
    feldZeitstempel: { _updated: zeitstempel.korrekturen[schluesselVonDatum(k.datum)] || '' },
  })))

  fortschritt({ schritt: 3, label: STORE_SCHRITTE[2].label })
  local.speichereZyklushistorie(daten.historie)
  local.speichereZeitstempel('HISTORIE', zeitstempel.historie)
  await cloud.speichereZyklushistorie(userId, daten.historie.map((h) => ({
    ...h,
    feldZeitstempel: { _updated: zeitstempel.historie[schluesselVonDatum(h.startdatum)] || '' },
  })))

  fortschritt({ schritt: 4, label: STORE_SCHRITTE[3].label })
  local.speichereChronik(daten.chronik)
  local.speichereZeitstempel('CHRONIK', zeitstempel.chronik)
  await cloud.speichereChronik(userId, daten.chronik.map((e) => ({
    ...e,
    feldZeitstempel: zeitstempel.chronik[schluesselVonDatum(e.datum)] || {},
  })))

  fortschritt({ schritt: 5, label: STORE_SCHRITTE[4].label })
  local.speichereTageskarten(daten.tageskarten)
  local.speichereZeitstempel('TAGESKARTEN', zeitstempel.tageskarten)
  await cloud.speichereTageskarten(userId, daten.tageskarten.map((k) => ({
    ...k,
    feldZeitstempel: { _updated: zeitstempel.tageskarten[schluesselVonDatum(k.datum)] || '' },
  })))

  fortschritt({ schritt: 6, label: STORE_SCHRITTE[5].label })
  local.speichereZyklustypHinweis(daten.hinweis)
  local.speichereZeitstempel('ZYKLUSTYP_HINWEIS', zeitstempel.hinweis)
  await cloud.speichereZyklustypHinweis(userId, {
    ...daten.hinweis,
    feldZeitstempel: zeitstempel.hinweis,
  })

  fortschritt({ schritt: 7, label: STORE_SCHRITTE[6].label })
  if (daten.grenzen) {
    local.speichereAngepassteGrenzen(daten.grenzen)
  } else {
    local.setzeGrenzenZurueck()
  }
  local.speichereZeitstempel('ANGEPASSTE_GRENZEN', zeitstempel.grenzen)
  if (daten.grenzen) {
    await cloud.speichereAngepassteGrenzen(userId, daten.grenzen, { _updated: zeitstempel.grenzen })
  } else {
    await cloud.setzeGrenzenZurueck(userId)
  }
}

// ---------------------------------------------------------------------------
// Hauptfunktion: Migration durchführen
// ---------------------------------------------------------------------------

/**
 * Führt die komplette Gaeste-Migration durch.
 *
 * @param {string} userId - Supabase User-ID
 * @param {Function} fortschritt - Callback: ({ pfad, schritt, gesamt, label })
 * @returns {{ pfad: string }} - Der gewählte Migrationspfad
 */
export async function fuehreMigrationDurch(userId, fortschritt) {
  const pfad = await erkennePfad(userId)

  if (pfad === 'nichts') {
    return { pfad }
  }

  const gesamt = STORE_SCHRITTE.length
  const meldeFortschritt = ({ schritt, label }) => {
    fortschritt({ pfad, schritt, gesamt, label })
  }

  switch (pfad) {
    case 'hochladen':
      await hochladen(userId, meldeFortschritt)
      break

    case 'herunterladen':
      await herunterladen(userId, meldeFortschritt)
      break

    case 'zusammenfuehren':
      await zusammenfuehren(userId, meldeFortschritt)
      break

    case 'fremddaten':
      // Fremde Gast-Daten: lokale Daten verwerfen, Cloud laden
      loescheGuestId()
      await herunterladen(userId, meldeFortschritt)
      break
  }

  return { pfad }
}
