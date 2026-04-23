import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getSanitationOrders, deleteSanitationOrder } from '../api/sanitation.js'
import styles from './SanitationOrders.module.css'

const PAGE_SIZE = 20

const STATUS_STYLES = {
  Pending: { bg: '#fef9c3', color: '#ca8a04' },
  'In Progress': { bg: '#dbeafe', color: '#2563eb' },
  Completed: { bg: '#dcfce7', color: '#16a34a' },
  Cancelled: { bg: '#f1f5f9', color: '#64748b' },
}

function SortIcon({ field, sort }) {
  if (sort.field !== field) return <span className={styles.sortIcon}>⇅</span>
  return <span className={styles.sortIcon}>{sort.dir === 'asc' ? '↑' : '↓'}</span>
}

export default function SanitationOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ status: '', search: '' })
  const [sort, setSort] = useState({ field: 'created_at', dir: 'desc' })
  const [selected, setSelected] = useState(new Set())
  const [page, setPage] = useState(1)

  useEffect(() => { fetchOrders() }, [])

  async function fetchOrders() {
    try {
      const res = await getSanitationOrders()
      setOrders(res.data || [])
    } catch {
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this sanitation order?')) return
    await deleteSanitationOrder(id)
    fetchOrders()
  }

  async function handleBulkDelete() {
    if (!confirm(`Delete ${selected.size} selected orders?`)) return
    await Promise.all([...selected].map(id => deleteSanitationOrder(id)))
    setSelected(new Set())
    fetchOrders()
  }

  function toggleSelect(id) {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  function toggleAll() {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map(o => o.id)))
  }

  const filtered = orders
    .filter(o => {
      if (filters.status && o.status !== filters.status) return false
      if (filters.search) {
        const q = filters.search.toLowerCase()
        if (!o.group_name?.toLowerCase().includes(q) &&
            !o.id?.toLowerCase().includes(q) &&
            !o.production_order?.toLowerCase().includes(q)) return false
      }
      return true
    })
    .sort((a, b) => {
      let va = a[sort.field], vb = b[sort.field]
      if (va == null) va = ''
      if (vb == null) vb = ''
      const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true })
      return sort.dir === 'asc' ? cmp : -cmp
    })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function handleFilterChange() {
    setPage(1)
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Sanitation Orders</h1>
        {selected.size > 0 && (
          <button className={styles.bulkDeleteBtn} onClick={handleBulkDelete}>
            Delete {selected.size} Selected
          </button>
        )}
      </div>

      <div className={styles.toolbar}>
        <input
          className={styles.search}
          placeholder="Search by group, WO, or ID..."
          value={filters.search}
          onChange={e => { setFilters(f => ({ ...f, search: e.target.value })); handleFilterChange() }}
        />
        <select
          className={styles.filter}
          value={filters.status}
          onChange={e => { setFilters(f => ({ ...f, status: e.target.value })); handleFilterChange() }}
        >
          <option value="">All Statuses</option>
          <option>Pending</option>
          <option>In Progress</option>
          <option>Completed</option>
          <option>Cancelled</option>
        </select>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>No sanitation orders found</div>
      ) : (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={selected.size === paged.length && paged.length > 0}
                      onChange={toggleAll}
                    />
                  </th>
                  {[
                    { key: 'id', label: 'ID' },
                    { key: 'production_order', label: 'Work Order' },
                    { key: 'group_name', label: 'Asset Group' },
                    { key: 'status', label: 'Status' },
                    { key: 'created_at', label: 'Created' },
                  ].map(col => (
                    <th key={col.key} onClick={() => setSort(s =>
                      s.field === col.key ? { ...s, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { field: col.key, dir: 'asc' }
                    )}>
                      {col.label} <SortIcon field={col.key} sort={sort} />
                    </th>
                  ))}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.map(o => {
                  const st = STATUS_STYLES[o.status] || {}
                  return (
                    <tr key={o.id} className={selected.has(o.id) ? styles.selected : ''}>
                      <td><input type="checkbox" checked={selected.has(o.id)} onChange={() => toggleSelect(o.id)} /></td>
                      <td className={styles.idCell}><Link to={`/orders/${o.id}`}>{o.id}</Link></td>
                      <td className={styles.mono}>{o.production_order || '—'}</td>
                      <td>{o.group_name || '—'}</td>
                      <td>
                        {o.status && (
                          <span className={styles.badge} style={{ background: st.bg, color: st.color }}>
                            {o.status}
                          </span>
                        )}
                      </td>
                      <td>{o.created_at ? new Date(o.created_at).toLocaleDateString() : '—'}</td>
                      <td>
                        <button className={styles.deleteBtn} onClick={() => handleDelete(o.id)}>Delete</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className={styles.pagination}>
            <span className={styles.pageInfo}>
              {filtered.length} orders — page {page} of {totalPages}
            </span>
            <div className={styles.pageBtns}>
              <button onClick={() => setPage(1)} disabled={page === 1}>«</button>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>›</button>
              <button onClick={() => setPage(totalPages)} disabled={page === totalPages}>»</button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
