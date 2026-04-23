import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getSanitationOrder, startSanitationOrder, completeSanitationOrder, cancelSanitationOrder } from '../api/sanitation.js'
import styles from './SanitationOrderDetail.module.css'

const STEPS = ['Pending', 'In Progress', 'Completed']

function ProgressStep({ label, active, completed }) {
  return (
    <div className={`${styles.step} ${active ? styles.active : ''} ${completed ? styles.completed : ''}`}>
      <div className={styles.stepDot}>
        {completed ? '✓' : active ? '●' : '○'}
      </div>
      <div className={styles.stepLabel}>{label}</div>
    </div>
  )
}

function elapsed(start) {
  if (!start) return '—'
  const ms = Date.now() - new Date(start).getTime()
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

export default function SanitationOrderDetail() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)

  useEffect(() => { load() }, [id])

  async function load() {
    setLoading(true)
    try {
      const res = await getSanitationOrder(id)
      setOrder(res)
    } finally {
      setLoading(false)
    }
  }

  async function action(fn, confirmMsg) {
    if (confirmMsg && !confirm(confirmMsg)) return
    setActing(true)
    try {
      await fn(id)
      load()
    } finally {
      setActing(false)
    }
  }

  if (loading) return <div className={styles.loading}>Loading...</div>
  if (!order) return <div className={styles.notFound}>Order not found</div>

  const stepIndex = STEPS.indexOf(order.status)
  const checklist = [
    { label: 'Cleaning checklist', done: !!order.started_at },
    { label: 'Sanitation applied', done: order.status === 'Completed' || order.status === 'In Progress' },
    { label: 'Final inspection', done: order.status === 'Completed' },
  ]

  return (
    <div className={styles.page}>
      <div className={styles.breadcrumb}>
        <Link to="/orders" className={styles.back}>← Sanitation Orders</Link>
      </div>

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Order #{id}</h1>
          <p className={styles.group}>{order.group_name || '—'}</p>
        </div>
        <div className={styles.headerRight}>
          {order.source_wo && (
            <span className={styles.woTag}>WO: {order.source_wo}</span>
          )}
          <span className={`${styles.badge} ${styles[order.status?.toLowerCase().replace(' ', '')]}`}>
            {order.status}
          </span>
        </div>
      </div>

      {/* 3-Step Progress */}
      <div className={styles.card}>
        <div className={styles.progressRow}>
          {STEPS.map((step, i) => (
            <React.Fragment key={step}>
              <ProgressStep
                label={step}
                active={i === stepIndex}
                completed={i < stepIndex}
              />
              {i < STEPS.length - 1 && (
                <div className={`${styles.connector} ${i < stepIndex ? styles.connectorDone : ''}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Timer + Actions */}
      <div className={styles.card}>
        <div className={styles.timerRow}>
          <div>
            <div className={styles.timerLabel}>Elapsed Time</div>
            <div className={styles.timerValue}>{elapsed(order.created_at)}</div>
          </div>
          <div className={styles.actions}>
            {order.status === 'Pending' && (
              <button className={styles.startBtn} onClick={() => alert('Coming Soon — start feature is under development.')} disabled={acting}>
                Start Sanitation
              </button>
            )}
            {order.status === 'In Progress' && (
              <button className={styles.completeBtn} onClick={() => action(completeSanitationOrder, 'Mark as complete?')} disabled={acting}>
                Mark Complete
              </button>
            )}
            {order.status !== 'Completed' && order.status !== 'Cancelled' && (
              <button className={styles.cancelBtn} onClick={() => action(cancelSanitationOrder, 'Cancel this order?')} disabled={acting}>
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Sanitation Checklist</h2>
        <div className={styles.checklist}>
          {checklist.map((item, i) => (
            <div key={i} className={styles.checkItem}>
              <span className={item.done ? styles.checkDone : styles.checkPending}>
                {item.done ? '✓' : '○'}
              </span>
              {item.label}
            </div>
          ))}
        </div>
      </div>

      {/* Timestamps */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Timestamps</h2>
        <div className={styles.timestamps}>
          <div className={styles.tsRow}>
            <span className={styles.tsLabel}>Created</span>
            <span>{order.created_at ? new Date(order.created_at).toLocaleString() : '—'}</span>
          </div>
          <div className={styles.tsRow}>
            <span className={styles.tsLabel}>Started</span>
            <span>{order.started_at ? new Date(order.started_at).toLocaleString() : '—'}</span>
          </div>
          <div className={styles.tsRow}>
            <span className={styles.tsLabel}>Completed</span>
            <span>{order.completed_at ? new Date(order.completed_at).toLocaleString() : '—'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}