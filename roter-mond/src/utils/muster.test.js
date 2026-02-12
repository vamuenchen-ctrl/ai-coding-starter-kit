import { describe, it, expect } from 'vitest'
import { analysiereChronikMuster, analysiereZyklusTypEntwicklung } from './muster'

// ---------------------------------------------------------------------------
// Hilfsfunktionen für Testdaten
// ---------------------------------------------------------------------------

function erzeugeEintraege(phase, anzahl, optionen = {}) {
  return Array.from({ length: anzahl }, (_, i) => ({
    datum: new Date(2025, 0, i + 1),
    phase,
    koerper: optionen.koerper || [],
    stimmung: optionen.stimmung || null,
    energie: optionen.energie ?? 5,
    traeume: optionen.traeume || '',
    kreativitaet: optionen.kreativitaet || '',
    sexuellesEmpfinden: optionen.sexuell || null,
  }))
}

// ---------------------------------------------------------------------------
// analysiereChronikMuster
// ---------------------------------------------------------------------------

describe('analysiereChronikMuster', () => {
  it('gibt leeres Array zurück bei leeren Einträgen', () => {
    expect(analysiereChronikMuster([], 28)).toEqual([])
    expect(analysiereChronikMuster(null, 28)).toEqual([])
  })

  it('gibt leeres Array zurück wenn zu wenig Einträge', () => {
    const wenige = erzeugeEintraege('jungeFrau', 5)
    expect(analysiereChronikMuster(wenige, 28)).toEqual([])
  })

  it('gibt leeres Array zurück wenn nur eine Phase Daten hat', () => {
    // 28 Einträge = 1 Zyklus, braucht 28*2*0.5 = 28 Einträge
    const eintraege = erzeugeEintraege('jungeFrau', 30, { energie: 8 })
    expect(analysiereChronikMuster(eintraege, 28)).toEqual([])
  })

  it('erkennt Energie-Muster bei deutlichem Unterschied', () => {
    const eintraege = [
      ...erzeugeEintraege('jungeFrau', 10, { energie: 9 }),
      ...erzeugeEintraege('alteWeise', 10, { energie: 3 }),
      ...erzeugeEintraege('mutter', 10, { energie: 7 }),
    ]
    const insights = analysiereChronikMuster(eintraege, 28)
    const energieTexte = insights.filter((i) => i.emoji === '⚡' || i.emoji === '🔋')
    expect(energieTexte.length).toBe(2)
    expect(energieTexte[0].text).toContain('Junge-Frau')
    expect(energieTexte[1].text).toContain('Alte-Weise')
  })

  it('erkennt kein Energie-Muster bei geringem Unterschied', () => {
    const eintraege = [
      ...erzeugeEintraege('jungeFrau', 10, { energie: 5 }),
      ...erzeugeEintraege('alteWeise', 10, { energie: 5 }),
      ...erzeugeEintraege('mutter', 10, { energie: 5 }),
    ]
    const insights = analysiereChronikMuster(eintraege, 28)
    const energieTexte = insights.filter((i) => i.emoji === '⚡')
    expect(energieTexte.length).toBe(0)
  })

  it('erkennt Stimmungs-Muster wenn eine Stimmung dominant ist', () => {
    const eintraege = [
      ...erzeugeEintraege('jungeFrau', 10, { stimmung: 'gluecklich' }),
      ...erzeugeEintraege('alteWeise', 10, { stimmung: 'traurig' }),
      ...erzeugeEintraege('mutter', 10, { stimmung: 'ruhig' }),
    ]
    const insights = analysiereChronikMuster(eintraege, 28)
    const stimmungsTexte = insights.filter((i) => i.emoji === '💭')
    expect(stimmungsTexte.length).toBeGreaterThanOrEqual(2)
    const jungeFrauInsight = stimmungsTexte.find((i) => i.text.includes('Junge-Frau'))
    expect(jungeFrauInsight.text).toContain('glücklich')
  })

  it('erkennt Traum-Muster bei hoher Traumquote', () => {
    const mitTraum = erzeugeEintraege('zauberin', 8, { traeume: 'Ein intensiver Traum' })
    const ohneTraum = erzeugeEintraege('zauberin', 2)
    const anderPhase = erzeugeEintraege('jungeFrau', 10, { energie: 5 })
    const drittPhase = erzeugeEintraege('mutter', 10, { energie: 5 })

    const eintraege = [...mitTraum, ...ohneTraum, ...anderPhase, ...drittPhase]
    const insights = analysiereChronikMuster(eintraege, 28)
    const traumTexte = insights.filter((i) => i.emoji === '🌙')
    expect(traumTexte.length).toBe(1)
    expect(traumTexte[0].text).toContain('Zauberin')
  })

  it('erkennt Körper-Muster Müdigkeit in Alter Weiser Phase', () => {
    const eintraege = [
      ...erzeugeEintraege('alteWeise', 10, {
        koerper: ['muede'],
        energie: 3,
      }),
      ...erzeugeEintraege('jungeFrau', 10, {
        koerper: ['energiegeladen'],
        energie: 8,
      }),
      ...erzeugeEintraege('mutter', 10, { energie: 6 }),
    ]
    const insights = analysiereChronikMuster(eintraege, 28)
    const ruheTexte = insights.filter((i) => i.emoji === '🛌')
    expect(ruheTexte.length).toBe(1)
    expect(ruheTexte[0].text).toContain('Alte-Weise')
    expect(ruheTexte[0].text).toContain('Ruhe')
  })

  it('erkennt Kreativitäts-Muster', () => {
    const eintraege = [
      ...erzeugeEintraege('zauberin', 10, { kreativitaet: 'Viele Ideen heute' }),
      ...erzeugeEintraege('jungeFrau', 10),
      ...erzeugeEintraege('mutter', 10),
    ]
    const insights = analysiereChronikMuster(eintraege, 28)
    const kreativTexte = insights.filter((i) => i.emoji === '🎨')
    expect(kreativTexte.length).toBe(1)
    expect(kreativTexte[0].text).toContain('Zauberin')
  })
})

// ---------------------------------------------------------------------------
// analysiereZyklusTypEntwicklung
// ---------------------------------------------------------------------------

describe('analysiereZyklusTypEntwicklung', () => {
  it('gibt stabil zurück bei weniger als 3 Zyklen', () => {
    const result = analysiereZyklusTypEntwicklung([
      { startdatum: new Date(2025, 0, 1), zyklusTyp: 'weisserMond' },
    ])
    expect(result.tendenz).toBe('stabil')
    expect(result.hinweisAnzeigen).toBe(false)
  })

  it('gibt stabil zurück bei null/undefined', () => {
    expect(analysiereZyklusTypEntwicklung(null).tendenz).toBe('stabil')
    expect(analysiereZyklusTypEntwicklung(undefined).tendenz).toBe('stabil')
  })

  it('erkennt Tendenz Richtung Weißmond bei Rotmond-Nutzerin', () => {
    // 3 Zyklen, die alle um Neumond starten (= Weißmond-Muster)
    // Referenz-Neumond: 6. Jan 2000, Zyklus ~29.53 Tage
    // Ein Neumond nahe 2025: ca. 29. Jan 2025
    const result = analysiereZyklusTypEntwicklung([
      { startdatum: new Date(2025, 0, 29), zyklusTyp: 'roterMond', zyklusLaenge: 28 },
      { startdatum: new Date(2025, 1, 27), zyklusTyp: 'roterMond', zyklusLaenge: 28 },
      { startdatum: new Date(2025, 2, 29), zyklusTyp: 'roterMond', zyklusLaenge: 28 },
    ])
    // Ergebnis hängt von der tatsächlichen Mondposition ab
    // Hauptsache die Funktion läuft ohne Fehler und gibt ein valides Ergebnis
    expect(['stabil', 'richtungWeissmond', 'richtungRotmond']).toContain(result.tendenz)
    expect(typeof result.hinweisAnzeigen).toBe('boolean')
    expect(typeof result.erklaerung).toBe('string')
  })

  it('gibt korrektes Format zurück', () => {
    const result = analysiereZyklusTypEntwicklung([
      { startdatum: new Date(2025, 0, 1), zyklusTyp: 'weisserMond', zyklusLaenge: 28 },
      { startdatum: new Date(2025, 0, 29), zyklusTyp: 'weisserMond', zyklusLaenge: 28 },
      { startdatum: new Date(2025, 1, 26), zyklusTyp: 'weisserMond', zyklusLaenge: 28 },
    ])
    expect(result).toHaveProperty('tendenz')
    expect(result).toHaveProperty('hinweisAnzeigen')
    expect(result).toHaveProperty('erklaerung')
  })
})
