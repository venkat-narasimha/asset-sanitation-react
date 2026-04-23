import { useState, useEffect, useCallback } from 'react'
import { getErpAssets } from '../api/sanitation'

export default function Assets() {
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getErpAssets({ search: search || undefined, status: statusFilter || undefined, limit: 100 })
      setAssets(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  useEffect(() => { load() }, [load])

  function handleSearchChange(e) {
    setSearch(e.target.value)
  }

  function handleStatusChange(e) {
    setStatusFilter(e.target.value)
  }

  const filtered = assets.filter(a => {
    if (search && !(a.asset_name || a.name || '').toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  function statusBadge(status) {
    const map = {
      'Submitted': 'badge-green',
      'Draft': 'badge-gray',
      'Cancelled': 'badge-red',
      'Partially Moved': 'badge-yellow',
      'Completed': 'badge-blue',
    }
    return map[status] || 'badge-gray'
  }

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">🗃️ ERPNext Assets</h1>
          <p className="page-subtitle">All assets from ERPNext — linked to Asset Groups for sanitation</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div className="search-bar" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: '10px', padding: '8px 14px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Search by name..."
              value={search}
              onChange={handleSearchChange}
              style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '14px', width: '180px' }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={handleStatusChange}
            style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: '10px', padding: '8px 14px', color: 'var(--text-primary)', fontSize: '14px', cursor: 'pointer' }}
          >
            <option value="">All Statuses</option>
            <option value="Submitted">Submitted</option>
            <option value="Draft">Draft</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <button
            className="btn btn-secondary"
            onClick={load}
            style={{ padding: '8px 16px', fontSize: '14px' }}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {loading && <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '60px' }}>Loading assets from ERPNext...</div>}
      {error && <div className="error-msg" style={{ margin: '20px' }}>{error}</div>}

      {!loading && !error && (
        <>
          <div style={{ marginBottom: '12px', color: 'var(--text-muted)', fontSize: '13px' }}>
            {filtered.length} asset{filtered.length !== 1 ? 's' : ''} found
            {statusFilter ? ` (status: ${statusFilter})` : ''}
          </div>

          {filtered.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '60px' }}>
              No assets found. Create assets in ERPNext first.
            </div>
          ) : (
            <div className="glass-card" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-glass)' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Asset Name</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Location</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Purchase Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(asset => (
                    <tr
                      key={asset.name}
                      style={{ borderBottom: '1px solid var(--border-glass)', cursor: 'pointer' }}
                      onClick={() => setSelectedAsset(asset)}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{asset.asset_name || asset.name}</span>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '2px' }}>{asset.name}</div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span className={`badge ${statusBadge(asset.status)}`}>{asset.status || '—'}</span>
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                        {asset.asset_category || '—'}
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                        {asset.location || '—'}
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                        {asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Detail Slide-Over */}
      {selectedAsset && (
        <div
          style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: '420px',
            background: 'var(--bg-elevated)', borderLeft: '1px solid var(--border-glass)',
            boxShadow: '-20px 0 60px rgba(0,0,0,0.3)', zIndex: 1000,
            display: 'flex', flexDirection: 'column'
          }}
        >
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Asset Detail</h2>
            <button
              onClick={() => setSelectedAsset(null)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '20px', padding: '4px' }}
            >✕</button>
          </div>
          <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <DetailRow label="Asset ID" value={selectedAsset.name} />
              <DetailRow label="Asset Name" value={selectedAsset.asset_name || '—'} />
              <DetailRow label="Status" badge={statusBadge(selectedAsset.status)} badgeText={selectedAsset.status} />
              <DetailRow label="Category" value={selectedAsset.asset_category || '—'} />
              <DetailRow label="Location" value={selectedAsset.location || '—'} />
              <DetailRow label="Purchase Date" value={selectedAsset.purchase_date ? new Date(selectedAsset.purchase_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'} />
            </div>
            <div style={{ marginTop: '24px', padding: '14px', background: 'var(--bg-glass)', borderRadius: '10px', fontSize: '13px', color: 'var(--text-muted)' }}>
              💡 Use the <strong>Asset Group → Edit</strong> page to link this asset to a group for sanitation tracking.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DetailRow({ label, value, badge, badgeText }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      {badge ? (
        <span className={`badge ${badge}`}>{badgeText || value}</span>
      ) : (
        <span style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)' }}>{value}</span>
      )}
    </div>
  )
}