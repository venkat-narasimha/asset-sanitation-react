import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import styles from './Layout.module.css'

const nav = {
  Overview: [
    { to: '/', label: 'Dashboard', icon: '📊' },
    { to: '/asset-groups', label: 'Asset Groups', icon: '🏢' },
    { to: '/orders', label: 'Sanitation Orders', icon: '🧼' },
  ],
  'ERPNext': [
    { to: '/work-orders', label: 'Work Orders', icon: '⚙️' },
    { to: '/items', label: 'Items', icon: '📦' },
    { to: '/boms', label: 'BOMs', icon: '📋' },
    { to: '/assets', label: 'Assets', icon: '🏗️' },
    { to: '/workstations', label: 'Workstations', icon: '🔧' },
  ],
  'Account': [
    { to: '/profile', label: 'Profile', icon: '👤' },
  ],
}

export default function Layout() {
  const { logout } = useAuth()

  function handleLogout() {
    if (confirm('Log out?')) logout()
  }

  return (
    <div className={styles.root}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>Asset Sanitation</div>

        {Object.entries(nav).map(([section, links]) => (
          <div key={section} className={styles.section}>
            <div className={styles.sectionLabel}>{section}</div>
            {links.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `${styles.link} ${isActive ? styles.active : ''}`
                }
              >
                <span className={styles.icon}>{link.icon}</span>
                {link.label}
              </NavLink>
            ))}
          </div>
        ))}

        <div className={styles.logoutArea}>
          <button className={styles.logoutBtn} onClick={handleLogout}>🚪 Logout</button>
        </div>
      </aside>

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}