import { Loader2 } from 'lucide-react'

/**
 * Primary = amber marker with ink text. Everything else is quiet paper.
 * `sky` is reserved for AI / formula actions.
 */
export default function Button({
  children, onClick, variant = 'primary', disabled = false, loading = false,
  className = '', size = 'md', icon, type = 'button',
}) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-2xl transition-all duration-150 active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none select-none'
  const sizes = {
    sm: 'py-2 px-4 text-xs',
    md: 'py-3.5 px-6 text-sm w-full',
    lg: 'py-4 px-8 text-base w-full',
  }
  const variants = {
    primary: 'bg-primary text-primary-ink shadow-glow-primary border border-primary/60',
    sky: 'bg-secondary text-[#04121C] shadow-glow-secondary border border-secondary/60',
    secondary: 'bg-surface-2 text-text-1 border border-border-strong',
    ghost: 'text-primary hover:bg-primary-dim',
    danger: 'bg-danger/10 text-danger border border-danger/30',
    success: 'bg-success/10 text-success border border-success/30',
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled || loading}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>
      {loading
        ? <Loader2 size={16} className="animate-spin" />
        : icon && <span className="inline-flex">{icon}</span>}
      {children}
    </button>
  )
}
