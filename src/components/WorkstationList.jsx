import { useState, useEffect, useCallback } from 'react'
import { getWorkstations, createWorkstation, updateWorkstation, deleteWorkstation } from '../api/sanitation'
import WorkstationModal from './WorkstationModal'
import InfoModal from './InfoModal'

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
  )
}

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  )
}

function ListIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>
    </svg>
  )
}

export default function WorkstationList() {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null)
  const [editGroup, setEditGroup] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [search, setSearch] = useState('')
  const [view, setView] = useState('table') // 'table' | 'grid'

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getWorkstations()
      setGroups(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleCreate(form) {
    await createWorkstation(form)
    setModal(null)
    load()
  }

  async function handleEdit(form) {
    await updateWorkstation(editGroup.id, form)
    setModal(null)
    setEditGroup(null)
    load()
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this workstation? This cannot be undone.')) return
    setDeleting(id)
    try {
      await deleteWorkstation(id)
      load()
    } catch (e) {
      alert(`Delete failed: ${e.message}`)
    } finally {
      setDeleting(null)
    }
  }

  async function handleToggleActive(g) {
    try {
      await updateWorkstation(g.id, { ...g, is_active: !g.is_active })
      load()
    } catch (e) {
      alert(`Update failed: ${e.message}`)
    }
  }

  const filtered = groups.filter(g =>
    g.group_name.toLowerCase().includes(search.toLowerCase())
  )

  const active = groups.filter(g => g.is_active).length
  const inactive = groups.filter(g => !g.is_active).length

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Workstations</div>
          <div className="page-subtitle">Manage production line groups for sanitation tracking</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <InfoModal title="What is an Workstation?">
            <p style={{ marginBottom: 12 }}>
              An <strong>Workstation</strong> is a named production area that gets cleaned together. Examples: <em>"Line-A"</em>, <em>"Beverage-Zone"</em>, <em>"Kitchen-1"</em>.
            </p>
            <p style={{ marginBottom: 12 }}>
              When a <strong>Work Order</strong> in ERPNext is completed, the system checks which Workstation it belongs to. If the BOM contains allergens, a <strong>Sanitation Order</strong> is automatically created for that group.
            </p>
            <p>
              <strong>Key rules:</strong> Only one pending sanitation can exist per group at a time. New Work Orders are blocked if a pending sanitation exists for the same group.
            </p>
          </InfoModal>
          <button className="btn btn-primary" onClick={() => setModal('create')}>
            + New Group
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* KPI row */}
        <div className="kpi-grid" style={{ marginBottom: 20 }}>
          <div className="kpi-card">
            <div className="kpi-label">Total Groups</div>
            <div className="kpi-value">{groups.length}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Active</div>
            <div className="kpi-value" style={{ color: 'var(--accent-green)' }}>{active}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Inactive</div>
            <div className="kpi-value" style={{ color: 'var(--text-muted)' }}>{inactive}</div>
          </div>
        </div>

        {/* Search + view toggle */}
        <div className="search-bar">
          <div className="search-input-wrap">
            <SearchIcon />
            <input
              type="text"
              className="search-input"
              placeholder="Search workstations…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="view-toggle">
            <button className={`view-toggle-btn${view === 'table' ? ' active' : ''}`} onClick={() => setView('table')}>
              <ListIcon /> Table
            </button>
            <button className={`view-toggle-btn${view === 'grid' ? ' active' : ''}`} onClick={() => setView('grid')}>
              <GridIcon /> Grid
            </button>
          </div>
        </div>

        {error && <div className="error-msg">{error}</div>}

        {loading ? (
          <div className="loading"><div className="spinner" /> Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="card">
            <div className="list-empty">
              {search ? 'No workstations match your search.' : 'No workstations yet. Create one to get started.'}
            </div>
          </div>
        ) : view === 'grid' ? (
          <div className="asset-grid">
            {filtered.map(g => (
              <div key={g.id} className="asset-card">
                <div className="asset-card-header">
                  <div>
                    <div className="asset-card-name">{g.group_name}</div>
                                      </div>
                  <span className={`badge ${g.is_active ? 'badge-active' : 'badge-inactive'}`}>
                    {g.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="asset-card-stats">
                  <div className="asset-card-stat">
                    <span className="asset-card-stat-label">Location</span>
                    <span className="asset-card-stat-value">{g.location || '—'}</span>
                  </div>
                  <div className="asset-card-stat">
                    <span className="asset-card-stat-label">Assets</span>
                    <span className="asset-card-stat-value">{g.assets?.length ?? 0}</span>
                  </div>
                  <div className="asset-card-stat">
                    <span className="asset-card-stat-label">Last WO</span>
                    <span className="asset-card-stat-value" style={{ fontSize: 11 }}>{g.last_work_order || '—'}</span>
                  </div>
                </div>
                <div className="asset-card-footer">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{g.is_active ? 'Active' : 'Inactive'}</span>
                    <span className="toggle" onClick={() => handleToggleActive(g)}>
                      <input type="checkbox" checked={g.is_active} onChange={() => {}} />
                      <span className="toggle-slider" />
                    </span>
                  </label>
                  <div className="asset-card-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => { setEditGroup(g); setModal('edit'); }}>Edit</button>
                    <button className="btn btn-danger btn-sm" disabled={deleting === g.id} onClick={() => handleDelete(g.id)}>
                      {deleting === g.id ? '…' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                                        <th>Location</th>
                    <th>Assets</th>
                    <th>Last Work Order</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(g => (
                    <tr key={g.id}>
                      <td style={{ fontWeight: 600 }}>{g.group_name}</td>
                                            <td><span className="text-secondary text-sm">{g.location || '—'}</span></td>
                      <td><span className="text-secondary text-sm">{g.assets?.length ?? 0}</span></td>
                      <td>{g.last_work_order ? <span className="font-mono text-sm">{g.last_work_order}</span> : <span className="text-muted text-sm">—</span>}</td>
                      <td>
                        <span className={`badge ${g.is_active ? 'badge-active' : 'badge-inactive'}`}>
                          {g.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-2 items-center">
                          <button className="btn btn-secondary btn-sm" onClick={() => { setEditGroup(g); setModal('edit'); }}>Edit</button>
                          <button className="btn btn-danger btn-sm" disabled={deleting === g.id} onClick={() => handleDelete(g.id)}>
                            {deleting === g.id ? '…' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {modal && (
          <WorkstationModal
            group={modal === 'edit' ? editGroup : null}
            onSave={modal === 'edit' ? handleEdit : handleCreate}
            onClose={() => { setModal(null); setEditGroup(null); }}
          />
        )}
      </div>
    </div>
  )
}
