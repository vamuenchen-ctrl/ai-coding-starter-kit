// ---------------------------------------------------------------------------
// Supabase-Persistenzschicht
// Async-Versionen aller speicher-Funktionen, die Supabase als Backend nutzen.
// Namenskonvention: camelCase (JS) ↔ snake_case (PostgreSQL)
// ---------------------------------------------------------------------------

import { supabase } from './supabase.js'

// ---------------------------------------------------------------------------
// Helfer
// ---------------------------------------------------------------------------

function datumAlsISO(datum) {
  if (!datum) return null
  if (datum instanceof Date) {
    // Lokale Zeitzone verwenden (nicht UTC), damit z.B. 9. Feb nicht zu 8. Feb wird
    const p = (n) => String(n).padStart(2, '0')
    return `${datum.getFullYear()}-${p(datum.getMonth() + 1)}-${p(datum.getDate())}`
  }
  if (typeof datum === 'string') return datum.slice(0, 10)
  return null
}

function isoAlsDatum(str) {
  if (!str) return null
  // Datum als lokale Mitternacht parsen (nicht UTC), damit kein Tages-Shift entsteht
  const teile = str.slice(0, 10).split('-').map(Number)
  if (teile.length < 3) return null
  const d = new Date(teile[0], teile[1] - 1, teile[2])
  return isNaN(d.getTime()) ? null : d
}

// ---------------------------------------------------------------------------
// 1) Zyklusdaten
// ---------------------------------------------------------------------------

const ZYKLUSDATEN_DEFAULT = {
  zyklusStart: null,
  zyklusLaenge: 28,
  zyklusTyp: null,
  ersteinrichtungAbgeschlossen: false,
}

export async function ladeZyklusdaten(userId) {
  if (!supabase) return ZYKLUSDATEN_DEFAULT

  const { data, error } = await supabase
    .from('zyklusdaten')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !data) return { ...ZYKLUSDATEN_DEFAULT }

  return {
    zyklusStart: isoAlsDatum(data.zyklus_start),
    zyklusLaenge: data.zyklus_laenge,
    zyklusTyp: data.zyklus_typ,
    ersteinrichtungAbgeschlossen: data.ersteinrichtung_abgeschlossen,
    feldZeitstempel: data.feld_zeitstempel || {},
    guestId: data.guest_id || null,
  }
}

export async function speichereZyklusdaten(userId, daten) {
  if (!supabase) return

  const row = {
    user_id: userId,
    zyklus_start: datumAlsISO(daten.zyklusStart),
    zyklus_laenge: daten.zyklusLaenge,
    zyklus_typ: daten.zyklusTyp,
    ersteinrichtung_abgeschlossen: daten.ersteinrichtungAbgeschlossen,
  }
  if (daten.feldZeitstempel) row.feld_zeitstempel = daten.feldZeitstempel
  if (daten.guestId !== undefined) row.guest_id = daten.guestId

  await supabase.from('zyklusdaten').upsert(row, { onConflict: 'user_id' })
}

export async function aktualisiereZyklusdaten(userId, teilDaten) {
  const aktuell = await ladeZyklusdaten(userId)
  await speichereZyklusdaten(userId, { ...aktuell, ...teilDaten })
}

// ---------------------------------------------------------------------------
// 2) Phasenkorrekturen
// ---------------------------------------------------------------------------

export async function ladeKorrekturen(userId) {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('korrekturen')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error || !data) return []

  return data.map((k) => ({
    datum: isoAlsDatum(k.datum),
    zyklusTag: k.zyklus_tag,
    berechnetePhase: k.berechnete_phase,
    korrigiertePhase: k.korrigierte_phase,
    feldZeitstempel: k.feld_zeitstempel || {},
  }))
}

export async function speichereKorrekturen(userId, korrekturen) {
  if (!supabase) return

  // Alle bisherigen löschen und neu schreiben
  await supabase.from('korrekturen').delete().eq('user_id', userId)

  if (korrekturen.length === 0) return

  const rows = korrekturen.map((k) => ({
    user_id: userId,
    datum: datumAlsISO(k.datum),
    zyklus_tag: k.zyklusTag,
    berechnete_phase: k.berechnetePhase,
    korrigierte_phase: k.korrigiertePhase,
    feld_zeitstempel: k.feldZeitstempel || {},
  }))

  await supabase.from('korrekturen').insert(rows)
}

export async function fuegeKorrekturHinzu(userId, korrektur) {
  if (!supabase) return

  const row = {
    user_id: userId,
    datum: datumAlsISO(korrektur.datum),
    zyklus_tag: korrektur.zyklusTag,
    berechnete_phase: korrektur.berechnetePhase,
    korrigierte_phase: korrektur.korrigiertePhase,
  }
  if (korrektur.feldZeitstempel) row.feld_zeitstempel = korrektur.feldZeitstempel

  await supabase.from('korrekturen').insert(row)
}

// ---------------------------------------------------------------------------
// 3) Zyklushistorie
// ---------------------------------------------------------------------------

export async function ladeZyklushistorie(userId) {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('zyklushistorie')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error || !data) return []

  return data.map((h) => ({
    id: h.id,
    startdatum: isoAlsDatum(h.startdatum),
    mondphase: h.mondphase,
    zyklusTyp: h.zyklus_typ,
    zyklusLaenge: h.zyklus_laenge,
    feldZeitstempel: h.feld_zeitstempel || {},
  }))
}

export async function speichereZyklushistorie(userId, historie) {
  if (!supabase) return

  // Alle bisherigen löschen und neu schreiben
  await supabase.from('zyklushistorie').delete().eq('user_id', userId)

  if (historie.length === 0) return

  const rows = historie.map((h) => ({
    user_id: userId,
    startdatum: datumAlsISO(h.startdatum),
    mondphase: h.mondphase,
    zyklus_typ: h.zyklusTyp,
    zyklus_laenge: h.zyklusLaenge,
    feld_zeitstempel: h.feldZeitstempel || {},
  }))

  await supabase.from('zyklushistorie').insert(rows)
}

export async function fuegeZyklusHinzu(userId, eintrag) {
  if (!supabase) return

  const row = {
    user_id: userId,
    startdatum: datumAlsISO(eintrag.startdatum),
    mondphase: eintrag.mondphase,
    zyklus_typ: eintrag.zyklusTyp,
    zyklus_laenge: eintrag.zyklusLaenge,
  }
  if (eintrag.feldZeitstempel) row.feld_zeitstempel = eintrag.feldZeitstempel

  await supabase.from('zyklushistorie').insert(row)
}

export async function aktualisiereLetztenZyklus(userId, teilDaten) {
  if (!supabase) return

  // Letzten Eintrag finden
  const { data } = await supabase
    .from('zyklushistorie')
    .select('id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!data) return

  const updates = {}
  if (teilDaten.startdatum !== undefined) updates.startdatum = datumAlsISO(teilDaten.startdatum)
  if (teilDaten.mondphase !== undefined) updates.mondphase = teilDaten.mondphase
  if (teilDaten.zyklusTyp !== undefined) updates.zyklus_typ = teilDaten.zyklusTyp
  if (teilDaten.zyklusLaenge !== undefined) updates.zyklus_laenge = teilDaten.zyklusLaenge

  await supabase.from('zyklushistorie').update(updates).eq('id', data.id)
}

// ---------------------------------------------------------------------------
// 4) Chronik-Einträge
// ---------------------------------------------------------------------------

export async function ladeChronik(userId) {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('chronik')
    .select('*')
    .eq('user_id', userId)
    .order('datum', { ascending: true })

  if (error || !data) return []

  return data.map((e) => ({
    datum: isoAlsDatum(e.datum),
    koerper: e.koerper,
    stimmung: e.stimmung,
    energie: e.energie,
    traeume: e.traeume ?? '',
    kreativitaet: e.kreativitaet ?? '',
    sexuellesEmpfinden: e.sexuelles_empfinden,
    phase: e.phase,
    feldZeitstempel: e.feld_zeitstempel || {},
  }))
}

export async function speichereChronik(userId, chronik) {
  if (!supabase) return

  // Alle bisherigen löschen und neu schreiben
  await supabase.from('chronik').delete().eq('user_id', userId)

  if (chronik.length === 0) return

  const rows = chronik.map((e) => ({
    user_id: userId,
    datum: datumAlsISO(e.datum),
    koerper: e.koerper,
    stimmung: e.stimmung,
    energie: e.energie,
    traeume: e.traeume ?? '',
    kreativitaet: e.kreativitaet ?? '',
    sexuelles_empfinden: e.sexuellesEmpfinden,
    phase: e.phase,
    feld_zeitstempel: e.feldZeitstempel || {},
  }))

  await supabase.from('chronik').insert(rows)
}

export async function speichereChronikEintrag(userId, eintrag) {
  if (!supabase) return

  const datumStr = datumAlsISO(eintrag.datum)

  const row = {
    user_id: userId,
    datum: datumStr,
    koerper: eintrag.koerper ?? null,
    stimmung: eintrag.stimmung ?? null,
    energie: eintrag.energie ?? null,
    traeume: eintrag.traeume ?? '',
    kreativitaet: eintrag.kreativitaet ?? '',
    sexuelles_empfinden: eintrag.sexuellesEmpfinden ?? null,
    phase: eintrag.phase ?? null,
  }
  if (eintrag.feldZeitstempel) row.feld_zeitstempel = eintrag.feldZeitstempel

  await supabase.from('chronik').upsert(row, { onConflict: 'user_id,datum' })
}

export async function ladeChronikEintrag(userId, datum) {
  if (!supabase) return null

  const datumStr = datumAlsISO(datum)
  if (!datumStr) return null

  const { data, error } = await supabase
    .from('chronik')
    .select('*')
    .eq('user_id', userId)
    .eq('datum', datumStr)
    .single()

  if (error || !data) return null

  return {
    datum: isoAlsDatum(data.datum),
    koerper: data.koerper,
    stimmung: data.stimmung,
    energie: data.energie,
    traeume: data.traeume ?? '',
    kreativitaet: data.kreativitaet ?? '',
    sexuellesEmpfinden: data.sexuelles_empfinden,
    phase: data.phase,
  }
}

// ---------------------------------------------------------------------------
// 5) Gezogene Tageskarten
// ---------------------------------------------------------------------------

export async function ladeTageskarten(userId) {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('tageskarten')
    .select('*')
    .eq('user_id', userId)
    .order('datum', { ascending: true })

  if (error || !data) return []

  return data.map((k) => ({
    datum: isoAlsDatum(k.datum),
    kartenId: k.karten_id,
    feldZeitstempel: k.feld_zeitstempel || {},
  }))
}

export async function speichereTageskarten(userId, karten) {
  if (!supabase) return

  await supabase.from('tageskarten').delete().eq('user_id', userId)

  if (karten.length === 0) return

  const rows = karten.map((k) => ({
    user_id: userId,
    datum: datumAlsISO(k.datum),
    karten_id: k.kartenId,
    feld_zeitstempel: k.feldZeitstempel || {},
  }))

  await supabase.from('tageskarten').insert(rows)
}

export async function speichereTageskarte(userId, datum, kartenId, feldZeitstempel) {
  if (!supabase) return

  const datumStr = datumAlsISO(datum)

  const row = {
    user_id: userId,
    datum: datumStr,
    karten_id: kartenId,
  }
  if (feldZeitstempel) row.feld_zeitstempel = feldZeitstempel

  await supabase.from('tageskarten').upsert(row, { onConflict: 'user_id,datum' })
}

export async function ladeHeutigeTageskarte(userId) {
  if (!supabase) return null

  const heuteStr = new Date().toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('tageskarten')
    .select('*')
    .eq('user_id', userId)
    .eq('datum', heuteStr)
    .single()

  if (error || !data) return null

  return {
    datum: isoAlsDatum(data.datum),
    kartenId: data.karten_id,
  }
}

// ---------------------------------------------------------------------------
// 6) Zyklustyp-Hinweis
// ---------------------------------------------------------------------------

const ZYKLUSTYP_HINWEIS_DEFAULT = {
  letzterHinweis: null,
  nutzerinHatAbgelehnt: false,
  ablehnungsDatum: null,
}

export async function ladeZyklustypHinweis(userId) {
  if (!supabase) return { ...ZYKLUSTYP_HINWEIS_DEFAULT }

  const { data, error } = await supabase
    .from('zyklustyp_hinweis')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !data) return { ...ZYKLUSTYP_HINWEIS_DEFAULT }

  return {
    letzterHinweis: data.letzter_hinweis ? new Date(data.letzter_hinweis) : null,
    nutzerinHatAbgelehnt: data.nutzerin_hat_abgelehnt,
    ablehnungsDatum: data.ablehnungs_datum ? new Date(data.ablehnungs_datum) : null,
    feldZeitstempel: data.feld_zeitstempel || {},
  }
}

export async function speichereZyklustypHinweis(userId, daten) {
  if (!supabase) return

  const row = {
    user_id: userId,
    letzter_hinweis: daten.letzterHinweis ? daten.letzterHinweis.toISOString() : null,
    nutzerin_hat_abgelehnt: daten.nutzerinHatAbgelehnt,
    ablehnungs_datum: daten.ablehnungsDatum ? daten.ablehnungsDatum.toISOString() : null,
  }
  if (daten.feldZeitstempel) row.feld_zeitstempel = daten.feldZeitstempel

  await supabase.from('zyklustyp_hinweis').upsert(row, { onConflict: 'user_id' })
}

export async function markiereHinweisAlsGezeigt(userId) {
  const aktuell = await ladeZyklustypHinweis(userId)
  await speichereZyklustypHinweis(userId, {
    ...aktuell,
    letzterHinweis: new Date(),
  })
}

export async function markiereHinweisAlsAbgelehnt(userId) {
  await speichereZyklustypHinweis(userId, {
    letzterHinweis: new Date(),
    nutzerinHatAbgelehnt: true,
    ablehnungsDatum: new Date(),
  })
}

export async function setzeHinweisZurueck(userId) {
  await speichereZyklustypHinweis(userId, ZYKLUSTYP_HINWEIS_DEFAULT)
}

// ---------------------------------------------------------------------------
// 7) Angepasste Phasengrenzen
// ---------------------------------------------------------------------------

export async function ladeAngepassteGrenzen(userId) {
  if (!supabase) return { grenzen: null, feldZeitstempel: {} }

  const { data, error } = await supabase
    .from('angepasste_grenzen')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !data) return { grenzen: null, feldZeitstempel: {} }

  return {
    grenzen: data.grenzen,
    feldZeitstempel: data.feld_zeitstempel || {},
  }
}

export async function speichereAngepassteGrenzen(userId, grenzen, feldZeitstempel) {
  if (!supabase) return

  const row = {
    user_id: userId,
    grenzen,
  }
  if (feldZeitstempel) row.feld_zeitstempel = feldZeitstempel

  await supabase.from('angepasste_grenzen').upsert(row, { onConflict: 'user_id' })
}

export async function setzeGrenzenZurueck(userId) {
  if (!supabase) return

  await supabase.from('angepasste_grenzen').delete().eq('user_id', userId)
}

// ---------------------------------------------------------------------------
// Alle Daten laden (Full-Pull für Sync-Engine)
// ---------------------------------------------------------------------------

export async function ladeAlleDaten(userId) {
  if (!supabase) return null

  const [zyklusdaten, korrekturen, historie, chronik, tageskarten, hinweis, grenzenResult] =
    await Promise.all([
      ladeZyklusdaten(userId),
      ladeKorrekturen(userId),
      ladeZyklushistorie(userId),
      ladeChronik(userId),
      ladeTageskarten(userId),
      ladeZyklustypHinweis(userId),
      ladeAngepassteGrenzen(userId),
    ])

  return { zyklusdaten, korrekturen, historie, chronik, tageskarten, hinweis, grenzen: grenzenResult.grenzen, grenzenMeta: grenzenResult }
}

// ---------------------------------------------------------------------------
// Alle Daten löschen
// ---------------------------------------------------------------------------

export async function loescheAlleDaten(userId) {
  if (!supabase) return

  // Zyklusdaten: Zurücksetzen statt Löschen, damit andere Geräte die
  // Löschung erkennen können (ersteinrichtung_abgeschlossen = false mit
  // frischen Zeitstempeln signalisiert "Daten wurden bewusst gelöscht").
  const zeit = new Date().toISOString()
  const zyklusdatenTs = {}
  for (const f of ['zyklusStart', 'zyklusLaenge', 'zyklusTyp', 'ersteinrichtungAbgeschlossen']) {
    zyklusdatenTs[f] = zeit
  }

  const ergebnisse = await Promise.all([
    supabase.from('zyklusdaten').upsert({
      user_id: userId,
      zyklus_start: null,
      zyklus_laenge: 28,
      zyklus_typ: null,
      ersteinrichtung_abgeschlossen: false,
      feld_zeitstempel: zyklusdatenTs,
      guest_id: null,
    }, { onConflict: 'user_id' }),
    supabase.from('korrekturen').delete().eq('user_id', userId),
    supabase.from('zyklushistorie').delete().eq('user_id', userId),
    supabase.from('chronik').delete().eq('user_id', userId),
    supabase.from('tageskarten').delete().eq('user_id', userId),
    supabase.from('zyklustyp_hinweis').delete().eq('user_id', userId),
    supabase.from('angepasste_grenzen').delete().eq('user_id', userId),
  ])

  const fehler = ergebnisse.find((r) => r.error)
  if (fehler) {
    throw new Error(fehler.error.message || 'Cloud-Daten konnten nicht gelöscht werden')
  }
}
