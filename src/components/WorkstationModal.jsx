import { useState } from 'react'


export default function WorkstationModal({ group, onSave, onClose }) {
  const [form, setForm] = useState({
    group_name: group?.group_name || '',
        assets: group?.assets?.join(', ') || '',
    is_active: group?.is_active !== undefined ? group.is_active : true,
    notes: group?.notes || '',
    location: group?.location || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(key, val) {
    setForm(f => ({ ...f, [key]: val }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.group_name.trim()) { setError('Group name is required'); return }
    setSaving(true)
    setError('')
    try {
      const payload = {
        group_name: form.group_name.trim(),
                assets: form.assets.split(',').map(s => s.trim()).filter(Boolean),
        is_active: form.is_active,
        notes: form.notes || undefined,
        location: form.location || undefined,
      }
      await onSave(payload)
    } catch (e) {
      setError(e.message)
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{group ? 'Edit Workstation' : 'New Workstation'}</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="error-msg mb-4">{error}</div>}
            <div className="form-group">
              <label className="form-label">Group Name *</label>
              <input
                className="form-input"
                placeholder="e.g. Line-A, Bakery Zone 2"
                value={form.group_name}
                onChange={e => set('group_name', e.target.value)}
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Assets (comma-separated)</label>
              <input
                className="form-input"
                placeholder="e.g. Tank-001, Mixer-A, Conveyor-B"
                value={form.assets}
                onChange={e => set('assets', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Location</label>
              <input
                className="form-input"
                placeholder="e.g. Building A, Floor 2"
                value={form.location}
                onChange={e => set('location', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea
                className="form-input"
                placeholder="Optional notes..."
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
              />
            </div>
            {group && (
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={e => set('is_active', e.target.checked)}
                  />
                  <span className="text-sm">Active</span>
                </label>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : (group ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
