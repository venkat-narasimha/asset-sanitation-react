import { useState } from 'react'
import { createPortal } from 'react-dom'

export default function InfoModal({ title, children }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        className="info-btn"
        onClick={() => setOpen(true)}
        title="Help"
        aria-label="Help"
      >
        ⓘ
      </button>

      {open && createPortal(
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{title}</h3>
              <button className="modal-close" onClick={() => setOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              {children}
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={() => setOpen(false)}>Got it</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
