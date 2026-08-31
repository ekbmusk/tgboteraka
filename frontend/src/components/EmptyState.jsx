import Button from './Button'

/**
 * Empty / error state with an optional call to action.
 * Keeps every "nothing here yet" screen in the app looking like one family.
 */
export default function EmptyState({ Icon, title, description, actionLabel, onAction, tone = 'muted', className = '' }) {
  const ring = tone === 'danger'
    ? 'border-danger/30 text-danger bg-danger/10'
    : tone === 'primary'
      ? 'border-primary/30 text-primary bg-primary-dim'
      : 'border-border-strong text-text-3 bg-surface-2'
  return (
    <div className={`flex flex-col items-center text-center px-6 py-10 animate-fade-in ${className}`}>
      {Icon && (
        <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center mb-4 ${ring}`}>
          <Icon size={28} strokeWidth={1.5} />
        </div>
      )}
      <p className="text-base font-semibold text-text-1 mb-1">{title}</p>
      {description && <p className="text-sm text-text-2 leading-relaxed max-w-[260px]">{description}</p>}
      {actionLabel && onAction && (
        <div className="mt-5 w-full max-w-[220px]">
          <Button onClick={onAction} variant={tone === 'danger' ? 'secondary' : 'primary'}>{actionLabel}</Button>
        </div>
      )}
    </div>
  )
}
