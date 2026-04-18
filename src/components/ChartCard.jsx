import ReactECharts from 'echarts-for-react'

const BASE_OPTS = {
  backgroundColor: 'transparent',
  grid: { top: 10, right: 16, bottom: 24, left: 48, containLabel: false },
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'line', lineStyle: { color: '#e2e8f0' } },
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    textStyle: { color: '#e2e8f0', fontSize: 12 },
    borderRadius: 6,
    padding: [8, 12],
  },
  textStyle: { fontFamily: 'Inter, sans-serif', color: '#64748b' },
}

function mergeOpts(opts) {
  return { ...BASE_OPTS, ...opts }
}

export function BarChart({ option, style = { height: 220 } }) {
  return (
    <ReactECharts
      option={mergeOpts(option)}
      style={style}
      opts={{ renderer: 'svg' }}
    />
  )
}

export function DonutChart({ option, style = { height: 220 } }) {
  return (
    <ReactECharts
      option={mergeOpts({
        legend: { bottom: 0, left: 'center', textStyle: { color: '#64748b', fontSize: 12 } },
        tooltip: { trigger: 'item', backgroundColor: '#0f172a', borderColor: '#1e293b', textStyle: { color: '#e2e8f0', fontSize: 12 }, borderRadius: 6, padding: [8, 12] },
        ...option,
      })}
      style={style}
      opts={{ renderer: 'svg' }}
    />
  )
}

export function HorizontalBarChart({ option, style = { height: 180 } }) {
  return (
    <ReactECharts
      option={mergeOpts({
        grid: { top: 10, right: 80, bottom: 24, left: 100, containLabel: false },
        ...option,
      })}
      style={style}
      opts={{ renderer: 'svg' }}
    />
  )
}

export default function ChartCard({ title, sub, children }) {
  return (
    <div className="chart-card">
      <div className="chart-card-title">{title}</div>
      {sub && <div className="chart-card-sub">{sub}</div>}
      {children}
    </div>
  )
}
