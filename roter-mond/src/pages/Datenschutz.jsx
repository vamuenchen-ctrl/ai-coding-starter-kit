import { useNavigate } from 'react-router-dom'

function Datenschutz() {
  const navigate = useNavigate()

  return (
    <div className="page datenschutz-seite">
      <h1>Datenschutz&shy;erkl&auml;rung</h1>
      <p className="datenschutz-stand">Stand: Februar 2026</p>

      <section>
        <h2>1. Verantwortlicher</h2>
        <p>
          Roter Mond ist ein privates, nicht-kommerzielles Projekt.
          Bei Fragen zum Datenschutz erreichst du uns unter der in der App
          hinterlegten Kontaktadresse.
        </p>
      </section>

      <section>
        <h2>2. Welche Daten werden erhoben?</h2>

        <h3>a) Gastmodus (ohne Anmeldung)</h3>
        <p>
          Im Gastmodus werden alle Daten ausschließlich lokal auf deinem
          Ger&auml;t gespeichert (localStorage im Browser). Es werden keine
          Daten an Server &uuml;bertragen. Folgende Daten werden lokal
          gespeichert:
        </p>
        <ul>
          <li>Zyklusdaten (Startdatum, L&auml;nge, Zyklustyp)</li>
          <li>Zyklushistorie (vergangene Zyklen)</li>
          <li>Chronik-Eintr&auml;ge (K&ouml;rperempfinden, Stimmung, Energie, Tr&auml;ume, Kreativit&auml;t)</li>
          <li>Gezogene Tageskarten</li>
          <li>Phasenkorrekturen und angepasste Phasengrenzen</li>
        </ul>

        <h3>b) Mit Google-Anmeldung</h3>
        <p>
          Wenn du dich mit deinem Google-Konto anmeldest, werden zus&auml;tzlich
          folgende Daten verarbeitet:
        </p>
        <ul>
          <li>
            <strong>E-Mail-Adresse</strong> &ndash; wird von Google &uuml;bermittelt,
            um dein Konto zu identifizieren
          </li>
          <li>
            <strong>Nutzungs-ID</strong> &ndash; eine anonyme Kennung zur
            Zuordnung deiner Daten in der Cloud-Datenbank
          </li>
        </ul>
        <p>
          Deine oben genannten Zyklusdaten werden dann zus&auml;tzlich in einer
          gesch&uuml;tzten Cloud-Datenbank (Supabase) gespeichert, damit du
          sie auf mehreren Ger&auml;ten nutzen kannst.
        </p>
      </section>

      <section>
        <h2>3. Zweck der Datenverarbeitung</h2>
        <ul>
          <li>Berechnung deiner aktuellen Zyklusphase</li>
          <li>Anzeige personalisierter Empfehlungen basierend auf deinem Zyklus</li>
          <li>Synchronisierung deiner Daten zwischen Ger&auml;ten (nur bei Anmeldung)</li>
          <li>Erkennung von Mustern in deiner Chronik</li>
        </ul>
      </section>

      <section>
        <h2>4. Speicherung und Sicherheit</h2>
        <p>
          Die Cloud-Speicherung erfolgt &uuml;ber <strong>Supabase</strong>,
          einen Dienst mit Sitz in den USA, der die Daten verschl&uuml;sselt
          &uuml;bertr&auml;gt (TLS) und in einer gesicherten PostgreSQL-Datenbank
          speichert. Der Zugriff auf deine Daten ist durch Row Level Security
          (RLS) auf deine Nutzer-ID beschr&auml;nkt &ndash; niemand sonst kann
          deine Daten einsehen.
        </p>
      </section>

      <section>
        <h2>5. Weitergabe an Dritte</h2>
        <p>
          Deine Daten werden <strong>nicht</strong> an Dritte weitergegeben,
          verkauft oder f&uuml;r Werbezwecke genutzt. Die einzige Ausnahme ist
          der technische Dienstleister Supabase f&uuml;r die Cloud-Speicherung
          sowie Google f&uuml;r die Authentifizierung.
        </p>
      </section>

      <section>
        <h2>6. Deine Rechte</h2>
        <p>Du hast jederzeit das Recht:</p>
        <ul>
          <li>
            <strong>Auskunft</strong> &ndash; Alle deine Daten sind direkt in
            der App einsehbar (Einstellungen, Chronik)
          </li>
          <li>
            <strong>L&ouml;schung</strong> &ndash; Du kannst in den Einstellungen
            &uuml;ber &bdquo;Abmelden und alle Daten l&ouml;schen&ldquo;
            deine Daten unwiderruflich entfernen (lokal und in der Cloud)
          </li>
          <li>
            <strong>Abmeldung</strong> &ndash; Du kannst dich jederzeit abmelden;
            die App funktioniert dann weiter im Gastmodus
          </li>
        </ul>
      </section>

      <section>
        <h2>7. Cookies und Tracking</h2>
        <p>
          Roter Mond verwendet <strong>keine Cookies</strong>, kein Tracking,
          keine Analyse-Tools und keine Werbung. Es werden keine Daten an
          Google Analytics oder vergleichbare Dienste gesendet.
        </p>
      </section>

      <section>
        <h2>8. &Auml;nderungen</h2>
        <p>
          Diese Datenschutzerkl&auml;rung kann gelegentlich aktualisiert werden.
          Die aktuelle Version ist immer in der App unter &bdquo;Datenschutz&ldquo;
          abrufbar.
        </p>
      </section>

      <button className="btn-secondary" onClick={() => navigate(-1)}>
        Zur&uuml;ck
      </button>
    </div>
  )
}

export default Datenschutz
