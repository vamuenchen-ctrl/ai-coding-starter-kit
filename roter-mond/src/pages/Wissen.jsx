import { useState } from 'react'
import phasen from '../data/phasen.json'
import wissen from '../data/wissen.json'

// ---------------------------------------------------------------------------
// Phasen-Reihenfolge für die Archetypen-Sektion
// ---------------------------------------------------------------------------

const PHASEN_KEYS = ['jungeFrau', 'mutter', 'zauberin', 'alteWeise']

// Symboltier-Emojis pro Tiername
const TIER_EMOJI = {
  'Schmetterling': '🦋',
  'Einhorn': '🦄',
  'Taube': '🕊️',
  'Pferd': '🐴',
  'Kranich': '🪶',
  'Eule': '🦉',
  'Hase': '🐇',
}

// ===========================================================================
// Hauptkomponente
// ===========================================================================

function Wissen() {
  const [offen, setOffen] = useState(null) // ID des geöffneten Top-Level-Akkordeons

  function toggle(id) {
    setOffen((prev) => (prev === id ? null : id))
  }

  return (
    <div className="page wissen-page">
      <h1>Wissen</h1>
      <p className="page-subtitle">Entdecke die Hintergründe</p>

      <div className="akkordeon-liste">
        {/* 1. Die vier Archetypen */}
        <Akkordeon
          id="archetypen"
          titel="Die vier Archetypen"
          farbe="var(--color-bordeaux)"
          offen={offen === 'archetypen'}
          onToggle={() => toggle('archetypen')}
        >
          <ArchetypenInhalt />
        </Akkordeon>

        {/* 2. Weißmond- und Rotmond-Zyklus */}
        <Akkordeon
          id="zyklustypen"
          titel="Weißmond- und Rotmond-Zyklus"
          farbe="var(--color-indigo)"
          offen={offen === 'zyklustypen'}
          onToggle={() => toggle('zyklustypen')}
        >
          <ZyklustypenInhalt />
        </Akkordeon>

        {/* 3. Die Symboltiere */}
        <Akkordeon
          id="symboltiere"
          titel="Die Symboltiere"
          farbe="var(--color-gold)"
          offen={offen === 'symboltiere'}
          onToggle={() => toggle('symboltiere')}
        >
          <SymboltiereInhalt />
        </Akkordeon>

        {/* 4. Mond und Menstruationszyklus */}
        <Akkordeon
          id="mond"
          titel="Mond und Menstruationszyklus"
          farbe="var(--color-indigo)"
          offen={offen === 'mond'}
          onToggle={() => toggle('mond')}
        >
          <p className="wissen-text">{wissen.mondZusammenhang}</p>
        </Akkordeon>

        {/* 5. Die Mond-Chronik */}
        <Akkordeon
          id="chronik"
          titel="Die Mond-Chronik"
          farbe="var(--color-bordeaux)"
          offen={offen === 'chronik'}
          onToggle={() => toggle('chronik')}
        >
          <p className="wissen-text">{wissen.mondChronik}</p>
        </Akkordeon>
      </div>
    </div>
  )
}

// ===========================================================================
// Akkordeon-Komponente (wiederverwendbar)
// ===========================================================================

function Akkordeon({ titel, farbe, offen, onToggle, children }) {
  return (
    <div className={`akkordeon ${offen ? 'akkordeon-offen' : ''}`} style={{ '--karten-farbe': farbe }}>
      <button className="akkordeon-kopf" onClick={onToggle}>
        <span className="akkordeon-titel">{titel}</span>
        <span className="akkordeon-pfeil">{offen ? '−' : '+'}</span>
      </button>
      <div className="akkordeon-inhalt-wrapper">
        <div className="akkordeon-inhalt">
          {children}
        </div>
      </div>
    </div>
  )
}

// ===========================================================================
// Unter-Akkordeon (für verschachtelte Bereiche)
// ===========================================================================

function UnterAkkordeon({ titel, farbe, offen, onToggle, children }) {
  return (
    <div
      className={`unter-akkordeon ${offen ? 'unter-akkordeon-offen' : ''}`}
      style={{ '--phasen-farbe': farbe }}
    >
      <button className="unter-akkordeon-kopf" onClick={onToggle}>
        <span className="unter-akkordeon-titel">{titel}</span>
        <span className="unter-akkordeon-pfeil">{offen ? '−' : '+'}</span>
      </button>
      <div className="unter-akkordeon-inhalt-wrapper">
        <div className="unter-akkordeon-inhalt">
          {children}
        </div>
      </div>
    </div>
  )
}

// ===========================================================================
// 1. Archetypen-Inhalt
// ===========================================================================

function ArchetypenInhalt() {
  const [offeneSub, setOffeneSub] = useState(null)

  function toggleSub(key) {
    setOffeneSub((prev) => (prev === key ? null : key))
  }

  return (
    <div className="archetypen-liste">
      {PHASEN_KEYS.map((key) => {
        const phase = phasen[key]
        return (
          <UnterAkkordeon
            key={key}
            titel={`Die ${phase.kurzname}`}
            farbe={phase.farbeHex}
            offen={offeneSub === key}
            onToggle={() => toggleSub(key)}
          >
            <PhasenDetail phase={phase} />
          </UnterAkkordeon>
        )
      })}
    </div>
  )
}

// ===========================================================================
// Phasen-Detail (einzelner Archetyp)
// ===========================================================================

function PhasenDetail({ phase }) {
  return (
    <div className="phasen-detail" style={{ '--phasen-farbe': phase.farbeHex }}>
      {/* Meta-Infos */}
      <div className="phasen-meta-grid">
        <MetaItem label="Symbol" wert={phase.symbol} />
        <MetaItem label="Mondphase" wert={phase.mondphase} />
        <MetaItem label="Jahreszeit" wert={phase.jahreszeit} />
        <MetaItem label="Element" wert={phase.element} />
      </div>

      {/* Ausführliche Beschreibung */}
      <p className="wissen-text">{phase.ausfuehrlicheBeschreibung}</p>

      {/* Stärken */}
      <div className="phasen-abschnitt">
        <h4 className="phasen-abschnitt-titel">Stärken</h4>
        <ul className="phasen-liste">
          {phase.staerken.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </div>

      {/* Herausforderungen */}
      <div className="phasen-abschnitt">
        <h4 className="phasen-abschnitt-titel">Herausforderungen</h4>
        <ul className="phasen-liste">
          {phase.herausforderungen.map((h, i) => (
            <li key={i}>{h}</li>
          ))}
        </ul>
      </div>

      {/* Symboltier */}
      <div className="phasen-abschnitt">
        <h4 className="phasen-abschnitt-titel">Symboltier</h4>
        <p className="wissen-text">{phase.symboltierBeschreibung}</p>
      </div>
    </div>
  )
}

function MetaItem({ label, wert }) {
  return (
    <div className="phasen-meta-item">
      <span className="phasen-meta-label">{label}</span>
      <span className="phasen-meta-wert">{wert}</span>
    </div>
  )
}

// ===========================================================================
// 2. Zyklustypen-Inhalt
// ===========================================================================

function ZyklustypenInhalt() {
  return (
    <div className="zyklustypen-inhalt">
      <div className="zyklustyp-block">
        <h3 className="zyklustyp-name">
          🌑 {wissen.zyklustypen.weissmond.name}
        </h3>
        <p className="wissen-text">
          {wissen.zyklustypen.weissmond.beschreibung}
        </p>
      </div>
      <div className="zyklustyp-block">
        <h3 className="zyklustyp-name">
          🌕 {wissen.zyklustypen.rotmond.name}
        </h3>
        <p className="wissen-text">
          {wissen.zyklustypen.rotmond.beschreibung}
        </p>
      </div>
    </div>
  )
}

// ===========================================================================
// 3. Symboltiere-Inhalt
// ===========================================================================

function SymboltiereInhalt() {
  return (
    <div className="symboltiere-grid">
      {wissen.symboltiere.map((tier, i) => (
        <div key={i} className="symboltier-karte">
          <div className="symboltier-kopf">
            <span className="symboltier-emoji">
              {TIER_EMOJI[tier.name] || '🐾'}
            </span>
            <div>
              <div className="symboltier-name">{tier.name}</div>
              <div className="symboltier-phase">{tier.phaseName}</div>
            </div>
          </div>
          <p className="symboltier-text">{tier.beschreibung}</p>
        </div>
      ))}
    </div>
  )
}

export default Wissen
