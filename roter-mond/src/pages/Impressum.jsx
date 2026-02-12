import { useNavigate } from 'react-router-dom'

function Impressum() {
  const navigate = useNavigate()

  return (
    <div className="page datenschutz-seite">
      <h1>Impressum</h1>
      <p className="datenschutz-stand">Stand: Februar 2026</p>

      <section>
        <h2>Angaben gem&auml;&szlig; &sect; 5 TMG</h2>
        <p>
          Roter Mond ist ein privates, nicht-kommerzielles Projekt und wird als
          pers&ouml;nliches Hobby betrieben. Es erfolgt keine gesch&auml;ftsm&auml;&szlig;ige
          T&auml;tigkeit.
        </p>
      </section>

      <section>
        <h2>Kontakt</h2>
        <p>
          Bei Fragen oder Anliegen zur App erreichst du uns per E-Mail
          unter der im Google Play Store bzw. App-Eintrag hinterlegten
          Kontaktadresse.
        </p>
      </section>

      <section>
        <h2>Haftung f&uuml;r Inhalte</h2>
        <p>
          Die Inhalte dieser App wurden mit gr&ouml;&szlig;tm&ouml;glicher Sorgfalt
          erstellt. F&uuml;r die Richtigkeit, Vollst&auml;ndigkeit und Aktualit&auml;t
          der Inhalte kann jedoch keine Gew&auml;hr &uuml;bernommen werden.
        </p>
        <p>
          Die App-Inhalte dienen ausschlie&szlig;lich der Selbstreflexion und
          pers&ouml;nlichen Begleitung. Sie stellen keine medizinische, therapeutische
          oder psychologische Beratung dar.
        </p>
      </section>

      <section>
        <h2>Haftung f&uuml;r Links</h2>
        <p>
          Die App enth&auml;lt keine externen Links zu fremden Webseiten, mit
          Ausnahme der technisch notwendigen Weiterleitung zu Google f&uuml;r
          die Anmeldung und zu Supabase f&uuml;r die Datenspeicherung.
        </p>
      </section>

      <section>
        <h2>Urheberrecht</h2>
        <p>
          Die in der App enthaltenen Inhalte und Werke (Texte, Grafiken,
          Orakelkarten-Texte) unterliegen dem deutschen Urheberrecht. Das
          zugrunde liegende Archetypen-Modell basiert auf den Arbeiten von
          Miranda Gray. Diese App ist ein unabh&auml;ngiges Projekt ohne
          Verbindung zur Autorin.
        </p>
      </section>

      <button className="btn-secondary" onClick={() => navigate(-1)}>
        Zur&uuml;ck
      </button>
    </div>
  )
}

export default Impressum
