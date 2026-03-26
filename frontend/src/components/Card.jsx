export default function Card({ children, className = '', onClick, accent }) {
  const accentStyle = accent ? { borderLeft: `3px solid ${accent}` } : {}
  const base = 'glass-card rounded-2xl overflow-hidden'
  if (onClick) {
    return (
      <button
        onClick={onClick}
        style={accentStyle}
        className={`${base} w-full text-left pressable glass-ripple ${className}`}
      >
        {children}
      </button>
    )
  }
  return (
    <div className={`${base} ${className}`} style={accentStyle}>
      {children}
    </div>
  )
}
