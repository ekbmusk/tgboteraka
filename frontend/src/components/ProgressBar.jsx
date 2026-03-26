const COLORS = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  secondary: 'bg-secondary',
}

export default function ProgressBar({ value, max = 100, color = 'primary', size = 'md', className = '', showLabel = false }) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100))
  const heights = { sm: 'h-1', md: 'h-1.5', lg: 'h-2.5' }
  return (
    <div className={className}>
      <div className={`${heights[size]} rounded-full overflow-hidden`} style={{ background: 'rgba(37,37,64,0.5)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div
          className={`h-full ${COLORS[color] || COLORS.primary} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {showLabel && (
        <div className="text-right text-xs text-text-2 mt-1">{Math.round(percent)}%</div>
      )}
    </div>
  )
}
