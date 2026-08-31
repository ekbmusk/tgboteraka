import { useState, useEffect } from 'react'
import { ArrowLeft, Trophy, Bell, X, TrendingUp, Flame, Brain, Calculator, Lock, Star, Settings, BellOff, Zap, Target } from 'lucide-react'
import { useUserStore } from '../store/userStore'
import { progressAPI } from '../api/progress'
import { ratingAPI } from '../api/rating'
import { usersAPI } from '../api/users'
import ProgressBar from './ProgressBar'
import Avatar from './Avatar'
import { toast } from './Toast'

const LEVEL_LABELS = { easy: 'Бастауыш', medium: 'Орташа', hard: 'Жоғары' }

// Achievements are derived from real stats — nothing is pre-unlocked.
const ACHIEVEMENTS = [
  { id: 'first_test', Icon: Star, name: 'Алғашқы тест', test: s => (s?.tests_taken || 0) >= 1 },
  { id: 'streak_3', Icon: Flame, name: '3 күн жолақ', test: s => (s?.streak || 0) >= 3 },
  { id: 'streak_7', Icon: Flame, name: '7 күн жолақ', test: s => (s?.streak || 0) >= 7 },
  { id: 'perfect', Icon: Trophy, name: '100% тест', test: s => (s?.recent_tests || []).some(t => t.score >= 100) },
  { id: 'problems_10', Icon: Calculator, name: '10 есеп', test: s => (s?.problems_solved || 0) >= 10 },
  { id: 'all_topics', Icon: Target, name: 'Барлық тақырып', test: s => (s?.topics?.length || 0) > 0 && s.topics.every(t => t.percent > 0) },
]

const rankLabel = (rank) => {
  if (!rank) return '#—'
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return `#${rank}`
}

function ProfileSheet({ onClose, user }) {
  const { setUser } = useUserStore()
  const [stats, setStats] = useState(null)
  const [rank, setRank] = useState(null)
  const [notifEnabled, setNotifEnabled] = useState(user?.notifications_enabled ?? true)

  useEffect(() => {
    if (!user?.id) return
    progressAPI.getUserProgress(user.id).then(setStats).catch(() => { })
    ratingAPI.getMyRank(user.id).then(setRank).catch(() => { })
  }, [user?.id])

  const toggleNotifications = async () => {
    const next = !notifEnabled
    setNotifEnabled(next)
    try {
      await usersAPI.toggleNotifications(user.id, next)
      setUser({ ...user, notifications_enabled: next })
    } catch {
      setNotifEnabled(!next)
      toast.error('Баптау сақталмады')
    }
  }

  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Пайдаланушы'
  const unlocked = ACHIEVEMENTS.filter(a => a.test(stats)).length

  return (
    <div className="fixed inset-0 z-[9998] flex flex-col justify-end" style={{ background: 'rgba(5,7,12,0.78)' }} onClick={onClose}>
      <div className="bg-surface border-t border-border-strong rounded-t-3xl shadow-sheet animate-slide-up max-h-[92vh] overflow-y-auto no-scrollbar" onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-border-strong rounded-full" />
        </div>
        <div className="flex justify-end px-4">
          <button type="button" onClick={onClose} className="p-2 rounded-full bg-surface-2 border border-border pressable" aria-label="Жабу">
            <X size={16} strokeWidth={2} className="text-text-2" />
          </button>
        </div>

        <div className="px-5 pb-10">
          {/* Identity */}
          <div className="flex items-center gap-4 pb-5">
            <Avatar user={user} size="xl" className="shadow-glow-primary" priority />
            <div className="min-w-0">
              <h2 className="display text-base text-text-1 truncate">{fullName}</h2>
              {user?.username && <p className="text-sm text-text-2 mt-0.5 truncate">@{user.username}</p>}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-dim border border-primary/25 rounded-full text-primary text-2xs font-semibold">
                  <Trophy size={11} /> {rankLabel(rank?.rank)}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-surface-2 border border-border rounded-full text-text-2 text-2xs font-semibold">
                  <Zap size={11} className="text-primary" /> {user?.score ?? rank?.score ?? 0} XP
                </span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            {[
              { Icon: Calculator, label: 'Есеп', value: stats?.problems_solved || 0 },
              { Icon: Brain, label: 'Тест', value: stats?.tests_taken || 0 },
              { Icon: Flame, label: 'Жолақ', value: stats?.streak || 0 },
            ].map((s, i) => (
              <div key={i} className="bg-surface-2 rounded-2xl p-3 text-center border border-border">
                <s.Icon size={16} strokeWidth={1.6} className="text-primary mx-auto mb-1" />
                <div className="display text-lg text-text-1 tnum">{s.value}</div>
                <div className="text-2xs text-text-2">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Topic progress */}
          {stats?.topics?.some(t => t.percent > 0) && (
            <div className="mb-6">
              <h3 className="eyebrow mb-3 flex items-center gap-1.5">
                <TrendingUp size={13} strokeWidth={1.6} /> Тақырыптар
              </h3>
              <div className="space-y-3">
                {stats.topics.filter(t => t.percent > 0).slice(0, 4).map((t, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-text-1">{t.name}</span>
                      <span className="text-text-2 tnum">{Math.round(t.percent)}%</span>
                    </div>
                    <ProgressBar value={t.percent} max={100} color="primary" size="sm" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Achievements */}
          <div className="mb-6">
            <h3 className="eyebrow mb-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5"><Star size={13} strokeWidth={1.6} /> Жетістіктер</span>
              <span className="tnum normal-case tracking-normal">{unlocked} / {ACHIEVEMENTS.length}</span>
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {ACHIEVEMENTS.map((a) => {
                const on = a.test(stats)
                return (
                  <div key={a.id} className={`rounded-2xl p-3 text-center border transition-all ${on ? 'bg-primary-dim border-primary/30' : 'bg-surface-2 border-border opacity-50'}`}>
                    {on
                      ? <a.Icon size={22} strokeWidth={1.6} className="text-primary mx-auto mb-1" />
                      : <Lock size={22} strokeWidth={1.6} className="text-text-3 mx-auto mb-1" />}
                    <div className="text-[10px] text-text-2 leading-tight">{a.name}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Settings */}
          <div>
            <h3 className="eyebrow mb-3 flex items-center gap-1.5">
              <Settings size={13} strokeWidth={1.6} /> Баптаулар
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-surface-2 border border-border rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2.5">
                  {notifEnabled
                    ? <Bell size={16} strokeWidth={1.6} className="text-primary" />
                    : <BellOff size={16} strokeWidth={1.6} className="text-text-3" />}
                  <span className="text-sm text-text-1">Хабарландырулар</span>
                </div>
                <button type="button" onClick={toggleNotifications} aria-pressed={notifEnabled}
                  className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${notifEnabled ? 'bg-primary' : 'bg-surface-3 border border-border-strong'}`}>
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full shadow transition-transform ${notifEnabled ? 'translate-x-5 bg-primary-ink' : 'translate-x-0.5 bg-text-2'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between bg-surface-2 border border-border rounded-2xl px-4 py-3">
                <span className="text-sm text-text-1">Деңгей</span>
                <span className="text-xs font-semibold text-primary">{LEVEL_LABELS[user?.level] || LEVEL_LABELS.medium}</span>
              </div>
            </div>
          </div>

          <button type="button" onClick={onClose} className="btn-secondary mt-6">Жабу</button>
        </div>
      </div>
    </div>
  )
}

export default function TopBar({ title, showBack, onBack, right }) {
  const { user } = useUserStore()
  const [showProfile, setShowProfile] = useState(false)
  const [rank, setRank] = useState(null)

  useEffect(() => {
    if (user?.id) ratingAPI.getMyRank(user.id).then(setRank).catch(() => { })
  }, [user?.id])

  return (
    <>
      <header
        className="flex items-center justify-between gap-3 px-4 py-2.5 sticky top-0 z-40 glass"
        style={{ borderLeft: 'none', borderRight: 'none', borderTop: 'none' }}
      >
        {showBack ? (
          <button type="button" onClick={onBack} className="flex items-center gap-2 pressable min-w-0">
            <span className="w-9 h-9 rounded-full bg-surface-2 border border-border flex items-center justify-center flex-shrink-0">
              <ArrowLeft size={18} strokeWidth={1.8} className="text-text-1" />
            </span>
            {title && <span className="text-sm font-semibold text-text-1 truncate">{title}</span>}
          </button>
        ) : (
          <button type="button" onClick={() => setShowProfile(true)} className="flex items-center gap-2.5 pressable min-w-0">
            <Avatar user={user} size="md" priority />
            <div className="text-left min-w-0">
              <div className="eyebrow leading-none">Физика Боты</div>
              <div className="text-sm font-semibold text-text-1 leading-tight mt-0.5 truncate">{user?.first_name || 'Сәлем!'}</div>
            </div>
          </button>
        )}

        <div className="flex items-center gap-2 flex-shrink-0">
          {right}
          <button
            type="button"
            onClick={() => setShowProfile(true)}
            className="flex items-center gap-1.5 bg-primary-dim border border-primary/25 rounded-full px-3 py-1.5 pressable"
            aria-label="Рейтинг және профиль"
          >
            <Trophy size={13} strokeWidth={1.8} className="text-primary" />
            <span className="text-xs font-bold text-primary tnum">{rankLabel(rank?.rank)}</span>
          </button>
        </div>
      </header>
      {showProfile && <ProfileSheet onClose={() => setShowProfile(false)} user={user} />}
    </>
  )
}
