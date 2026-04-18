import { useState, useEffect, useCallback, useRef } from 'react'
import { getSanitationOrder, updateSanitationOrder, completeSanitationOrder, getWorkstations, statusClass, typeClass, formatDateTime } from '../api/sanitation'
import InfoModal from './InfoModal'

function StepProgressBar({ status }) {
  const steps = ['Pending', 'In Progress', 'Completed']
  const currentIndex = steps.indexOf(status)

  return (
    <div className="step-progress">
      {steps.map((step, i) => {
        const isDone = i < currentIndex
        const isActive = i === currentIndex
        return (
          <div key={step} className="step-item">
            <div className={`step-circle ${isDone ? 'done' : isActive ? 'active' : 'pending'}`}>
              {isDone ? '✓' : i + 1}
            </div>
            <span className="step-label" style={{ color: isDone || isActive ? 'var(--text-primary)' : 'var(--text-muted)' }}>
              {step}
            </span>
            {i < steps.length - 1 && (
              <div className={`step-connector ${isDone ? 'done' : ''}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function ElapsedTimer({ startDate, startTime, endDate, endTime, status }) {
  const [elapsed, setElapsed] = useState('')

  useEffect(() => {
    if (status !== 'In Progress') {
      // Show static time
      if (startDate && endDate) {
        const start = new Date(`${startDate}T${startTime || '00:00'}`)
        const end = new Date(`${endDate}T${endTime || '00:00'}`)
        const diffMs = end - start
        setElapsed(formatDuration(diffMs))
      }
      return
    }

    function update() {
      const start = new Date(`${startDate}T${startTime || '00:00'}`)
      const diff = Date.now() - start.getTime()
      setElapsed(formatDuration(diff))
    }

    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [startDate, startTime, endDate, endTime, status])

  if (!startDate || status === 'Pending') return null

  return (
    <span className="elapsed-timer">
      ⏱ {elapsed}
    </span>
  )
}

function formatDuration(ms) {
  if (ms < 0) ms = 0
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

export default function SanitationOrderDetail() {
  const id = window.location.pathname.split('/').pop()
  const [order, setOrder] = useState(null)
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [completeModal, setCompleteModal] = useState(false)
  const [completedBy, setCompletedBy] = useState('')
  const [notes, setNotes] = useState('')
  const [checklist, setChecklist] = useState([])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [o, gs] = await Promise.all([
        getSanitationOrder(id),
        getWorkstations(),
      ])
      setOrder(o)
      setGroups(gs)
      if (o.cleaning_checklist?.items) {
        setChecklist(o.cleaning_checklist.items.map(item => ({ ...item })))
      }
      if (o.cleaning_notes) setNotes(o.cleaning_notes)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  function groupName(gid) {
    const g = groups.find(g => g.id === gid)
    return g ? g.group_name : gid ? gid.slice(0, 8) + '…' : '—'
  }

  async function handleStart() {
    setSaving(true)
    try {
      const now = new Date()
      const updated = await updateSanitationOrder(id, {
        status: 'In Progress',
        start_date: now.toISOString().split('T')[0],
        start_time: now.toTimeString().slice(0, 5),
      })
      setOrder(o => ({ ...o, status: 'In Progress', start_date: updated.start_date, start_time: updated.start_time }))
    } catch (e) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleChecklistToggle(idx) {
    if (order.status === 'Completed') return
    const updated = [...checklist]
    updated[idx].cleaned = !updated[idx].cleaned
    setChecklist(updated)
    try {
      await updateSanitationOrder(id, {
        cleaning_checklist: { mode: order.cleaning_checklist?.mode || 'manual', items: updated },
      })
    } catch (e) {
      setChecklist(c => c)
      alert(e.message)
    }
  }

  async function handleNotesSave() {
    try {
      await updateSanitationOrder(id, { cleaning_notes: notes })
    } catch (e) {
      // silently fail — notes auto-save is non-critical
    }
  }

  async function handleComplete() {
    if (!completedBy.trim()) { alert('Name is required'); return }
    setSaving(true)
    try {
      const updated = await completeSanitationOrder(id, {
        completed_by: completedBy.trim(),
        cleaning_notes: notes || undefined,
        cleaning_checklist: { mode: order.cleaning_checklist?.mode || 'manual', items: checklist },
      })
      setOrder(o => ({ ...o, ...updated, status: 'Completed' }))
      setCompleteModal(false)
    } catch (e) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="page-body"><div className="loading"><div className="spinner" /> Loading…</div></div>
  if (error) return <div className="page-body"><div className="error-msg">{error}</div></div>
  if (!order) return null

  const isPending = order.status === 'Pending'
  const isInProgress = order.status === 'In Progress'
  const isCompleted = order.status === 'Completed'

  return (
    <div>
      <div className="page-header">
        <div>
          <button className="back-link" onClick={() => window.location.hash = '/orders'}>
            ← Back to Orders
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div className="page-title" style={{ fontSize: 22 }}>{order.so_number}</div>
            <span className={`badge ${statusClass(order.status)}`} style={{ fontSize: 13, padding: '4px 12px' }}>
              {order.status}
            </span>
            {isInProgress && (
              <ElapsedTimer
                startDate={order.start_date}
                startTime={order.start_time}
                status={order.status}
              />
            )}
          </div>
        </div>
        <div className="detail-actions">
          <InfoModal title="Understanding This Page">
            <p style={{ marginBottom: 12 }}>
              <strong>Workflow:</strong>
            </p>
            <ol style={{ paddingLeft: 20, marginBottom: 12 }}>
              <li>Click <strong>▶ Start Sanitation</strong> when the team begins cleaning</li>
              <li>Tick each <strong>checklist item</strong> as steps are completed</li>
              <li>Add notes in <strong>Cleaning Notes</strong></li>
              <li>Click <strong>✓ Complete Order</strong> when all steps are done</li>
            </ol>
            <p>
              Once <strong>Completed</strong>, the Workstation is unblocked and new production can begin.
            </p>
          </InfoModal>
          {isPending && (
            <button className="btn btn-primary" onClick={handleStart} disabled={saving}>
              ▶ Start Sanitation
            </button>
          )}
          {(isPending || isInProgress) && (
            <button className="btn btn-success" onClick={() => setCompleteModal(true)} disabled={saving}>
              ✓ Complete Order
            </button>
          )}
        </div>
      </div>

      <div className="page-body">
        {/* Step progress */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-body">
            <StepProgressBar status={order.status} />
          </div>
        </div>

        {/* Info grid */}
        <div className="info-grid" style={{ marginBottom: 20 }}>
          <div className="info-card">
            <div className="info-label">Sanitation Type</div>
            <div className="info-value"><span className={`badge ${typeClass(order.sanitation_type)}`}>{order.sanitation_type}</span></div>
          </div>
          <div className="info-card">
            <div className="info-label">Workstation</div>
            <div className="info-value">{groupName(order.asset_group_id)}</div>
          </div>
          <div className="info-card">
            <div className="info-label">Work Order</div>
            <div className="info-value font-mono" style={{ fontSize: 13 }}>{order.production_order || '—'}</div>
          </div>
          <div className="info-card">
            <div className="info-label">Allergen Triggered</div>
            <div className="info-value" style={{ color: order.allergen_triggered ? 'var(--accent-red)' : 'var(--text-muted)' }}>
              {order.allergen_triggered || 'None'}
            </div>
          </div>
          <div className="info-card">
            <div className="info-label">Created</div>
            <div className="info-value text-sm">{formatDateTime(order.created_at)}</div>
          </div>
          {order.start_date && (
            <div className="info-card">
              <div className="info-label">Started</div>
              <div className="info-value text-sm">{order.start_date}{order.start_time ? ` at ${order.start_time}` : ''}</div>
            </div>
          )}
          {order.end_date && (
            <div className="info-card">
              <div className="info-label">Completed</div>
              <div className="info-value text-sm" style={{ color: 'var(--accent-green)' }}>
                {order.end_date}{order.end_time ? ` at ${order.end_time}` : ''}
              </div>
            </div>
          )}
          {order.completed_by && (
            <div className="info-card">
              <div className="info-label">Completed By</div>
              <div className="info-value text-sm">{order.completed_by}</div>
            </div>
          )}
        </div>

        {/* Checklist */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <div className="card-title">Cleaning Checklist</div>
            <div className="text-sm text-muted">
              {checklist.filter(i => i.cleaned).length} / {checklist.length} complete
              {order.cleaning_checklist?.mode && (
                <span style={{ marginLeft: 8, padding: '2px 8px', background: 'var(--bg-tertiary)', borderRadius: 4, fontSize: 11, textTransform: 'capitalize' }}>
                  {order.cleaning_checklist.mode === 'dynamic' ? `Auto: ${order.cleaning_checklist.source || 'allergen'}` : order.cleaning_checklist.mode}
                </span>
              )}
            </div>
          </div>
          <div className="card-body" style={{ padding: '8px 0' }}>
            {checklist.length === 0 ? (
              <div className="text-muted text-sm" style={{ padding: '12px 20px' }}>No checklist items for this order.</div>
            ) : (
              <div className="checklist">
                {checklist.map((item, idx) => (
                  <div
                    key={idx}
                    className={`checklist-item${item.cleaned ? ' checked' : ''}`}
                    onClick={() => !isCompleted && handleChecklistToggle(idx)}
                    style={{ cursor: isCompleted ? 'default' : 'pointer' }}
                  >
                    <input
                      type="checkbox"
                      checked={item.cleaned || false}
                      onChange={() => {}}
                      disabled={isCompleted}
                    />
                    <div>
                      <div className="checklist-item-name">{item.item}</div>
                      {item.method && <div className="checklist-item-method">Method: {item.method}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cleaning Notes */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Cleaning Notes</div>
          </div>
          <div className="card-body">
            <textarea
              className="form-input"
              placeholder="Add notes about the cleaning process…"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              onBlur={handleNotesSave}
              disabled={isCompleted}
              rows={4}
            />
          </div>
        </div>
      </div>

      {/* Complete Modal */}
      {completeModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && !saving && setCompleteModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Complete Sanitation Order</div>
              <button className="modal-close" onClick={() => !saving && setCompleteModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Completed By *</label>
                <input
                  className="form-input"
                  placeholder="Your name"
                  value={completedBy}
                  onChange={e => setCompletedBy(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">Final Notes</label>
                <textarea
                  className="form-input"
                  placeholder="Any additional notes…"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="text-sm text-muted">
                {checklist.filter(i => i.cleaned).length} of {checklist.length} checklist items completed.
                {checklist.some(i => !i.cleaned) && (
                  <span style={{ color: 'var(--accent-yellow)', display: 'block', marginTop: 4 }}>
                    ⚠ Some items are not checked. Are you sure you want to complete?
                  </span>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setCompleteModal(false)} disabled={saving}>Cancel</button>
              <button className="btn btn-success" onClick={handleComplete} disabled={saving}>
                {saving ? 'Completing…' : 'Complete Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
