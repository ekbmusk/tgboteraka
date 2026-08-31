/**
 * Paper card. `accent` paints a 3px marker stripe on the left edge.
 */
export default function Card({ children, className = '', onClick, accent, style }) {
  const accentStyle = accent ? { borderLeft: `3px solid ${accent}`, ...style } : style
  const base = 'card rounded-2xl overflow-hidden'
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        style={accentStyle}
        className={`${base} w-full text-left pressable ${className}`}
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
