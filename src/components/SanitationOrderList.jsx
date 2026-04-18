import { useState, useEffect, useCallback } from 'react'
import { getSanitationOrders, getWorkstations, statusClass, typeClass, formatDate } from '../api/sanitation'
import InfoModal from './InfoModal'

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
  )
}

function SortIcon({ dir }) {
  if (dir === 'asc') return <span style={{ fontSize: 10 }}>▲</span>
  if (dir === 'desc') return <span style={{ fontSize: 10 }}>▼</span>
  return <span style={{ fontSize: 10, opacity: 0.3 }}>⇅</span>
}

export default function SanitationOrderList() {
  const [orders, setOrders] = useState([])
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ status: '', assetGroupId: '', fromDate: '', toDate: '' })
  const [sortCol, setSortCol] = useState('created_at')
  const [sortDir, setSortDir] = useState('desc')
  const [selected, setSelected] = useState(new Set())
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [orderData, groupData] = await Promise.all([
        getSanitationOrders(filters),
        getWorkstations(),
      ])
      setOrders(orderData)
      setGroups(groupData)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { load() }, [load])

  function groupName(id) {
    const g = groups.find(g => g.id === id)
    return g ? g.group_name : id ? id.slice(0, 8) + '…' : '—'
  }

  function handleSort(col) {
    if (sortCol === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortCol(col)
      setSortDir('asc')
    }
  }

  const filtered = orders.filter(o => {
    if (search) {
      const q = search.toLowerCase()
      if (!o.so_number?.toLowerCase().includes(q) && !o.work_order?.toLowerCase().includes(q)) return false
    }
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    let av = a[sortCol], bv = b[sortCol]
    if (!av && !bv) return 0
    if (!av) return 1
    if (!bv) return -1
    if (typeof av === 'string') av = av.toLowerCase()
    if (typeof bv === 'string') bv = bv.toLowerCase()
    if (av < bv) return sortDir === 'asc' ? -1 : 1
    if (av > bv) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  function toggleSelect(id) {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  function toggleSelectAll() {
    if (selected.size === sorted.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(sorted.map(o => o.id)))
    }
  }

  async function handleBulkDelete() {
    if (!window.confirm(`Delete ${selected.size} selected orders? This cannot be undone.`)) return
    setDeleting(true)
    try {
      const { deleteSanitationOrder } = await import('../api/sanitation')
      await Promise.all([...selected].map(id => deleteSanitationOrder(id).catch(() => {})))
      setSelected(new Set())
      load()
    } finally {
      setDeleting(false)
    }
  }

  const counts = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'Pending').length,
    inProgress: orders.filter(o => o.status === 'In Progress').length,
    completed: orders.filter(o => o.status === 'Completed').length,
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Sanitation Orders</div>
          <div className="page-subtitle">Track and manage cleaning schedules for production lines</div>
        </div>
        <InfoModal title="How Sanitation Orders Work">
          <p style={{ marginBottom: 12 }}>
            A <strong>Sanitation Order (SO)</strong> is created automatically when a Work Order with an <strong>allergen BOM</strong> is completed in ERPNext.
          </p>
          <p style={{ marginBottom: 12 }}>
            <strong>Order lifecycle:</strong> Pending → In Progress → Completed
          </p>
          <p>
            <strong>Production blocking:</strong> If a pending SO exists for an Workstation, new Work Orders for that same group are <strong>blocked in ERPNext</strong> until cleaning is completed here.
          </p>
        </InfoModal>
      </div>

      <div className="page-body">
        {/* KPI row */}
        <div className="kpi-grid" style={{ marginBottom: 20 }}>
          <div className="kpi-card">
            <div className="kpi-label">Total</div>
            <div className="kpi-value">{counts.total}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Pending</div>
            <div className="kpi-value" style={{ color: 'var(--accent-yellow)' }}>{counts.pending}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">In Progress</div>
            <div className="kpi-value" style={{ color: 'var(--accent-blue)' }}>{counts.inProgress}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Completed</div>
            <div className="kpi-value" style={{ color: 'var(--accent-green)' }}>{counts.completed}</div>
          </div>
        </div>

        {/* Search + filters */}
        <div className="search-bar">
          <div className="search-input-wrap" style={{ flex: 2 }}>
            <SearchIcon />
            <input
              type="text"
              className="search-input"
              placeholder="Search by SO number or production order…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="filter-bar">
          <select
            value={filters.status}
            onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
          <select
            value={filters.assetGroupId}
            onChange={e => setFilters(f => ({ ...f, assetGroupId: e.target.value }))}
          >
            <option value="">All Workstations</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.group_name}</option>)}
          </select>
          <input
            type="date"
            className="form-input"
            style={{ width: 'auto' }}
            value={filters.fromDate}
            onChange={e => setFilters(f => ({ ...f, fromDate: e.target.value }))}
          />
          <span className="text-muted text-sm">to</span>
          <input
            type="date"
            className="form-input"
            style={{ width: 'auto' }}
            value={filters.toDate}
            onChange={e => setFilters(f => ({ ...f, toDate: e.target.value }))}
          />
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setFilters({ status: '', assetGroupId: '', fromDate: '', toDate: '' })}
          >
            Clear
          </button>
        </div>

        {/* Bulk actions */}
        {selected.size > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, padding: '8px 14px', background: 'rgba(239,68,68,0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239,68,68,0.15)' }}>
            <span style={{ fontSize: 13, color: 'var(--accent-red)', fontWeight: 600 }}>{selected.size} selected</span>
            <button className="btn btn-danger btn-sm" disabled={deleting} onClick={handleBulkDelete}>
              {deleting ? 'Deleting…' : `Delete ${selected.size} selected`}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setSelected(new Set())}>Cancel</button>
          </div>
        )}

        {error && <div className="error-msg">{error}</div>}

        <div className="card">
          {loading ? (
            <div className="loading"><div className="spinner" /> Loading…</div>
          ) : sorted.length === 0 ? (
            <div className="table-empty">No sanitation orders match the current filters.</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 36 }}>
                      <input
                        type="checkbox"
                        checked={selected.size === sorted.length && sorted.length > 0}
                        onChange={toggleSelectAll}
                        style={{ accentColor: 'var(--accent)' }}
                      />
                    </th>
                    <th onClick={() => handleSort('so_number')} className="no-sort">
                      SO Number <SortIcon dir={sortCol === 'so_number' ? sortDir : null} />
                    </th>
                    <th onClick={() => handleSort('production_order')}>
                      Work Order <SortIcon dir={sortCol === 'production_order' ? sortDir : null} />
                    </th>
                    <th onClick={() => handleSort('asset_group_id')}>
                      Workstation <SortIcon dir={sortCol === 'asset_group_id' ? sortDir : null} />
                    </th>
                    <th onClick={() => handleSort('sanitation_type')}>
                      Type <SortIcon dir={sortCol === 'sanitation_type' ? sortDir : null} />
                    </th>
                    <th onClick={() => handleSort('status')}>
                      Status <SortIcon dir={sortCol === 'status' ? sortDir : null} />
                    </th>
                    <th onClick={() => handleSort('created_at')}>
                      Created <SortIcon dir={sortCol === 'created_at' ? sortDir : null} />
                    </th>
                    <th>Allergen</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map(o => (
                    <tr
                      key={o.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => window.location.hash = `/orders/${o.id}`}
                    >
                      <td onClick={e => { e.stopPropagation(); toggleSelect(o.id); }}>
                        <input
                          type="checkbox"
                          checked={selected.has(o.id)}
                          onChange={() => {}}
                          style={{ accentColor: 'var(--accent)' }}
                        />
                      </td>
                      <td>
                        <span className="font-mono" style={{ fontWeight: 700, color: 'var(--accent)', fontSize: 13 }}>{o.so_number}</span>
                      </td>
                      <td>
                        <span className="font-mono text-sm text-secondary">{o.work_order || o.production_order || '—'}</span>
                      </td>
                      <td style={{ fontSize: 13, fontWeight: 500 }}>{groupName(o.asset_group_id)}</td>
                      <td><span className={`badge ${typeClass(o.sanitation_type)}`}>{o.sanitation_type}</span></td>
                      <td><span className={`badge ${statusClass(o.status)}`}>{o.status}</span></td>
                      <td><span className="text-secondary text-sm">{formatDate(o.created_at)}</span></td>
                      <td>
                        {o.allergen_triggered
                          ? <span style={{ color: 'var(--accent-red)', fontSize: 12, fontWeight: 600 }}>{o.allergen_triggered}</span>
                          : <span className="text-muted text-sm">—</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
