import { useState, useEffect } from 'react'
import WebApp from '@twa-dev/sdk'
import { ChevronRight, BookOpen, FileText } from 'lucide-react'
import TopBar from '../components/TopBar'
import Card from '../components/Card'
import FormulaRenderer from '../components/FormulaRenderer'
import { SkeletonCard } from '../components/SkeletonLoader'
import { theoryAPI } from '../api/theory'

const TOPICS = [
  { id: 'mechanics', label: 'Механика', accent: '#6C63FF', lessons: 12, preview: 'F = ma' },
  { id: 'thermodynamics', label: 'Термодинамика', accent: '#FF6584', lessons: 8, preview: 'Q = \\Delta U + A' },
  { id: 'electromagnetism', label: 'Электромагнетизм', accent: '#FFD93D', lessons: 10, preview: 'I = \\frac{U}{R}' },
  { id: 'optics', label: 'Оптика', accent: '#38BDF8', lessons: 6, preview: 'n_1 \\sin\\theta_1 = n_2 \\sin\\theta_2' },
  { id: 'quantum', label: 'Кванттық физика', accent: '#43E97B', lessons: 7, preview: 'E = h\\nu' },
  { id: 'nuclear', label: 'Ядролық физика', accent: '#FF8FA3', lessons: 5, preview: 'E = \\Delta m c^2' },
]
const TABS = ['Түсіндірме', 'Формулалар', 'Мини-тест']
const LECTURE_ACCENT = '#A78BFA'

function LectureDetail({ lecture, onBack }) {
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    theoryAPI.getLectureDetail(lecture.id)
      .then(setContent)
      .catch(() => setError('Лекция жүктелмеді'))
      .finally(() => setLoading(false))
  }, [lecture.id])

  return (
    <div className="min-h-screen bg-bg page-enter">
      <TopBar showBack onBack={onBack} title={lecture.title} />
      <div className="mx-4 mt-2 rounded-3xl p-5 mb-4 glass-hero" style={{ background: `linear-gradient(135deg, ${LECTURE_ACCENT}20 0%, #1A1A2E 100%)`, border: `1px solid ${LECTURE_ACCENT}25` }}>
        <FileText size={32} strokeWidth={1.5} style={{ color: LECTURE_ACCENT }} className="mb-2" />
        <h1 className="text-xl font-bold text-text-1">{lecture.title}</h1>
        <p className="text-sm text-text-2 mt-1">{lecture.block_count} блок</p>
      </div>

      <div className="px-4 pb-8 space-y-3">
        {error ? (
          <div className="text-center py-12">
            <p className="text-text-3 text-sm">{error}</p>
          </div>
        ) : loading ? (
          <div className="space-y-3">{[0,1,2].map(i => <SkeletonCard key={i} />)}</div>
        ) : content?.blocks?.length > 0 ? (
          content.blocks.map((block, i) => {
            if (block.type === 'formula') {
              return (
                <div key={i} className="formula-block">
                  <FormulaRenderer formula={block.content} glow />
                </div>
              )
            }
            if (block.type === 'example') {
              return (
                <Card key={i} className="p-4 border-l-3" style={{ borderLeftColor: '#43E97B' }}>
                  <p className="text-xs text-success font-semibold mb-1">Мысал</p>
                  <p className="text-sm text-text-2 leading-relaxed whitespace-pre-line">{block.content}</p>
                </Card>
              )
            }
            if (block.type === 'divider') {
              return <hr key={i} className="border-border my-2" />
            }
            return (
              <Card key={i} className="p-4">
                <p className="text-sm text-text-2 leading-relaxed whitespace-pre-line">{block.content}</p>
              </Card>
            )
          })
        ) : (
          <Card className="p-6 text-center">
            <FileText size={40} strokeWidth={1} className="text-text-3 mx-auto mb-3" />
            <p className="text-text-2 text-sm">Мазмұн әлі қосылмаған</p>
          </Card>
        )}
      </div>
    </div>
  )
}

function TopicDetail({ topic, onBack }) {
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState(0)

  const fetchContent = () => {
    setLoading(true); setError(null)
    theoryAPI.getTopicDetail(topic.id)
      .then(setContent)
      .catch(() => setError('Мазмұн жүктелмеді'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchContent() }, [topic.id])

  const formulas = content?.subtopics?.flatMap(s => s.formulas || []) || []

  return (
    <div className="min-h-screen bg-bg page-enter">
      <TopBar showBack onBack={onBack} title={topic.label} />
      <div className="mx-4 mt-2 rounded-3xl p-5 mb-4 glass-hero" style={{ background: `linear-gradient(135deg, ${topic.accent}20 0%, #1A1A2E 100%)`, border: `1px solid ${topic.accent}25` }}>
        <BookOpen size={32} strokeWidth={1.5} style={{ color: topic.accent }} className="mb-2" />
        <h1 className="text-xl font-bold text-text-1">{topic.label}</h1>
        <p className="text-sm text-text-2 mt-1">{topic.lessons} сабақ</p>
      </div>

      <div className="flex gap-1.5 px-4 mb-4">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => { setTab(i); WebApp.HapticFeedback.impactOccurred('light') }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${i === tab ? 'glass-btn text-white shadow-glow-primary' : 'glass-input text-text-2'}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="px-4 pb-8">
        {error ? (
          <div className="text-center py-12">
            <p className="text-text-3 text-sm mb-3">{error}</p>
            <button onClick={fetchContent} className="text-primary text-sm font-semibold">Қайталау</button>
          </div>
        ) : loading ? (
          <div className="space-y-3">{[0,1,2].map(i => <SkeletonCard key={i} />)}</div>
        ) : tab === 0 ? (
          <div className="space-y-3">
            {content?.subtopics?.map((sub, i) => (
              <Card key={i} className="p-4">
                <h3 className="font-bold text-text-1 mb-2">{sub.title}</h3>
                <p className="text-sm text-text-2 leading-relaxed">{sub.description}</p>
              </Card>
            ))}
          </div>
        ) : tab === 1 ? (
          <div className="space-y-3">
            {formulas.map((f, i) => (
              <div key={i} className="formula-block">
                <p className="text-xs text-primary font-semibold mb-2">{f.name}</p>
                <FormulaRenderer formula={`$$${f.latex}$$`} glow />
                <p className="text-xs text-text-2 mt-2">{f.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <Card className="p-6 text-center">
            <BookOpen size={40} strokeWidth={1} className="text-text-3 mx-auto mb-3" />
            <p className="text-text-2 text-sm">Мини-тест жақында қосылады</p>
          </Card>
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
  const [activeSection, setActiveSection] = useState('lectures')

  const fetchLectures = () => {
    setLecturesLoading(true); setLecturesError(null)
    theoryAPI.getLectures()
      .then(setLectures)
      .catch(() => setLecturesError('Лекциялар жүктелмеді'))
      .finally(() => setLecturesLoading(false))
  }

  useEffect(() => { fetchLectures() }, [])

  if (selected) return <TopicDetail topic={selected} onBack={() => setSelected(null)} />
  if (selectedLecture) return <LectureDetail lecture={selectedLecture} onBack={() => setSelectedLecture(null)} />

  return (
    <div className="min-h-screen bg-bg page-enter">
      <TopBar />
      <div className="px-4 pt-2 pb-4">
        <h1 className="text-2xl font-extrabold text-text-1 mb-1">Теория</h1>
        <p className="text-sm text-text-2 mb-4">Тақырыпты таңдаңыз</p>

        <div className="flex gap-2 mb-5">
          <button
            onClick={() => { setActiveSection('lectures'); WebApp.HapticFeedback.impactOccurred('light') }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeSection === 'lectures' ? 'glass-btn text-white shadow-glow-primary' : 'glass-input text-text-2'}`}>
            Лекциялар
          </button>
          <button
            onClick={() => { setActiveSection('formulas'); WebApp.HapticFeedback.impactOccurred('light') }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeSection === 'formulas' ? 'glass-btn text-white shadow-glow-primary' : 'glass-input text-text-2'}`}>
            Формулалар
          </button>
        </div>

        {activeSection === 'lectures' ? (
          <div className="space-y-2.5">
            {lecturesError ? (
              <div className="text-center py-12">
                <p className="text-text-3 text-sm mb-3">{lecturesError}</p>
                <button onClick={fetchLectures} className="text-primary text-sm font-semibold">Қайталау</button>
              </div>
            ) : lecturesLoading ? (
              <div className="space-y-3">{[0,1,2].map(i => <SkeletonCard key={i} />)}</div>
            ) : lectures.length > 0 ? (
              lectures.map((lec) => (
                <button key={lec.id} onClick={() => { WebApp.HapticFeedback.impactOccurred('light'); setSelectedLecture(lec) }}
                  className="w-full pressable text-left">
                  <div className="rounded-2xl p-4 border glass-card" style={{ background: `linear-gradient(135deg, ${LECTURE_ACCENT}12 0%, #1A1A2E 100%)`, borderColor: `${LECTURE_ACCENT}25`, borderLeft: `3px solid ${LECTURE_ACCENT}` }}>
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${LECTURE_ACCENT}18` }}>
                        <FileText size={20} strokeWidth={1.5} style={{ color: LECTURE_ACCENT }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-text-1 text-sm mb-1">{lec.title}</div>
                        <div className="text-[11px] text-text-3">{lec.block_count} блок</div>
                      </div>
                      <ChevronRight size={18} strokeWidth={1.5} style={{ color: LECTURE_ACCENT }} className="flex-shrink-0" />
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <Card className="p-6 text-center">
                <FileText size={40} strokeWidth={1} className="text-text-3 mx-auto mb-3" />
                <p className="text-text-2 text-sm">Лекциялар әлі қосылмаған</p>
              </Card>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {TOPICS.map((topic) => (
              <button key={topic.id} onClick={() => { WebApp.HapticFeedback.impactOccurred('light'); setSelected(topic) }}
                className="w-full pressable text-left">
                <div className="rounded-2xl p-4 border glass-card" style={{ background: `linear-gradient(135deg, ${topic.accent}12 0%, #1A1A2E 100%)`, borderColor: `${topic.accent}25`, borderLeft: `3px solid ${topic.accent}` }}>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${topic.accent}18` }}>
                      <BookOpen size={20} strokeWidth={1.5} style={{ color: topic.accent }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-text-1 text-sm mb-1">{topic.label}</div>
                      <div className="text-[11px] text-text-3 mb-2">{topic.lessons} сабақ</div>
                      <div className="text-xs">
                        <FormulaRenderer formula={`$${topic.preview}$`} inline />
                      </div>
                    </div>
                    <ChevronRight size={18} strokeWidth={1.5} style={{ color: topic.accent }} className="flex-shrink-0" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
