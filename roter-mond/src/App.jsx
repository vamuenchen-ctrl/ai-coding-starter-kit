import { useState, useEffect, useCallback } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { SyncEngineProvider, useSyncEngine } from './context/SyncEngineContext'
import { ladeZyklusdaten, ladeKorrekturen, ladeAngepassteGrenzen } from './utils/speicher'
import { berechneAngepasstePhase, PHASEN_INFO } from './utils/zyklus'
import TabBar from './components/TabBar'
import SyncStatus from './components/SyncStatus'
import Heute from './pages/Heute'
import Orakel from './pages/Orakel'
import Chronik from './pages/Chronik'
import Wissen from './pages/Wissen'
import Einstellungen from './pages/Einstellungen'
import Anmelden from './pages/Anmelden'
import Datenschutz from './pages/Datenschutz'
import Nutzungsbedingungen from './pages/Nutzungsbedingungen'
import Impressum from './pages/Impressum'
import RechtlicheLinks from './components/RechtlicheLinks'
import ScrollToTop from './components/ScrollToTop'
import MergeToast from './components/MergeToast'
import MigrationsOverlay from './components/MigrationsOverlay'
import './App.css'

// ---------------------------------------------------------------------------
// AppShell – setzt die Phasen-Hintergrundfarbe auf App-Ebene
// ---------------------------------------------------------------------------

function AppShell({ children }) {
  const { syncVersion } = useSyncEngine()
  const [phasenBgFarbe, setPhasenBgFarbe] = useState('#F5F5F3') // Default: Alte Weise

  const berechneHintergrund = useCallback(() => {
    const daten = ladeZyklusdaten()
    if (!daten || !daten.ersteinrichtungAbgeschlossen || !daten.zyklusStart) {
      setPhasenBgFarbe('#F5F5F3')
      return
    }

    const korrekturen = ladeKorrekturen()
    const grenzen = ladeAngepassteGrenzen()
    const phaseInfo = berechneAngepasstePhase(
      daten.zyklusStart,
      daten.zyklusLaenge,
      new Date(),
      korrekturen,
      grenzen,
    )

    const meta = PHASEN_INFO[phaseInfo.phase]
    if (meta && meta.farbeBgHex) {
      setPhasenBgFarbe(meta.farbeBgHex)
    }
  }, [])

  // Neuberechnung bei Sync-Änderungen
  useEffect(() => {
    berechneHintergrund()
  }, [syncVersion, berechneHintergrund])

  // Auf lokale Phasen-Änderungen reagieren (manuelle Phase, Datumskorrektur)
  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.farbeBgHex) {
        // Direkte Farbübergabe (z.B. manuelle Phasenwahl in Heute)
        setPhasenBgFarbe(e.detail.farbeBgHex)
      } else {
        // Neuberechnung aus localStorage (z.B. Datumsänderung)
        berechneHintergrund()
      }
    }
    window.addEventListener('rotermond:phasen-update', handler)
    return () => window.removeEventListener('rotermond:phasen-update', handler)
  }, [berechneHintergrund])

  return (
    <div className="app-shell" style={{ '--phasen-farbe-bg': phasenBgFarbe }}>
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

function App() {
  return (
    <AuthProvider>
      <SyncEngineProvider>
        <BrowserRouter>
          <ScrollToTop />
          <MergeToast />
          <MigrationsOverlay />
          <SyncStatus />
          <AppShell>
            <main className="app-content">
              <Routes>
                <Route path="/" element={<Heute />} />
                <Route path="/orakel" element={<Orakel />} />
                <Route path="/chronik" element={<Chronik />} />
                <Route path="/wissen" element={<Wissen />} />
                <Route path="/einstellungen" element={<Einstellungen />} />
                <Route path="/anmelden" element={<Anmelden />} />
                <Route path="/datenschutz" element={<Datenschutz />} />
                <Route path="/nutzungsbedingungen" element={<Nutzungsbedingungen />} />
                <Route path="/impressum" element={<Impressum />} />
              </Routes>
              <RechtlicheLinks />
            </main>
            <TabBar />
          </AppShell>
        </BrowserRouter>
      </SyncEngineProvider>
    </AuthProvider>
  )
}

export default App
