export default function StatCard({ icon, iconColor = 'teal', label, value, trend, trendUp }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${iconColor}`}>{icon}</div>
      <div className="stat-content">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        {trend && (
          <div className={`stat-trend ${trendUp ? 'up' : 'down'}`}>
            {trendUp ? '↑' : '↓'} {trend}
          </div>
        )}
      </div>
    </div>
  )
}
