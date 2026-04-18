import { useState, useEffect, useCallback } from 'react'
import { getWorkOrders, triggerSanitation } from '../api/sanitation'

export default function WorkOrderList() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all') // all | blocked | clear
  const [triggering, setTriggering] = useState({}) // wo_name -> bool

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getWorkOrders()
      setOrders(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleTrigger = async (woName) => {
    if (!window.confirm(`Trigger sanitation for ${woName}?`)) return
    setTriggering(prev => ({ ...prev, [woName]: true }))
    try {
      const result = await triggerSanitation(woName)
      if (result.skipped) {
        alert(`⚠️ ${result.reason}`)
      } else {
        alert(`✅ Sanitation Order ${result.so_number} created for ${woName}`)
      }
      await load()
    } catch (e) {
      console.error('triggerSanitation error:', e)
      let msg = 'Unknown error'
      try { msg = String(e?.detail || e?.message || e?.reason || JSON.stringify(e)) }
      catch(_) { msg = String(e) }
      alert(`❌ Failed: ${msg}`)
    } finally {
      setTriggering(prev => ({ ...prev, [woName]: false }))
    }
  }

  const filtered = orders.filter(wo => {
    if (filter === 'blocked') return wo.blocking !== null
    if (filter === 'clear') return !wo.blocking
    return true
  })

  if (loading) return <div className="page-loading">Loading Work Orders…</div>
  if (error) return <div className="page-body"><div className="error-msg">{error}</div></div>

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">Work Orders</div>
        <div className="page-subtitle">All submitted production orders with allergen + blocking status</div>
      </div>

      {/* Filters */}
      <div className="filter-bar" style={{ marginBottom: 20, display: 'flex', gap: 8, alignItems: 'center' }}>
        {['all', 'blocked', 'clear'].map(f => (
          <button
            key={f}
            className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All' : f === 'blocked' ? '🔴 Blocked' : '🟢 Clear'}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', color: 'var(--text-secondary)', fontSize: 13 }}>
          {filtered.length} of {orders.length} orders
        </span>
      </div>

      {/* Table */}
      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Work Order</th>
                <th>Status</th>
                <th>Production Item</th>
                <th>Workstation</th>
                <th>Allergen</th>
                <th>Blocking</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No work orders found</td></tr>
              ) : filtered.map(wo => (
                <tr key={wo.work_order}>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13 }}>{wo.work_order}</span>
                  </td>
                  <td>
                    <span className={`badge badge-${wo.status === 'Completed' ? 'completed' : wo.status === 'Not Started' ? 'pending' : 'in-progress'}`}>
                      {wo.status}
                    </span>
                  </td>
                  <td>{wo.production_item || '—'}</td>
                  <td>{wo.asset_group_name || '—'}</td>
                  <td>
                    {wo.is_allergen_bom ? (
                      <span style={{ color: 'var(--accent-red)', fontWeight: 600, fontSize: 13 }}>
                        ⚠️ {(wo.allergen_items || []).join(', ')}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>None</span>
                    )}
                  </td>
                  <td>
                    {wo.blocking ? (
                      <div>
                        <span className="badge badge-danger">🔴 Blocked</span>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                          {wo.blocking.so_number} · {wo.blocking.sanitation_type}
                        </div>
                      </div>
                    ) : (
                      <span className="badge badge-success">🟢 Clear</span>
                    )}
                  </td>
                  <td>
                    {!wo.blocking && !wo.already_has_so && (
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleTrigger(wo.work_order)}
                        disabled={triggering[wo.work_order]}
                      >
                        {triggering[wo.work_order] ? '…' : '🧹 Trigger Sanitation'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
