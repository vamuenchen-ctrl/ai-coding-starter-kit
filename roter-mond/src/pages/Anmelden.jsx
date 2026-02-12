import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../utils/supabase.js'
import { useAuth } from '../context/AuthContext.jsx'

function Anmelden() {
  const [fehler, setFehler] = useState(null)
  const [laed, setLaed] = useState(false)
  const navigate = useNavigate()
  const { user } = useAuth()

  // Bereits eingeloggt → zurück
  if (user) {
    return (
      <div className="page anmelden-seite">
        <h2>Angemeldet</h2>
        <p className="text-muted">
          Du bist bereits angemeldet als <strong>{user.email}</strong>.
        </p>
        <button className="btn-primary" onClick={() => navigate('/einstellungen')}>
          Zurück zu Einstellungen
        </button>
      </div>
    )
  }

  if (!supabase) {
    return (
      <div className="page anmelden-seite">
        <h2>Cloud-Sicherung</h2>
        <p className="text-muted">
          Die Cloud-Sicherung ist noch nicht konfiguriert. Bitte richte zuerst
          ein Supabase-Projekt ein.
        </p>
        <button className="btn-secondary" onClick={() => navigate('/einstellungen')}>
          Zurück
        </button>
      </div>
    )
  }

  async function mitGoogleAnmelden() {
    setFehler(null)
    setLaed(true)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/einstellungen',
      },
    })

    if (error) {
      console.error('Google Auth Fehler:', error.message, error)
      setFehler(`Fehler: ${error.message}`)
      setLaed(false)
    }
    // Bei Erfolg wird der Browser zu Google weitergeleitet
  }

  return (
    <div className="page anmelden-seite">
      <h2>Anmelden</h2>
      <p className="text-muted">
        Melde dich mit deinem Google-Konto an, um deine Daten in der Cloud
        zu sichern und auf anderen Geräten nutzen zu können.
      </p>

      {fehler && <p className="anmelden-fehler">{fehler}</p>}

      <button
        className="btn-google"
        onClick={mitGoogleAnmelden}
        disabled={laed}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" className="google-icon">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        {laed ? 'Weiterleitung...' : 'Mit Google anmelden'}
      </button>

      <div className="anmelden-datenschutz">
        <h3>Datenschutz</h3>
        <p className="text-muted">
          Deine Daten werden verschlüsselt übertragen und sicher in einer
          geschützten Datenbank gespeichert. Nur du hast Zugriff auf deine
          Daten – niemand sonst kann sie einsehen.
        </p>
        <p className="text-muted" style={{ marginTop: 8 }}>
          <Link to="/datenschutz">Datenschutzerklärung lesen</Link>
        </p>
      </div>

      <button className="btn-secondary" onClick={() => navigate('/einstellungen')}>
        Zurück
      </button>
    </div>
  )
}

export default Anmelden
