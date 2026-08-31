import { useState, useEffect } from 'react'
import WebApp from '@twa-dev/sdk'
import { CheckCircle2, XCircle, ChevronRight, Delete, Target, Bot, BookOpen } from 'lucide-react'
import TopBar from '../components/TopBar'
import Card from '../components/Card'
import Button from '../components/Button'
import FormulaRenderer from '../components/FormulaRenderer'
import { SkeletonCard } from '../components/SkeletonLoader'
import { problemsAPI } from '../api/problems'

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
  { id: 'easy', label: 'Жеңіл', color: '#43E97B' },
  { id: 'medium', label: 'Орташа', color: '#FFD93D' },
  { id: 'hard', label: 'Күрделі', color: '#FF6B6B' },
]
const NUMPAD = ['7','8','9','4','5','6','1','2','3','.','0','⌫']

function ResultCard({ result, onNext, isAI }) {
  const Icon = result.correct ? CheckCircle2 : XCircle
  return (
    <div className={`card p-5 border-2 animate-scale-in ${result.correct ? 'border-success/40' : 'border-danger/40'}`}>
      <div className="text-center mb-4">
        <Icon size={52} strokeWidth={1.5} className={`mx-auto mb-2 ${result.correct ? 'text-success' : 'text-danger'}`} />
        <h3 className="text-lg font-bold text-text-1">{result.correct ? 'Дұрыс!' : 'Қате'}</h3>
        <p className="text-sm text-text-2 mt-1">{result.message}</p>
      </div>
      {result.solution && (
        <div className="bg-surface-2 rounded-xl p-3 mb-4 border border-border">
          <p className="text-xs text-primary font-semibold mb-1">
            {isAI ? '🤖 AI шешімі:' : 'Шешімі:'}
          </p>
          <div className="text-sm text-text-2 leading-relaxed">
            {/* The AI answer starts with a "НӘТИЖЕ: ..." verdict line; the card header already shows it */}
            <FormulaRenderer text={result.solution.replace(/^\s*НӘТИЖЕ:[^\n]*\n*/i, '')} />
          </div>
        </div>
      )}
      <Button onClick={onNext} variant={result.correct ? 'success' : 'secondary'} icon={<ChevronRight size={16} />}>
        Келесі есеп
      </Button>
    </div>
  )
}

export default function Problems() {
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

  const fetchTopics = () => {
    setTopicsLoading(true); setTopicsError(null)
    problemsAPI.getTopics()
      .then(setTopics)
      .catch(() => setTopicsError('Тақырыптар жүктелмеді'))
      .finally(() => setTopicsLoading(false))
  }

  useEffect(() => { fetchTopics() }, [])

  useEffect(() => {
    if (!selectedTopic) return
    fetchProblems()
  }, [selectedTopic, level])

  const fetchProblems = async () => {
    setLoading(true); setSelected(null); setResult(null); setAnswer(''); setError(null)
    try {
      const data = await problemsAPI.getProblems({ topic: selectedTopic, difficulty: level })
      setProblems(data)
    } catch { setError('Есептер жүктелмеді') }
    finally { setLoading(false) }
  }

  const handleSelect = (p) => { WebApp.HapticFeedback.impactOccurred('light'); setSelected(p); setAnswer(''); setResult(null) }

  const handleKey = (k) => {
    WebApp.HapticFeedback.impactOccurred('light')
    if (k === '⌫') setAnswer(v => v.slice(0, -1))
    else if (k === '.' && answer.includes('.')) return
    else setAnswer(v => v + k)
  }

  const handleSubmit = async () => {
    if (!answer.trim() || submitting) return
    setSubmitting(true); WebApp.HapticFeedback.impactOccurred('medium')
    try {
      const res = await problemsAPI.checkAnswer(selected.id, answer)
      setResult(res)
      WebApp.HapticFeedback.notificationOccurred(res.correct ? 'success' : 'error')
    } catch { setResult({ correct: false, message: 'Қате орын алды' }) }
    finally { setSubmitting(false) }
  }

  const isAI = selected?.ai_checked

  // Problem detail view
  if (selected) {
    const lvl = LEVELS.find(l => l.id === selected.difficulty)
    return (
      <div className="min-h-screen bg-bg page-enter flex flex-col">
        <TopBar showBack onBack={() => { setSelected(null); setResult(null); setAnswer('') }} title="Есеп" />
        <div className="flex-1 px-4 pt-2 pb-6 flex flex-col gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              {lvl && (
                <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: `${lvl.color}18`, color: lvl.color }}>
                  {lvl.label}
                </span>
              )}
              {isAI && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                  <Bot size={12} /> AI тексереді
                </span>
              )}
            </div>
            <div className="text-sm text-text-1 leading-relaxed whitespace-pre-line">
              <FormulaRenderer text={selected.question} />
            </div>
            {selected.formula && (
              <div className="formula-block mt-3">
                <FormulaRenderer formula={`$$${selected.formula}$$`} glow />
              </div>
            )}
          </Card>

          {result ? (
            <ResultCard result={result} onNext={() => { setSelected(null); setResult(null); setAnswer('') }} isAI={isAI} />
          ) : isAI ? (
            <div className="flex-1 flex flex-col">
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Жауабыңызды жазыңыз..."
                maxLength={500}
                className="glass-input border-2 border-primary/30 rounded-2xl px-4 py-4 text-sm text-text-1 placeholder-text-3 mb-1 min-h-[120px] resize-none focus:outline-none focus:border-primary/60"
              />
              <p className="text-[10px] text-text-3 text-right mb-2">{answer.length}/500</p>
              <Button onClick={handleSubmit} disabled={!answer.trim() || submitting}>
                {submitting ? '🤖 AI тексеруде...' : 'Тексеру'}
              </Button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              <div className="glass-input border-2 border-primary/30 rounded-2xl px-4 py-4 text-center mb-2 min-h-[58px] flex items-center justify-center">
                <span className={`text-3xl font-bold tracking-widest ${answer ? 'text-text-1' : 'text-text-3'}`}>{answer || '—'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {NUMPAD.map(k => (
                  <button key={k} onClick={() => handleKey(k)}
                    className="glass-input rounded-xl py-3.5 flex items-center justify-center text-lg font-semibold text-text-1 active:bg-primary/20 active:scale-95 transition-all">
                    {k === '⌫' ? <Delete size={20} strokeWidth={1.5} className="text-text-2" /> : k}
                  </button>
                ))}
              </div>
              <Button className="mt-3" onClick={handleSubmit} disabled={!answer.trim() || submitting}>
                {submitting ? 'Тексерілуде...' : 'Тексеру'}
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Problems list (after topic selected)
  if (selectedTopic) {
    return (
      <div className="min-h-screen bg-bg page-enter">
        <TopBar showBack onBack={() => { setSelectedTopic(null); setProblems([]) }} title="Есептер" />
        <div className="px-4 pt-2 pb-4">
          <p className="text-sm text-text-2 mb-3 truncate">{selectedTopic}</p>

          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 mb-4">
            {LEVELS.map(l => (
              <button key={l.id} onClick={() => { setLevel(l.id); WebApp.HapticFeedback.impactOccurred('light') }}
                className={`chip flex-shrink-0 border flex items-center gap-1.5 ${level === l.id ? 'text-white border-transparent' : 'glass-input text-text-2'}`}
                style={level === l.id ? { background: l.color } : {}}>
                {l.label}
              </button>
            ))}
          </div>

          {error ? (
            <div className="text-center py-12">
              <p className="text-text-3 text-sm mb-3">{error}</p>
              <button onClick={fetchProblems} className="text-primary text-sm font-semibold">Қайталау</button>
            </div>
          ) : loading ? (
            <div className="space-y-3">{[0,1,2,3].map(i => <SkeletonCard key={i} />)}</div>
          ) : (
            <div className="space-y-2.5">
              {problems.map((p, idx) => {
                const lvl = LEVELS.find(l => l.id === p.difficulty)
                return (
                  <button key={p.id} onClick={() => handleSelect(p)}
                    className="w-full card p-4 text-left pressable"
                    style={{ borderLeft: `3px solid ${lvl?.color || '#6C63FF'}` }}>
                    <p className="text-text-1 text-sm leading-relaxed line-clamp-2">
                      {idx + 1}. {p.question}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-text-3">{lvl?.label}</span>
                      <div className="flex items-center gap-2">
                        {p.ai_checked && <Bot size={12} className="text-primary" />}
                        <ChevronRight size={14} strokeWidth={1.5} className="text-text-3" />
                      </div>
                    </div>
                  </button>
                )
              })}
              {problems.length === 0 && (
                <div className="text-center py-16">
                  <Target size={48} strokeWidth={1} className="text-text-3 mx-auto mb-3" />
                  <p className="text-text-3 text-sm">Есеп табылмады</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Topic selection (first screen)
  return (
    <div className="min-h-screen bg-bg page-enter">
      <TopBar />
      <div className="px-4 pt-2 pb-4">
        <h1 className="text-2xl font-extrabold text-text-1 mb-1">Есептер</h1>
        <p className="text-sm text-text-2 mb-5">Тақырыпты таңдаңыз</p>

        {topicsError ? (
          <div className="text-center py-12">
            <p className="text-text-3 text-sm mb-3">{topicsError}</p>
            <button onClick={fetchTopics} className="text-primary text-sm font-semibold">Қайталау</button>
          </div>
        ) : topicsLoading ? (
          <div className="space-y-3">{[0,1,2,3].map(i => <SkeletonCard key={i} />)}</div>
        ) : (
          <div className="space-y-2.5">
            {topics.map(topic => (
              <button
                key={topic.id}
                onClick={() => { WebApp.HapticFeedback.impactOccurred('light'); setSelectedTopic(topic.id) }}
                className="w-full flex items-center gap-3 glass-card rounded-2xl px-4 py-3.5 pressable"
              >
                <span className="text-xl w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  {TOPIC_ICONS[topic.id] || '📝'}
                </span>
                <div className="text-left flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-1 truncate">{topic.name}</p>
                  <p className="text-xs text-text-3">{topic.count} есеп</p>
                </div>
                <ChevronRight size={16} className="text-text-3 flex-shrink-0" />
              </button>
            ))}
            {topics.length === 0 && (
              <div className="text-center py-16">
                <Target size={48} strokeWidth={1} className="text-text-3 mx-auto mb-3" />
                <p className="text-text-3 text-sm">Тақырып табылмады</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
