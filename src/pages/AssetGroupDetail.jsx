import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getAssetGroup, getGroupAssets, addAssetsToGroup, removeAssetFromGroup } from '../api/sanitation.js'
import styles from './AssetGroupDetail.module.css'

function AddAssetModal({ agId, linkedAssets, onSave, onClose }) {
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState([])     // array, not Set
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('https://pbapps.duckdns.org/api/v1/erp-assets')
      .then(r => r.json())
      .then(d => setAssets(d.data || []))
      .catch(() => setAssets([]))
      .finally(() => setLoading(false))
  }, [])

  // Build set of already-linked ERPNext asset names (erp_asset_name on linkedAssets, name on all assets)
  const linkedNames = new Set(linkedAssets.map(a => a.erp_asset_name))
  const available = assets.filter(a => !linkedNames.has(a.name))

  // Apply search filter
  const filtered = available.filter(a => {
    if (!search) return true
    const q = search.toLowerCase()
    return (a.name || '').toLowerCase().includes(q) ||
      (a.asset_name || '').toLowerCase().includes(q) ||
      (a.asset_category || '').toLowerCase().includes(q) ||
      (a.location || '').toLowerCase().includes(q)
  })

  // Group by category
  const groups = {}
  filtered.forEach(a => {
    const cat = a.asset_category || 'Other'
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(a)
  })

  function toggle(id) {
    if (selected.includes(id)) {
      setSelected(selected.filter(s => s !== id))
    } else {
      setSelected([...selected, id])
    }
  }

  async function handleSave() {
    if (selected.length === 0) return
    setError(null)
    setSaving(true)
    try {
      const data = await addAssetsToGroup(agId, selected)
      if (!data?.success) {
        const msg = data?.invalid_ids
          ? `Invalid asset IDs: ${data.invalid_ids.join(', ')}`
          : (data?.detail || 'Failed to link assets')
        throw new Error(msg)
      }
      onSave()
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.cardModal} onClick={e => e.stopPropagation()}>
        <div className={styles.cardModalHeader}>
          <div>
            <h2 className={styles.modalTitle}>Add ERPNext Assets</h2>
            <p className={styles.modalSub}>{available.length} available · {selected.length} selected</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.cardSearchWrap}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            className={styles.cardSearch}
            placeholder="Search assets..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.cardGridWrap}>
          {loading ? (
            <div className={styles.loading}>Loading assets...</div>
          ) : filtered.length === 0 ? (
            <div className={styles.empty}>No assets found</div>
          ) : (
            Object.entries(groups).sort(([a], [b]) => a.localeCompare(b)).map(([category, items]) => (
              <div key={category} className={styles.cardGroup}>
                <div className={styles.cardGroupLabel}>{category}</div>
                <div className={styles.cardGrid}>
                  {items.map(a => (
                    <div
                      key={a.id}
                      className={`${styles.assetCard} ${selected.includes(a.id) ? styles.assetCardSelected : ''}`}
                      onClick={() => toggle(a.id)}
                    >
                      <div className={styles.assetCardCheck}>
                        {selected.includes(a.id) ? '✅' : '○'}
                      </div>
                      <div className={styles.assetCardName}>{a.asset_name || a.name}</div>
                      <div className={styles.assetCardMeta}>{a.name}</div>
                      <div className={styles.assetCardLocation}>{a.location || 'No location'}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {error && (
          <div className={styles.saveError}>
            <span className={styles.saveErrorIcon}>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <div className={styles.cardModalFooter}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button
            className={styles.saveBtn}
            disabled={selected.length === 0 || saving}
            onClick={handleSave}
          >
            {saving ? 'Linking...' : `Link ${selected.length} Asset${selected.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AssetGroupDetail() {
  const { id } = useParams()
  const [group, setGroup] = useState(null)
  const [linkedAssets, setLinkedAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [removing, setRemoving] = useState(null)

  async function load() {
    setLoading(true)
    try {
      const gRes = await getAssetGroup(id)
      const aRes = await getGroupAssets(id)
      const gData = gRes.data?.group || gRes.data || {}
      setGroup(gData)
      setLinkedAssets(aRes.assets || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  async function handleUnlink(asset) {
    if (!confirm(`Remove "${asset.asset_name}" from this group?`)) return
    setRemoving(asset.id)
    try {
      await removeAssetFromGroup(id, asset.erp_asset_id)
      load()
    } finally {
      setRemoving(null)
    }
  }

  if (loading) return <div className={styles.loading}>Loading...</div>
  if (!group) return <div className={styles.notFound}>Asset group not found</div>

  return (
    <div className={styles.page}>
      <div className={styles.breadcrumb}>
        <Link to="/asset-groups" className={styles.back}>← Asset Groups</Link>
      </div>

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{group.group_name}</h1>
          <p className={styles.desc}>{group.location || group.notes || '—'}</p>
        </div>
        <span className={`${styles.badge} ${group.is_active ? styles.active : styles.inactive}`}>
          {group.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Linked ERPNext Assets ({linkedAssets.length})</h2>
          <button className={styles.addBtn} onClick={() => setPickerOpen(true)}>+ Add Assets</button>
        </div>

        {linkedAssets.length === 0 ? (
          <div className={styles.empty}>
            No assets linked yet. Click "+ Add Assets" to link ERPNext assets to this group.
          </div>
        ) : (
          <table className={styles.assetTable}>
            <thead>
              <tr>
                <th>Asset Name</th>
                <th>Category</th>
                <th>Location</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {linkedAssets.map(a => (
                <tr key={a.erp_asset_id}>
                  <td>
                    <div className={styles.assetName}>{a.asset_name}</div>
                    <div className={styles.assetId}>{a.erp_asset_name}</div>
                  </td>
                  <td>{a.asset_category || '—'}</td>
                  <td>{a.location || '—'}</td>
                  <td>{a.status || '—'}</td>
                  <td>
                    <button
                      className={styles.unlinkBtn}
                      disabled={removing === a.erp_asset_id}
                      onClick={() => handleUnlink(a)}
                    >
                      {removing === a.erp_asset_id ? 'Removing...' : 'Remove'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {pickerOpen && (
        <AddAssetModal
          agId={id}
          linkedAssets={linkedAssets}
          onSave={() => { setPickerOpen(false); load() }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  )
}
