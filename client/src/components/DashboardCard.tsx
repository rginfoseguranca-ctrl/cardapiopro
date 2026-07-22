export default function DashboardCard({
  icon, value, label, bg, children, className = '', style,
}: {
  icon?: string
  value?: string | number
  label?: string
  bg?: string
  children?: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div className={`dashboard-card ${className}`} style={style}>
      {children || (
        <div className="dashboard-metric">
          {icon && (
            <div className="dashboard-metric-icon" style={{ background: bg || 'var(--primary-light)' }}>
              {icon}
            </div>
          )}
          <div>
            <div className="dashboard-metric-value">{value}</div>
            <div className="dashboard-metric-label">{label}</div>
          </div>
        </div>
      )}
    </div>
  )
}
