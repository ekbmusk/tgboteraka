import { useNavigate, useLocation } from 'react-router-dom'
import WebApp from '@twa-dev/sdk'
import { Home, BookOpen, Calculator, Brain, MessageCircle, Settings, FlaskConical } from 'lucide-react'

const BASE_TABS = [
  { path: '/', Icon: Home, label: 'Басты' },
  { path: '/theory', Icon: BookOpen, label: 'Теория' },
  { path: '/lab', Icon: FlaskConical, label: 'Зертхана' },
  { path: '/problems', Icon: Calculator, label: 'Есеп' },
  { path: '/test', Icon: Brain, label: 'Тест' },
  { path: '/ask-ai', Icon: MessageCircle, label: 'AI' },
]

const ADMIN_TAB = { path: '/admin', Icon: Settings, label: 'Admin' }

export default function BottomNav({ isAdmin }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const TABS = isAdmin ? [...BASE_TABS, ADMIN_TAB] : BASE_TABS

  const handleTab = (path) => {
    if (path === pathname) return
    WebApp.HapticFeedback.impactOccurred('light')
    navigate(path)
  }

  return (
    <nav
      className="glass"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
        borderTop: '1px solid rgba(244,241,234,0.08)',
        borderLeft: 'none',
        borderRight: 'none',
        borderBottom: 'none',
      }}
    >
      <div className="flex items-stretch justify-around px-1 pt-1.5">
        {TABS.map(({ path, Icon, label }) => {
          const active = pathname === path
          return (
            <button
              key={path}
              type="button"
              onClick={() => handleTab(path)}
              aria-current={active ? 'page' : undefined}
              className="tab-item flex-1 relative min-w-0"
            >
              <span
                className={`flex items-center justify-center w-11 h-7 rounded-full transition-all duration-200 ${active ? 'bg-primary-dim' : ''}`}
              >
                <Icon
                  size={20}
                  strokeWidth={active ? 2.2 : 1.6}
                  className={`transition-colors duration-200 ${active ? 'text-primary' : 'text-text-3'}`}
                />
              </span>
              <span className={`text-[10px] font-medium truncate max-w-full transition-colors duration-200 ${active ? 'text-text-1' : 'text-text-3'}`}>
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
