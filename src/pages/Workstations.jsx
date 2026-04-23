import { useState, useEffect } from 'react'
import { getWorkstations } from '../api/sanitation.js'
import styles from './Workstations.module.css'

export default function Workstations() {
  const [workstations, setWorkstations] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    getWorkstations({ limit: 100 })
      .then(r => setWorkstations(r.data || []))
      .catch(() => setWorkstations([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = workstations.filter(w => {
    if (!search) return true
    return w.name?.toLowerCase().includes(search.toLowerCase()) ||
      w.workstation_group?.toLowerCase().includes(search.toLowerCase())
  })

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Workstations</h1>
        <span className={styles.badge}>Custom DB</span>
      </div>

      <div className={styles.toolbar}>
        <input
          className={styles.search}
          placeholder="Search workstation..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className={styles.loading}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>No workstations found</div>
      ) : (
        <div className={styles.grid}>
          {filtered.map(w => (
            <div key={w.id} className={styles.card}>
              <div className={styles.cardName}>{w.name}</div>
              <div className={styles.cardGroup}>{w.workstation_group || '—'}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}