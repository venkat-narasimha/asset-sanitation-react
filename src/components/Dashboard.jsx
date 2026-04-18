import { useState, useEffect, useCallback } from 'react'
import { getSanitationStats, getSanitationOrders, getWorkstations, statusClass, typeClass, formatDate, lookupWorkOrder, checkBlocking } from '../api/sanitation'
import StatCard from './StatCard'
import ChartCard, { BarChart, DonutChart, HorizontalBarChart } from './ChartCard'

const API_BASE = 'https://pbapps.duckdns.org/api/v1'

async function fetchRaw(path) {
  const res = await fetch(`${API_BASE}${path}`)
  if (!res.ok) return []
  return res.json().catch(() => [])
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [recentOrders, setRecentOrders] = useState([])
  const [pendingActions, setPendingActions] = useState([])
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  // (WO Status Checker moved to Work Orders page)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [s, ords, grps] = await Promise.all([
        getSanitationStats().catch(() => null),
        getSanitationOrders({ status: 'Completed' }).catch(() => []),
        getWorkstations().catch(() => []),
      ])
      setStats(s)
      setRecentOrders(ords.slice(0, 5))
      setGroups(grps)

      // Pending actions = pending + in_progress
      const pending = ords.filter(o => o.status === 'Pending' || o.status === 'In Progress')
      setPendingActions(pending.slice(0, 5))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function groupName(id) {
    const g = groups.find(g => g.id === id)
    return g ? g.group_name : id ? id.slice(0, 8) + '…' : '—'
  }

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <div className="loading"><div className="spinner" /> Loading dashboard…</div>
      </div>
    )
  }

  const pendingCount = stats?.pending ?? pendingActions.length
  const inProgressCount = stats?.in_progress ?? 0
  const completedThisWeek = stats?.completed_this_week ?? 0

  // Daily volume chart
  const dailyVolumeOpts = {
    xAxis: {
      type: 'category',
      data: stats?.daily_volume?.map(d => d.date.split('T')[0].slice(5)) || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisTick: { show: false },
      axisLabel: { color: '#94a3b8', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#f1f5f9' } },
      axisLabel: { color: '#94a3b8', fontSize: 11 },
    },
    series: [{
      data: stats?.daily_volume?.map(d => d.count) || [0, 0, 0, 0, 0, 0, 0],
      type: 'bar',
      itemStyle: { color: '#0d9488', borderRadius: [4, 4, 0, 0] },
      barMaxWidth: 32,
    }],
  }

  // Type donut
  const typeData = stats?.type_breakdown?.map(t => ({ name: t.sanitation_type, value: t.count })) || []
  const typeDonutOpts = {
    series: [{
      type: 'pie',
      radius: ['45%', '70%'],
      label: { show: true, formatter: '{b}: {c}', fontSize: 12, color: '#475569' },
      data: typeData.length > 0 ? typeData : [{ name: 'No data', value: 1 }],
      itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
      color: ['#0d9488', '#06b6d4', '#f59e0b', '#3b82f6'],
    }],
  }

  // Avg completion time
  const avgTimeData = stats?.avg_time_by_group || []
  const avgTimeOpts = {
    yAxis: { type: 'category', data: avgTimeData.map(t => t.group_name || 'Unknown'), axisLine: { lineStyle: { color: '#e2e8f0' } }, axisTick: { show: false }, axisLabel: { color: '#475569', fontSize: 12 } },
    xAxis: { type: 'value', splitLine: { lineStyle: { color: '#f1f5f9' } }, axisLabel: { color: '#94a3b8', fontSize: 11, formatter: v => v + 'h' } },
    series: [{
      data: avgTimeData.map(t => ({ value: t.avg_hours, name: t.group_name })),
      type: 'bar',
      itemStyle: { color: '#06b6d4', borderRadius: [0, 4, 4, 0] },
      barMaxWidth: 24,
    }],
  }

  // Orders by group bar
  const groupData = stats?.orders_by_group || []
  const groupBarOpts = {
    xAxis: { type: 'category', data: groupData.map(g => g.group_name || 'Unknown'), axisLine: { lineStyle: { color: '#e2e8f0' } }, axisTick: { show: false }, axisLabel: { color: '#475569', fontSize: 11, rotate: 0 } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: '#f1f5f9' } }, axisLabel: { color: '#94a3b8', fontSize: 11 } },
    series: [{
      data: groupData.map(g => g.count),
      type: 'bar',
      itemStyle: { color: '#0d9488', borderRadius: [4, 4, 0, 0] },
      barMaxWidth: 40,
    }],
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-subtitle">Sanitation operations overview</div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={load}>
          ↻ Refresh
        </button>
      </div>

      <div className="page-body">
        {/* KPI Cards */}
        <div className="stat-cards-grid">
          <StatCard icon="📋" iconColor="teal" label="Total Orders" value={stats?.total ?? '—'} />
          <StatCard icon="⏳" iconColor="yellow" label="Pending" value={pendingCount} />
          <StatCard icon="🔄" iconColor="blue" label="In Progress" value={inProgressCount} />
          <StatCard icon="✅" iconColor="green" label="Completed This Week" value={completedThisWeek} trend="vs last week" trendUp />
        </div>

        {/* Charts */}
        <div className="chart-grid">
          <ChartCard title="Daily Sanitation Volume" sub="Last 14 days">
            <BarChart option={dailyVolumeOpts} />
          </ChartCard>
          <ChartCard title="Orders by Type" sub="All time">
            <DonutChart option={typeDonutOpts} />
          </ChartCard>
          <ChartCard title="Avg Completion Time" sub="By workstation (hours)">
            <HorizontalBarChart option={avgTimeOpts} />
          </ChartCard>
          <ChartCard title="Orders by Workstation" sub="All time">
            <BarChart option={groupBarOpts} />
          </ChartCard>
        </div>

        {/* Bottom columns */}
        <div className="dashboard-cols">
          {/* Pending Actions */}
          <div className="list-card">
            <div className="list-card-header">
              <span className="list-card-title">⚡ Pending Actions</span>
              <a href="#/orders" className="btn btn-ghost btn-sm">View all</a>
            </div>
            {pendingActions.length === 0 ? (
              <div className="list-empty">✅ No pending actions</div>
            ) : (
              pendingActions.map(o => (
                <div key={o.id} className="list-item" style={{ cursor: 'pointer' }} onClick={() => window.location.hash = `/orders/${o.id}`}>
                  <div className="list-item-left">
                    <span className="list-item-title">{o.so_number}</span>
                    <span className="list-item-sub">{groupName(o.asset_group_id)} · {o.sanitation_type}</span>
                  </div>
                  <div className="list-item-right">
                    <span className={`badge ${statusClass(o.status)}`}>{o.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Recent Completions */}
          <div className="list-card">
            <div className="list-card-header">
              <span className="list-card-title">✅ Recently Completed</span>
              <a href="#/orders" className="btn btn-ghost btn-sm">View all</a>
            </div>
            {recentOrders.length === 0 ? (
              <div className="list-empty">No completed orders yet</div>
            ) : (
              recentOrders.map(o => (
                <div key={o.id} className="list-item" style={{ cursor: 'pointer' }} onClick={() => window.location.hash = `/orders/${o.id}`}>
                  <div className="list-item-left">
                    <span className="list-item-title">{o.so_number}</span>
                    <span className="list-item-sub">{groupName(o.asset_group_id)} · Completed {formatDate(o.end_date)}</span>
                  </div>
                  <div className="list-item-right">
                    <span className={`badge ${typeClass(o.sanitation_type)}`}>{o.sanitation_type}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
