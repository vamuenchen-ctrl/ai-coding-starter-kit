import { PHASEN_INFO, PHASEN_KASUS } from './zyklus'
import { berechneMondphase } from './mondphasen'

// ---------------------------------------------------------------------------
// Konstanten
// ---------------------------------------------------------------------------

const PHASEN_KEYS = ['alteWeise', 'jungeFrau', 'mutter', 'zauberin']

const STIMMUNG_LABELS = {
  gluecklich: 'glücklich',
  ruhig: 'ruhig',
  traurig: 'traurig',
  wuetend: 'wütend',
  aengstlich: 'ängstlich',
  neutral: 'neutral',
}

const KOERPER_LABELS = {
  leicht: 'Leichtigkeit',
  energiegeladen: 'Energiegeladenheit',
  schwer: 'Schwere',
  verspannt: 'Verspannung',
  entspannt: 'Entspannung',
  schmerzen: 'Schmerzen',
  muede: 'Müdigkeit',
  kraeftig: 'Kraft',
  empfindlich: 'Empfindlichkeit',
  neutral: 'Neutralität',
}

// ===========================================================================
// 1) analysiereChronikMuster
// ===========================================================================

/**
 * Analysiert Chronik-Einträge und erkennt Muster über Zyklen hinweg.
 *
 * @param {Array} chronikEintraege - Array von Chronik-Einträgen mit { datum, phase, koerper, stimmung, energie, traeume, kreativitaet, sexuellesEmpfinden }
 * @param {number} zyklusLaenge - Durchschnittliche Zykluslänge
 * @returns {Array<{ emoji: string, text: string }>} - Erkannte Insights
 */
export function analysiereChronikMuster(chronikEintraege, zyklusLaenge) {
  if (!chronikEintraege || chronikEintraege.length === 0) return []

  // Mindestens 2 volle Zyklen an Daten nötig
  const minEintraege = zyklusLaenge * 2 * 0.5 // 50% der Tage von 2 Zyklen
  if (chronikEintraege.length < minEintraege) return []

  // Einträge nach Phase gruppieren
  const nachPhase = gruppiereNachPhase(chronikEintraege)

  // Nur analysieren wenn wir Daten für mindestens 2 Phasen haben
  const phasenMitDaten = PHASEN_KEYS.filter(
    (p) => nachPhase[p] && nachPhase[p].length >= 3,
  )
  if (phasenMitDaten.length < 2) return []

  const insights = []

  // --- Energie-Muster ---
  const energieInsights = analysiereEnergieMuster(nachPhase, phasenMitDaten)
  insights.push(...energieInsights)

  // --- Stimmungs-Muster ---
  const stimmungsInsights = analysiereStimmungsMuster(nachPhase, phasenMitDaten)
  insights.push(...stimmungsInsights)

  // --- Körper-Muster ---
  const koerperInsights = analysiereKoerperMuster(nachPhase, phasenMitDaten)
  insights.push(...koerperInsights)

  // --- Traum-Muster ---
  const traumInsights = analysiereTraumMuster(nachPhase, phasenMitDaten)
  insights.push(...traumInsights)

  // --- Kreativitäts-Muster ---
  const kreativInsights = analysiereKreativMuster(nachPhase, phasenMitDaten)
  insights.push(...kreativInsights)

  return insights
}

// ===========================================================================
// 2) analysiereZyklusTypEntwicklung
// ===========================================================================

/**
 * Analysiert die Zyklushistorie und erkennt Tendenzen Richtung
 * Weißmond oder Rotmond.
 *
 * @param {Array} zyklusHistorie - Array von { startdatum, mondphase, zyklusTyp, zyklusLaenge }
 * @returns {{
 *   tendenz: "stabil" | "richtungWeissmond" | "richtungRotmond",
 *   hinweisAnzeigen: boolean,
 *   erklaerung: string
 * }}
 */
export function analysiereZyklusTypEntwicklung(zyklusHistorie) {
  const standard = {
    tendenz: 'stabil',
    hinweisAnzeigen: false,
    erklaerung: '',
  }

  if (!zyklusHistorie || zyklusHistorie.length < 3) return standard

  // Letzte 3 Zyklen, neueste zuletzt
  const sortiert = [...zyklusHistorie]
    .filter((h) => h.startdatum)
    .sort((a, b) => a.startdatum - b.startdatum)

  const letzteN = sortiert.slice(-3)
  if (letzteN.length < 3) return standard

  // Mondphase-Position für jeden Zyklusstart berechnen
  const positionen = letzteN.map((z) => {
    const mond = berechneMondphase(z.startdatum)
    return {
      ...z,
      tageImMondZyklus: mond.tageImZyklus,
      mondPhase: mond.phase,
    }
  })

  // Menstruation bei Neumond (±4 Tage) = Weißmond
  // Menstruation bei Vollmond (Tage 11-18) = Rotmond
  const typen = positionen.map((p) => bestimmeTypAusPosition(p.tageImMondZyklus))

  // Aktueller Zyklustyp (vom letzten Eintrag oder aus der Historie)
  const aktuellerTyp = letzteN[letzteN.length - 1].zyklusTyp || null

  // Tendenz ermitteln
  const weissmondAnzahl = typen.filter((t) => t === 'weissmond').length
  const rotmondAnzahl = typen.filter((t) => t === 'rotmond').length

  let tendenz = 'stabil'
  let hinweisAnzeigen = false
  let erklaerung = ''

  if (weissmondAnzahl >= 2 && aktuellerTyp === 'roterMond') {
    tendenz = 'richtungWeissmond'
    hinweisAnzeigen = true
    erklaerung =
      'Deine Menstruation fällt in den letzten Zyklen vermehrt mit dem Neumond zusammen. Dein Zyklus bewegt sich Richtung Weißmond-Zyklus.'
  } else if (rotmondAnzahl >= 2 && aktuellerTyp === 'weisserMond') {
    tendenz = 'richtungRotmond'
    hinweisAnzeigen = true
    erklaerung =
      'Deine Menstruation fällt in den letzten Zyklen vermehrt mit dem Vollmond zusammen. Dein Zyklus bewegt sich Richtung Rotmond-Zyklus.'
  } else if (weissmondAnzahl >= 2) {
    tendenz = 'richtungWeissmond'
    erklaerung =
      'Deine Menstruation liegt in den letzten Zyklen stabil um den Neumond. Dein Weißmond-Zyklus ist konsistent.'
  } else if (rotmondAnzahl >= 2) {
    tendenz = 'richtungRotmond'
    erklaerung =
      'Deine Menstruation liegt in den letzten Zyklen stabil um den Vollmond. Dein Rotmond-Zyklus ist konsistent.'
  }

  return { tendenz, hinweisAnzeigen, erklaerung }
}

// ===========================================================================
// Interne Hilfsfunktionen
// ===========================================================================

function gruppiereNachPhase(eintraege) {
  const gruppen = {}
  for (const key of PHASEN_KEYS) {
    gruppen[key] = []
  }

  for (const e of eintraege) {
    if (e.phase && gruppen[e.phase]) {
      gruppen[e.phase].push(e)
    }
  }

  return gruppen
}

function bestimmeTypAusPosition(tageImMondZyklus) {
  const MOND_ZYKLUS = 29.53
  // Nahe Neumond (±4 Tage)
  if (tageImMondZyklus <= 4 || tageImMondZyklus >= MOND_ZYKLUS - 4) {
    return 'weissmond'
  }
  // Nahe Vollmond (Tag 11-18)
  if (tageImMondZyklus >= 11 && tageImMondZyklus <= 18) {
    return 'rotmond'
  }
  return 'unklar'
}

// --- Energie-Analyse ---

function analysiereEnergieMuster(nachPhase, phasenMitDaten) {
  const insights = []
  const durchschnitte = {}

  for (const phase of phasenMitDaten) {
    const eintraege = nachPhase[phase].filter((e) => e.energie != null)
    if (eintraege.length === 0) continue
    const summe = eintraege.reduce((s, e) => s + e.energie, 0)
    durchschnitte[phase] = summe / eintraege.length
  }

  const phasenMitEnergie = Object.keys(durchschnitte)
  if (phasenMitEnergie.length < 2) return insights

  // Höchste Energie
  const hoechste = phasenMitEnergie.reduce((a, b) =>
    durchschnitte[a] > durchschnitte[b] ? a : b,
  )
  const hoechsterWert = durchschnitte[hoechste]

  // Niedrigste Energie
  const niedrigste = phasenMitEnergie.reduce((a, b) =>
    durchschnitte[a] < durchschnitte[b] ? a : b,
  )
  const niedrigsterWert = durchschnitte[niedrigste]

  // Nur Insight wenn deutlicher Unterschied (> 1.5 Punkte)
  if (hoechsterWert - niedrigsterWert > 1.5) {
    const kompHoch = PHASEN_KASUS[hoechste]?.kompositum || PHASEN_INFO[hoechste].kurzname
    insights.push({
      emoji: '⚡',
      text: `Dein Energie-Hoch liegt meist in der ${kompHoch}-Phase (Durchschnitt: ${hoechsterWert.toFixed(1)}/10).`,
    })

    const kompTief = PHASEN_KASUS[niedrigste]?.kompositum || PHASEN_INFO[niedrigste].kurzname
    insights.push({
      emoji: '🔋',
      text: `In der ${kompTief}-Phase ist deine Energie am niedrigsten (Durchschnitt: ${niedrigsterWert.toFixed(1)}/10).`,
    })
  }

  return insights
}

// --- Stimmungs-Analyse ---

function analysiereStimmungsMuster(nachPhase, phasenMitDaten) {
  const insights = []

  for (const phase of phasenMitDaten) {
    const eintraege = nachPhase[phase].filter((e) => e.stimmung)
    if (eintraege.length < 3) continue

    // Häufigste Stimmung in dieser Phase
    const zaehler = {}
    for (const e of eintraege) {
      zaehler[e.stimmung] = (zaehler[e.stimmung] || 0) + 1
    }

    const haeufigste = Object.entries(zaehler).reduce((a, b) =>
      a[1] > b[1] ? a : b,
    )
    const anteil = haeufigste[1] / eintraege.length

    // Nur Insight wenn die Stimmung in > 50% der Einträge vorkommt
    if (anteil > 0.5) {
      const komp = PHASEN_KASUS[phase]?.kompositum || PHASEN_INFO[phase].kurzname
      const stimmungsLabel = STIMMUNG_LABELS[haeufigste[0]] || haeufigste[0]
      insights.push({
        emoji: '💭',
        text: `In der ${komp}-Phase fühlst du dich besonders häufig ${stimmungsLabel} (${Math.round(anteil * 100)}% der Einträge).`,
      })
    }
  }

  return insights
}

// --- Körper-Analyse ---

function analysiereKoerperMuster(nachPhase, phasenMitDaten) {
  const insights = []

  for (const phase of phasenMitDaten) {
    const eintraege = nachPhase[phase].filter(
      (e) => e.koerper && Array.isArray(e.koerper) && e.koerper.length > 0,
    )
    if (eintraege.length < 3) continue

    // Häufigste Körperempfindung
    const zaehler = {}
    for (const e of eintraege) {
      for (const k of e.koerper) {
        zaehler[k] = (zaehler[k] || 0) + 1
      }
    }

    const haeufigste = Object.entries(zaehler).reduce((a, b) =>
      a[1] > b[1] ? a : b,
    )
    const anteil = haeufigste[1] / eintraege.length

    if (anteil > 0.5) {
      const komp = PHASEN_KASUS[phase]?.kompositum || PHASEN_INFO[phase].kurzname
      const koerperLabel = KOERPER_LABELS[haeufigste[0]] || haeufigste[0]

      // Spezial-Insight für "muede" in Alter Weiser Phase
      if (phase === 'alteWeise' && haeufigste[0] === 'muede') {
        insights.push({
          emoji: '🛌',
          text: `In der ${komp}-Phase brauchst du besonders viel Ruhe – ${koerperLabel} war dein häufigstes Körpergefühl.`,
        })
      } else {
        insights.push({
          emoji: '🫀',
          text: `In der ${komp}-Phase erlebst du häufig ${koerperLabel} (${Math.round(anteil * 100)}% der Einträge).`,
        })
      }
    }
  }

  return insights
}

// --- Traum-Analyse ---

function analysiereTraumMuster(nachPhase, phasenMitDaten) {
  const insights = []

  for (const phase of phasenMitDaten) {
    const eintraege = nachPhase[phase]
    if (eintraege.length < 3) continue

    const mitTraum = eintraege.filter(
      (e) => e.traeume && e.traeume.trim().length > 0,
    )
    const anteil = mitTraum.length / eintraege.length

    if (anteil > 0.6) {
      const komp = PHASEN_KASUS[phase]?.kompositum || PHASEN_INFO[phase].kurzname
      insights.push({
        emoji: '🌙',
        text: `In deiner ${komp}-Phase hast du oft intensive Träume – in ${Math.round(anteil * 100)}% der Einträge hast du Träume notiert.`,
      })
    }
  }

  return insights
}

// --- Kreativitäts-Analyse ---

function analysiereKreativMuster(nachPhase, phasenMitDaten) {
  const insights = []

  for (const phase of phasenMitDaten) {
    const eintraege = nachPhase[phase]
    if (eintraege.length < 3) continue

    const mitKreativ = eintraege.filter(
      (e) => e.kreativitaet && e.kreativitaet.trim().length > 0,
    )
    const anteil = mitKreativ.length / eintraege.length

    if (anteil > 0.6) {
      const komp = PHASEN_KASUS[phase]?.kompositum || PHASEN_INFO[phase].kurzname
      insights.push({
        emoji: '🎨',
        text: `Deine kreativste Phase ist die ${komp}-Phase – in ${Math.round(anteil * 100)}% der Einträge hattest du kreative Impulse.`,
      })
    }
  }

  return insights
}
