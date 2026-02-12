import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSyncEngine } from '../context/SyncEngineContext'

const STATUS_TEXTE = {
  verbunden: 'Daten synchron',
  verbindend: 'Verbindung wird hergestellt\u2026',
  getrennt: 'Offline \u2013 Daten werden lokal gespeichert',
  sitzung_abgelaufen: 'Sitzung abgelaufen \u2013 bitte erneut anmelden',
}

function SyncStatus() {
  const { user } = useAuth()
  const { syncStatus, queueAnzahl, fehlgeschlageneAnzahl, fehlgeschlageneVerwerfen } = useSyncEngine()
  const [tooltipOffen, setTooltipOffen] = useState(false)

  // Nur für eingeloggte Nutzerinnen anzeigen
  if (!user) return null

  const tooltipText = queueAnzahl > 0
    ? `${STATUS_TEXTE[syncStatus]} \u2013 ${queueAnzahl} ${queueAnzahl === 1 ? '\u00c4nderung wartet' : '\u00c4nderungen warten'} auf Sync`
    : STATUS_TEXTE[syncStatus]

  return (
    <div
      className="sync-status"
      onClick={() => setTooltipOffen((v) => !v)}
      onBlur={() => setTooltipOffen(false)}
      tabIndex={0}
      role="status"
      aria-label={tooltipText}
    >
      <span className={`sync-status-punkt sync-status-punkt--${syncStatus}`} />
      {queueAnzahl > 0 && (
        <span className="sync-status-badge">{queueAnzahl}</span>
      )}
      {tooltipOffen && (
        <span className="sync-status-tooltip">{tooltipText}</span>
      )}
      {fehlgeschlageneAnzahl > 0 && (
        <div className="sync-status-warnung">
          <span>
            {fehlgeschlageneAnzahl === 1
              ? '1 \u00c4nderung konnte nicht synchronisiert werden'
              : `${fehlgeschlageneAnzahl} \u00c4nderungen konnten nicht synchronisiert werden`}
          </span>
          <button
            className="sync-status-warnung-btn"
            onClick={(e) => {
              e.stopPropagation()
              fehlgeschlageneVerwerfen()
            }}
          >
            OK
          </button>
        </div>
      )}
    </div>
  )
}

export default SyncStatus
