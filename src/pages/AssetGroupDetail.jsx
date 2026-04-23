import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getAssetGroup, getGroupAssets, addAssetsToGroup, removeAssetFromGroup } from '../api/sanitation.js'
import styles from './AssetGroupDetail.module.css'

function AddAssetModal({ agId, linkedAssets, onSave, onClose }) {
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(new Set())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('https://pbapps.duckdns.org/api/v1/erp-assets')
      .then(r => r.json())
      .then(d => setAssets(d.data || []))
      .catch(() => setAssets([]))
      .finally(() => setLoading(false))
  }, [])

  // Build set of already-linked ERPNext asset names
  const linkedNames = new Set(linkedAssets.map(a => a.erp_asset_name))
  const available = assets.filter(a => !linkedNames.has(a.erp_asset_name))

  function toggle(name) {
    const next = new Set(selected)
    if (next.has(name)) next.delete(name)
    else next.add(name)
    setSelected(next)
  }

  async function handleSave() {
    if (selected.size === 0) return
    setSaving(true)
    // selected contains erp_asset_names; resolve to integer IDs via the loaded erp_assets
    const nameToId = Object.fromEntries(assets.map(a => [a.erp_asset_name, a.id]))
    const erp_asset_ids = Array.from(selected).map(n => nameToId[n]).filter(Boolean)
    try {
      await addAssetsToGroup(agId, erp_asset_ids)
      onSave()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>Add ERPNext Assets</h2>
        <div className={styles.assetList}>
          {loading ? (
            <div className={styles.loading}>Loading assets...</div>
          ) : available.length === 0 ? (
            <div className={styles.empty}>All assets already linked to this group</div>
          ) : (
            available.map(a => (
              <label key={a.erp_asset_name} className={styles.assetRow}>
                <input
                  type="checkbox"
                  checked={selected.has(a.erp_asset_name)}
                  onChange={() => toggle(a.erp_asset_name)}
                />
                <span>{a.erp_asset_name || a.asset_name}</span>
                <span className={styles.assetMeta}>{a.asset_category || '—'} · {a.location || 'No location'}</span>
              </label>
            ))
          )}
        </div>
        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button
            className={styles.saveBtn}
            disabled={selected.size === 0 || saving}
            onClick={handleSave}
          >
            {saving ? 'Linking...' : `Link ${selected.size} Asset${selected.size !== 1 ? 's' : ''}`}
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
      setLinkedAssets(gRes.data?.linked_assets || aRes.data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  async function handleUnlink(asset) {
    if (!confirm(`Remove "${asset.asset_name}" from this group?`)) return
    setRemoving(asset.erp_asset_id)
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