import { useState, useEffect } from 'react'
import InfoModal from './InfoModal'

export default function Layout({ children }) {
  const [hash, setHash] = useState(window.location.hash || '#/')

  // Ensure hash is always valid on mount
  useEffect(() => {
    if (!window.location.hash || window.location.hash === '#') {
      window.location.hash = '#/'
    }
  }, [])

  function handleNavClick(to) {
    window.location.hash = '#' + to
    setHash('#' + to)
  }

  function isActive(to) {
    if (to === '/' && (hash === '' || hash === '#/' || hash === '#')) return true
    return hash === '#' + to
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h1>
            <span>🧹</span>
            Sanitation
          </h1>
          <InfoModal title="About Asset Sanitation">
            <p style={{ marginBottom: 12 }}>
              The <strong>Asset Sanitation System</strong> automatically creates cleaning orders when production lines finish batches containing allergens.
            </p>
            <p style={{ marginBottom: 12 }}>
              It ensures <strong>no allergen cross-contamination</strong> between production runs by requiring cleaning to be completed before new batches can start.
            </p>
            <p style={{ marginBottom: 12 }}>
              <strong>How it works:</strong>
            </p>
            <ol style={{ paddingLeft: 20, marginBottom: 12 }}>
              <li>A Work Order with an allergen BOM is completed in ERPNext</li>
              <li>A Sanitation Order is automatically created</li>
              <li>Production is blocked until cleaning is done</li>
              <li>Staff complete the checklist in this app</li>
            </ol>
          </InfoModal>
        </div>

        <div className="sidebar-section">
          <div className="nav-section-title">Overview</div>
          <NavItem to="/" icon={<DashboardIcon />} onClick={() => handleNavClick('/')}>
            Dashboard
          </NavItem>
        </div>

        <div className="sidebar-section">
          <div className="nav-section-title">Management</div>
          <NavItem to="/work-orders" icon={<WorkOrdersIcon />} onClick={() => handleNavClick('/work-orders')}>
            Work Orders
          </NavItem>
          <NavItem to="/workstations" icon={<GroupsIcon />} onClick={() => handleNavClick('/workstations')}>
            Workstations
          </NavItem>
          <NavItem to="/orders" icon={<ListIcon />} onClick={() => handleNavClick('/orders')}>
            Sanitation Orders
          </NavItem>
        </div>

        <div className="sidebar-footer">
          Phase 6 UI Upgrade · 2026-04-16
        </div>
      </aside>
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}

function NavItem({ to, icon, children, onClick }) {
  const liveHash = window.location.hash || '#/'
  const isActive = (to === '/' && (liveHash === '' || liveHash === '#/' || liveHash === '#'))
    || liveHash === '#' + to
  return (
    <a
      href={`#${to}`}
      className={`nav-item${isActive ? ' active' : ''}`}
      onClick={e => { e.preventDefault(); onClick(); }}
    >
      {icon}
      {children}
    </a>
  )
}

function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  )
}

function WorkOrdersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
      <rect x="9" y="3" width="6" height="4" rx="1"/>
      <path d="M9 12h6M9 16h6"/>
    </svg>
  )
}

function GroupsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
      <path d="M14 17.5h7M17.5 14v7"/>
    </svg>
  )
}

function ListIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
      <rect x="9" y="3" width="6" height="4" rx="1"/>
      <path d="M9 12h6M9 16h6"/>
    </svg>
  )
}
