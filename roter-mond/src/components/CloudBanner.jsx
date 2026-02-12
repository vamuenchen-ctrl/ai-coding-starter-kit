import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { loescheAlleDaten } from '../utils/speicher.js'
import { supabase } from '../utils/supabase.js'

const HAT_KONTO_KEY = 'rotermond_hat_konto'

function CloudBanner() {
  const { user, abmelden } = useAuth()
  const navigate = useNavigate()
  const [loeschenBestaetigung, setLoeschenBestaetigung] = useState(false)
  const [loeschFehler, setLoeschFehler] = useState(null)
  const [loescheGerade, setLoescheGerade] = useState(false)

  // Supabase nicht konfiguriert → nichts anzeigen
  if (!supabase) return null

  // Merken, dass Nutzerin schon mal angemeldet war
  if (user) {
    try { localStorage.setItem(HAT_KONTO_KEY, '1') } catch { /* */ }
  }

  const hatteKonto = (() => {
    try { return localStorage.getItem(HAT_KONTO_KEY) === '1' } catch { return false }
  })()

  async function abmeldenUndLoeschen() {
    setLoeschFehler(null)
    setLoescheGerade(true)
    // Daten löschen mit Timeout — bei Netzwerkproblemen trotzdem abmelden
    try {
      await Promise.race([
        loescheAlleDaten(),
        new Promise((resolve) => setTimeout(resolve, 5000)),
      ])
    } catch { /* Fehler ignorieren, trotzdem abmelden */ }
    try { await abmelden({ global: true }) } catch { /* */ }
    navigate('/')
    window.location.reload()
  }

  async function lokaleDatenLoeschen() {
    setLoeschFehler(null)
    setLoescheGerade(true)
    try {
      await loescheAlleDaten()
    } catch { /* Kein User → nur lokale Daten, Fehler ignorieren */ }
    navigate('/')
    window.location.reload()
  }

  if (user) {
    return (
      <div className="cloud-banner cloud-banner-aktiv">
        <div className="cloud-banner-status">
          <span className="cloud-icon">&#9729;</span>
          <div>
            <p className="cloud-banner-title">Cloud-Sicherung aktiv</p>
            <p className="cloud-banner-email">{user.email}</p>
          </div>
        </div>

        <div className="cloud-banner-aktionen">
          <button className="btn-secondary" onClick={async () => {
            await abmelden()
            navigate('/')
            window.location.reload()
          }}>
            Abmelden
          </button>

          {!loeschenBestaetigung ? (
            <button
              className="btn-gefahr"
              onClick={() => setLoeschenBestaetigung(true)}
            >
              Abmelden und alle Daten löschen
            </button>
          ) : (
            <div className="cloud-banner-bestaetigung">
              <p>Bist du sicher? Dies kann nicht rückgängig gemacht werden.</p>
              {loeschFehler && (
                <p className="cloud-banner-fehler">{loeschFehler}</p>
              )}
              <div className="btn-gruppe">
                <button
                  className="btn-gefahr"
                  onClick={abmeldenUndLoeschen}
                  disabled={loescheGerade}
                >
                  {loescheGerade ? 'Lösche…' : 'Ja, alles löschen'}
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setLoeschenBestaetigung(false)
                    setLoeschFehler(null)
                  }}
                >
                  Abbrechen
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="cloud-banner">
      <div className="cloud-banner-inhalt">
        <span className="cloud-icon">&#9729;</span>
        <div>
          <p className="cloud-banner-title">{hatteKonto ? 'Cloud-Sicherung' : 'Daten sichern'}</p>
          <p className="cloud-banner-text">
            {hatteKonto
              ? 'Du bist abgemeldet. Melde dich an, um deine Daten zu synchronisieren.'
              : 'Melde dich an, damit deine Daten nicht verloren gehen.'}
          </p>
        </div>
      </div>
      <div className="cloud-banner-aktionen">
        <button className="btn-primary btn-sm" onClick={() => navigate('/anmelden')}>
          Anmelden
        </button>

        {!loeschenBestaetigung ? (
          <button
            className="btn-gefahr"
            onClick={() => setLoeschenBestaetigung(true)}
          >
            Alle Daten löschen
          </button>
        ) : (
          <div className="cloud-banner-bestaetigung">
            <p>Bist du sicher? Dies kann nicht rückgängig gemacht werden.</p>
            <div className="btn-gruppe">
              <button className="btn-gefahr" onClick={lokaleDatenLoeschen}>
                Ja, alles löschen
              </button>
              <button
                className="btn-secondary"
                onClick={() => setLoeschenBestaetigung(false)}
              >
                Abbrechen
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CloudBanner
