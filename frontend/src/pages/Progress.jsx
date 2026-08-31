import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import WebApp from '@twa-dev/sdk'
import { Brain, Calculator, TrendingUp, Flame, BarChart2, RefreshCw, Rocket, History } from 'lucide-react'
import TopBar from '../components/TopBar'
import ProgressBar from '../components/ProgressBar'
import EmptyState from '../components/EmptyState'
import { SkeletonCard } from '../components/SkeletonLoader'
import { progressAPI } from '../api/progress'
import { useUserStore } from '../store/userStore'

const barColor = (p) => (p >= 70 ? 'success' : p >= 40 ? 'primary' : 'secondary')

export default function Progress() {
  const navigate = useNavigate()
  const { user } = useUserStore()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchProgress = () => {
    if (!user?.id) { setLoading(false); return }
    setLoading(true); setError(null)
    progressAPI.getUserProgress(user.id)
      .then(setStats)
      .catch(() => setError('Деректер жүктелмеді'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    WebApp.BackButton.show()
    WebApp.BackButton.onClick(() => navigate('/'))
    fetchProgress()
    return () => WebApp.BackButton.hide()
  }, [user?.id])

  const empty = stats && !stats.tests_taken && !stats.problems_solved && !stats.streak
  const started = (stats?.topics || []).filter(t => t.percent > 0).sort((a, b) => b.percent - a.percent)
  const untouched = (stats?.topics || []).filter(t => !(t.percent > 0))

  return (
    <div className="min-h-screen page-enter">
      <TopBar showBack onBack={() => navigate('/')} title="Прогресс" />
      <div className="px-4 pt-3 pb-6 space-y-5">
        <div>
          <h1 className="display text-2xl text-text-1 mb-1">Прогресс</h1>
          <p className="text-sm text-text-2">Жалпы үлгерімің</p>
        </div>

        {error ? (
          <EmptyState Icon={RefreshCw} tone="danger" title={error} actionLabel="Қайталау" onAction={fetchProgress} />
        ) : loading ? (
          <div className="space-y-3">{[0, 1, 2].map(i => <SkeletonCard key={i} />)}</div>
        ) : !user?.id ? (
          <EmptyState Icon={BarChart2} title="Telegram арқылы кіріңіз" description="Прогресс Telegram аккаунтыңызға байланады." />
        ) : empty ? (
          <EmptyState
            Icon={Rocket} tone="primary"
            title="Әлі бастамадың"
            description="Бір тест тапсыр — мұнда тақырыптар бойынша үлгерімің, жолағың және нәтижелерің пайда болады."
            actionLabel="Тест тапсыру" onAction={() => navigate('/test')}
          />
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2.5 stagger">
              {[
                { Icon: Brain, label: 'Тест', value: stats?.tests_taken || 0, color: 'text-success' },
                { Icon: TrendingUp, label: 'Орташа', value: `${Math.round(stats?.avg_score || 0)}%`, color: 'text-primary' },
                { Icon: Calculator, label: 'Есеп', value: stats?.problems_solved || 0, color: 'text-secondary' },
              ].map((s, i) => (
                <div key={i} className="card p-3.5 text-center">
                  <s.Icon size={18} strokeWidth={1.6} className={`mx-auto mb-1.5 ${s.color}`} />
                  <div className="display text-xl text-text-1 tnum">{s.value}</div>
                  <div className="text-2xs text-text-2 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            <div className={`rounded-2xl p-4 flex items-center gap-4 ${stats?.streak > 0 ? 'bg-primary text-primary-ink shadow-glow-primary' : 'card'}`}>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${stats?.streak > 0 ? 'bg-primary-ink/10' : 'bg-surface-2 border border-border'}`}>
                <Flame size={28} strokeWidth={1.6} className={stats?.streak > 0 ? '' : 'text-text-3'} />
              </div>
              <div>
                <div className="display text-2xl tnum">{stats?.streak || 0} күн</div>
                <div className={`text-sm ${stats?.streak > 0 ? 'text-primary-ink/70' : 'text-text-2'}`}>
                  {stats?.streak > 0 ? 'Үзіліссіз оқу жолағы — жалғастыр!' : 'Бүгін тест тапсырып жолақ баста'}
                </div>
              </div>
            </div>

            {(started.length > 0 || untouched.length > 0) && (
              <section>
                <h2 className="eyebrow mb-3 flex items-center gap-1.5"><BarChart2 size={13} /> Тақырыптар</h2>
                <div className="card p-4 space-y-3.5">
                  {started.map((t, i) => (
                    <div key={`s${i}`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-text-1">{t.icon ? `${t.icon} ` : ''}{t.name}</span>
                        <span className="text-xs text-text-2 font-semibold tnum">{Math.round(t.percent)}%</span>
                      </div>
                      <ProgressBar value={t.percent} max={100} color={barColor(t.percent)} />
                    </div>
                  ))}
                  {untouched.length > 0 && (
                    <div className={started.length ? 'pt-2 border-t border-border' : ''}>
                      <p className="text-2xs text-text-3 mb-2">Әлі бастамаған тақырыптар</p>
                      <div className="flex flex-wrap gap-1.5">
                        {untouched.map((t, i) => (
                          <span key={`u${i}`} className="text-xs text-text-2 bg-surface-2 border border-border rounded-full px-2.5 py-1">{t.name}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {stats?.recent_tests?.length > 0 && (
              <section>
                <h2 className="eyebrow mb-3 flex items-center gap-1.5"><History size={13} /> Соңғы тесттер</h2>
                <div className="card divide-y divide-border">
                  {stats.recent_tests.map((t, i) => (
                    <div key={i} className="px-4 py-3 flex items-center justify-between">
                      <span className="text-sm text-text-2 tnum">{t.date}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-24"><ProgressBar value={t.score} max={100} color={barColor(t.score)} size="sm" /></div>
                        <span className={`text-sm font-bold tnum w-11 text-right ${t.score >= 70 ? 'text-success' : 'text-text-1'}`}>{Math.round(t.score)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}
