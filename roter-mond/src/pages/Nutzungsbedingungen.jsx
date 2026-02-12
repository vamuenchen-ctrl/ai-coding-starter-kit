import { useNavigate } from 'react-router-dom'

function Nutzungsbedingungen() {
  const navigate = useNavigate()

  return (
    <div className="page datenschutz-seite">
      <h1>Nutzungs&shy;bedingungen</h1>
      <p className="datenschutz-stand">Stand: Februar 2026</p>

      <section>
        <h2>1. Geltungsbereich</h2>
        <p>
          Diese Nutzungsbedingungen gelten f&uuml;r die Nutzung der Web-App
          &bdquo;Roter Mond&ldquo; (nachfolgend &bdquo;App&ldquo;). Mit der
          Nutzung der App erkl&auml;rst du dich mit diesen Bedingungen
          einverstanden.
        </p>
      </section>

      <section>
        <h2>2. Beschreibung der App</h2>
        <p>
          Roter Mond ist eine Zyklus-Begleiterin auf Basis der vier Archetypen
          nach Miranda Gray. Die App bietet Zyklustracking, t&auml;gliche
          Orakelkarten, eine pers&ouml;nliche Chronik und Wissensinhalte rund
          um den weiblichen Zyklus.
        </p>
      </section>

      <section>
        <h2>3. Keine medizinische Beratung</h2>
        <p>
          Die App dient ausschlie&szlig;lich zur <strong>Selbstreflexion und
          pers&ouml;nlichen Begleitung</strong>. Sie ersetzt keine medizinische,
          therapeutische oder psychologische Beratung. Alle Inhalte &ndash;
          einschlie&szlig;lich Phasenberechnung, Empfehlungen und
          Orakelkarten &ndash; sind <strong>nicht</strong> als medizinischer Rat
          zu verstehen.
        </p>
        <p>
          Die App ist <strong>nicht</strong> als Verh&uuml;tungsmittel oder zur
          Familienplanung geeignet.
        </p>
      </section>

      <section>
        <h2>4. Kostenfreiheit</h2>
        <p>
          Die Nutzung der App ist kostenlos. Es gibt keine In-App-K&auml;ufe,
          keine Abonnements und keine Werbung.
        </p>
      </section>

      <section>
        <h2>5. Konto und Gastmodus</h2>
        <p>
          Die App kann ohne Anmeldung im Gastmodus genutzt werden. Daten werden
          dabei ausschlie&szlig;lich lokal auf deinem Ger&auml;t gespeichert.
        </p>
        <p>
          Optional kannst du dich mit einem Google-Konto anmelden, um deine
          Daten in der Cloud zu sichern und auf mehreren Ger&auml;ten zu nutzen.
          Du kannst dein Konto jederzeit abmelden oder deine Daten vollst&auml;ndig
          l&ouml;schen.
        </p>
      </section>

      <section>
        <h2>6. Verf&uuml;gbarkeit</h2>
        <p>
          Es besteht kein Anspruch auf st&auml;ndige Verf&uuml;gbarkeit der App.
          Die App kann jederzeit ge&auml;ndert, eingeschr&auml;nkt oder
          eingestellt werden.
        </p>
      </section>

      <section>
        <h2>7. Haftungsausschluss</h2>
        <p>
          Die Nutzung der App erfolgt auf eigene Verantwortung. F&uuml;r die
          Richtigkeit, Vollst&auml;ndigkeit und Aktualit&auml;t der Inhalte
          wird keine Gew&auml;hr &uuml;bernommen. Eine Haftung f&uuml;r
          Sch&auml;den, die durch die Nutzung der App entstehen, ist &ndash;
          soweit gesetzlich zul&auml;ssig &ndash; ausgeschlossen.
        </p>
      </section>

      <section>
        <h2>8. Geistiges Eigentum</h2>
        <p>
          Die Inhalte der App (Texte, Grafiken, Orakelkarten) sind
          urheberrechtlich gesch&uuml;tzt. Das Archetypen-Modell basiert auf
          den Arbeiten von Miranda Gray. Die App selbst ist ein unabh&auml;ngiges
          Projekt ohne Verbindung zur Autorin.
        </p>
      </section>

      <section>
        <h2>9. &Auml;nderungen</h2>
        <p>
          Diese Nutzungsbedingungen k&ouml;nnen gelegentlich aktualisiert werden.
          Die aktuelle Version ist immer in der App abrufbar.
        </p>
      </section>

      <button className="btn-secondary" onClick={() => navigate(-1)}>
        Zur&uuml;ck
      </button>
    </div>
  )
}

export default Nutzungsbedingungen
