const COLORS = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
}

export default function ProgressBar({ value, max = 100, color = 'primary', size = 'md', className = '', showLabel = false }) {
  const percent = Math.min(100, Math.max(0, max > 0 ? (value / max) * 100 : 0))
  const heights = { sm: 'h-1', md: 'h-1.5', lg: 'h-2.5' }
  return (
    <div className={className}>
      <div className={`${heights[size]} rounded-full overflow-hidden bg-surface-3 border border-border`}>
        <div
          className={`h-full ${COLORS[color] || COLORS.primary} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {showLabel && (
        <div className="text-right text-2xs text-text-2 mt-1 tnum">{Math.round(percent)}%</div>
      )}
    </div>
  )
}
