import { useState, useEffect } from 'react'
import ReactEChartsCore from 'echarts-for-react/lib/core'
import echarts from '../echarts-core'

import { getStats } from '../api/sanitation.js'
import styles from './Dashboard.module.css'

const KPI_LABELS = {
  asset_groups: 'Asset Groups',
  sanitation_orders: 'Sanitation Orders',
  pending_orders: 'Pending',
  completed_orders: 'Completed',
}

function StatCard({ label, value, color }) {
  return (
    <div className={styles.card}>
      <div className={styles.kpiLabel}>{label}</div>
      <div className={styles.kpiValue} style={{ color }}>{value ?? '—'}</div>
    </div>
  )
}

function PieChart({ title, data }) {
  const option = {
    title: { text: title, left: 'center', textStyle: { fontSize: 13, fontWeight: 600, color: '#475569' } },
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    series: [{
      type: 'pie',
      radius: ['40%', '65%'],
      label: { show: true, formatter: '{b}\n{c}', fontSize: 11 },
      data: data || [],
      emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.2)' } },
    }],
  }
  return <ReactEChartsCore echarts={echarts} option={option} style={{ height: 220 }} notMerge={true} />
}

function BarChart({ title, data }) {
  const option = {
    title: { text: title, left: 'center', textStyle: { fontSize: 13, fontWeight: 600, color: '#475569' } },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 8, right: 8, top: 36, bottom: 8, containLabel: true },
    xAxis: { type: 'category', data: data?.map(d => d.name) || [], axisLabel: { fontSize: 10, rotate: 20 } },
    yAxis: { type: 'value', axisLabel: { fontSize: 10 } },
    series: [{
      type: 'bar',
      data: data?.map(d => d.value) || [],
      itemStyle: { color: '#0d9488' },
    }],
  }
  return <ReactEChartsCore echarts={echarts} option={option} style={{ height: 200 }} notMerge={true} />
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getStats()
      .then(data => { setStats(data.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className={styles.loading}>Loading...</div>

  const s = stats || {}
  const kpis = [
    { label: 'Asset Groups', value: s.asset_groups ?? 0, color: '#0d9488' },
    { label: 'Sanitation Orders', value: s.sanitation_orders ?? 0, color: '#2563eb' },
    { label: 'Pending', value: s.pending_orders ?? 0, color: '#ca8a04' },
    { label: 'Completed', value: s.completed_orders ?? 0, color: '#16a34a' },
  ]

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Dashboard</h1>

      <div className={styles.kpiRow}>
        {kpis.map(k => <StatCard key={k.label} {...k} />)}
      </div>

      <div className={styles.chartsRow}>
        <div className={styles.chartCard}>
          <PieChart
            title="Order Status"
            data={[
              { name: 'Pending', value: s.pending_orders ?? 0 },
              { name: 'Completed', value: s.completed_orders ?? 0 },
            ]}
          />
        </div>
        <div className={styles.chartCard}>
          <PieChart
            title="Asset Groups"
            data={s.asset_group_breakdown?.map(g => ({ name: g.group_name, value: g.count })) || []}
          />
        </div>
        <div className={styles.chartCard}>
          <BarChart
            title="Orders per Group"
            data={s.group_order_count?.map(g => ({ name: g.group_name, value: g.count })) || []}
          />
        </div>
        <div className={styles.chartCard}>
          <BarChart
            title="Monthly Orders"
            data={s.monthly_orders?.map(m => ({ name: m.month, value: m.count })) || []}
          />
        </div>
      </div>
    </div>
  )
}