import { useState, useEffect } from 'react'
import ReactEChartsCore from 'echarts-for-react/lib/core'
import echarts from '../echarts-core'

import { getStats, getAssetGroups } from '../api/sanitation.js'
import styles from './Dashboard.module.css'

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
    legend: { orient: 'horizontal', bottom: 0, textStyle: { fontSize: 11 } },
    series: [{
      type: 'pie',
      radius: ['40%', '65%'],
      center: ['50%', '50%'],
      label: { show: false },
      data: data || [],
      emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.2)' } },
    }],
  }
  return <ReactEChartsCore echarts={echarts} option={option} style={{ height: 220 }} notMerge={true} />
}

function BarChart({ title, data }) {
  const shorten = (name) => {
    if (!name) return ''
    if (name.length > 14) return name.slice(0, 12) + '…'
    return name
  }
  const option = {
    title: { text: title, left: 'center', textStyle: { fontSize: 13, fontWeight: 600, color: '#475569' } },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { orient: 'horizontal', bottom: 0, textStyle: { fontSize: 10 } },
    grid: { left: 8, right: 8, top: 36, bottom: 44, containLabel: true },
    xAxis: {
      type: 'category',
      data: data?.map(d => shorten(d.name)) || [],
      axisLabel: { fontSize: 10, rotate: 25, interval: 0 },
    },
    yAxis: { type: 'value', axisLabel: { fontSize: 10 } },
    series: [{
      type: 'bar',
      data: data?.map(d => d.value) || [],
      itemStyle: { color: '#0d9488' },
    }],
  }
  return <ReactEChartsCore echarts={echarts} option={option} style={{ height: 200 }} notMerge={true} />
}

function MonthlyChart({ allData, completedData }) {
  // Merge dates from both series for x-axis
  const allDates = [...new Set([
    ...(allData || []).map(d => d.date),
    ...(completedData || []).map(d => d.date),
  ])].sort()

  const shorten = (name) => {
    if (!name) return ''
    if (name.length > 10) return name.slice(0, 8) + '…'
    return name
  }

  const allValues = allDates.map(d => {
    const found = (allData || []).find(a => a.date === d)
    return found ? found.count : 0
  })
  const compValues = allDates.map(d => {
    const found = (completedData || []).find(a => a.date === d)
    return found ? found.count : 0
  })

  const option = {
    title: { text: 'Monthly Orders', left: 'center', textStyle: { fontSize: 13, fontWeight: 600, color: '#475569' } },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { orient: 'horizontal', bottom: 0, textStyle: { fontSize: 10 } },
    grid: { left: 8, right: 8, top: 36, bottom: 44, containLabel: true },
    xAxis: {
      type: 'category',
      data: allDates.map(d => shorten(d)),
      axisLabel: { fontSize: 9, rotate: 30, interval: 0 },
    },
    yAxis: { type: 'value', axisLabel: { fontSize: 10 } },
    series: [
      {
        name: 'All Orders',
        type: 'bar',
        data: allValues,
        itemStyle: { color: '#2563eb' },
      },
      {
        name: 'Completed',
        type: 'bar',
        data: compValues,
        itemStyle: { color: '#16a34a' },
      },
    ],
  }
  return <ReactEChartsCore echarts={echarts} option={option} style={{ height: 200 }} notMerge={true} />
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [assetGroupCount, setAssetGroupCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getStats(), getAssetGroups()])
      .then(([statsData, groupsData]) => {
        setStats(statsData.data)
        setAssetGroupCount(groupsData.data?.length ?? 0)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className={styles.loading}>Loading...</div>

  const s = stats || {}
  const kpis = [
    { label: 'Asset Groups', value: assetGroupCount, color: '#0d9488' },
    { label: 'Sanitation Orders', value: s.total ?? 0, color: '#2563eb' },
    { label: 'Pending', value: s.pending ?? 0, color: '#ca8a04' },
    { label: 'Completed', value: s.completed_this_week ?? 0, color: '#16a34a' },
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
              { name: 'Pending', value: s.pending ?? 0 },
              { name: 'Completed', value: s.completed_this_week ?? 0 },
            ]}
          />
        </div>
        <div className={styles.chartCard}>
          <PieChart
            title="Order Types"
            data={(s.type_breakdown || []).map(t => ({ name: t.type, value: t.count }))}
          />
        </div>
        <div className={styles.chartCard}>
          <BarChart
            title="Orders per Group"
            data={s.orders_by_group?.map(g => ({ name: g.group_name, value: g.count })) || []}
          />
        </div>
        <div className={styles.chartCard}>
          <MonthlyChart
            allData={s.daily_volume}
            completedData={s.completed_by_date}
          />
        </div>
      </div>
    </div>
  )
}
