import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../utils/supabase.js'
import { setCurrentUser } from '../utils/speicher.js'
import { fuehreMigrationDurch } from '../utils/migrationsManager.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  // PROJ-4: Migrationsstatus ersetzt den alten `syncing`-Boolean
  // null = keine Migration, Objekt = aktiv oder Fehler
  const [migration, setMigration] = useState(null)

  const starteMigration = useCallback(async (userId) => {
    setMigration({ aktiv: true, pfad: null, schritt: 0, gesamt: 7, label: '', fehler: null })

    try {
      const ergebnis = await fuehreMigrationDurch(userId, (fortschritt) => {
        setMigration((prev) => ({ ...prev, ...fortschritt, fehler: null }))
      })

      // Synced-Flag setzen (AC-10)
      localStorage.setItem(`rotermond_synced_${userId}`, Date.now().toString())
      setMigration(null)
      return ergebnis
    } catch (err) {
      console.error('Migrations-Fehler:', err)
      setMigration((prev) => ({ ...prev, aktiv: true, fehler: err.message || 'Netzwerkfehler' }))
      throw err
    }
  }, [])

  const handleAuthenticatedUser = useCallback(async (authUser) => {
    setCurrentUser(authUser.id)

    // Bereits synchronisierte Nutzerinnen überspringen (AC-10)
    const bereitsGesynct = localStorage.getItem(`rotermond_synced_${authUser.id}`)
    if (bereitsGesynct) return

    try {
      await starteMigration(authUser.id)
    } catch {
      // Fehler wird im migration-State angezeigt (AC-4)
    }
  }, [starteMigration])

  // AC-4: "Erneut versuchen"-Funktion
  const migrationWiederholen = useCallback(async () => {
    if (!user) return
    try {
      await starteMigration(user.id)
    } catch {
      // Fehler wird im migration-State angezeigt
    }
  }, [user, starteMigration])

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    // Bestehende Session prüfen
    supabase.auth.getSession().then(({ data: { session } }) => {
      const authUser = session?.user ?? null
      setUser(authUser)

      if (authUser) {
        handleAuthenticatedUser(authUser).then(() => setLoading(false))
      } else {
        setCurrentUser(null)
        setLoading(false)
      }
    })

    // Auth-Änderungen beobachten (OAuth-Callback, Sign-Out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const authUser = session?.user ?? null
        setUser(authUser)

        if (event === 'SIGNED_OUT') {
          // Cross-Device-Sicherheit: Supabase-Tokens aus localStorage entfernen,
          // damit kein Auto-Refresh die Session wiederherstellen kann.
          // Wichtig bei globalem Signout von einem anderen Gerät.
          try {
            Object.keys(localStorage)
              .filter((k) => k.startsWith('sb-'))
              .forEach((k) => localStorage.removeItem(k))
          } catch { /* */ }
          setCurrentUser(null)
        } else if (authUser) {
          await handleAuthenticatedUser(authUser)
        } else {
          setCurrentUser(null)
        }
      },
    )

    return () => subscription.unsubscribe()
  }, [handleAuthenticatedUser])

  const abmelden = useCallback(async ({ global: istGlobal } = {}) => {
    if (!supabase) return
    const aktuellerUser = user?.id
    // UI sofort aktualisieren
    setUser(null)
    setCurrentUser(null)
    setMigration(null)
    if (aktuellerUser) {
      localStorage.removeItem(`rotermond_synced_${aktuellerUser}`)
    }

    // signOut ZUERST aufrufen — der Client braucht die Tokens in localStorage,
    // um den API-Call zum Server zu authentifizieren.
    // Bei global: Alle Sessions auf allen Geräten invalidieren.
    // Längerer Timeout für global, da dies für Cross-Device-Sicherheit kritisch ist.
    try {
      await Promise.race([
        supabase.auth.signOut(istGlobal ? { scope: 'global' } : undefined),
        new Promise((resolve) => setTimeout(resolve, istGlobal ? 8000 : 3000)),
      ])
    } catch { /* Fehler ignorieren */ }

    // DANACH: Supabase-Tokens aus localStorage entfernen,
    // damit nach Reload keine Session mehr gefunden wird
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith('sb-'))
        .forEach((k) => localStorage.removeItem(k))
    } catch { /* */ }
  }, [user])

  return (
    <AuthContext.Provider value={{ user, loading, migration, migrationWiederholen, abmelden }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    // Außerhalb des Providers: Gast-Modus
    return { user: null, loading: false, migration: null, migrationWiederholen: () => {}, abmelden: () => {} }
  }
  return context
}
