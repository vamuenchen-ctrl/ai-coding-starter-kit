import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ladeZyklusdaten,
  ladeKorrekturen,
  fuegeKorrekturHinzu,
  ladeZyklushistorie,
  ladeZyklustypHinweis,
  markiereHinweisAlsAbgelehnt,
  aktualisiereZyklusdaten,
  ladeAngepassteGrenzen,
  speichereAngepassteGrenzen,
} from '../utils/speicher'
import { useSyncEngine } from '../context/SyncEngineContext'
import {
  berechneAngepasstePhase,
  berechneAngepassteGrenzen,
  berechnePhasenGrenzen,
  PHASEN_INFO,
} from '../utils/zyklus'
import { berechneMondphase } from '../utils/mondphasen'
import { analysiereZyklusTypEntwicklung } from '../utils/muster'
import tagesempfehlungen from '../data/tagesempfehlungen.json'
import { SYMBOLTIERE, UEBERGANGSTIERE } from '../data/symboltiere'
import wissen from '../data/wissen.json'

// ---------------------------------------------------------------------------
// Phasen-Reihenfolge für Modal
// ---------------------------------------------------------------------------

const PHASEN_KEYS = ['alteWeise', 'jungeFrau', 'mutter', 'zauberin']

// ---------------------------------------------------------------------------
// Deterministischer Shuffle (seeded) für Empfehlungs-Rotation
// ---------------------------------------------------------------------------

function mischeIndizes(anzahl, seedText) {
  const indizes = Array.from({ length: anzahl }, (_, i) => i)
  let seed = 0
  for (let i = 0; i < seedText.length; i++) {
    seed = ((seed << 5) - seed + seedText.charCodeAt(i)) | 0
  }
  for (let i = indizes.length - 1; i > 0; i--) {
    seed += 0x6D2B79F5
    let t = seed
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    const r = ((t ^ (t >>> 14)) >>> 0) / 4294967296
    const j = Math.floor(r * (i + 1))
    ;[indizes[i], indizes[j]] = [indizes[j], indizes[i]]
  }
  return indizes
}

// ===========================================================================
// Hauptkomponente
// ===========================================================================

function Heute() {
  const { syncVersion } = useSyncEngine()
  const [daten, setDaten] = useState(null)
  const [korrekturen, setKorrekturen] = useState([])
  const [modalOffen, setModalOffen] = useState(false)
  const [gespeicherteGrenzen, setGespeicherteGrenzen] = useState(null)

  // Manuelle Phasen-Überschreibung für den aktuellen Besuch
  const [manuellPhase, setManuellPhase] = useState(null)

  // Symboltier-Tooltip
  const [tierTooltip, setTierTooltip] = useState(false)

  // Archetyp-Info-Tooltip
  const [archetypTooltip, setArchetypTooltip] = useState(false)

  // Zyklustyp-Trend-Banner
  const [trendInfo, setTrendInfo] = useState(null)
  const [bannerSichtbar, setBannerSichtbar] = useState(false)

  useEffect(() => {
    const geladeneDaten = ladeZyklusdaten()
    setDaten(geladeneDaten)
    setKorrekturen(ladeKorrekturen())
    setGespeicherteGrenzen(ladeAngepassteGrenzen())

    // Zyklustyp-Trend prüfen
    if (geladeneDaten.ersteinrichtungAbgeschlossen) {
      const historie = ladeZyklushistorie()
      const trend = analysiereZyklusTypEntwicklung(historie)
      setTrendInfo(trend)

      if (trend.hinweisAnzeigen) {
        const hinweis = ladeZyklustypHinweis()
        if (!hinweis.nutzerinHatAbgelehnt) {
          setBannerSichtbar(true)
        }
      }
    }
  }, [syncVersion])

  if (!daten) return null

  // --- Ersteinrichtung nicht abgeschlossen ---
  if (!daten.ersteinrichtungAbgeschlossen) {
    return (
      <div className="page einstellungen-page">
        <div className="onboarding-schritt">
          <h1>Willkommen bei Roter Mond</h1>
          <p className="onboarding-text">
            Diese App begleitet dich durch deinen Zyklus und hilft dir, die Kraft deiner vier
            inneren Archetypen zu entdecken.
          </p>
          <p className="onboarding-text">
            Richte zuerst deinen Zyklus ein, um tägliche Empfehlungen zu erhalten.
          </p>
          <Link to="/einstellungen" className="btn-primary">
            Los geht's
          </Link>
        </div>
      </div>
    )
  }

  // --- Berechnungen ---
  const heute = new Date()
  const mondInfo = berechneMondphase(heute)

  // Phase mit Korrekturen und gespeicherten Grenzen berechnen
  const phaseInfo = berechneAngepasstePhase(
    daten.zyklusStart,
    daten.zyklusLaenge,
    heute,
    korrekturen,
    gespeicherteGrenzen,
  )

  // Manuell gesetzte Phase hat Vorrang (nur für aktuelle Ansicht)
  const aktuellePhase = manuellPhase || phaseInfo.phase
  const phasenMeta = PHASEN_INFO[aktuellePhase]
  const symboltier = SYMBOLTIERE[aktuellePhase]

  // Variante: Deterministischer Shuffle pro Zyklus + Phase
  const empfehlungen = tagesempfehlungen[aktuellePhase]
  const anzahlVarianten = empfehlungen ? empfehlungen.energie.length : 1
  const shuffleSeed = `${daten.zyklusStart}-${aktuellePhase}`
  const gemischteIndizes = mischeIndizes(anzahlVarianten, shuffleSeed)
  const variantenIndex = empfehlungen
    ? gemischteIndizes[(phaseInfo.zyklusTag - 1) % anzahlVarianten]
    : 0

  // Übergangstier an Phasengrenzen (nur bei berechneter Phase, nicht bei manueller)
  const uebergangsDef = !manuellPhase && UEBERGANGSTIERE[aktuellePhase]
  const istErsterTag = phaseInfo.phaseTag === 1
  const istLetzterTag = phaseInfo.phaseTag === phaseInfo.phaseLaenge
  const uebergangsTier = uebergangsDef && (
    (istErsterTag && uebergangsDef.ersterTag) ||
    (istLetzterTag && uebergangsDef.letzterTag)
  ) || null
  const aktuellesTier = uebergangsTier || (symboltier && symboltier.primaer)

  // Symboltier-Botschaft: bei Übergang nach Tiername filtern
  const symboltierBotschaft = (() => {
    if (!empfehlungen) return null
    if (uebergangsTier) {
      const quelleTexte = tagesempfehlungen[uebergangsTier.textQuelle]?.symboltier || []
      const tierTexte = quelleTexte.filter(t => t.tier === uebergangsTier.name)
      return tierTexte.length > 0 ? tierTexte[variantenIndex % tierTexte.length] : null
    }
    return empfehlungen.symboltier?.[variantenIndex] || null
  })()

  // Zyklustyp anpassen (Banner-Aktion)
  function zyklustypAnpassen() {
    if (!trendInfo) return
    const neuerTyp =
      trendInfo.tendenz === 'richtungWeissmond' ? 'weisserMond' : 'roterMond'
    aktualisiereZyklusdaten({ zyklusTyp: neuerTyp })
    setDaten(ladeZyklusdaten())
    setBannerSichtbar(false)
  }

  function zyklustypBeibehalten() {
    markiereHinweisAlsAbgelehnt()
    setBannerSichtbar(false)
  }

  // Phase-Korrektur speichern und Grenzen aktualisieren
  function phaseKorrigieren(neuePhase) {
    if (neuePhase !== phaseInfo.phase) {
      fuegeKorrekturHinzu({
        datum: heute,
        zyklusTag: phaseInfo.zyklusTag,
        berechnetePhase: phaseInfo.phase,
        korrigiertePhase: neuePhase,
      })
      const neueKorrekturen = ladeKorrekturen()
      setKorrekturen(neueKorrekturen)

      // Grenzen aus Korrekturen neu berechnen und persistieren
      const neueGrenzen = berechneAngepassteGrenzen(daten.zyklusLaenge, neueKorrekturen)
      const standard = berechnePhasenGrenzen(daten.zyklusLaenge)
      const hatAnpassung = neueGrenzen.some(
        (g, i) => g.start !== standard[i].start || g.ende !== standard[i].ende,
      )
      if (hatAnpassung) {
        speichereAngepassteGrenzen(neueGrenzen)
        setGespeicherteGrenzen(neueGrenzen)
      }
    }
    setManuellPhase(neuePhase)
    setModalOffen(false)

    // Hintergrundfarbe der App aktualisieren
    const neueMeta = PHASEN_INFO[neuePhase]
    if (neueMeta) {
      window.dispatchEvent(new CustomEvent('rotermond:phasen-update', {
        detail: { farbeBgHex: neueMeta.farbeBgHex },
      }))
    }
  }

  return (
    <div className="page heute-page">
      {/* Zyklustyp-Trend-Banner */}
      {bannerSichtbar && trendInfo && (
        <div className="trend-banner">
          <p className="trend-banner-text">
            {trendInfo.erklaerung} Möchtest du deinen Zyklustyp auf{' '}
            <strong>
              {trendInfo.tendenz === 'richtungWeissmond'
                ? 'Weißmond-Zyklus'
                : 'Rotmond-Zyklus'}
            </strong>{' '}
            anpassen?
          </p>
          <div className="trend-banner-aktionen">
            <button
              className="btn-primary trend-banner-btn"
              onClick={zyklustypAnpassen}
            >
              Ja, anpassen
            </button>
            <button
              className="btn-secondary trend-banner-btn"
              onClick={zyklustypBeibehalten}
            >
              Nein, beibehalten
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div
        className="heute-header"
        style={{ '--phasen-farbe': phasenMeta.farbeHex }}
      >
        <div className="heute-header-akzent" />
        <div className="heute-header-inhalt">
          <div className="heute-phase-zeile">
            <button
              className="archetyp-symbol-btn heute-phase-symbol"
              onClick={() => { setArchetypTooltip(!archetypTooltip); setTierTooltip(false) }}
            >
              {phasenMeta.symbol}
            </button>
            <span className="heute-phase-name">{phasenMeta.kurzname}</span>
            {aktuellesTier && (
              <span
                className="heute-symboltier"
                onClick={() => { setTierTooltip(!tierTooltip); setArchetypTooltip(false) }}
              >
                {aktuellesTier.emoji}
              </span>
            )}
          </div>
          {aktuellesTier && (
            <div className="heute-begleiterin">
              Deine Begleiterin: {aktuellesTier.name}
            </div>
          )}
          {archetypTooltip && (
            <div
              className="archetyp-info-tooltip"
              style={{ '--phasen-farbe': phasenMeta.farbeHex }}
            >
              <div className="archetyp-info-tooltip-kopf">
                <span className="archetyp-info-tooltip-name">
                  {phasenMeta.symbol} {phasenMeta.kurzname}
                </span>
                <button
                  className="archetyp-info-tooltip-close"
                  onClick={() => setArchetypTooltip(false)}
                >
                  ✕
                </button>
              </div>
              <p>{phasenMeta.kurzbeschreibung}</p>
              <p className="archetyp-info-tooltip-energie">
                {phasenMeta.kernenergie}
              </p>
            </div>
          )}
          {tierTooltip && aktuellesTier && (
            <div className="heute-tier-tooltip">
              <p>{(() => {
                const tier = wissen.symboltiere.find(
                  (t) => t.name === aktuellesTier.name,
                )
                return tier ? tier.beschreibung : ''
              })()}</p>
              <button
                className="heute-tier-tooltip-close"
                onClick={() => setTierTooltip(false)}
              >
                ✕
              </button>
            </div>
          )}
          <div className="heute-zyklustag">
            Tag {phaseInfo.zyklusTag} von {daten.zyklusLaenge}
          </div>
          <div className="heute-mond">
            {mondInfo.symbol} {mondInfo.anzeigeText}
          </div>
          <button
            className="btn-phase-anpassen"
            onClick={() => setModalOffen(true)}
          >
            Phase anpassen ✏️
          </button>
        </div>
      </div>

      {/* Empfehlungskarten */}
      {empfehlungen && (
        <div className="empfehlungen">
          <EmpfehlungsKarte
            icon="✨"
            titel="Energie des Tages"
            text={empfehlungen.energie[variantenIndex]}
            farbe={phasenMeta.farbeHex}
          />

          {symboltierBotschaft && (
            <SymboltierKarte
              botschaft={symboltierBotschaft}
              farbe={phasenMeta.farbeHex}
            />
          )}

          <EmpfehlungsKarte
            icon="🌿"
            titel="Tagesimpuls"
            text={empfehlungen.uebung[variantenIndex]}
            farbe={phasenMeta.farbeHex}
          />

          <EmpfehlungsKarte
            icon="💫"
            titel="Affirmation"
            text={empfehlungen.affirmation[variantenIndex]}
            farbe={phasenMeta.farbeHex}
            zentriert
          />

          <EmpfehlungsKarte
            icon="🎨"
            titel="Kreativ-Tipp"
            text={empfehlungen.kreativ[variantenIndex]}
            farbe={phasenMeta.farbeHex}
          />
        </div>
      )}

      {/* Phase-Korrektur-Modal */}
      {modalOffen && (
        <PhasenModal
          aktuellePhase={aktuellePhase}
          berechnetePhase={phaseInfo.berechnetePhase}
          onWaehlen={phaseKorrigieren}
          onSchliessen={() => setModalOffen(false)}
        />
      )}
    </div>
  )
}

// ===========================================================================
// Empfehlungskarte
// ===========================================================================

function EmpfehlungsKarte({ icon, titel, text, farbe, zentriert }) {
  const [offen, setOffen] = useState(false)
  return (
    <div className={`empfehlung-card klappbar ${offen ? 'klappbar-offen' : ''}`} style={{ '--karten-farbe': farbe }}>
      <button className="empfehlung-header klappbar-kopf" onClick={() => setOffen(!offen)}>
        <span className="empfehlung-icon">{icon}</span>
        <span className="empfehlung-titel">{titel}</span>
        <span className="klappbar-pfeil">›</span>
      </button>
      {offen && (
        <p className={`empfehlung-text klappbar-inhalt ${zentriert ? 'empfehlung-text-zentriert' : ''}`}>
          {text}
        </p>
      )}
    </div>
  )
}

// ===========================================================================
// Symboltier-Karte
// ===========================================================================

function SymboltierKarte({ botschaft, farbe }) {
  const [offen, setOffen] = useState(false)
  if (!botschaft) return null

  return (
    <div className={`empfehlung-card klappbar ${offen ? 'klappbar-offen' : ''}`} style={{ '--karten-farbe': farbe }}>
      <button className="empfehlung-header klappbar-kopf" onClick={() => setOffen(!offen)}>
        <span className="empfehlung-icon">{botschaft.emoji}</span>
        <span className="empfehlung-titel">{botschaft.tier} flüstert</span>
        <span className="klappbar-pfeil">›</span>
      </button>
      {offen && (
        <p className="empfehlung-text klappbar-inhalt">
          {botschaft.text}
        </p>
      )}
    </div>
  )
}

// ===========================================================================
// Phasen-Korrektur-Modal
// ===========================================================================

function PhasenModal({ aktuellePhase, berechnetePhase, onWaehlen, onSchliessen }) {
  return (
    <div className="modal-overlay" onClick={onSchliessen}>
      <div className="modal-inhalt" onClick={(e) => e.stopPropagation()}>
        <div className="modal-kopf">
          <h2>Phase anpassen</h2>
          <button className="modal-schliessen" onClick={onSchliessen}>
            ✕
          </button>
        </div>
        <p className="modal-beschreibung">
          Wie fühlst du dich heute? Wähle die Phase, die am besten zu dir passt.
        </p>
        <div className="phasen-auswahl">
          {PHASEN_KEYS.map((key) => {
            const info = PHASEN_INFO[key]
            const istAktuell = key === aktuellePhase
            const istBerechnet = key === berechnetePhase

            return (
              <div
                key={key}
                className={`phasen-karte ${istAktuell ? 'phasen-karte-aktiv' : ''}`}
                style={{ '--phasen-farbe': info.farbeHex }}
                onClick={() => onWaehlen(key)}
              >
                <div className="phasen-karte-kopf">
                  <span className="phasen-karte-symbol">{info.symbol}</span>
                  <span className="phasen-karte-name">{info.kurzname}</span>
                  {istBerechnet && (
                    <span className="phasen-karte-badge">berechnet</span>
                  )}
                </div>
                <p className="phasen-karte-beschreibung">
                  {info.kurzbeschreibung}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Heute
