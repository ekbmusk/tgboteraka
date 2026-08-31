import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import WebApp from '@twa-dev/sdk'
import {
  BookOpen, Calculator, Brain, Trophy, BarChart2, HelpCircle, Flame, CheckCircle2,
  ChevronRight, Zap, Users, FlaskConical, MessageCircle, ArrowRight,
} from 'lucide-react'
import TopBar from '../components/TopBar'
import ProgressBar from '../components/ProgressBar'
import { progressAPI } from '../api/progress'
import { testsAPI } from '../api/tests'
import { useUserStore } from '../store/userStore'

const MENU = [
  { Icon: BookOpen, title: 'Теория', subtitle: 'Лекциялар мен формулалар', path: '/theory', accent: '#5EC8FF' },
  { Icon: Calculator, title: 'Есептер', subtitle: 'Деңгей бойынша шығару', path: '/problems', accent: '#FF7A5C' },
  { Icon: Brain, title: 'Тест', subtitle: '10 сұрақ, 20 секунд', path: '/test', accent: '#3DDC97' },
  { Icon: FlaskConical, title: 'Зертхана', subtitle: '15 виртуалды жұмыс', path: '/lab', accent: '#B39DFF' },
  { Icon: MessageCircle, title: 'AI репетитор', subtitle: 'Сұрақ қой — түсіндіреді', path: '/ask-ai', accent: '#5EC8FF' },
  { Icon: Trophy, title: 'Рейтинг', subtitle: 'Үздік оқушылар', path: '/rating', accent: '#FFB020' },
  { Icon: BarChart2, title: 'Прогресс', subtitle: 'Тақырып бойынша үлгерім', path: '/progress', accent: '#3DDC97' },
  { Icon: HelpCircle, title: 'Көмек', subtitle: 'Қолданба нұсқаулығы', path: '/help', accent: '#9AA0B4' },
]

const MOTIVATIONS = [
  'Бүгін жаңа нәрсе үйрен!',
  'Физика — табиғат тілі',
  'Формулалар — ойдың коды',
  'Жетістікке жол — тәжірибеден өтеді',
  'Ғарышты танып білу — физикадан басталады',
  'Бір есеп — бір қадам',
  'Сұрақ қоюдан қорықпа',
]

const WEEKDAYS = ['Жексенбі', 'Дүйсенбі', 'Сейсенбі', 'Сәрсенбі', 'Бейсенбі', 'Жұма', 'Сенбі']
// WebViews rarely ship kk-KZ locale data, so month names are ours
const MONTHS = ['қаңтар', 'ақпан', 'наурыз', 'сәуір', 'мамыр', 'маусым', 'шілде', 'тамыз', 'қыркүйек', 'қазан', 'қараша', 'желтоқсан']

const AUTHORS = [
  'Еділбаев Ержан Нұрланұлы',
  'Полатұлы Серік',
  'Сарыбаева Әлия Хожанқызы',
  'Жоранова Диёра Фархадқызы',
  'Курбанбеков Бакытжан Алимханович',
  'Тулеутаев Бекарыс Талгатович',
]

export default function Home() {
  const navigate = useNavigate()
  const { user } = useUserStore()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dailyStatus, setDailyStatus] = useState(null)
  const [showAuthors, setShowAuthors] = useState(false)

  const today = new Date()
  const motivation = MOTIVATIONS[today.getDay() % MOTIVATIONS.length]

  useEffect(() => {
    if (user?.id) {
      progressAPI.getUserProgress(user.id).then(setStats).catch(() => { }).finally(() => setLoading(false))
      testsAPI.getDailyStatus(user.id).then(setDailyStatus).catch(() => { })
    } else setLoading(false)
  }, [user?.id])

  const nav = (path) => { WebApp.HapticFeedback.impactOccurred('light'); navigate(path) }
  const lastTopic = stats?.topics?.find(t => t.percent > 0 && t.percent < 100)
  const streak = stats?.streak || 0

  return (
    <div className="min-h-screen page-enter">
      <TopBar />
      <div className="px-4 space-y-5 pt-3 pb-6">

        {/* Hero — the notebook's title page */}
        <section className="relative glass-hero glass-ambient overflow-hidden p-5">
          <div className="absolute inset-0 pointer-events-none select-none" aria-hidden>
            <span className="particle particle-1 absolute top-3 right-8 text-secondary/25 text-2xl font-mono">∑</span>
            <span className="particle particle-2 absolute top-12 right-20 text-primary/25 text-base font-mono">∫</span>
            <span className="particle particle-3 absolute bottom-6 right-6 text-secondary/20 text-3xl font-mono">∞</span>
            <span className="particle particle-1 absolute bottom-3 right-24 text-success/25 text-sm font-mono">Δ</span>
          </div>
          <div className="relative z-10">
            <p className="eyebrow mb-2">{WEEKDAYS[today.getDay()]} · {today.getDate()} {MONTHS[today.getMonth()]}</p>
            <h1 className="display text-[26px] leading-[1.15] text-text-1 mb-2">
              Сәлем,<br />{user?.first_name || 'Оқушы'}!
            </h1>
            <p className="text-sm text-text-2">{motivation}</p>

            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 border text-xs font-semibold ${streak > 0 ? 'bg-primary-dim border-primary/30 text-primary' : 'bg-surface-2 border-border text-text-2'}`}>
                <Flame size={13} strokeWidth={2} /> {streak} күн қатар
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 border bg-surface-2 border-border text-xs font-semibold text-text-2">
                <Zap size={13} strokeWidth={2} className="text-primary" /> {user?.score ?? 0} XP
              </span>
            </div>
          </div>
        </section>

        {/* Quick stats */}
        {loading ? (
          <div className="grid grid-cols-3 gap-2.5">
            {[0, 1, 2].map(i => <div key={i} className="skeleton h-[84px] rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2.5 stagger">
            {[
              { Icon: Brain, label: 'Тест', value: stats?.tests_taken || 0, color: 'text-success' },
              { Icon: CheckCircle2, label: 'Есеп', value: stats?.problems_solved || 0, color: 'text-secondary' },
              { Icon: BarChart2, label: 'Орташа', value: `${Math.round(stats?.avg_score || 0)}%`, color: 'text-primary' },
            ].map((s, i) => (
              <div key={i} className="card p-3 text-center">
                <s.Icon size={18} strokeWidth={1.6} className={`mx-auto mb-1.5 ${s.color}`} />
                <div className="display text-xl text-text-1 tnum">{s.value}</div>
                <div className="text-2xs text-text-2 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Daily challenge — the marker-highlighted card */}
        {dailyStatus && (
          <button
            type="button"
            onClick={() => !dailyStatus.completed && nav('/test?mode=daily')}
            className={`w-full rounded-2xl p-4 text-left transition-all ${dailyStatus.completed
              ? 'card border-success/30 cursor-default'
              : 'bg-primary text-primary-ink shadow-glow-primary pressable'}`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${dailyStatus.completed ? 'bg-success/10' : 'bg-primary-ink/10'}`}>
                {dailyStatus.completed
                  ? <CheckCircle2 size={22} strokeWidth={1.6} className="text-success" />
                  : <Flame size={22} strokeWidth={1.8} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-2xs font-semibold uppercase tracking-[0.14em] mb-0.5 ${dailyStatus.completed ? 'text-success' : 'text-primary-ink/70'}`}>Күнделікті сынақ</p>
                <p className={`text-sm font-bold ${dailyStatus.completed ? 'text-text-1' : ''}`}>
                  {dailyStatus.completed ? 'Бүгін орындалды!' : '10 сұрақ · бонус XP'}
                </p>
              </div>
              {!dailyStatus.completed && (
                <span className="inline-flex items-center gap-1 bg-primary-ink/10 rounded-full px-2.5 py-1 text-xs font-bold">
                  <Zap size={12} strokeWidth={2} /> +{dailyStatus.bonus_xp}
                </span>
              )}
            </div>
          </button>
        )}

        {/* Continue learning */}
        {lastTopic && (
          <button type="button" onClick={() => nav('/theory')} className="w-full card p-4 text-left pressable" style={{ borderLeft: '3px solid #5EC8FF' }}>
            <div className="flex items-center justify-between mb-2.5">
              <div className="min-w-0">
                <p className="eyebrow mb-0.5">Жалғастыру</p>
                <p className="text-sm font-bold text-text-1 truncate">{lastTopic.name}</p>
              </div>
              <ArrowRight size={18} strokeWidth={1.6} className="text-secondary flex-shrink-0" />
            </div>
            <ProgressBar value={lastTopic.percent} max={100} color="secondary" showLabel />
          </button>
        )}

        {/* Sections */}
        <section>
          <h2 className="eyebrow mb-3"><span className="marker text-text-1">Бөлімдер</span></h2>
          <div className="grid grid-cols-2 gap-2.5 stagger">
            {MENU.map(({ Icon, title, subtitle, path, accent }) => (
              <button
                key={path}
                type="button"
                onClick={() => nav(path)}
                className="card p-4 text-left pressable relative overflow-hidden"
              >
                <span className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r" style={{ background: accent }} />
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${accent}1C` }}>
                  <Icon size={20} strokeWidth={1.6} style={{ color: accent }} />
                </div>
                <div className="font-semibold text-text-1 text-sm leading-tight">{title}</div>
                <div className="text-2xs text-text-2 mt-1 leading-snug">{subtitle}</div>
                <ChevronRight size={14} strokeWidth={1.6} className="text-text-3 absolute right-3 top-4" />
              </button>
            ))}
          </div>
        </section>

        {/* Authors */}
        <button
          type="button"
          onClick={() => { WebApp.HapticFeedback.impactOccurred('light'); setShowAuthors(!showAuthors) }}
          className="w-full rounded-2xl px-4 py-3 pressable bg-surface-2 border border-border"
        >
          <div className="flex items-center justify-center gap-2">
            <Users size={14} className="text-text-3" />
            <span className="text-xs text-text-3">Авторлар</span>
          </div>
        </button>

        {showAuthors && (
          <div className="card p-4 animate-slide-up">
            <p className="eyebrow mb-3">Жобаны жасаған авторлар</p>
            <div className="space-y-2">
              {AUTHORS.map((name, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary-dim border border-primary/25 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0 tnum">
                    {i + 1}
                  </div>
                  <p className="text-sm text-text-1">{name}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
