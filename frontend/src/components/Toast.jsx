import { create } from 'zustand'
import { AlertTriangle, CheckCircle2, Info, WifiOff } from 'lucide-react'

/**
 * Global toasts. Anywhere in the app: `toast.error('Желі қатесі')`.
 * The API client uses this to surface network failures the pages would otherwise swallow.
 */
export const useToastStore = create((set, get) => ({
  items: [],
  push: (message, type = 'info', ttl = 3200) => {
    const id = Date.now() + Math.random()
    // Collapse identical messages fired in a burst (e.g. three requests failing at once)
    if (get().items.some(t => t.message === message)) return
    set(s => ({ items: [...s.items, { id, message, type }] }))
    setTimeout(() => set(s => ({ items: s.items.filter(t => t.id !== id) })), ttl)
  },
  dismiss: (id) => set(s => ({ items: s.items.filter(t => t.id !== id) })),
}))

export const toast = {
  info: (m) => useToastStore.getState().push(m, 'info'),
  success: (m) => useToastStore.getState().push(m, 'success'),
  error: (m) => useToastStore.getState().push(m, 'error'),
  offline: (m) => useToastStore.getState().push(m, 'offline', 4000),
}

const STYLE = {
  info: { Icon: Info, cls: 'border-secondary/30 text-secondary' },
  success: { Icon: CheckCircle2, cls: 'border-success/30 text-success' },
  error: { Icon: AlertTriangle, cls: 'border-danger/30 text-danger' },
  offline: { Icon: WifiOff, cls: 'border-warning/30 text-warning' },
}

export default function ToastHost() {
  const { items, dismiss } = useToastStore()
  if (items.length === 0) return null
  return (
    <div
      className="fixed left-0 right-0 z-[10000] flex flex-col items-center gap-2 px-4 pointer-events-none"
      style={{ bottom: 'calc(92px + max(8px, env(safe-area-inset-bottom)))' }}
    >
      {items.map(t => {
        const { Icon, cls } = STYLE[t.type] || STYLE.info
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => dismiss(t.id)}
            className={`pointer-events-auto glass rounded-2xl px-4 py-3 flex items-center gap-2.5 max-w-sm w-full shadow-card animate-slide-up border ${cls}`}
          >
            <Icon size={16} strokeWidth={2} className="flex-shrink-0" />
            <span className="text-sm text-text-1 text-left leading-snug">{t.message}</span>
          </button>
        )
      })}
    </div>
  )
}
