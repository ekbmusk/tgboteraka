import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import WebApp from '@twa-dev/sdk'
import {
  ChevronRight, Search, Users, Brain, Flame, Star, ChevronLeft,
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, XCircle,
  BarChart2, Activity, Clock, Calendar, MessageCircle, BookOpen, Target
} from 'lucide-react'
import TopBar from '../components/TopBar'
import Card from '../components/Card'
import { SkeletonCard } from '../components/SkeletonLoader'
import { useUserStore } from '../store/userStore'
import client from '../api/client'

// Admin access is determined by user.is_admin from backend
export const ADMIN_IDS = [876371171, 6433578212] // fallback only

const formatDate = (iso) => {
  if (!iso) return '-'
  const d = new Date(iso)
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }) +
    ' ' + d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

const formatShortDate = (iso) => {
  if (!iso) return '-'
  const d = new Date(iso)
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

const scoreColor = (pct) => pct >= 70 ? 'text-success' : pct >= 40 ? 'text-warning' : 'text-danger'
const scoreBg = (pct) => pct >= 70 ? 'bg-success' : pct >= 40 ? 'bg-warning' : 'bg-danger'

// ─── DASHBOARD ──────────────────────────────────────────────────────────────

function Dashboard({ onViewUsers }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    client.get('/users/admin/stats')
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="space-y-3 px-4">{[0,1,2].map(i => <SkeletonCard key={i} />)}</div>
  if (!stats) return <p className="text-center py-8 text-text-3">Статистика жүктелмеді</p>

  return (
    <div className="space-y-4">
      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-2">
        <Card className="p-3">
          <div className="flex items-center gap-2 mb-1">
            <Users size={14} className="text-primary" />
            <span className="text-[10px] text-text-3 uppercase">Пайдаланушылар</span>
          </div>
          <p className="text-2xl font-bold text-text-1">{stats.total_users}</p>
          <p className="text-[10px] text-text-3">Бүгін: {stats.active_today} | Апта: {stats.active_week}</p>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2 mb-1">
            <Brain size={14} className="text-success" />
            <span className="text-[10px] text-text-3 uppercase">Тесттер</span>
          </div>
          <p className="text-2xl font-bold text-text-1">{stats.total_tests_taken}</p>
          <p className="text-[10px] text-text-3">Орташа балл: {stats.avg_score}%</p>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen size={14} className="text-warning" />
            <span className="text-[10px] text-text-3 uppercase">Сұрақтар</span>
          </div>
          <p className="text-2xl font-bold text-text-1">{stats.total_questions}</p>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2 mb-1">
            <Target size={14} className="text-secondary" />
            <span className="text-[10px] text-text-3 uppercase">Есептер</span>
          </div>
          <p className="text-2xl font-bold text-text-1">{stats.total_problems}</p>
        </Card>
      </div>

      {/* Tests per day chart */}
      {stats.tests_per_day?.length > 0 && (
        <Card className="p-4">
          <p className="text-xs font-semibold text-text-2 mb-3 uppercase flex items-center gap-1.5">
            <Activity size={12} /> Аптадағы тесттер
          </p>
          <div className="flex items-end gap-1.5 h-20">
            {stats.tests_per_day.map((d, i) => {
              const max = Math.max(...stats.tests_per_day.map(x => x.count), 1)
              const h = Math.max(4, (d.count / max) * 100)
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] text-text-3">{d.count || ''}</span>
                  <div className="w-full rounded-t-md bg-primary/80" style={{ height: `${h}%` }} />
                  <span className="text-[9px] text-text-3">{d.date}</span>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Hardest questions */}
      {stats.hardest_questions?.length > 0 && (
        <Card className="p-4">
          <p className="text-xs font-semibold text-text-2 mb-3 uppercase flex items-center gap-1.5">
            <AlertTriangle size={12} /> Ең қиын сұрақтар
          </p>
          <div className="space-y-2">
            {stats.hardest_questions.map((q) => (
              <div key={q.id} className="flex items-start gap-2 text-xs">
                <span className={`font-bold mt-0.5 ${scoreColor(q.correct_rate)}`}>{q.correct_rate}%</span>
                <div className="flex-1 min-w-0">
                  <p className="text-text-1 truncate">{q.question}</p>
                  <p className="text-text-3">{q.topic} &middot; {q.attempts} әрекет</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <button onClick={onViewUsers} className="w-full card p-4 flex items-center gap-3 pressable">
        <Users size={20} className="text-primary" />
        <span className="text-sm font-semibold text-text-1 flex-1 text-left">Пайдаланушылар тізімі</span>
        <ChevronRight size={16} className="text-text-3" />
      </button>
    </div>
  )
}

// ─── USER DETAIL ────────────────────────────────────────────────────────────

const DETAIL_TABS = ['Жалпы', 'Тесттер', 'Тақырып дәлдігі', 'Прогресс', 'AI Чат']

function UserDetail({ userId, onBack }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState(0)
  const [expandedTest, setExpandedTest] = useState(null)

  useEffect(() => {
    setLoading(true)
    client.get(`/users/admin/${userId}/activity`)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [userId])

  if (loading) return (
    <div className="min-h-screen bg-bg page-enter">
      <TopBar showBack onBack={onBack} title="Мониторинг" />
      <div className="px-4 pt-4 space-y-3">{[0,1,2].map(i => <SkeletonCard key={i} />)}</div>
    </div>
  )

  if (!data) return (
    <div className="min-h-screen bg-bg page-enter">
      <TopBar showBack onBack={onBack} title="Мониторинг" />
      <div className="px-4 pt-8 text-center text-text-3 text-sm">Деректер табылмады</div>
    </div>
  )

  const { user, summary } = data

  return (
    <div className="min-h-screen bg-bg page-enter">
      <TopBar showBack onBack={onBack} title="Мониторинг" />
      <div className="px-4 pt-2 pb-6 space-y-4">
        {/* User header */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-lg font-bold text-primary">
              {(user.first_name || '?')[0]}
            </div>
            <div className="flex-1">
              <p className="font-bold text-text-1">
                {[user.first_name, user.last_name].filter(Boolean).join(' ') || 'Белгісіз'}
              </p>
              <p className="text-xs text-text-3">
                {user.username ? `@${user.username}` : ''} &middot; ID: {user.telegram_id}
              </p>
            </div>
            {user.is_banned && <span className="text-[10px] bg-danger/20 text-danger px-2 py-0.5 rounded-full font-semibold">BAN</span>}
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3 text-xs text-text-3">
            <span className="flex items-center gap-1"><Calendar size={10} /> Тіркелген: {formatShortDate(user.created_at)}</span>
            <span className="flex items-center gap-1"><Clock size={10} /> Соңғы: {formatShortDate(user.last_activity)}</span>
            <span className="flex items-center gap-1"><Activity size={10} /> {summary.days_active} күн бойы</span>
            <span className="flex items-center gap-1">{user.notifications_enabled ? '🔔' : '🔕'} Хабарлама</span>
          </div>
        </Card>

        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: Brain, value: summary.total_tests, label: 'Тест', color: 'text-primary' },
            { icon: Star, value: `${summary.avg_score}%`, label: 'Орташа', color: 'text-success' },
            { icon: Flame, value: user.streak, label: 'Streak', color: 'text-warning' },
            { icon: Target, value: summary.total_problems_solved, label: 'Есеп', color: 'text-secondary' },
          ].map((s, i) => (
            <div key={i} className="card p-2.5 text-center">
              <s.icon size={14} className={`mx-auto mb-0.5 ${s.color}`} />
              <p className="text-base font-bold text-text-1">{s.value}</p>
              <p className="text-[9px] text-text-3">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Best/worst score + AI questions */}
        <div className="grid grid-cols-3 gap-2">
          <div className="card p-2.5 text-center">
            <TrendingUp size={14} className="mx-auto mb-0.5 text-success" />
            <p className="text-sm font-bold text-success">{summary.best_score}%</p>
            <p className="text-[9px] text-text-3">Ең жоғары</p>
          </div>
          <div className="card p-2.5 text-center">
            <TrendingDown size={14} className="mx-auto mb-0.5 text-danger" />
            <p className="text-sm font-bold text-danger">{summary.worst_score}%</p>
            <p className="text-[9px] text-text-3">Ең төмен</p>
          </div>
          <div className="card p-2.5 text-center">
            <MessageCircle size={14} className="mx-auto mb-0.5 text-info" />
            <p className="text-sm font-bold text-text-1">{summary.ai_questions_asked}</p>
            <p className="text-[9px] text-text-3">AI сұрақ</p>
          </div>
        </div>

        {/* Score trend mini chart */}
        {data.score_trend?.length > 1 && (
          <Card className="p-3">
            <p className="text-[10px] font-semibold text-text-3 uppercase mb-2">Балл динамикасы</p>
            <div className="flex items-end gap-1 h-12">
              {data.score_trend.map((s, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div className={`w-full rounded-t-sm ${scoreBg(s.score)}`}
                    style={{ height: `${Math.max(4, s.score)}%`, opacity: 0.8 }} />
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[8px] text-text-3 mt-1">
              <span>{data.score_trend[0]?.date}</span>
              <span>{data.score_trend[data.score_trend.length - 1]?.date}</span>
            </div>
          </Card>
        )}

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {DETAIL_TABS.map((t, i) => (
            <button key={t} onClick={() => { setTab(i); WebApp.HapticFeedback.impactOccurred('light') }}
              className={`flex-shrink-0 px-3 py-2 rounded-xl text-[11px] font-semibold transition-all ${
                i === tab ? 'glass-btn text-white' : 'glass-input text-text-2'
              }`}>
              {t}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 0 && (
          <div className="space-y-3">
            <Card className="p-4">
              <p className="text-xs font-semibold text-text-2 mb-2 uppercase">Профиль</p>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-text-3">Деңгей</span><span className="font-medium">{user.level}</span></div>
                <div className="flex justify-between"><span className="text-text-3">Жалпы ұпай</span><span className="font-medium">{user.score}</span></div>
                <div className="flex justify-between"><span className="text-text-3">Тақырыптар</span><span className="font-medium">{summary.topics_started}</span></div>
              </div>
            </Card>
            {data.topic_progress.length > 0 && (
              <Card className="p-4">
                <p className="text-xs font-semibold text-text-2 mb-2 uppercase">Тақырыптар прогресі</p>
                <div className="space-y-2">
                  {data.topic_progress.map(tp => (
                    <div key={tp.topic_id}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-text-2 truncate max-w-[65%]">{tp.topic_name}</span>
                        <span className="font-semibold">{tp.completion_percent}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-surface-2 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{
                          width: `${tp.completion_percent}%`,
                          background: tp.completion_percent >= 70 ? '#43E97B' : tp.completion_percent >= 40 ? '#FFD93D' : '#6C63FF',
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {tab === 1 && (
          <div className="space-y-2">
            {data.test_history.length > 0 ? data.test_history.map((t) => (
              <div key={t.id}>
                <button
                  onClick={() => { setExpandedTest(expandedTest === t.id ? null : t.id); WebApp.HapticFeedback.impactOccurred('light') }}
                  className="w-full card p-3 flex items-center justify-between pressable"
                >
                  <div>
                    <p className="text-xs text-text-3">{formatDate(t.date)}</p>
                    <p className="text-sm text-text-2">{t.correct_answers}/{t.total_questions} дұрыс</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-bold ${scoreColor(t.percentage)}`}>{t.percentage}%</span>
                    {t.wrong_questions?.length > 0 && (
                      <ChevronRight size={14} className={`text-text-3 transition-transform ${expandedTest === t.id ? 'rotate-90' : ''}`} />
                    )}
                  </div>
                </button>
                {expandedTest === t.id && t.wrong_questions?.length > 0 && (
                  <div className="ml-3 mt-1 mb-2 space-y-1.5 animate-slide-up">
                    <p className="text-[10px] text-danger uppercase font-semibold flex items-center gap-1">
                      <XCircle size={10} /> Қате жауаптар:
                    </p>
                    {t.wrong_questions.map((wq, i) => (
                      <div key={i} className="bg-danger/5 border border-danger/10 rounded-xl px-3 py-2 text-xs">
                        <p className="text-text-1">{wq.question}</p>
                        <p className="text-text-3 mt-0.5">{wq.topic}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )) : (
              <p className="text-center py-8 text-text-3 text-sm">Тест тарихы жоқ</p>
            )}
          </div>
        )}

        {tab === 2 && (
          <div className="space-y-2">
            {data.topic_accuracy?.length > 0 ? data.topic_accuracy.map((ta) => (
              <Card key={ta.topic} className="p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-semibold text-text-1 truncate max-w-[60%]">{ta.topic}</p>
                  <span className={`text-sm font-bold ${scoreColor(ta.accuracy)}`}>{ta.accuracy}%</span>
                </div>
                <div className="w-full h-2 bg-surface-2 rounded-full overflow-hidden mb-1.5">
                  <div className={`h-full rounded-full ${scoreBg(ta.accuracy)}`} style={{ width: `${ta.accuracy}%`, opacity: 0.8 }} />
                </div>
                <div className="flex justify-between text-[10px] text-text-3">
                  <span className="flex items-center gap-1"><CheckCircle2 size={9} /> {ta.correct} дұрыс</span>
                  <span className="flex items-center gap-1"><XCircle size={9} /> {ta.total - ta.correct} қате</span>
                  <span>{ta.total} сұрақ</span>
                </div>
              </Card>
            )) : (
              <p className="text-center py-8 text-text-3 text-sm">Тақырып деректері жоқ</p>
            )}
          </div>
        )}

        {tab === 3 && (
          <div className="space-y-2">
            {data.topic_progress.length > 0 ? data.topic_progress.map(tp => (
              <Card key={tp.topic_id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-text-1 truncate max-w-[60%]">{tp.topic_name}</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    tp.completion_percent >= 70 ? 'bg-success/10 text-success' :
                    tp.completion_percent >= 40 ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary'
                  }`}>{tp.completion_percent}%</span>
                </div>
                <div className="w-full h-2 bg-surface-2 rounded-full overflow-hidden mb-2">
                  <div className="h-full rounded-full" style={{
                    width: `${tp.completion_percent}%`,
                    background: tp.completion_percent >= 70 ? '#43E97B' : tp.completion_percent >= 40 ? '#FFD93D' : '#6C63FF',
                  }} />
                </div>
                <p className="text-xs text-text-3">Есептер: {tp.problems_solved} &middot; {formatDate(tp.last_updated)}</p>
              </Card>
            )) : (
              <p className="text-center py-8 text-text-3 text-sm">Прогресс жоқ</p>
            )}
          </div>
        )}

        {tab === 4 && (
          <div className="space-y-2">
            {data.chat_history.length > 0 ? data.chat_history.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
                  msg.role === 'user'
                    ? 'bg-primary/20 text-text-1 rounded-tr-sm'
                    : 'bg-surface border border-border text-text-2 rounded-tl-sm'
                }`}>
                  <p className="whitespace-pre-wrap text-xs leading-relaxed">{msg.content}</p>
                  <p className="text-[9px] text-text-3 mt-1">{formatDate(msg.date)}</p>
                </div>
              </div>
            )) : (
              <p className="text-center py-8 text-text-3 text-sm">AI чат тарихы жоқ</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── USER LIST ───────────────────────────────────────────────────────────────

function UserList({ onSelect, onBack }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => { fetchUsers() }, [page, search])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = { page, page_size: 15 }
      if (search.trim()) params.q = search.trim()
      const data = await client.get('/users/admin/list', { params })
      setUsers(data.items || [])
      setTotal(data.total || 0)
    } catch { setUsers([]) }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-bg page-enter">
      <TopBar showBack onBack={onBack} title="Пайдаланушылар" />
      <div className="px-4 pt-2 pb-6">
        <p className="text-sm text-text-3 mb-3">{total} пайдаланушы</p>

        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Іздеу..."
            className="w-full glass-input rounded-xl pl-9 pr-4 py-2.5 text-sm text-text-1 placeholder-text-3 focus:outline-none focus:border-primary/50"
          />
        </div>

        {loading ? (
          <div className="space-y-2">{[0,1,2,3,4].map(i => <div key={i} className="skeleton h-16 rounded-2xl" />)}</div>
        ) : (
          <div className="space-y-2">
            {users.map(u => (
              <button
                key={u.id}
                onClick={() => { WebApp.HapticFeedback.impactOccurred('light'); onSelect(u.id) }}
                className="w-full card p-3.5 flex items-center gap-3 text-left pressable"
              >
                <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                  {(u.first_name || '?')[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-1 truncate">
                    {[u.first_name, u.last_name].filter(Boolean).join(' ') || 'Белгісіз'}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-text-3">
                    {u.username && <span>@{u.username}</span>}
                    <span>&middot; {u.score} ұпай</span>
                    {u.streak > 0 && <span>&middot; {u.streak} streak</span>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-text-3">{formatShortDate(u.last_activity)}</p>
                  <ChevronRight size={14} className="text-text-3 ml-auto" />
                </div>
              </button>
            ))}
            {users.length === 0 && (
              <p className="text-center py-12 text-text-3 text-sm">Пайдаланушы табылмады</p>
            )}
          </div>
        )}

        {total > 15 && (
          <div className="flex items-center justify-center gap-4 mt-4">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="text-sm text-primary disabled:text-text-3">
              <ChevronLeft size={20} />
            </button>
            <span className="text-sm text-text-2">{page} / {Math.ceil(total / 15)}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 15)} className="text-sm text-primary disabled:text-text-3">
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── MAIN ADMIN ─────────────────────────────────────────────────────────────

export default function Admin() {
  const navigate = useNavigate()
  const { user } = useUserStore()
  const [view, setView] = useState('dashboard') // dashboard | users | detail
  const [selectedUserId, setSelectedUserId] = useState(null)

  const isAdmin = user && (user.is_admin || ADMIN_IDS.includes(user.id))

  useEffect(() => {
    if (!isAdmin) navigate('/')
  }, [isAdmin])

  if (!isAdmin) return null

  if (view === 'detail' && selectedUserId) {
    return <UserDetail userId={selectedUserId} onBack={() => { setView('users'); setSelectedUserId(null) }} />
  }

  if (view === 'users') {
    return <UserList onSelect={(id) => { setSelectedUserId(id); setView('detail') }} onBack={() => setView('dashboard')} />
  }

  return (
    <div className="min-h-screen bg-bg page-enter">
      <TopBar title="Admin" />
      <div className="px-4 pt-2 pb-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 size={20} className="text-primary" />
          <h1 className="text-xl font-extrabold text-text-1">Панель</h1>
        </div>
        <Dashboard onViewUsers={() => setView('users')} />
      </div>
    </div>
  )
}
