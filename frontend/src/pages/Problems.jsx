import { useState, useEffect } from 'react'
import WebApp from '@twa-dev/sdk'
import { CheckCircle2, XCircle, ChevronRight, Delete, Target, Bot, Lightbulb, RefreshCw, Sparkles } from 'lucide-react'
import TopBar from '../components/TopBar'
import Card from '../components/Card'
import Button from '../components/Button'
import FormulaRenderer from '../components/FormulaRenderer'
import EmptyState from '../components/EmptyState'
import { SkeletonCard } from '../components/SkeletonLoader'
import { problemsAPI } from '../api/problems'
import { aiAPI } from '../api/ai'
import { useUserStore } from '../store/userStore'

const TOPIC_ICONS = {
  'Төменде сұраған тақырыптарыңыз бойынша (модель, санақ жүйесі, траектория, жол, о': '📐',
  'Жылдамдық, үдеу және оның құраушылары. Бұрыштық жылдамдық. Бұрыштық үдеу': '🏎️',
  'Импульс сақталу заңы. Масса центрі. Айнымалы массалы дене қозғалысы': '💥',
  'Энергия, жұмыс, қуат. Кинетикалық және потенциалдық энергия': '⚡',
  'Сақталу заңы. Серпімді және серпімсіз соқтығысулар': '🔄',
  'Инерция моменті. Айналмалы қозғалыстың кинетикалық энергиясы. Күш моменті. Айналмалы қозғалыс теңдеуі': '🌀',
  'Импульс моменті және оның сақталу заңы. Гироскоп. Қатты дене деформациясы': '💫',
  'Бүкіл әлемдік тартылыс заңы. Кеплер заңдары': '🌍',
  'Газдардағы және сұйықтықтардағы қысым. Үздіксіздік теңдеу. Архимед және Паскаль заңдары': '💧',
  'Бернулли теңдеуі және оның салдарлары': '🌊',
  'Сұйықтықтардың ламинар және турбуленттік ағындары. Тұтқырлық': '🔬',
  'Акустикалық толқындар': '🔊',
  'Механика': '⚙️',
  'Электромагнетизм': '⚡',
  'Термодинамика': '🌡️',
}

const LEVELS = [
  { id: 'easy', label: 'Жеңіл', color: '#3DDC97' },
  { id: 'medium', label: 'Орташа', color: '#FFB020' },
  { id: 'hard', label: 'Күрделі', color: '#FF5C5C' },
]
const NUMPAD = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '.', '0', '⌫']

/** Topic names from the syllabus are long — show the first sentence as the title and the rest as a hint. */
function splitTopic(name) {
  const parts = (name || '').split(/\.\s+/)
  return { head: parts[0].replace(/\.$/, ''), tail: parts.slice(1).join('. ') }
}

function ResultCard({ result, onNext, isAI }) {
  const Icon = result.correct ? CheckCircle2 : XCircle
  return (
    <div className={`card p-5 animate-scale-in ${result.correct ? 'border-success/40' : 'border-danger/40'}`}>
      <div className="text-center mb-4">
        <Icon size={48} strokeWidth={1.5} className={`mx-auto mb-2 ${result.correct ? 'text-success' : 'text-danger'}`} />
        <h3 className="display text-lg text-text-1">{result.correct ? 'Дұрыс!' : 'Қате'}</h3>
        <p className="text-sm text-text-2 mt-1">{result.message}</p>
      </div>
      {result.solution && (
        <div className="bg-surface-2 rounded-2xl p-3.5 mb-4 border border-border">
          <p className="eyebrow text-secondary mb-2 flex items-center gap-1.5">
            {isAI ? <><Bot size={12} /> AI шешімі</> : 'Шешімі'}
          </p>
          <div className="text-sm text-text-2 leading-relaxed">
            {/* The AI answer starts with a "НӘТИЖЕ: ..." verdict line; the card header already shows it */}
            <FormulaRenderer text={result.solution.replace(/^\s*НӘТИЖЕ:[^\n]*\n*/i, '')} />
          </div>
        </div>
      )}
      <Button onClick={onNext} variant={result.correct ? 'primary' : 'secondary'} icon={<ChevronRight size={16} />}>
        Келесі есеп
      </Button>
    </div>
  )
}

export default function Problems() {
  const { user } = useUserStore()
  const [topics, setTopics] = useState([])
  const [topicsLoading, setTopicsLoading] = useState(true)
  const [topicsError, setTopicsError] = useState(null)
  const [selectedTopic, setSelectedTopic] = useState(null)

  const [level, setLevel] = useState('easy')
  const [problems, setProblems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selected, setSelected] = useState(null)
  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [hint, setHint] = useState(null)
  const [hintLoading, setHintLoading] = useState(false)

  const fetchTopics = () => {
    setTopicsLoading(true); setTopicsError(null)
    problemsAPI.getTopics()
      .then(setTopics)
      .catch(() => setTopicsError('Тақырыптар жүктелмеді'))
      .finally(() => setTopicsLoading(false))
  }
  useEffect(fetchTopics, [])

  useEffect(() => { if (selectedTopic) fetchProblems() }, [selectedTopic, level])

  const fetchProblems = async () => {
    setLoading(true); setSelected(null); setResult(null); setAnswer(''); setError(null)
    try {
      const data = await problemsAPI.getProblems({ topic: selectedTopic, difficulty: level })
      setProblems(data)
    } catch { setError('Есептер жүктелмеді') }
    finally { setLoading(false) }
  }

  const openProblem = (p) => { WebApp.HapticFeedback.impactOccurred('light'); setSelected(p); setAnswer(''); setResult(null); setHint(null) }
  const closeProblem = () => { setSelected(null); setResult(null); setAnswer(''); setHint(null) }

  const handleKey = (k) => {
    WebApp.HapticFeedback.impactOccurred('light')
    if (k === '⌫') setAnswer(v => v.slice(0, -1))
    else if (k === '.' && answer.includes('.')) return
    else if (answer.length >= 12) return
    else setAnswer(v => v + k)
  }

  const handleSubmit = async () => {
    if (!answer.trim() || submitting) return
    setSubmitting(true); WebApp.HapticFeedback.impactOccurred('medium')
    try {
      const res = await problemsAPI.checkAnswer(selected.id, answer)
      setResult(res)
      WebApp.HapticFeedback.notificationOccurred(res.correct ? 'success' : 'error')
    } catch (e) { setResult({ correct: false, message: e.message || 'Қате орын алды' }) }
    finally { setSubmitting(false) }
  }

  const askHint = async () => {
    if (hintLoading || hint) return
    setHintLoading(true); WebApp.HapticFeedback.impactOccurred('light')
    try {
      const r = await aiAPI.getHint(selected.id, user?.id)
      setHint(r.hint || 'Кеңес алынбады.')
    } catch { setHint('Кеңес алынбады. Кейінірек қайталаңыз.') }
    finally { setHintLoading(false) }
  }

  const isAI = selected?.ai_checked

  // ── Problem detail ──────────────────────────────────────────────────────
  if (selected) {
    const lvl = LEVELS.find(l => l.id === selected.difficulty)
    return (
      <div className="min-h-screen page-enter flex flex-col">
        <TopBar showBack onBack={closeProblem} title="Есеп" />
        <div className="flex-1 px-4 pt-3 pb-6 flex flex-col gap-4">
          <Card className="p-4" accent={lvl?.color}>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {lvl && (
                <span className="text-2xs font-semibold px-2.5 py-1 rounded-full" style={{ background: `${lvl.color}1C`, color: lvl.color }}>{lvl.label}</span>
              )}
              {isAI && (
                <span className="inline-flex items-center gap-1 text-2xs font-semibold px-2.5 py-1 rounded-full bg-secondary-dim text-secondary">
                  <Bot size={11} /> AI тексереді
                </span>
              )}
            </div>
            <div className="text-[15px] text-text-1 leading-relaxed [&_span]:text-[15px]">
              <FormulaRenderer text={selected.question} />
            </div>
            {selected.formula && (
              <div className="mt-3">
                <FormulaRenderer formula={`$$${selected.formula}$$`} glow />
              </div>
            )}
          </Card>

          {!result && (
            hint ? (
              <div className="rounded-2xl p-3.5 border border-primary/25 bg-primary-dim flex gap-2.5 animate-slide-up">
                <Lightbulb size={16} className="text-primary flex-shrink-0 mt-0.5" />
                <div className="text-sm text-text-2 [&_span]:text-text-2"><FormulaRenderer text={hint} /></div>
              </div>
            ) : (
              <button type="button" onClick={askHint} disabled={hintLoading}
                className="self-start inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary-dim border border-primary/25 rounded-full px-3 py-1.5 pressable disabled:opacity-60">
                <Sparkles size={13} className={hintLoading ? 'animate-pulse' : ''} /> {hintLoading ? 'AI ойланып жатыр…' : 'Кеңес алу'}
              </button>
            )
          )}

          {result ? (
            <ResultCard result={result} onNext={closeProblem} isAI={isAI} />
          ) : isAI ? (
            <div className="flex-1 flex flex-col">
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Жауабыңды жаз: сан, бірлік, қысқа түсіндірме…"
                maxLength={500}
                className="bg-surface-2 border border-border-strong rounded-2xl px-4 py-4 text-sm text-text-1 placeholder:text-text-3 mb-1 min-h-[120px] resize-none focus:outline-none focus:border-secondary/60 transition-colors"
              />
              <p className="text-2xs text-text-3 text-right mb-3 tnum">{answer.length}/500</p>
              <Button variant="sky" onClick={handleSubmit} disabled={!answer.trim()} loading={submitting} icon={<Bot size={16} />}>
                {submitting ? 'AI тексеруде…' : 'Тексеру'}
              </Button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              <div className="bg-surface-2 border border-border-strong rounded-2xl px-4 py-4 text-center mb-2.5 min-h-[64px] flex items-center justify-center">
                <span className={`display text-3xl tracking-wider tnum ${answer ? 'text-text-1' : 'text-text-3'}`}>{answer || '—'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {NUMPAD.map(k => (
                  <button key={k} type="button" onClick={() => handleKey(k)}
                    className="card rounded-xl py-3.5 flex items-center justify-center text-lg font-semibold text-text-1 active:bg-primary-dim active:scale-95 transition-all tnum">
                    {k === '⌫' ? <Delete size={20} strokeWidth={1.6} className="text-text-2" /> : k}
                  </button>
                ))}
              </div>
              <Button className="mt-3" onClick={handleSubmit} disabled={!answer.trim()} loading={submitting}>
                Тексеру
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Problem list ────────────────────────────────────────────────────────
  if (selectedTopic) {
    const { head } = splitTopic(selectedTopic)
    return (
      <div className="min-h-screen page-enter">
        <TopBar showBack onBack={() => { setSelectedTopic(null); setProblems([]) }} title={head} />
        <div className="px-4 pt-3 pb-4">
          <div className="flex gap-1 p-1 rounded-2xl bg-surface-2 border border-border mb-4">
            {LEVELS.map(l => {
              const on = level === l.id
              return (
                <button key={l.id} type="button" onClick={() => { setLevel(l.id); WebApp.HapticFeedback.impactOccurred('light') }}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${on ? 'bg-surface text-text-1 shadow-card' : 'text-text-2'}`}>
                  <span className="w-2 h-2 rounded-full" style={{ background: l.color, opacity: on ? 1 : 0.5 }} />
                  {l.label}
                </button>
              )
            })}
          </div>

          {error ? (
            <EmptyState Icon={RefreshCw} tone="danger" title={error} actionLabel="Қайталау" onAction={fetchProblems} />
          ) : loading ? (
            <div className="space-y-2.5">{[0, 1, 2, 3].map(i => <SkeletonCard key={i} />)}</div>
          ) : problems.length === 0 ? (
            <EmptyState Icon={Target} title="Бұл деңгейде есеп жоқ" description="Басқа деңгейді таңдап көр." />
          ) : (
            <div className="space-y-2.5 stagger">
              {problems.map((p, idx) => {
                const lvl = LEVELS.find(l => l.id === p.difficulty)
                return (
                  <button key={p.id} type="button" onClick={() => openProblem(p)}
                    className="w-full card p-4 text-left pressable flex gap-3"
                    style={{ borderLeft: `3px solid ${lvl?.color || '#FFB020'}` }}>
                    <span className="display text-sm text-text-3 tnum pt-0.5 w-6 flex-shrink-0">{idx + 1}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-text-1 text-sm leading-relaxed line-clamp-2">{p.question}</span>
                      <span className="flex items-center gap-2 mt-2 text-2xs text-text-3">
                        {p.ai_checked ? <span className="inline-flex items-center gap-1 text-secondary"><Bot size={11} /> AI тексереді</span> : <span>Сандық жауап</span>}
                      </span>
                    </span>
                    <ChevronRight size={16} strokeWidth={1.6} className="text-text-3 flex-shrink-0 self-center" />
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Topics ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen page-enter">
      <TopBar />
      <div className="px-4 pt-3 pb-4">
        <h1 className="display text-2xl text-text-1 mb-1">Есептер</h1>
        <p className="text-sm text-text-2 mb-4">{topics.length ? `${topics.length} тақырып · ${topics.reduce((s, t) => s + (t.count || 0), 0)} есеп` : 'Тақырыпты таңда'}</p>

        {topicsError ? (
          <EmptyState Icon={RefreshCw} tone="danger" title={topicsError} actionLabel="Қайталау" onAction={fetchTopics} />
        ) : topicsLoading ? (
          <div className="space-y-2.5">{[0, 1, 2, 3].map(i => <SkeletonCard key={i} lines={1} />)}</div>
        ) : topics.length === 0 ? (
          <EmptyState Icon={Target} title="Тақырып табылмады" />
        ) : (
          <div className="space-y-2.5 stagger">
            {topics.map(topic => {
              const { head, tail } = splitTopic(topic.name)
              return (
                <button key={topic.id} type="button"
                  onClick={() => { WebApp.HapticFeedback.impactOccurred('light'); setSelectedTopic(topic.id) }}
                  className="w-full flex items-center gap-3 card rounded-2xl px-4 py-3.5 pressable">
                  <span className="text-lg w-10 h-10 rounded-xl bg-surface-2 border border-border flex items-center justify-center flex-shrink-0">
                    {TOPIC_ICONS[topic.id] || '📝'}
                  </span>
                  <span className="text-left flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-text-1 leading-snug">{head}</span>
                    {tail && <span className="block text-2xs text-text-3 truncate mt-0.5">{tail}</span>}
                    <span className="block text-2xs text-text-2 mt-1 tnum">{topic.count} есеп</span>
                  </span>
                  <ChevronRight size={16} className="text-text-3 flex-shrink-0" />
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
