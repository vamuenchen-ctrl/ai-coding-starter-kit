import { useAuth } from '../context/AuthContext'
import { STORE_SCHRITTE } from '../utils/migrationsManager'

function MigrationsOverlay() {
  const { migration, migrationWiederholen } = useAuth()

  if (!migration?.aktiv) return null

  const { schritt, gesamt, fehler } = migration

  // Fehler-Ansicht (AC-4)
  if (fehler) {
    return (
      <div className="migrations-overlay" role="alert">
        <div className="migrations-overlay-inhalt">
          <p className="migrations-overlay-titel">Synchronisation fehlgeschlagen</p>
          <p className="migrations-overlay-fehler">{fehler}</p>
          <p className="migrations-overlay-hinweis">Deine lokalen Daten sind sicher.</p>
          <button className="migrations-overlay-btn" onClick={migrationWiederholen}>
            Erneut versuchen
          </button>
        </div>
      </div>
    )
  }

  // Fortschritts-Ansicht (AC-3)
  const fortschrittProzent = gesamt > 0 ? Math.round((schritt / gesamt) * 100) : 0

  return (
    <div className="migrations-overlay" role="status" aria-live="polite">
      <div className="migrations-overlay-inhalt">
        <p className="migrations-overlay-titel">Daten werden synchronisiert&hellip;</p>

        <div className="migrations-overlay-balken-bg">
          <div
            className="migrations-overlay-balken"
            style={{ width: `${fortschrittProzent}%` }}
          />
        </div>

        <p className="migrations-overlay-zaehler">
          {schritt} / {gesamt}
        </p>

        <ul className="migrations-overlay-liste">
          {STORE_SCHRITTE.map((s, i) => {
            const nr = i + 1
            let symbol = '\u25CB' // ○ pending
            let klasse = 'migrations-schritt--wartend'
            if (nr < schritt) {
              symbol = '\u2713' // ✓ done
              klasse = 'migrations-schritt--fertig'
            } else if (nr === schritt) {
              symbol = '\u25CF' // ● active
              klasse = 'migrations-schritt--aktiv'
            }
            return (
              <li key={s.key} className={`migrations-schritt ${klasse}`}>
                <span className="migrations-schritt-symbol">{symbol}</span>
                {s.label}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

export default MigrationsOverlay
