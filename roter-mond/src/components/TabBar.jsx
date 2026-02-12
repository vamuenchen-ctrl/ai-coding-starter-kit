import { NavLink } from 'react-router-dom'

const tabs = [
  { path: '/', label: 'Heute', icon: '☀️' },
  { path: '/chronik', label: 'Chronik', icon: '📖' },
  { path: '/orakel', label: 'Orakel', icon: '🔮' },
  { path: '/wissen', label: 'Wissen', icon: '🌙' },
  { path: '/einstellungen', label: 'Einstellungen', icon: '⚙️' },
]

function TabBar() {
  return (
    <nav className="tab-bar">
      {tabs.map((tab) => (
        <NavLink
          key={tab.path}
          to={tab.path}
          className={({ isActive }) =>
            'tab-item' + (isActive ? ' tab-active' : '')
          }
          end={tab.path === '/'}
        >
          <span className="tab-icon">{tab.icon}</span>
          <span className="tab-label">{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

export default TabBar
