export default function Button({ children, onClick, variant = 'primary', disabled = false, className = '', size = 'md', icon }) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-2xl transition-all duration-150 active:scale-95 disabled:opacity-40 disabled:pointer-events-none'
  const sizes = {
    sm: 'py-2 px-4 text-xs',
    md: 'py-3.5 px-6 text-sm w-full',
    lg: 'py-4 px-8 text-base w-full',
  }
  const variants = {
    primary: 'glass-btn text-white shadow-glow-primary bg-primary/80',
    secondary: 'glass-input text-text-1',
    ghost: 'text-primary hover:bg-primary-dim',
    danger: 'glass-input text-danger !border-danger/30',
    success: 'glass-input text-success !border-success/30',
  }
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>
      {icon && <span className="text-base">{icon}</span>}
      {children}
    </button>
  )
}
