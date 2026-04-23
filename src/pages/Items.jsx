import { useState, useEffect } from 'react'
import { getErpItems } from '../api/sanitation.js'
import styles from './Items.module.css'

export default function Items() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    getErpItems({ limit: 100 })
      .then(r => setItems(r.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = items.filter(o => {
    if (!search) return true
    const q = search.toLowerCase()
    return o.name?.toLowerCase().includes(q) ||
      o.item_name?.toLowerCase().includes(q) ||
      o.item_group?.toLowerCase().includes(q)
  })

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Items</h1>
        <span className={styles.badge}>ERPNext</span>
      </div>

      <div className={styles.toolbar}>
        <input
          className={styles.search}
          placeholder="Search by name, item group..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className={styles.loading}>Loading from ERPNext...</div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>No items found</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Item Code</th>
                <th>Item Name</th>
                <th>Item Group</th>
                <th>Unit</th>
                <th>Disabled</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.name}>
                  <td className={styles.mono}>{item.name}</td>
                  <td>{item.item_name || '—'}</td>
                  <td>{item.item_group || '—'}</td>
                  <td>{item.stock_uom || '—'}</td>
                  <td>
                    {item.disabled ? (
                      <span className={styles.yes}>Yes</span>
                    ) : (
                      <span className={styles.no}>No</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}