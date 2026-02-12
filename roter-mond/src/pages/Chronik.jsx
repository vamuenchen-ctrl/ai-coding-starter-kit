import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  ladeZyklusdaten,
  ladeKorrekturen,
  ladeChronikEintrag,
  speichereChronikEintrag,
  ladeZyklushistorie,
  speichereZyklushistorie,
  aktualisiereZyklusdaten,
  ladeChronik,
  ladeAngepassteGrenzen,
} from '../utils/speicher'
import { useSyncEngine } from '../context/SyncEngineContext'
import { berechneAngepasstePhase, PHASEN_INFO, PHASEN_KASUS } from '../utils/zyklus'
import { berechneMondphase } from '../utils/mondphasen'
import { korrigiereZyklusStartDatum } from '../utils/zyklusKorrektur'
import { analysiereChronikMuster } from '../utils/muster'
import { SYMBOLTIERE } from '../data/symboltiere'
import wissen from '../data/wissen.json'

// ---------------------------------------------------------------------------
// Konstanten für die Formularfelder
// ---------------------------------------------------------------------------

const KOERPER_OPTIONEN = [
  { wert: 'leicht', label: 'Leicht' },
  { wert: 'schwer', label: 'Schwer' },
  { wert: 'energiegeladen', label: 'Energiegeladen' },
  { wert: 'muede', label: 'Müde' },
  { wert: 'entspannt', label: 'Entspannt' },
  { wert: 'verspannt', label: 'Verspannt' },
  { wert: 'kraeftig', label: 'Kräftig' },
  { wert: 'empfindlich', label: 'Empfindlich' },
  { wert: 'schmerzen', label: 'Schmerzen' },
  { wert: 'neutral', label: 'Neutral' },
]

const STIMMUNG_OPTIONEN = [
  { wert: 'gluecklich', label: '😊', name: 'Glücklich' },
  { wert: 'ruhig', label: '😌', name: 'Ruhig' },
  { wert: 'traurig', label: '😢', name: 'Traurig' },
  { wert: 'wuetend', label: '😤', name: 'Wütend' },
  { wert: 'aengstlich', label: '😰', name: 'Ängstlich' },
  { wert: 'neutral', label: '😐', name: 'Neutral' },
]

const SEXUELL_OPTIONEN = [
  { wert: 'sehrStark', label: 'Sehr stark' },
  { wert: 'stark', label: 'Stark' },
  { wert: 'normal', label: 'Normal' },
  { wert: 'gering', label: 'Gering' },
  { wert: 'keines', label: 'Keines' },
]

// ===========================================================================
// Hauptkomponente
// ===========================================================================

function Chronik() {
  const { syncVersion } = useSyncEngine()
  const [aktiverTab, setAktiverTab] = useState('eintrag')
  const [eingerichtet, setEingerichtet] = useState(true)
  const [vorgewaehltesDatum, setVorgewaehltesDatum] = useState(null)

  useEffect(() => {
    const daten = ladeZyklusdaten()
    setEingerichtet(daten.ersteinrichtungAbgeschlossen)
  }, [syncVersion])

  function zumEintrag(datumStr) {
    setVorgewaehltesDatum(datumStr)
    setAktiverTab('eintrag')
  }

  if (!eingerichtet) {
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

  return (
    <div className="page chronik-page">
      <h1>Chronik</h1>
      <p className="page-subtitle">Dein Zyklustagebuch</p>

      {/* Tab-Navigation */}
      <div className="chronik-tabs">
        <button
          className={`chronik-tab ${aktiverTab === 'eintrag' ? 'chronik-tab-aktiv' : ''}`}
          onClick={() => setAktiverTab('eintrag')}
        >
          Eintrag
        </button>
        <button
          className={`chronik-tab ${aktiverTab === 'kalender' ? 'chronik-tab-aktiv' : ''}`}
          onClick={() => setAktiverTab('kalender')}
        >
          Kalender
        </button>
        <button
          className={`chronik-tab ${aktiverTab === 'verlauf' ? 'chronik-tab-aktiv' : ''}`}
          onClick={() => setAktiverTab('verlauf')}
        >
          Verlauf
        </button>
        <button
          className={`chronik-tab ${aktiverTab === 'insights' ? 'chronik-tab-aktiv' : ''}`}
          onClick={() => setAktiverTab('insights')}
        >
          Insights
        </button>
      </div>

      {/* Tab-Inhalt */}
      {aktiverTab === 'eintrag' && (
        <Tageseintrag
          vorgewaehltesDatum={vorgewaehltesDatum}
          onDatumGenutzt={() => setVorgewaehltesDatum(null)}
        />
      )}
      {aktiverTab === 'kalender' && <Kalender onBearbeiten={zumEintrag} />}
      {aktiverTab === 'verlauf' && <MondVerlauf />}
      {aktiverTab === 'insights' && <Insights />}
    </div>
  )
}

// ===========================================================================
// Tab 1: Tageseintrag
// ===========================================================================

function Tageseintrag({ vorgewaehltesDatum, onDatumGenutzt }) {
  const [datum, setDatum] = useState(() => datumAlsString(new Date()))
  const [gespeichert, setGespeichert] = useState(false)

  // Formularfelder
  const [koerper, setKoerper] = useState([])
  const [stimmung, setStimmung] = useState(null)
  const [energie, setEnergie] = useState(null)
  const [traeume, setTraeume] = useState('')
  const [kreativitaet, setKreativitaet] = useState('')
  const [sexuell, setSexuell] = useState(null)

  // Phaseninfo für das gewählte Datum
  const [phasenInfo, setPhasenInfo] = useState(null)

  // Tooltips für Archetyp/Symboltier
  const [archetypTooltip, setArchetypTooltip] = useState(false)
  const [tierTooltip, setTierTooltip] = useState(false)

  // Klappbare Felder
  const [offeneFelder, setOffeneFelder] = useState(new Set())
  function toggleFeld(key) {
    setOffeneFelder((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // Vorgewähltes Datum aus Kalender übernehmen
  useEffect(() => {
    if (vorgewaehltesDatum) {
      setDatum(vorgewaehltesDatum)
      onDatumGenutzt()
    }
  }, [vorgewaehltesDatum, onDatumGenutzt])

  // Lade bestehenden Eintrag bei Datumswechsel
  useEffect(() => {
    const gewaehlt = stringAlsDatum(datum)
    if (!gewaehlt) return

    // Phase für das gewählte Datum berechnen
    const daten = ladeZyklusdaten()
    if (daten.ersteinrichtungAbgeschlossen && daten.zyklusStart) {
      const korrekturen = ladeKorrekturen()
      const gespeicherteGrenzen = ladeAngepassteGrenzen()
      const phase = berechneAngepasstePhase(
        daten.zyklusStart,
        daten.zyklusLaenge,
        gewaehlt,
        korrekturen,
        gespeicherteGrenzen,
      )
      setPhasenInfo(phase)
    }

    // Bestehenden Eintrag laden
    const bestehend = ladeChronikEintrag(gewaehlt)
    if (bestehend) {
      setKoerper(bestehend.koerper || [])
      setStimmung(bestehend.stimmung || null)
      setEnergie(bestehend.energie ?? null)
      setTraeume(bestehend.traeume || '')
      setKreativitaet(bestehend.kreativitaet || '')
      setSexuell(bestehend.sexuellesEmpfinden || null)
    } else {
      // Felder zurücksetzen
      setKoerper([])
      setStimmung(null)
      setEnergie(null)
      setTraeume('')
      setKreativitaet('')
      setSexuell(null)
    }
    setGespeichert(false)
  }, [datum])

  function toggleKoerper(wert) {
    setKoerper((prev) =>
      prev.includes(wert)
        ? prev.filter((k) => k !== wert)
        : [...prev, wert],
    )
    setGespeichert(false)
  }

  function speichern() {
    const gewaehlt = stringAlsDatum(datum)
    if (!gewaehlt) return

    speichereChronikEintrag({
      datum: gewaehlt,
      koerper,
      stimmung,
      energie,
      traeume,
      kreativitaet,
      sexuellesEmpfinden: sexuell,
      phase: phasenInfo?.phase || null,
    })

    setGespeichert(true)
    setTimeout(() => setGespeichert(false), 2000)
  }

  const phasenMeta = phasenInfo ? PHASEN_INFO[phasenInfo.phase] : null

  return (
    <div className="tageseintrag" style={{ '--karten-farbe': phasenMeta ? phasenMeta.farbeHex : 'var(--color-bordeaux)' }}>
      {/* Datumsauswahl */}
      <div className="chronik-feld">
        <label className="form-label" htmlFor="chronik-datum">
          Datum
        </label>
        <input
          id="chronik-datum"
          type="date"
          className="form-input"
          value={datum}
          max={datumAlsString(new Date())}
          onChange={(e) => setDatum(e.target.value)}
        />
      </div>

      {/* Phase-Anzeige */}
      {phasenMeta && (
        <>
          <div
            className="chronik-phase-anzeige"
            style={{ '--phasen-farbe': phasenMeta.farbeHex }}
          >
            <button
              className="archetyp-symbol-btn chronik-phase-symbol"
              onClick={() => { setArchetypTooltip(!archetypTooltip); setTierTooltip(false) }}
            >
              {phasenMeta.symbol}
            </button>
            <span className="chronik-phase-name">{PHASEN_KASUS[phasenInfo.phase]?.kompositum || phasenMeta.kurzname}-Phase</span>
            {SYMBOLTIERE[phasenInfo.phase] && (
              <button
                className="archetyp-symbol-btn chronik-phase-tier"
                onClick={() => { setTierTooltip(!tierTooltip); setArchetypTooltip(false) }}
              >
                {SYMBOLTIERE[phasenInfo.phase].primaer.emoji}
              </button>
            )}
            {phasenInfo && (
              <span className="chronik-phase-tag">
                · Tag {phasenInfo.zyklusTag}
              </span>
            )}
          </div>
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
          {tierTooltip && SYMBOLTIERE[phasenInfo.phase] && (
            <div className="archetyp-info-tooltip" style={{ '--phasen-farbe': phasenMeta.farbeHex }}>
              <div className="archetyp-info-tooltip-kopf">
                <span className="archetyp-info-tooltip-name">
                  {SYMBOLTIERE[phasenInfo.phase].primaer.emoji} {SYMBOLTIERE[phasenInfo.phase].primaer.name}
                </span>
                <button
                  className="archetyp-info-tooltip-close"
                  onClick={() => setTierTooltip(false)}
                >
                  ✕
                </button>
              </div>
              <p>{(() => {
                const tier = wissen.symboltiere.find(
                  (t) => t.name === SYMBOLTIERE[phasenInfo.phase].primaer.name,
                )
                return tier ? tier.beschreibung : ''
              })()}</p>
            </div>
          )}
        </>
      )}

      {/* Körperempfinden */}
      <div className={`chronik-feld klappbar ${offeneFelder.has('koerper') ? 'klappbar-offen' : ''}`}>
        <button className="form-label klappbar-kopf" onClick={() => toggleFeld('koerper')}>
          <span>Körperempfinden</span>
          <span className="klappbar-pfeil">›</span>
        </button>
        {offeneFelder.has('koerper') && (
          <div className="klappbar-inhalt">
            <div className="chip-gruppe">
              {KOERPER_OPTIONEN.map((opt) => (
                <button
                  key={opt.wert}
                  className={`chip ${koerper.includes(opt.wert) ? 'chip-aktiv' : ''}`}
                  onClick={() => toggleKoerper(opt.wert)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Stimmung */}
      <div className={`chronik-feld klappbar ${offeneFelder.has('stimmung') ? 'klappbar-offen' : ''}`}>
        <button className="form-label klappbar-kopf" onClick={() => toggleFeld('stimmung')}>
          <span>Stimmung</span>
          <span className="klappbar-pfeil">›</span>
        </button>
        {offeneFelder.has('stimmung') && (
          <div className="klappbar-inhalt">
            <div className="emoji-gruppe">
              {STIMMUNG_OPTIONEN.map((opt) => (
                <button
                  key={opt.wert}
                  className={`emoji-btn ${stimmung === opt.wert ? 'emoji-btn-aktiv' : ''}`}
                  onClick={() => {
                    setStimmung(stimmung === opt.wert ? null : opt.wert)
                    setGespeichert(false)
                  }}
                  title={opt.name}
                >
                  <span className="emoji-btn-emoji">{opt.label}</span>
                  <span className="emoji-btn-name">{opt.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Energie-Slider */}
      <div className={`chronik-feld klappbar ${offeneFelder.has('energie') ? 'klappbar-offen' : ''}`}>
        <button className="form-label klappbar-kopf" onClick={() => toggleFeld('energie')}>
          <span>Energie</span>
          {offeneFelder.has('energie') && (
            <span className="klappbar-wert">{energie != null ? `${energie}/10` : '–'}</span>
          )}
          <span className="klappbar-pfeil">›</span>
        </button>
        {offeneFelder.has('energie') && (
          <div className="klappbar-inhalt">
            <div className="slider-container">
              <span className="slider-label-min">1</span>
              <input
                type="range"
                min="1"
                max="10"
                value={energie ?? 5}
                className="energie-slider"
                onChange={(e) => {
                  setEnergie(Number(e.target.value))
                  setGespeichert(false)
                }}
              />
              <span className="slider-label-max">10</span>
            </div>
          </div>
        )}
      </div>

      {/* Sexuelles Empfinden */}
      <div className={`chronik-feld klappbar ${offeneFelder.has('sexuell') ? 'klappbar-offen' : ''}`}>
        <button className="form-label klappbar-kopf" onClick={() => toggleFeld('sexuell')}>
          <span>Sexuelles Empfinden</span>
          {offeneFelder.has('sexuell') && (
            <span className="klappbar-wert">{sexuell ? SEXUELL_OPTIONEN.find((o) => o.wert === sexuell)?.label : '–'}</span>
          )}
          <span className="klappbar-pfeil">›</span>
        </button>
        {offeneFelder.has('sexuell') && (
          <div className="klappbar-inhalt">
            <div className="slider-container">
              <span className="slider-label-min">{SEXUELL_OPTIONEN[SEXUELL_OPTIONEN.length - 1].label}</span>
              <input
                type="range"
                min="0"
                max={SEXUELL_OPTIONEN.length - 1}
                value={sexuell ? (SEXUELL_OPTIONEN.length - 1 - SEXUELL_OPTIONEN.findIndex((o) => o.wert === sexuell)) : 2}
                className="energie-slider"
                onChange={(e) => {
                  const invertedIndex = SEXUELL_OPTIONEN.length - 1 - Number(e.target.value)
                  setSexuell(SEXUELL_OPTIONEN[invertedIndex].wert)
                  setGespeichert(false)
                }}
              />
              <span className="slider-label-max">{SEXUELL_OPTIONEN[0].label}</span>
            </div>
          </div>
        )}
      </div>

      {/* Träume */}
      <div className={`chronik-feld klappbar ${offeneFelder.has('traeume') ? 'klappbar-offen' : ''}`}>
        <button className="form-label klappbar-kopf" onClick={() => toggleFeld('traeume')}>
          <span>Träume</span>
          <span className="klappbar-pfeil">›</span>
        </button>
        {offeneFelder.has('traeume') && (
          <div className="klappbar-inhalt">
            <AutoTextarea
              id="chronik-traeume"
              value={traeume}
              maxLength={2000}
              minRows={3}
              placeholder="Erinnerst du dich an einen Traum?"
              onChange={(val) => {
                setTraeume(val)
                setGespeichert(false)
              }}
            />
            <div className="textarea-zaehler">{traeume.length}/2000</div>
          </div>
        )}
      </div>

      {/* Kreativität */}
      <div className={`chronik-feld klappbar ${offeneFelder.has('kreativitaet') ? 'klappbar-offen' : ''}`}>
        <button className="form-label klappbar-kopf" onClick={() => toggleFeld('kreativitaet')}>
          <span>Kreativität</span>
          <span className="klappbar-pfeil">›</span>
        </button>
        {offeneFelder.has('kreativitaet') && (
          <div className="klappbar-inhalt">
            <AutoTextarea
              id="chronik-kreativ"
              value={kreativitaet}
              maxLength={2000}
              minRows={3}
              placeholder="Kreative Gedanken oder Impulse?"
              onChange={(val) => {
                setKreativitaet(val)
                setGespeichert(false)
              }}
            />
            <div className="textarea-zaehler">{kreativitaet.length}/2000</div>
          </div>
        )}
      </div>

      {/* Speichern-Button */}
      <button className="btn-primary chronik-speichern" onClick={speichern}>
        {gespeichert ? '✓ Gespeichert' : 'Eintrag speichern'}
      </button>
    </div>
  )
}

// ===========================================================================
// Tab 2: Kalender
// ===========================================================================

function Kalender({ onBearbeiten }) {
  const { syncVersion } = useSyncEngine()
  const [monat, setMonat] = useState(() => {
    const heute = new Date()
    return { jahr: heute.getFullYear(), monat: heute.getMonth() }
  })
  const [gewaehlterTag, setGewaehlterTag] = useState(null)
  const [eintraege, setEintraege] = useState({})
  const [zyklusStarts, setZyklusStarts] = useState({})
  const [historieVersion, setHistorieVersion] = useState(0)

  useEffect(() => {
    const chronik = ladeChronik()
    const map = {}
    for (const eintrag of chronik) {
      if (eintrag.datum) {
        const key = datumAlsString(eintrag.datum)
        map[key] = eintrag
      }
    }
    setEintraege(map)

    // Zyklushistorie laden: Menstruations-Startdaten
    const historie = ladeZyklushistorie()
    const starts = {}
    for (const h of historie) {
      if (h.startdatum) {
        const key = datumAlsString(h.startdatum)
        starts[key] = h
      }
    }
    setZyklusStarts(starts)
  }, [syncVersion, historieVersion])

  function nachKorrektur(neuesDatum) {
    setHistorieVersion((v) => v + 1)
    setGewaehlterTag(null)
    if (neuesDatum) {
      setMonat({ jahr: neuesDatum.getFullYear(), monat: neuesDatum.getMonth() })
    }
  }

  const heute = new Date()
  const heuteKey = datumAlsString(heute)

  // Kalenderdaten berechnen
  const ersterTag = new Date(monat.jahr, monat.monat, 1)
  const tageImMonat = new Date(monat.jahr, monat.monat + 1, 0).getDate()

  // Montag = 0, Sonntag = 6 (deutscher Kalender)
  let startWochentag = ersterTag.getDay() - 1
  if (startWochentag < 0) startWochentag = 6

  const monatsName = ersterTag.toLocaleDateString('de-DE', {
    month: 'long',
    year: 'numeric',
  })

  function vorherMonat() {
    setMonat((prev) => {
      const d = new Date(prev.jahr, prev.monat - 1, 1)
      return { jahr: d.getFullYear(), monat: d.getMonth() }
    })
    setGewaehlterTag(null)
  }

  function naechsterMonat() {
    setMonat((prev) => {
      const d = new Date(prev.jahr, prev.monat + 1, 1)
      return { jahr: d.getFullYear(), monat: d.getMonth() }
    })
    setGewaehlterTag(null)
  }

  // Zellen aufbauen
  const zellen = []
  for (let i = 0; i < startWochentag; i++) {
    zellen.push(null)
  }
  for (let tag = 1; tag <= tageImMonat; tag++) {
    const datum = new Date(monat.jahr, monat.monat, tag)
    const key = datumAlsString(datum)
    zellen.push({
      tag,
      key,
      eintrag: eintraege[key] || null,
      istHeute: key === heuteKey,
      istGewaehlt: gewaehlterTag === key,
      zyklusStart: zyklusStarts[key] || null,
    })
  }

  // Anzahl Einträge im Monat
  const eintraegeImMonat = zellen.filter((z) => z && z.eintrag).length

  const gewaehlterEintrag = gewaehlterTag ? eintraege[gewaehlterTag] : null
  const gewaehlterStart = gewaehlterTag ? zyklusStarts[gewaehlterTag] : null

  return (
    <div className="kalender">
      {/* Monatsnavigation */}
      <div className="kalender-kopf">
        <button className="kalender-nav" onClick={vorherMonat}>
          ‹
        </button>
        <span className="kalender-monat">{monatsName}</span>
        <button className="kalender-nav" onClick={naechsterMonat}>
          ›
        </button>
      </div>

      {eintraegeImMonat > 0 && (
        <div className="kalender-zaehler">
          {eintraegeImMonat} {eintraegeImMonat === 1 ? 'Eintrag' : 'Einträge'}
        </div>
      )}

      {/* Wochentage */}
      <div className="kalender-grid">
        {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((tag) => (
          <div key={tag} className="kalender-wochentag">
            {tag}
          </div>
        ))}

        {/* Tageszellen */}
        {zellen.map((zelle, i) => {
          if (!zelle) {
            return (
              <div key={`leer-${i}`} className="kalender-zelle kalender-zelle-leer" />
            )
          }

          const klassen = ['kalender-zelle']
          if (zelle.istHeute) klassen.push('kalender-zelle-heute')
          if (zelle.istGewaehlt) klassen.push('kalender-zelle-gewaehlt')
          if (zelle.eintrag) klassen.push('kalender-zelle-eintrag')
          if (zelle.zyklusStart) klassen.push('kalender-zelle-mens')

          const phasenFarbe =
            zelle.eintrag?.phase && PHASEN_INFO[zelle.eintrag.phase]
              ? PHASEN_INFO[zelle.eintrag.phase].farbeHex
              : null

          return (
            <div
              key={zelle.key}
              className={klassen.join(' ')}
              onClick={() =>
                setGewaehlterTag(zelle.key === gewaehlterTag ? null : zelle.key)
              }
            >
              <span className="kalender-tag">{zelle.tag}</span>
              <span className="kalender-marker">
                {zelle.zyklusStart && (
                  <span className="kalender-tropfen" title="Menstruationsbeginn">●</span>
                )}
                {zelle.eintrag && (
                  <span
                    className="kalender-punkt"
                    style={phasenFarbe ? { backgroundColor: phasenFarbe } : undefined}
                  />
                )}
              </span>
            </div>
          )
        })}
      </div>

      {/* Zyklusstart-Info (immer anzeigen, wenn vorhanden) */}
      {gewaehlterTag && gewaehlterStart && (
        <ZyklusStartDetail
          zyklusStart={gewaehlterStart}
          onBearbeiten={gewaehlterEintrag ? null : () => onBearbeiten(gewaehlterTag)}
          onKorrektur={nachKorrektur}
        />
      )}

      {/* Ausgewählter Eintrag */}
      {gewaehlterTag && gewaehlterEintrag && (
        <EintragDetail
          eintrag={gewaehlterEintrag}
          onBearbeiten={() => onBearbeiten(gewaehlterTag)}
        />
      )}

      {gewaehlterTag && !gewaehlterEintrag && !gewaehlterStart && (
        <div className="kalender-kein-eintrag">
          <p>Kein Eintrag für diesen Tag.</p>
          <button
            className="btn-secondary kalender-neuer-eintrag-btn"
            onClick={() => onBearbeiten(gewaehlterTag)}
          >
            Eintrag erstellen
          </button>
        </div>
      )}
    </div>
  )
}

// ===========================================================================
// Eintrag-Detail (Kalender-Ansicht)
// ===========================================================================

function EintragDetail({ eintrag, onBearbeiten }) {
  const phasenMeta = eintrag.phase ? PHASEN_INFO[eintrag.phase] : null

  const datumStr = eintrag.datum
    ? eintrag.datum.toLocaleDateString('de-DE', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : ''

  const stimmungOpt = STIMMUNG_OPTIONEN.find((s) => s.wert === eintrag.stimmung)

  const koerperLabels = (eintrag.koerper || []).map((k) => {
    const opt = KOERPER_OPTIONEN.find((o) => o.wert === k)
    return opt ? opt.label : k
  })

  const sexuellOpt = SEXUELL_OPTIONEN.find(
    (s) => s.wert === eintrag.sexuellesEmpfinden,
  )

  return (
    <div className="eintrag-detail">
      <div className="eintrag-detail-kopf">
        <span className="eintrag-detail-datum">{datumStr}</span>
        {phasenMeta && (
          <span
            className="eintrag-detail-phase"
            style={{ color: phasenMeta.farbeHex }}
          >
            {phasenMeta.symbol} {phasenMeta.kurzname}
          </span>
        )}
      </div>

      {/* Stimmung, Energie & Sexuelles Empfinden */}
      <div className="eintrag-detail-zeile">
        {stimmungOpt && (
          <div className="eintrag-detail-item">
            <span className="eintrag-detail-label">Stimmung</span>
            <span className="eintrag-detail-wert">
              {stimmungOpt.label} {stimmungOpt.name}
            </span>
          </div>
        )}
        {eintrag.energie != null && (
          <div className="eintrag-detail-item">
            <span className="eintrag-detail-label">Energie</span>
            <span className="eintrag-detail-wert">{eintrag.energie}/10</span>
          </div>
        )}
        {sexuellOpt && (
          <div className="eintrag-detail-item">
            <span className="eintrag-detail-label">Sex. Empfinden</span>
            <span className="eintrag-detail-wert">{sexuellOpt.label}</span>
          </div>
        )}
      </div>

      {/* Körperempfinden */}
      {koerperLabels.length > 0 && (
        <div className="eintrag-detail-block">
          <span className="eintrag-detail-label">Körperempfinden</span>
          <div className="eintrag-detail-chips">
            {koerperLabels.map((label, i) => (
              <span key={i} className="chip chip-klein">
                {label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Träume */}
      {eintrag.traeume && (
        <div className="eintrag-detail-block">
          <span className="eintrag-detail-label">Träume</span>
          <p className="eintrag-detail-text">{eintrag.traeume}</p>
        </div>
      )}

      {/* Kreativität */}
      {eintrag.kreativitaet && (
        <div className="eintrag-detail-block">
          <span className="eintrag-detail-label">Kreativität</span>
          <p className="eintrag-detail-text">{eintrag.kreativitaet}</p>
        </div>
      )}

      <button className="btn-secondary eintrag-detail-bearbeiten" onClick={onBearbeiten}>
        Eintrag bearbeiten
      </button>
    </div>
  )
}

// ===========================================================================
// Zyklusstart-Detail (Kalender-Ansicht)
// ===========================================================================

function ZyklusStartDetail({ zyklusStart, onBearbeiten, onKorrektur }) {
  const [korrekturOffen, setKorrekturOffen] = useState(false)
  const [neuesDatum, setNeuesDatum] = useState('')
  const [fehler, setFehler] = useState(null)
  const [gespeichert, setGespeichert] = useState(false)

  const startStr = zyklusStart.startdatum
    ? zyklusStart.startdatum.toLocaleDateString('de-DE', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : ''

  const mondInfo = zyklusStart.startdatum
    ? berechneMondphase(zyklusStart.startdatum)
    : null

  const zyklusTypLabel =
    zyklusStart.zyklusTyp === 'weissmond'
      ? 'Weißmond-Zyklus'
      : zyklusStart.zyklusTyp === 'rotmond'
        ? 'Rotmond-Zyklus'
        : null

  function oeffneKorrektur() {
    setNeuesDatum(datumAlsString(zyklusStart.startdatum))
    setFehler(null)
    setGespeichert(false)
    setKorrekturOffen(true)
  }

  function schliesseKorrektur() {
    setKorrekturOffen(false)
    setFehler(null)
  }

  function speichereKorrektur() {
    setFehler(null)

    const historie = ladeZyklushistorie()
    const ergebnis = korrigiereZyklusStartDatum({
      neuesDatumStr: neuesDatum,
      bisherigStartdatum: zyklusStart.startdatum,
      historie,
    })

    if (!ergebnis.erfolg) {
      setFehler(ergebnis.fehler)
      return
    }

    // Ganzes Array speichern
    speichereZyklushistorie(ergebnis.historie)

    // Falls aktuellster Zyklus: auch zyklusdaten.zyklusStart aktualisieren
    if (ergebnis.istAktuellsterZyklus) {
      const neuesDate = ergebnis.historie[ergebnis.historie.length - 1].startdatum
      aktualisiereZyklusdaten({ zyklusStart: neuesDate })
    }

    // Hintergrundfarbe aktualisieren
    window.dispatchEvent(new Event('rotermond:phasen-update'))

    // Feedback anzeigen
    setGespeichert(true)
    setKorrekturOffen(false)
    setTimeout(() => {
      setGespeichert(false)
      if (onKorrektur) onKorrektur(stringAlsDatum(neuesDatum))
    }, 2000)
  }

  return (
    <div className="eintrag-detail kalender-mens-detail">
      <div className="eintrag-detail-kopf">
        <span className="eintrag-detail-datum">{startStr}</span>
        <span className="kalender-mens-badge">Menstruationsbeginn</span>
      </div>

      <div className="eintrag-detail-zeile">
        {mondInfo && (
          <div className="eintrag-detail-item">
            <span className="eintrag-detail-label">Mondphase</span>
            <span className="eintrag-detail-wert">
              {mondInfo.symbol} {mondInfo.anzeigeText}
            </span>
          </div>
        )}
        {zyklusStart.zyklusLaenge && (
          <div className="eintrag-detail-item">
            <span className="eintrag-detail-label">Zykluslänge</span>
            <span className="eintrag-detail-wert">{zyklusStart.zyklusLaenge} Tage</span>
          </div>
        )}
      </div>

      {zyklusTypLabel && (
        <div className="eintrag-detail-block">
          <span className="eintrag-detail-label">Zyklustyp</span>
          <span className="eintrag-detail-wert">{zyklusTypLabel}</span>
        </div>
      )}

      {/* Feedback nach erfolgreicher Korrektur */}
      {gespeichert && (
        <div className="korrektur-erfolg">Datum korrigiert</div>
      )}

      {/* Datum korrigieren - Button */}
      {!korrekturOffen && !gespeichert && (
        <button
          className="btn-text korrektur-btn"
          onClick={oeffneKorrektur}
        >
          Datum korrigieren
        </button>
      )}

      {/* Korrektur-Bereich (inline klappbar) */}
      {korrekturOffen && (
        <div className="korrektur-bereich">
          <label className="form-label" htmlFor="korrektur-datum">
            Neues Datum
          </label>
          <input
            id="korrektur-datum"
            type="date"
            className="form-input"
            value={neuesDatum}
            max={datumAlsString(new Date())}
            onChange={(e) => {
              setNeuesDatum(e.target.value)
              setFehler(null)
            }}
          />

          {fehler && (
            <div className="korrektur-fehler">{fehler}</div>
          )}

          <div className="korrektur-aktionen">
            <button
              className="btn-primary korrektur-speichern-btn"
              onClick={speichereKorrektur}
            >
              Speichern
            </button>
            <button
              className="btn-text korrektur-abbrechen-btn"
              onClick={schliesseKorrektur}
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {onBearbeiten && !korrekturOffen && !gespeichert && (
        <button className="btn-secondary eintrag-detail-bearbeiten" onClick={onBearbeiten}>
          Chronik-Eintrag erstellen
        </button>
      )}
    </div>
  )
}

// ===========================================================================
// Tab 3: Mein Mond-Verlauf
// ===========================================================================

function MondVerlauf() {
  const { syncVersion } = useSyncEngine()
  const [historie, setHistorie] = useState([])

  useEffect(() => {
    const daten = ladeZyklushistorie()
    // Neueste zuerst
    daten.sort((a, b) => b.startdatum - a.startdatum)
    setHistorie(daten)
  }, [syncVersion])

  if (historie.length === 0) {
    return (
      <div className="verlauf-leer">
        <div className="verlauf-leer-icon">🌙</div>
        <p className="verlauf-leer-text">
          Noch keine Zyklen erfasst. Sobald du in den Einstellungen einen neuen
          Zyklus startest, erscheint er hier.
        </p>
      </div>
    )
  }

  return (
    <div className="mond-verlauf">
      {historie.map((zyklus, index) => (
        <VerlaufKarte key={index} zyklus={zyklus} />
      ))}
    </div>
  )
}

// ===========================================================================
// Verlauf-Karte (einzelner Zyklus)
// ===========================================================================

function VerlaufKarte({ zyklus }) {
  const startStr = zyklus.startdatum
    ? zyklus.startdatum.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : '–'

  // Mondphase zum Zyklusstart
  const mondInfo = zyklus.startdatum
    ? berechneMondphase(zyklus.startdatum)
    : null

  const zyklusTypLabel =
    zyklus.zyklusTyp === 'weissmond'
      ? 'Weißmond-Zyklus'
      : zyklus.zyklusTyp === 'rotmond'
        ? 'Rotmond-Zyklus'
        : zyklus.zyklusTyp || '–'

  return (
    <div className="verlauf-karte" style={{ '--karten-farbe': zyklus.zyklusTyp === 'weissmond' ? 'var(--color-indigo)' : zyklus.zyklusTyp === 'rotmond' ? 'var(--color-bordeaux)' : 'var(--color-gold)' }}>
      <div className="verlauf-karte-kopf">
        <span className="verlauf-karte-datum">{SYMBOLTIERE.alteWeise.primaer.emoji} {startStr}</span>
        {zyklus.zyklusLaenge && (
          <span className="verlauf-karte-laenge">
            {zyklus.zyklusLaenge} Tage
          </span>
        )}
      </div>
      <div className="verlauf-karte-details">
        {mondInfo && (
          <div className="verlauf-detail">
            <span className="verlauf-detail-label">Mondphase:</span>
            <span className="verlauf-detail-wert">
              {mondInfo.symbol} {mondInfo.anzeigeText}
            </span>
          </div>
        )}
        <div className="verlauf-detail">
          <span className="verlauf-detail-label">Zyklustyp:</span>
          <span className="verlauf-detail-wert">{zyklusTypLabel}</span>
        </div>
      </div>
    </div>
  )
}

// ===========================================================================
// Tab 3: Insights
// ===========================================================================

function Insights() {
  const { syncVersion } = useSyncEngine()
  const [insights, setInsights] = useState([])
  const [geladen, setGeladen] = useState(false)

  useEffect(() => {
    const daten = ladeZyklusdaten()
    const chronik = ladeChronik()

    if (daten.ersteinrichtungAbgeschlossen && chronik.length > 0) {
      const muster = analysiereChronikMuster(chronik, daten.zyklusLaenge)
      setInsights(muster)
    }
    setGeladen(true)
  }, [syncVersion])

  if (!geladen) return null

  if (insights.length === 0) {
    return (
      <div className="insights-leer">
        <div className="insights-leer-icon">🔮</div>
        <p className="insights-leer-text">
          Trage regelmäßig in deine Mond-Chronik ein. Nach 2–3 Zyklen zeigt
          dir die App hier persönliche Muster und Erkenntnisse.
        </p>
      </div>
    )
  }

  return (
    <div className="insights-liste">
      {insights.map((insight, index) => (
        <div key={index} className="insight-karte">
          <span className="insight-emoji">{insight.emoji}</span>
          <p className="insight-text">{insight.text}</p>
        </div>
      ))}
    </div>
  )
}

// ===========================================================================
// Auto-wachsende Textarea
// ===========================================================================

function AutoTextarea({ id, value, maxLength, minRows, placeholder, onChange }) {
  const ref = useRef(null)
  const minHoehe = useRef(0)

  const anpassen = useCallback(() => {
    const el = ref.current
    if (!el) return
    // Mindesthöhe beim ersten Render merken
    if (minHoehe.current === 0) {
      minHoehe.current = el.scrollHeight
    }
    // Auf auto setzen damit scrollHeight korrekt gemessen wird
    el.style.height = 'auto'
    // Neue Höhe: mindestens die initiale Höhe
    el.style.height = Math.max(minHoehe.current, el.scrollHeight) + 'px'
  }, [])

  useEffect(() => {
    anpassen()
  }, [value, anpassen])

  return (
    <textarea
      ref={ref}
      id={id}
      className="form-input chronik-textarea"
      value={value}
      maxLength={maxLength}
      rows={minRows}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      style={{ overflow: 'hidden', resize: 'none' }}
    />
  )
}

// ===========================================================================
// Hilfsfunktionen
// ===========================================================================

function datumAlsString(datum) {
  const j = datum.getFullYear()
  const m = String(datum.getMonth() + 1).padStart(2, '0')
  const t = String(datum.getDate()).padStart(2, '0')
  return `${j}-${m}-${t}`
}

function stringAlsDatum(str) {
  if (!str) return null
  const [j, m, t] = str.split('-').map(Number)
  return new Date(j, m - 1, t)
}

export default Chronik
