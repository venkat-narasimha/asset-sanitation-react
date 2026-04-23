import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAssetGroups, createAssetGroup, updateAssetGroup, deleteAssetGroup } from '../api/sanitation.js'
import styles from './AssetGroups.module.css'

const STATUS_COLORS = { Active: '#16a34a', Inactive: '#64748b' }

function GroupModal({ group, onSave, onClose }) {
  const [form, setForm] = useState({ group_name: group?.group_name || '', description: group?.description || '', status: group?.status || 'Active' })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave(form)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>{group ? 'Edit' : 'Create'} Asset Group</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label>Group Name</label>
            <input value={form.group_name} onChange={e => setForm(f => ({ ...f, group_name: e.target.value }))} required placeholder="e.g. Line A - Mixer" />
          </div>
          <div className={styles.field}>
            <label>Description</label>
            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" />
          </div>
          <div className={styles.field}>
            <label>Status</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
          <div className={styles.modalActions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.saveBtn} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AssetGroups() {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [view, setView] = useState('grid') // grid | table
  const [modal, setModal] = useState(null) // null | { group }

  useEffect(() => { fetchGroups() }, [])

  async function fetchGroups() {
    try {
      const res = await getAssetGroups()
      setGroups(res.data || [])
    } catch {
      setGroups([])
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(form) {
    if (modal?.group) {
      await updateAssetGroup(modal.group.id, form)
    } else {
      await createAssetGroup(form)
    }
    setModal(null)
    fetchGroups()
  }

  async function handleDelete(id) {
    if (!confirm('Delete this asset group?')) return
    await deleteAssetGroup(id)
    fetchGroups()
  }

  const filtered = groups.filter(g =>
    g.group_name?.toLowerCase().includes(search.toLowerCase()) ||
    g.description?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Asset Groups</h1>
        <button className={styles.createBtn} onClick={() => setModal({ group: null })}>+ Create Group</button>
      </div>

      <div className={styles.toolbar}>
        <input
          className={styles.search}
          placeholder="Search groups..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className={styles.viewToggle}>
          <button className={view === 'grid' ? styles.active : ''} onClick={() => setView('grid')}>Grid</button>
          <button className={view === 'table' ? styles.active : ''} onClick={() => setView('table')}>Table</button>
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>No asset groups found</div>
      ) : view === 'grid' ? (
        <div className={styles.grid}>
          {filtered.map(g => (
            <Link to={`/asset-groups/${g.id}`} key={g.id} className={styles.cardLink}>
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <span className={styles.cardName}>{g.group_name}</span>
                  <span className={styles.cardStatus} style={{ color: STATUS_COLORS[g.status] }}>{g.status}</span>
                </div>
                <div className={styles.cardDesc}>{g.description || '—'}</div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Group Name</th>
              <th>Description</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(g => (
              <tr key={g.id}>
                <td>{g.group_name}</td>
                <td>{g.description || '—'}</td>
                <td><span style={{ color: STATUS_COLORS[g.status] }}>{g.status}</span></td>
                <td>
                  <button className={styles.editBtn} onClick={() => setModal({ group: g })}>Edit</button>
                  <button className={styles.deleteBtn} onClick={() => handleDelete(g.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modal !== null && (
        <GroupModal
          group={modal?.group}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}