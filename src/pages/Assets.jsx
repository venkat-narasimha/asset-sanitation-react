import { useState, useEffect } from 'react'
import { getErpAssets } from '../api/sanitation.js'
import styles from './Assets.module.css'

const STATUS_STYLES = {
  'Allotted': { bg: '#dbeafe', color: '#2563eb' },
  'Submitted': { bg: '#fef9c3', color: '#ca8a04' },
  'Active': { bg: '#dcfce7', color: '#16a34a' },
  'Scrapped': { bg: '#f1f5f9', color: '#64748b' },
}

export default function Assets() {
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    getErpAssets({ limit: 100 })
      .then(r => setAssets(r.data || []))
      .catch(() => setAssets([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = assets.filter(a => {
    if (!search) return true
    const q = search.toLowerCase()
    return a.name?.toLowerCase().includes(q) ||
      a.asset_name?.toLowerCase().includes(q) ||
      a.asset_category?.toLowerCase().includes(q)
  })

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Assets</h1>
        <span className={styles.badge}>ERPNext</span>
      </div>

      <div className={styles.toolbar}>
        <input
          className={styles.search}
          placeholder="Search by name or category..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className={styles.loading}>Loading from ERPNext...</div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>No assets found</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Asset Code</th>
                <th>Asset Name</th>
                <th>Category</th>
                <th>Status</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => {
                const st = STATUS_STYLES[a.status] || {}
                return (
                  <tr key={a.name}>
                    <td className={styles.mono}>{a.name}</td>
                    <td>{a.asset_name || '—'}</td>
                    <td>{a.asset_category || '—'}</td>
                    <td>
                      {a.status && (
                        <span className={styles.badge2} style={{ background: st.bg, color: st.color }}>
                          {a.status}
                        </span>
                      )}
                    </td>
                    <td>{a.location || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}