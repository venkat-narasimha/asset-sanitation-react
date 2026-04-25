import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getErpWorkOrders, getSanitationOrders, createSanitationOrder, getAssetGroups } from '../api/sanitation.js'
import styles from './WorkOrders.module.css'

const WO_STATUS = {
  'Open': { bg: '#dbeafe', color: '#2563eb' },
  'In Process': { bg: '#fef9c3', color: '#ca8a04' },
  'Completed': { bg: '#dcfce7', color: '#16a34a' },
  'Cancelled': { bg: '#f1f5f9', color: '#64748b' },
  'On Hold': { bg: '#fee2e2', color: '#dc2626' },
}

const SO_STATUS = {
  'Pending': { bg: '#fef9c3', color: '#ca8a04' },
  'In Progress': { bg: '#dbeafe', color: '#2563eb' },
  'Completed': { bg: '#dcfce7', color: '#16a34a' },
  'Cancelled': { bg: '#f1f5f9', color: '#64748b' },
}

function hasActiveSO(sos) {
  return sos && sos.some(s => s.status === 'Pending' || s.status === 'In Progress')
}

export default function WorkOrders() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [sanitationMap, setSanitationMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sort, setSort] = useState({ field: 'name', dir: 'asc' })
  const [modal, setModal] = useState(null)
  const [groups, setGroups] = useState([])
  const [selectedGroup, setSelectedGroup] = useState('')
  const [creating, setCreating] = useState(false)
  const [loadingGroups, setLoadingGroups] = useState(false)

  function fetchData() {
    setLoading(true)
    Promise.all([
      getErpWorkOrders({ limit: 100 }),
      getSanitationOrders({ limit: 500 }),
    ]).then(([woRes, soRes]) => {
      const wos = woRes.data || []
      const sos = soRes.data || []
      const map = {}
      for (const so of sos) {
        const key = so.production_order
        if (!map[key]) map[key] = []
        map[key].push({ id: so.id, so_number: so.so_number, status: so.status })
      }
      setOrders(wos)
      setSanitationMap(map)
    }).catch(() => {
      setOrders([])
      setSanitationMap({})
    }).finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchData()
  }, [])

  async function handleOpenModal(wo) {
    if (hasActiveSO(sanitationMap[wo.name])) return
    setModal({ wo_name: wo.name, item_name: wo.production_item })
    setSelectedGroup('')
    setLoadingGroups(true)
    try {
      const res = await getAssetGroups()
      setGroups(res.data || [])
    } catch {
      setGroups([])
    } finally {
      setLoadingGroups(false)
    }
  }

  async function submitSanitation() {
    if (!selectedGroup) return
    setCreating(true)
    try {
      const res = await createSanitationOrder({ asset_group_id: selectedGroup, production_order: modal.wo_name })
      setModal(null)
      fetchData()
      setSelectedGroup('')
      if (res?.data?.id) navigate(`/orders/${res.data.id}`)
    } catch (err) {
      alert('Failed to create: ' + (err.message || err))
    } finally {
      setCreating(false)
    }
  }

  const filtered = orders.filter(o => {
    if (statusFilter && o.status !== statusFilter) return false
    if (!search) return true
    const q = search.toLowerCase()
    return o.name?.toLowerCase().includes(q) ||
      o.production_item?.toLowerCase().includes(q) ||
      o.bom_no?.toLowerCase().includes(q)
  })

  const sorted = [...filtered].sort((a, b) => {
    let av = a[sort.field] || ''
    let bv = b[sort.field] || ''
    if (av < bv) return sort.dir === 'asc' ? -1 : 1
    if (av > bv) return sort.dir === 'asc' ? 1 : -1
    return 0
  })

  function toggleSort(field) {
    setSort(s => s.field === field
      ? { ...s, dir: s.dir === 'asc' ? 'desc' : 'asc' }
      : { field, dir: 'asc' }
    )
  }

  const STATUS_OPTIONS = ['', 'Open', 'In Process', 'Completed', 'Cancelled', 'On Hold']

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Work Orders</h1>
        <span className={styles.badge}>ERPNext</span>
        <button className={styles.refreshBtn} onClick={fetchData} title="Refresh">
          ↻
        </button>
      </div>

      <div className={styles.toolbar}>
        <input
          className={styles.search}
          placeholder="Search by WO, item, BOM..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className={styles.filterSelect}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.filter(s => s).map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading from ERPNext...</div>
      ) : sorted.length === 0 ? (
        <div className={styles.empty}>No work orders found</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th onClick={() => toggleSort('name')}>
                  WO {sort.field === 'name' ? (sort.dir === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th onClick={() => toggleSort('production_item')}>
                  Item {sort.field === 'production_item' ? (sort.dir === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th onClick={() => toggleSort('qty')}>
                  Qty {sort.field === 'qty' ? (sort.dir === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th onClick={() => toggleSort('status')}>
                  Status {sort.field === 'status' ? (sort.dir === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th>Sanitation Orders</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(o => {
                const woSt = WO_STATUS[o.status] || {}
                const sos = sanitationMap[o.name] || []
                const active = hasActiveSO(sos)

                return (
                  <tr key={o.name}>
                    <td className={styles.mono}>{o.name}</td>
                    <td>{o.production_item || '—'}</td>
                    <td>{o.qty || '—'}</td>
                    <td>
                      {o.status && (
                        <span className={styles.badge2} style={{ background: woSt.bg, color: woSt.color }}>
                          {o.status}
                        </span>
                      )}
                    </td>
                    <td>
                      {sos.length === 0 ? (
                        <span className={styles.noSo}>—</span>
                      ) : (
                        <div className={styles.soList}>
                          {sos.map(so => {
                            const soSt = SO_STATUS[so.status] || {}
                            return (
                              <div key={so.id} className={styles.soRow}>
                                <button
                                  className={styles.soLink}
                                  onClick={() => navigate(`/orders/${so.id}`)}
                                >
                                  {so.so_number}
                                </button>
                                <span className={styles.soBadge} style={{ background: soSt.bg, color: soSt.color }}>
                                  {so.status}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </td>
                    <td>
                      <button
                        className={styles.createBtn}
                        onClick={() => handleOpenModal(o)}
                        disabled={active}
                        title={active ? 'Active sanitation order exists' : 'Create sanitation order'}
                      >
                        {active ? 'SO Active' : '+ Sanitation'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className={styles.modalOverlay} onClick={() => !creating && setModal(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Create Sanitation Order</h2>
            <p className={styles.modalSubtitle}>
              WO: <strong>{modal.wo_name}</strong> — {modal.item_name}
            </p>
            <label className={styles.label}>Asset Group</label>
            {loadingGroups ? (
              <div className={styles.loadingGroups}>Loading groups...</div>
            ) : (
              <select
                className={styles.select}
                value={selectedGroup}
                onChange={e => setSelectedGroup(e.target.value)}
              >
                <option value="">Select asset group...</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.group_name}</option>
                ))}
              </select>
            )}
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setModal(null)} disabled={creating}>Cancel</button>
              <button
                className={styles.confirmBtn}
                onClick={submitSanitation}
                disabled={!selectedGroup || creating || loadingGroups}
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
