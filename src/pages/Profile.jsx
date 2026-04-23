import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import styles from './Profile.module.css'

export default function Profile() {
  const { user, logout } = useAuth()
  const [saving, setSaving] = useState(false)

  function handleLogout() {
    if (confirm('Log out?')) logout()
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.avatar}>
          {user?.full_name?.[0]?.toUpperCase() || 'U'}
        </div>
        <div className={styles.info}>
          <div className={styles.name}>{user?.full_name || 'Unknown'}</div>
          <div className={styles.email}>{user?.name || '—'}</div>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Session</h2>
        <div className={styles.metaRow}>
          <span className={styles.metaLabel}>Logged in as</span>
          <span className={styles.metaValue}>{user?.name || '—'}</span>
        </div>
        <div className={styles.metaRow}>
          <span className={styles.metaLabel}>Full name</span>
          <span className={styles.metaValue}>{user?.full_name || '—'}</span>
        </div>
        <div className={styles.metaRow}>
          <span className={styles.metaLabel}>Home page</span>
          <span className={styles.metaValue}>{user?.home_page || '—'}</span>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>About</h2>
        <div className={styles.about}>
          <p><strong>Asset Sanitation System</strong></p>
          <p className={styles.version}>SPA v1.0 — React + FastAPI</p>
          <p className={styles.stack}>Backend: FastAPI on Docker<br/>Database: Custom MariaDB + ERPNext proxy</p>
        </div>
      </div>

      <button className={styles.logoutBtn} onClick={handleLogout}>
        Log Out
      </button>
    </div>
  )
}