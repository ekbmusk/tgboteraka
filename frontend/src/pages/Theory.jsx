import { useState, useEffect } from 'react'
import WebApp from '@twa-dev/sdk'
import { ChevronRight, BookOpen, FileText, Lightbulb, RefreshCw, Sigma } from 'lucide-react'
import TopBar from '../components/TopBar'
import Card from '../components/Card'
import FormulaRenderer from '../components/FormulaRenderer'
import EmptyState from '../components/EmptyState'
import { SkeletonCard } from '../components/SkeletonLoader'
import { theoryAPI } from '../api/theory'

const TOPICS = [
  { id: 'mechanics', label: 'Механика', accent: '#5EC8FF', preview: 'F = ma' },
  { id: 'thermodynamics', label: 'Термодинамика', accent: '#FF7A5C', preview: 'Q = \\Delta U + A' },
  { id: 'electromagnetism', label: 'Электромагнетизм', accent: '#FFB020', preview: 'I = \\frac{U}{R}' },
  { id: 'optics', label: 'Оптика', accent: '#B39DFF', preview: 'n_1 \\sin\\theta_1 = n_2 \\sin\\theta_2' },
  { id: 'quantum', label: 'Кванттық физика', accent: '#3DDC97', preview: 'E = h\\nu' },
  { id: 'nuclear', label: 'Ядролық физика', accent: '#FF5C8A', preview: 'E = \\Delta m c^2' },
]

const LECTURE_ACCENT = '#5EC8FF'
const LECTURE_TITLE = /^(\d+)-лекция:?\s*(.*)$/i

/** "2-лекция: Кинематика" → { num: 2, name: "Кинематика" } */
function splitLectureTitle(title) {
  const m = LECTURE_TITLE.exec(title || '')
  return m ? { num: Number(m[1]), name: m[2] || title } : { num: null, name: title }
}

function Segmented({ options, value, onChange }) {
  return (
    <div className="flex gap-1 p-1 rounded-2xl bg-surface-2 border border-border">
      {options.map(o => {
        const on = o.id === value
        return (
          <button key={o.id} type="button"
            onClick={() => { onChange(o.id); WebApp.HapticFeedback.impactOccurred('light') }}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${on ? 'bg-primary text-primary-ink shadow-glow-primary' : 'text-text-2'}`}>
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/** Thin amber line under the header that fills as you read */
function ReadingProgress() {
  const [p, setP] = useState(0)
  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement
      const max = el.scrollHeight - el.clientHeight
      setP(max > 0 ? Math.min(1, window.scrollY / max) : 0)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <div className="sticky top-[57px] z-30 h-[2px] bg-transparent">
      <div className="h-full bg-primary transition-[width] duration-150" style={{ width: `${p * 100}%` }} />
    </div>
  )
}

function LectureBlock({ block }) {
  if (block.type === 'formula') {
    const math = (block.content || '').trim().replace(/^\$+/, '').replace(/\$+$/, '')
    return (
      <div className="my-4">
        <FormulaRenderer formula={`$$${math}$$`} glow />
      </div>
    )
  }
  if (block.type === 'example') {
    return (
      <aside className="my-4 rounded-2xl p-4 border border-success/25 bg-success/[0.06]">
        <p className="eyebrow text-success mb-1.5 flex items-center gap-1.5"><Lightbulb size={12} /> Мысал</p>
        <div className="text-[15px] text-text-1 leading-relaxed">
          <FormulaRenderer text={block.content} />
        </div>
      </aside>
    )
  }
  if (block.type === 'divider') return <hr className="border-border my-5" />
  return (
    <div className="text-[15px] text-text-1/90 leading-[1.7] my-3 [&_span]:text-[15px] [&_span]:leading-[1.7]">
      <FormulaRenderer text={block.content} />
    </div>
  )
}

function LectureDetail({ lecture, onBack }) {
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { num, name } = splitLectureTitle(lecture.title)

  const load = () => {
    setLoading(true); setError(null)
    theoryAPI.getLectureDetail(lecture.id)
      .then(setContent)
      .catch(() => setError('Лекция жүктелмеді'))
      .finally(() => setLoading(false))
  }
  useEffect(load, [lecture.id])

  // The first block is usually just "2-лекция" — the header already says that.
  const blocks = (content?.blocks || []).filter((b, i) => !(i === 0 && /^\d+-лекция\.?$/i.test((b.content || '').trim())))

  return (
    <div className="min-h-screen page-enter">
      <TopBar showBack onBack={onBack} title={name} />
      <ReadingProgress />
      <div className="mx-4 mt-3 mb-2 glass-hero p-5 relative overflow-hidden">
        <span className="absolute -right-2 -top-4 display text-[88px] leading-none text-secondary/[0.08] select-none">{num ?? '§'}</span>
        <p className="eyebrow text-secondary mb-2">{num ? `${num}-лекция` : 'Лекция'} · {lecture.block_count} блок</p>
        <h1 className="display text-xl leading-snug text-text-1 relative">{name}</h1>
      </div>

      <article className="px-5 pb-10">
        {error ? (
          <EmptyState Icon={RefreshCw} tone="danger" title={error} actionLabel="Қайталау" onAction={load} />
        ) : loading ? (
          <div className="space-y-3 pt-3">{[0, 1, 2, 3].map(i => <SkeletonCard key={i} lines={3} />)}</div>
        ) : blocks.length > 0 ? (
          blocks.map((block, i) => <LectureBlock key={i} block={block} />)
        ) : (
          <EmptyState Icon={FileText} title="Мазмұн әлі қосылмаған" description="Бұл лекция жақында толтырылады." />
        )}
      </article>
    </div>
  )
}

function TopicDetail({ topic, onBack }) {
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('explain')

  const load = () => {
    setLoading(true); setError(null)
    theoryAPI.getTopicDetail(topic.id)
      .then(setContent)
      .catch(() => setError('Мазмұн жүктелмеді'))
      .finally(() => setLoading(false))
  }
  useEffect(load, [topic.id])

  const formulas = content?.subtopics?.flatMap(s => (s.formulas || []).map(f => ({ ...f, group: s.title }))) || []

  return (
    <div className="min-h-screen page-enter">
      <TopBar showBack onBack={onBack} title={topic.label} />
      <div className="mx-4 mt-3 mb-4 glass-hero p-5 relative overflow-hidden">
        <div className="absolute -right-3 -top-3 w-28 h-28 rounded-full blur-2xl" style={{ background: `${topic.accent}33` }} />
        <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3" style={{ background: `${topic.accent}1C` }}>
          <BookOpen size={22} strokeWidth={1.6} style={{ color: topic.accent }} />
        </div>
        <h1 className="display text-xl text-text-1">{topic.label}</h1>
        <p className="text-sm text-text-2 mt-1">{content?.subtopics?.length ?? '—'} бөлім · {formulas.length || '—'} формула</p>
      </div>

      <div className="px-4 mb-4">
        <Segmented value={tab} onChange={setTab} options={[{ id: 'explain', label: 'Түсіндірме' }, { id: 'formulas', label: 'Формулалар' }]} />
      </div>

      <div className="px-4 pb-8">
        {error ? (
          <EmptyState Icon={RefreshCw} tone="danger" title={error} actionLabel="Қайталау" onAction={load} />
        ) : loading ? (
          <div className="space-y-3">{[0, 1, 2].map(i => <SkeletonCard key={i} />)}</div>
        ) : tab === 'explain' ? (
          <div className="space-y-3 stagger">
            {content?.subtopics?.map((sub, i) => (
              <Card key={i} className="p-4" accent={topic.accent}>
                <h3 className="font-semibold text-text-1 mb-1.5">{sub.title}</h3>
                <p className="text-sm text-text-2 leading-relaxed">{sub.description}</p>
                {sub.formulas?.length > 0 && (
                  <p className="text-2xs text-text-3 mt-2.5 flex items-center gap-1"><Sigma size={11} /> {sub.formulas.length} формула</p>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-3 stagger">
            {formulas.map((f, i) => (
              <div key={i} className="card p-4">
                <div className="flex items-baseline justify-between gap-2 mb-2">
                  <p className="text-sm font-semibold text-text-1">{f.name}</p>
                  <p className="text-2xs text-text-3 truncate">{f.group}</p>
                </div>
                <FormulaRenderer formula={`$$${f.latex}$$`} glow />
                {f.description && <p className="text-xs text-text-2 mt-2.5 leading-relaxed">{f.description}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Theory() {
  const [selected, setSelected] = useState(null)
  const [selectedLecture, setSelectedLecture] = useState(null)
  const [lectures, setLectures] = useState([])
  const [lecturesLoading, setLecturesLoading] = useState(true)
  const [lecturesError, setLecturesError] = useState(null)
  const [section, setSection] = useState('lectures')

  const fetchLectures = () => {
    setLecturesLoading(true); setLecturesError(null)
    theoryAPI.getLectures()
      .then(setLectures)
      .catch(() => setLecturesError('Лекциялар жүктелмеді'))
      .finally(() => setLecturesLoading(false))
  }
  useEffect(fetchLectures, [])

  if (selected) return <TopicDetail topic={selected} onBack={() => setSelected(null)} />
  if (selectedLecture) return <LectureDetail lecture={selectedLecture} onBack={() => setSelectedLecture(null)} />

  return (
    <div className="min-h-screen page-enter">
      <TopBar />
      <div className="px-4 pt-3 pb-4">
        <h1 className="display text-2xl text-text-1 mb-1">Теория</h1>
        <p className="text-sm text-text-2 mb-4">
          {section === 'lectures' ? `${lectures.length || 15} лекция · оқу ретімен` : '6 тақырып бойынша формулалар'}
        </p>

        <div className="mb-4">
          <Segmented value={section} onChange={setSection} options={[{ id: 'lectures', label: 'Лекциялар' }, { id: 'formulas', label: 'Формулалар' }]} />
        </div>

        {section === 'lectures' ? (
          lecturesError ? (
            <EmptyState Icon={RefreshCw} tone="danger" title={lecturesError} actionLabel="Қайталау" onAction={fetchLectures} />
          ) : lecturesLoading ? (
            <div className="space-y-2.5">{[0, 1, 2, 3].map(i => <SkeletonCard key={i} lines={1} />)}</div>
          ) : lectures.length > 0 ? (
            <div className="space-y-2 stagger">
              {lectures.map((lec) => {
                const { num, name } = splitLectureTitle(lec.title)
                return (
                  <button key={lec.id} type="button"
                    onClick={() => { WebApp.HapticFeedback.impactOccurred('light'); setSelectedLecture(lec) }}
                    className="w-full card p-3.5 text-left pressable flex items-center gap-3">
                    <span className="w-11 h-11 rounded-xl bg-secondary-dim border border-secondary/20 flex items-center justify-center flex-shrink-0 display text-base text-secondary tnum">
                      {num ?? <FileText size={18} />}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block font-semibold text-text-1 text-sm leading-snug">{name}</span>
                      <span className="block text-2xs text-text-3 mt-0.5">{lec.block_count} блок</span>
                    </span>
                    <ChevronRight size={16} strokeWidth={1.6} className="text-text-3 flex-shrink-0" />
                  </button>
                )
              })}
            </div>
          ) : (
            <EmptyState Icon={FileText} title="Лекциялар әлі қосылмаған" />
          )
        ) : (
          <div className="grid grid-cols-2 gap-2.5 stagger">
            {TOPICS.map((topic) => (
              <button key={topic.id} type="button"
                onClick={() => { WebApp.HapticFeedback.impactOccurred('light'); setSelected(topic) }}
                className="card p-4 text-left pressable relative overflow-hidden min-h-[132px] flex flex-col">
                <span className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r" style={{ background: topic.accent }} />
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2.5" style={{ background: `${topic.accent}1C` }}>
                  <BookOpen size={18} strokeWidth={1.6} style={{ color: topic.accent }} />
                </div>
                <div className="font-semibold text-text-1 text-sm leading-tight mb-auto">{topic.label}</div>
                <div className="text-xs text-text-2 mt-2 overflow-hidden">
                  <FormulaRenderer formula={`$${topic.preview}$`} inline />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
