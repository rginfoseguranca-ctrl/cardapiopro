interface BadgeProps {
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'muted'
  children: React.ReactNode
}

export default function Badge({ variant = 'muted', children }: BadgeProps) {
  return <span className={`badge badge-${variant}`}>{children}</span>
}
