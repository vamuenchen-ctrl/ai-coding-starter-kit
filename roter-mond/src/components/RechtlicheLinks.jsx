import { Link } from 'react-router-dom'

function RechtlicheLinks() {
  return (
    <div className="rechtliche-links">
      <Link to="/datenschutz">Datenschutzerkl&auml;rung</Link>
      <Link to="/nutzungsbedingungen">Nutzungsbedingungen</Link>
      <Link to="/impressum">Impressum</Link>
    </div>
  )
}

export default RechtlicheLinks
