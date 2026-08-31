import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import WebApp from '@twa-dev/sdk'
import confetti from 'canvas-confetti'
import { Trophy, RotateCcw, Home, ChevronRight, Lightbulb, Shuffle, Zap, Check, X, RefreshCw, Brain } from 'lucide-react'
import TopBar from '../components/TopBar'
import ProgressBar from '../components/ProgressBar'
import Button from '../components/Button'
import EmptyState from '../components/EmptyState'
import { SkeletonCard } from '../components/SkeletonLoader'
import FormulaRenderer from '../components/FormulaRenderer'
import XPAnimation from '../components/XPAnimation'
import { testsAPI } from '../api/tests'
import { useUserStore } from '../store/userStore'

const TIMER = 20
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

const TOPIC_ICONS = {
  'Кинематика негіздері': '📐',
  'Жылдамдық және үдеу': '🏎️',
  'Ньютон заңдары (1)': '⚙️',
  'Ньютон заңдары (2)': '⚙️',
  'Жұмыс, энергия, қуат': '⚡',
  'Сақталу заңдары': '🔄',
  'Айналмалы қозғалыс': '🌀',
  'Импульс моменті': '💫',
  'Бүкіл әлемдік тартылыс': '🌍',
  'Салыстырмалылық теориясы': '🚀',
  'Қысым және гидростатика': '💧',
  'Бернулли теңдеуі': '🌊',
  'Сұйықтық динамикасы': '🔬',
  'Тербелістер': '〰️',
  'Акустика': '🔊',
  'Жалпы физика': '⚛️',
}

function TimerCircle({ seconds }) {
  const r = 22, c = 2 * Math.PI * r
  const color = seconds <= 5 ? '#FF5C5C' : seconds <= 10 ? '#FFB020' : '#3DDC97'
  return (
    <div className="relative w-14 h-14 flex-shrink-0" aria-label={`${seconds} секунд`}>
      <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={r} fill="none" stroke="#212739" strokeWidth="4" />
        <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${c * (seconds / TIMER)} ${c}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s linear, stroke 0.3s' }} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center display text-sm tnum" style={{ color }}>{seconds}</span>
    </div>
  )
}

function ReviewItem({ item, index }) {
  const { q, sel } = item
  const timedOut = sel === -1
  return (
    <div className="card p-4">
      <div className="flex items-start gap-3 mb-3">
        <span className="w-7 h-7 rounded-full bg-danger/10 border border-danger/30 text-danger flex items-center justify-center text-xs font-bold flex-shrink-0 tnum">{index + 1}</span>
        <div className="text-sm text-text-1 leading-relaxed min-w-0"><FormulaRenderer text={q.question} /></div>
      </div>
      <div className="space-y-1.5 text-sm">
        <div className="flex items-start gap-2 rounded-xl px-3 py-2 bg-danger/[0.07] border border-danger/20">
          <X size={14} className="text-danger flex-shrink-0 mt-0.5" />
          <span className="text-text-2 min-w-0">
            <span className="text-2xs uppercase tracking-wider text-danger/80 block mb-0.5">Сенің жауабың</span>
            {timedOut ? <span className="italic">Уақыт бітті</span> : <FormulaRenderer text={q.options[sel]} />}
          </span>
        </div>
        <div className="flex items-start gap-2 rounded-xl px-3 py-2 bg-success/[0.07] border border-success/20">
          <Check size={14} className="text-success flex-shrink-0 mt-0.5" />
          <span className="text-text-1 min-w-0">
            <span className="text-2xs uppercase tracking-wider text-success/80 block mb-0.5">Дұрыс жауап</span>
            <FormulaRenderer text={q.options[q.correct_answer]} />
          </span>
        </div>
        {q.explanation && (
          <div className="flex items-start gap-2 px-3 pt-2 text-text-2">
            <Lightbulb size={14} className="text-primary flex-shrink-0 mt-0.5" />
            <div className="min-w-0 [&_span]:text-text-2"><FormulaRenderer text={q.explanation} /></div>
          </div>
        )}
      </div>
    </div>
  )
}

function ResultScreen({ score, total, pct, xpEarned, bonusXp, isDaily, wrong, onRetry, onHome }) {
  const passed = pct >= 70
  const [showXP, setShowXP] = useState(xpEarned > 0)

  useEffect(() => {
    if (passed) confetti({ particleCount: 120, spread: 80, origin: { y: 0.4 }, colors: ['#FFB020', '#3DDC97', '#5EC8FF', '#F4F1EA'] })
  }, [passed])

  const r = 60, circ = 2 * Math.PI * r
  return (
    <div className="min-h-screen page-enter">
      {showXP && <XPAnimation xp={xpEarned} bonusXp={bonusXp} onDone={() => setShowXP(false)} />}
      <TopBar showBack onBack={onHome} title="Нәтиже" />
      <div className="px-4 pt-6 pb-8">
        <div className="flex flex-col items-center text-center">
          <div className="relative w-40 h-40 mb-5">
            <svg className="w-40 h-40 -rotate-90" viewBox="0 0 144 144">
              <circle cx="72" cy="72" r={r} fill="none" stroke="#212739" strokeWidth="8" />
              <circle cx="72" cy="72" r={r} fill="none" stroke={passed ? '#3DDC97' : '#FFB020'} strokeWidth="8"
                strokeDasharray={`${circ * (pct / 100)} ${circ}`} strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 1.5s cubic-bezier(0.34,1.56,0.64,1)' }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`display text-4xl tnum ${passed ? 'text-success' : 'text-primary'}`}>{pct}%</span>
              <span className="text-2xs text-text-2 mt-1 tnum">{score} / {total}</span>
            </div>
          </div>
          <h2 className="display text-2xl text-text-1 mb-1">{passed ? 'Керемет!' : 'Жақсы бастама'}</h2>
          <p className="text-sm text-text-2 mb-4">
            {passed ? 'Тақырыпты жақсы меңгергенсің.' : wrong.length ? 'Төменде қателерді қарап шық — келесіде оңай болады.' : 'Келесіде уақытқа назар аудар.'}
          </p>
          {(xpEarned > 0 || bonusXp > 0) && (
            <div className="flex items-center gap-2 mb-6">
              {xpEarned > 0 && (
                <span className="inline-flex items-center gap-1.5 bg-primary-dim border border-primary/25 rounded-full px-3 py-1.5 text-xs font-bold text-primary tnum">
                  <Zap size={13} strokeWidth={2} /> +{xpEarned} XP
                </span>
              )}
              {bonusXp > 0 && (
                <span className="inline-flex items-center gap-1.5 bg-success/10 border border-success/25 rounded-full px-3 py-1.5 text-xs font-bold text-success tnum">
                  +{bonusXp} бонус 🔥
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3 mb-8">
          {!isDaily && <Button variant="secondary" onClick={onRetry} icon={<RotateCcw size={16} />}>Қайтару</Button>}
          <Button onClick={onHome} icon={<Home size={16} />}>{isDaily ? 'Басты бет' : 'Тақырыптар'}</Button>
        </div>

        {wrong.length > 0 && (
          <section>
            <h3 className="eyebrow mb-3 flex items-center justify-between">
              <span><span className="marker text-text-1">Қателерді талдау</span></span>
              <span className="tnum normal-case tracking-normal">{wrong.length} сұрақ</span>
            </h3>
            <div className="space-y-3 stagger">
              {wrong.map((item, i) => <ReviewItem key={item.q.id ?? i} item={item} index={i} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function TopicSelect({ topics, loading, error, onRetry, onSelect }) {
  const total = topics.reduce((s, t) => s + t.count, 0)
  return (
    <div className="min-h-screen page-enter">
      <TopBar />
      <div className="px-4 pt-3 pb-6">
        <h1 className="display text-2xl text-text-1 mb-1">Тест</h1>
        <p className="text-sm text-text-2 mb-4">10 сұрақ · әр сұраққа 20 секунд</p>

        {loading ? (
          <div className="space-y-3">{[0, 1, 2, 3].map(i => <div key={i} className="skeleton h-[68px] rounded-2xl" />)}</div>
        ) : error ? (
          <EmptyState Icon={RefreshCw} tone="danger" title={error} actionLabel="Қайталау" onAction={onRetry} />
        ) : (
          <>
            <button type="button" onClick={() => onSelect(null)}
              className="w-full flex items-center gap-4 bg-primary text-primary-ink rounded-2xl px-4 py-4 mb-5 pressable shadow-glow-primary">
              <div className="w-11 h-11 rounded-xl bg-primary-ink/10 flex items-center justify-center flex-shrink-0">
                <Shuffle size={20} strokeWidth={2} />
              </div>
              <div className="text-left flex-1">
                <p className="text-sm font-bold">Аралас тест</p>
                <p className="text-xs opacity-70">Барлық тақырыптардан кездейсоқ · {total} сұрақ</p>
              </div>
              <ChevronRight size={18} className="opacity-70" />
            </button>

            <div className="flex items-center justify-between mb-2.5">
              <h3 className="eyebrow">Тақырып бойынша</h3>
              <span className="text-2xs text-text-3 tnum">{topics.length} тақырып</span>
            </div>
            <div className="space-y-2 stagger">
              {topics.map(topic => (
                <button key={topic.id} type="button" onClick={() => onSelect(topic.id)}
                  className="w-full flex items-center gap-3 card rounded-2xl px-4 py-3.5 pressable">
                  <span className="text-lg w-9 h-9 rounded-xl bg-surface-2 border border-border flex items-center justify-center flex-shrink-0">
                    {TOPIC_ICONS[topic.id] || '📝'}
                  </span>
                  <div className="text-left flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-1 truncate">{topic.name}</p>
                    <p className="text-2xs text-text-3 tnum">{topic.count} сұрақ</p>
                  </div>
                  <ChevronRight size={16} className="text-text-3 flex-shrink-0" />
                </button>
              ))}
            </div>
            {topics.length === 0 && <EmptyState Icon={Brain} title="Тест сұрақтары әлі жоқ" />}
          </>
        )}
      </div>
    </div>
  )
}

export default function Test() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isDaily = searchParams.get('mode') === 'daily'
  const { user, setUser } = useUserStore()

  const [topics, setTopics] = useState([])
  const [topicsLoading, setTopicsLoading] = useState(true)
  const [topicsError, setTopicsError] = useState(null)
  const [selectedTopic, setSelectedTopic] = useState(isDaily ? null : undefined)

  const [qs, setQs] = useState([])
  const [cur, setCur] = useState(0)
  const [sel, setSel] = useState(null)
  const [answers, setAnswers] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const [done, setDone] = useState(false)
  const [score, setScore] = useState(null)
  const [timer, setTimer] = useState(TIMER)
  const [submitting, setSubmitting] = useState(false)
  const timerRef = useRef(null)

  const fetchTopics = () => {
    setTopicsLoading(true); setTopicsError(null)
    testsAPI.getTopics()
      .then(setTopics)
      .catch(() => setTopicsError('Тесттер жүктелмеді'))
      .finally(() => setTopicsLoading(false))
  }
  useEffect(fetchTopics, [])

  const load = useCallback(async (topic) => {
    setLoading(true); setCur(0); setAnswers([]); setSel(null); setDone(false); setScore(null); setTimer(TIMER); setLoadError(null)
    try {
      const d = isDaily
        ? await testsAPI.getDailyTest()
        : await testsAPI.getTest(topic ? { topic, count: 10 } : { count: 10 })
      setQs(d.questions)
    } catch { setLoadError('Сұрақтар жүктелмеді') }
    finally { setLoading(false) }
  }, [isDaily])

  useEffect(() => { if (isDaily) load(null) }, [isDaily])

  const handleTopicSelect = (topicId) => { setSelectedTopic(topicId); load(topicId) }
  const handleRetry = () => load(selectedTopic)
  const handleBackToTopics = () => {
    if (isDaily) { navigate('/'); return }
    setSelectedTopic(undefined); setDone(false); setScore(null)
  }

  useEffect(() => {
    if (loading || done || sel !== null || selectedTopic === undefined) return
    timerRef.current = setInterval(() => {
      setTimer(t => {
        if (t <= 1) { clearInterval(timerRef.current); setSel(-1); WebApp.HapticFeedback.notificationOccurred('warning'); return TIMER }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [cur, loading, done, sel, selectedTopic])

  const handleAnswer = (i) => {
    if (sel !== null) return
    clearInterval(timerRef.current); setSel(i)
    WebApp.HapticFeedback.notificationOccurred(i === qs[cur].correct_answer ? 'success' : 'error')
  }

  const handleNext = async () => {
    if (submitting) return
    const newAns = [...answers, { question_id: qs[cur].id, answer: sel ?? -1, q: qs[cur], sel: sel ?? -1 }]
    setAnswers(newAns)
    if (cur + 1 < qs.length) { setCur(c => c + 1); setSel(null); setTimer(TIMER) }
    else {
      setSubmitting(true)
      try {
        const r = await testsAPI.submitTest({ telegram_id: user?.id, answers: newAns.map(({ question_id, answer }) => ({ question_id, answer })), is_daily: isDaily })
        setScore(r); WebApp.HapticFeedback.notificationOccurred(r.percentage >= 70 ? 'success' : 'warning')
        if (user && (r.xp_earned || r.bonus_xp)) {
          setUser({ ...user, score: (user.score || 0) + (r.xp_earned || 0) + (r.bonus_xp || 0) })
        }
      } catch {
        // Server unreachable — still show the local result so the effort isn't lost
        const correct = newAns.filter(a => a.sel === a.q.correct_answer).length
        setScore({ correct, total: qs.length, percentage: Math.round((correct / qs.length) * 100), xp_earned: 0, bonus_xp: 0 })
      }
      setDone(true)
    }
  }

  if (selectedTopic === undefined) {
    return <TopicSelect topics={topics} loading={topicsLoading} error={topicsError} onRetry={fetchTopics} onSelect={handleTopicSelect} />
  }

  if (loading) return (
    <div className="min-h-screen page-enter">
      <TopBar />
      <div className="px-4 pt-3 space-y-4">
        <SkeletonCard lines={2} />
        {[0, 1, 2, 3].map(i => <div key={i} className="skeleton h-14 rounded-2xl" />)}
      </div>
    </div>
  )

  if (done && score) {
    const wrong = answers.filter(a => a.sel !== a.q.correct_answer)
    return (
      <ResultScreen
        score={score.correct} total={score.total} pct={Math.round(score.percentage)}
        xpEarned={score.xp_earned || 0} bonusXp={score.bonus_xp || 0}
        isDaily={isDaily} wrong={wrong} onRetry={handleRetry} onHome={handleBackToTopics}
      />
    )
  }

  const q = qs[cur]
  if (loadError || !q) return (
    <div className="min-h-screen page-enter">
      <TopBar showBack onBack={handleBackToTopics} title="Тест" />
      <EmptyState Icon={RefreshCw} tone="danger" title={loadError || 'Сұрақтар жүктелмеді'} description="Қайтадан көріңіз." actionLabel="Қайталау" onAction={() => load(selectedTopic)} className="pt-16" />
    </div>
  )

  const topicName = isDaily ? 'Күнделікті сынақ' : selectedTopic ? (topics.find(t => t.id === selectedTopic)?.name ?? selectedTopic) : 'Аралас тест'
  const answered = sel !== null

  return (
    <div className="min-h-screen flex flex-col page-enter">
      <TopBar showBack onBack={handleBackToTopics} title={topicName} />
      <div className="flex-1 px-4 pt-3 pb-6 flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1">
            <div className="flex items-baseline justify-between mb-1.5">
              <p className="eyebrow">Сұрақ</p>
              <p className="text-xs text-text-2 tnum"><span className="text-text-1 font-semibold">{cur + 1}</span> / {qs.length}</p>
            </div>
            <ProgressBar value={cur + 1} max={qs.length} color="primary" size="lg" />
          </div>
          <TimerCircle seconds={timer} />
        </div>

        <div className="glass-hero p-5 mb-4 flex-shrink-0 animate-slide-up" key={cur}>
          <div className="text-[15px] text-text-1 leading-relaxed [&_span]:text-[15px]"><FormulaRenderer text={q.question} /></div>
        </div>

        <div className="space-y-2.5 flex-1">
          {q.options.map((opt, i) => {
            const isCorrect = i === q.correct_answer
            const isMine = i === sel
            let cls = 'border-border bg-surface text-text-1'
            let badge = 'bg-surface-2 text-text-2 border border-border'
            if (answered) {
              if (isCorrect) { cls = 'border-success bg-success/10 text-text-1'; badge = 'bg-success text-primary-ink border border-success' }
              else if (isMine) { cls = 'border-danger bg-danger/10 text-text-1'; badge = 'bg-danger text-white border border-danger' }
              else { cls = 'border-border bg-surface text-text-3 opacity-55'; badge = 'bg-surface-2 text-text-3 border border-border' }
            }
            return (
              <button key={i} type="button" onClick={() => handleAnswer(i)} disabled={answered}
                className={`w-full text-left px-4 py-3.5 rounded-2xl border transition-all duration-200 text-sm font-medium flex items-center gap-3 ${cls} ${!answered ? 'pressable' : ''}`}>
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${badge}`}>
                  {answered && isCorrect ? <Check size={14} strokeWidth={3} /> : answered && isMine ? <X size={14} strokeWidth={3} /> : LETTERS[i]}
                </span>
                <span className="min-w-0 flex-1"><FormulaRenderer text={opt} /></span>
              </button>
            )
          })}
        </div>

        {answered && (
          <div className="mt-4 animate-slide-up">
            {q.explanation && (
              <div className="card rounded-2xl p-3.5 mb-3 flex gap-2.5">
                <Lightbulb size={16} strokeWidth={1.6} className="text-primary flex-shrink-0 mt-0.5" />
                <div className="text-sm text-text-2 [&_span]:text-text-2"><FormulaRenderer text={q.explanation} /></div>
              </div>
            )}
            <Button onClick={handleNext} loading={submitting} icon={<ChevronRight size={16} />}>
              {cur + 1 < qs.length ? 'Келесі' : 'Аяқтау'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
