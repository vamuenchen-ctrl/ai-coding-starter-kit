// Referenz-Neumond: 6. Januar 2000, 18:14 UTC
const REFERENZ_NEUMOND = new Date(Date.UTC(2000, 0, 6, 18, 14, 0))
const ZYKLUS_LAENGE = 29.53058867 // Synodischer Monat in Tagen

/**
 * Berechnet die Mondphase für ein beliebiges Datum.
 *
 * @param {Date} datum - Das Datum, für das die Mondphase berechnet werden soll
 * @returns {{
 *   phase: "neumond" | "zunehmend" | "vollmond" | "abnehmend",
 *   tageImZyklus: number,
 *   beleuchtung: number,
 *   naechsterVollmond: Date,
 *   naechsterNeumond: Date,
 *   anzeigeText: string,
 *   symbol: string
 * }}
 */
export function berechneMondphase(datum) {
  const tageImZyklus = berechneTageImZyklus(datum)
  const phase = bestimmePhase(tageImZyklus)
  const beleuchtung = berechneBeleuchtung(tageImZyklus)
  const naechsterVollmond = berechneNaechstenVollmond(datum, tageImZyklus)
  const naechsterNeumond = berechneNaechstenNeumond(datum, tageImZyklus)
  const symbol = bestimmeSymbol(tageImZyklus)
  const anzeigeText = erzeugeAnzeigeText(phase, tageImZyklus)

  return {
    phase,
    tageImZyklus: Math.round(tageImZyklus * 10) / 10,
    beleuchtung: Math.round(beleuchtung),
    naechsterVollmond,
    naechsterNeumond,
    anzeigeText,
    symbol,
  }
}

/**
 * Berechnet die Position im aktuellen Mondzyklus (0 bis ~29.53).
 */
function berechneTageImZyklus(datum) {
  const diffMs = datum.getTime() - REFERENZ_NEUMOND.getTime()
  const diffTage = diffMs / (1000 * 60 * 60 * 24)
  const position = diffTage % ZYKLUS_LAENGE
  return position < 0 ? position + ZYKLUS_LAENGE : position
}

/**
 * Bestimmt die Mondphase anhand der Tage im Zyklus.
 * - Tag 0 (± 1 Tag): Neumond
 * - Tag 1–13: Zunehmend
 * - Tag 14 (± 1 Tag): Vollmond
 * - Tag 15–28: Abnehmend
 */
function bestimmePhase(tageImZyklus) {
  if (tageImZyklus <= 1 || tageImZyklus >= ZYKLUS_LAENGE - 1) {
    return 'neumond'
  }
  if (tageImZyklus > 1 && tageImZyklus < 13) {
    return 'zunehmend'
  }
  if (tageImZyklus >= 13 && tageImZyklus <= 15) {
    return 'vollmond'
  }
  return 'abnehmend'
}

/**
 * Berechnet die Beleuchtung des Mondes in Prozent (0–100).
 * Verwendet eine Kosinus-Funktion für realistische Werte.
 */
function berechneBeleuchtung(tageImZyklus) {
  // Kosinus-basierte Beleuchtung: 0% bei Neumond (Tag 0), 100% bei Vollmond (~Tag 14.76)
  const winkel = (tageImZyklus / ZYKLUS_LAENGE) * 2 * Math.PI
  const beleuchtung = ((1 - Math.cos(winkel)) / 2) * 100
  return beleuchtung
}

/**
 * Berechnet das Datum des nächsten Vollmonds.
 */
function berechneNaechstenVollmond(datum, tageImZyklus) {
  const halbzyklus = ZYKLUS_LAENGE / 2
  let tageZumVollmond

  if (tageImZyklus <= halbzyklus) {
    tageZumVollmond = halbzyklus - tageImZyklus
  } else {
    tageZumVollmond = ZYKLUS_LAENGE - tageImZyklus + halbzyklus
  }

  const vollmondDatum = new Date(datum.getTime() + tageZumVollmond * 24 * 60 * 60 * 1000)
  return vollmondDatum
}

/**
 * Berechnet das Datum des nächsten Neumonds.
 */
function berechneNaechstenNeumond(datum, tageImZyklus) {
  const tageZumNeumond = ZYKLUS_LAENGE - tageImZyklus

  const neumondDatum = new Date(datum.getTime() + tageZumNeumond * 24 * 60 * 60 * 1000)
  return neumondDatum
}

/**
 * Gibt das passende Mond-Emoji für die aktuelle Zyklusposition zurück.
 * Konsistent mit der Phasenlogik: Neumond- und Vollmond-Bereiche
 * erhalten ihr exaktes Symbol, dazwischen werden 6 Zwischenstufen verteilt.
 */
function bestimmeSymbol(tageImZyklus) {
  // Grenzen identisch mit bestimmePhase() für Konsistenz
  if (tageImZyklus <= 1 || tageImZyklus >= ZYKLUS_LAENGE - 1) {
    return '🌑'
  }
  if (tageImZyklus >= 13 && tageImZyklus <= 15) {
    return '🌕'
  }

  // Zunehmend: Tag 1 bis 13, aufgeteilt in 🌒🌓🌔
  if (tageImZyklus < 13) {
    const fortschritt = (tageImZyklus - 1) / 12
    if (fortschritt < 1 / 3) return '🌒'
    if (fortschritt < 2 / 3) return '🌓'
    return '🌔'
  }

  // Abnehmend: Tag 15 bis Zyklusende-1, aufgeteilt in 🌖🌗🌘
  const fortschritt = (tageImZyklus - 15) / (ZYKLUS_LAENGE - 16)
  if (fortschritt < 1 / 3) return '🌖'
  if (fortschritt < 2 / 3) return '🌗'
  return '🌘'
}

/**
 * Erzeugt einen lesbaren Anzeigetext für die aktuelle Mondphase.
 */
function erzeugeAnzeigeText(phase, tageImZyklus) {
  const halbzyklus = ZYKLUS_LAENGE / 2

  switch (phase) {
    case 'neumond':
      return 'Neumond'
    case 'vollmond':
      return 'Vollmond'
    case 'zunehmend': {
      const tageZumVollmond = Math.round(halbzyklus - tageImZyklus)
      if (tageZumVollmond === 1) {
        return 'Zunehmend – noch 1 Tag bis Vollmond'
      }
      return `Zunehmend – noch ${tageZumVollmond} Tage bis Vollmond`
    }
    case 'abnehmend': {
      const tageZumNeumond = Math.round(ZYKLUS_LAENGE - tageImZyklus)
      if (tageZumNeumond === 1) {
        return 'Abnehmend – noch 1 Tag bis Neumond'
      }
      return `Abnehmend – noch ${tageZumNeumond} Tage bis Neumond`
    }
  }
}
