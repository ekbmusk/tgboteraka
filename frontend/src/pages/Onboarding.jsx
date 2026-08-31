import { useState, useRef } from 'react'
import WebApp from '@twa-dev/sdk'
import {
  BookOpen, Brain, Calculator, Trophy, Flame, MessageCircle, BarChart2,
  ChevronRight, Sparkles, FlaskConical, Check,
} from 'lucide-react'
import { useUserStore } from '../store/userStore'
import { usersAPI } from '../api/users'
import Button from '../components/Button'

const LEVELS = [
  { id: 'easy', title: 'Бастауыш', desc: 'Физиканы жаңа бастадым', sub: '7–8 сынып', color: '#3DDC97' },
  { id: 'medium', title: 'Орташа', desc: 'Негіздерді білемін', sub: '9–10 сынып', color: '#FFB020' },
  { id: 'hard', title: 'Жоғары', desc: 'ҰБТ-ға дайындалып жатырмын', sub: '11 сынып / олимпиада', color: '#FF7A5C' },
]

const FEATURES = [
  { Icon: BookOpen, title: 'Теория', desc: '15 лекция және формулалар жинағы — бәрі қазақ тілінде.', color: '#5EC8FF' },
  { Icon: Calculator, title: 'Есептер', desc: 'Жеңілден күрделіге. AI шешімді қадам-қадам түсіндіреді.', color: '#FF7A5C' },
  { Icon: Brain, title: 'Тест', desc: '10 сұрақ, 20 секунд таймер, қателерді бірден талдау.', color: '#3DDC97' },
  { Icon: Flame, title: 'Күнделікті сынақ', desc: 'Күн сайын жаңа тест — аяқтасаң бонус XP.', color: '#FFB020' },
  { Icon: FlaskConical, title: 'Зертхана', desc: '15 виртуалды зертханалық жұмыс.', color: '#B39DFF' },
  { Icon: MessageCircle, title: 'AI репетитор', desc: 'Кез келген физика сұрағына формулалармен жауап.', color: '#5EC8FF' },
  { Icon: Trophy, title: 'Рейтинг және прогресс', desc: 'XP жина, жолақ ұста, кестеде жоғарыла.', color: '#FFB020' },
]

function Dots({ total, current, onClick }) {
  return (
    <div className="flex justify-center items-center gap-2 py-4">
      {Array.from({ length: total }).map((_, i) => (
        <button key={i} type="button" onClick={() => i <= current && onClick(i)} aria-label={`Қадам ${i + 1}`}
          className={`rounded-full transition-all duration-300 ${
            i === current ? 'w-7 h-2.5 bg-primary' : i < current ? 'w-2.5 h-2.5 bg-primary/50' : 'w-2.5 h-2.5 bg-border-strong'
          }`} />
      ))}
    </div>
  )
}

function SkipButton({ onSkip }) {
  return (
    <div className="flex justify-end pt-4">
      <button type="button" onClick={onSkip} className="text-xs text-text-2 bg-surface-2 border border-border rounded-full px-3 py-1.5 pressable">
        Өткізу
      </button>
    </div>
  )
}

/* ─── Screen 0: Welcome ─── */
function Screen0({ onNext, onSkip }) {
  return (
    <div className="flex flex-col h-full px-5">
      <SkipButton onSkip={onSkip} />

      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Atom */}
        <div className="relative w-44 h-44 mx-auto mb-8 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-primary/10 blur-2xl" />
          <div className="absolute inset-0 rounded-full border border-primary/25 animate-spin" style={{ animationDuration: '10s' }} />
          <div className="absolute inset-6 rounded-full border border-secondary/25 animate-spin" style={{ animationDuration: '6s', animationDirection: 'reverse' }} />
          <div className="absolute inset-12 rounded-full border border-success/25 animate-spin" style={{ animationDuration: '4s' }} />
          {['#FFB020', '#5EC8FF', '#3DDC97'].map((c, i) => (
            <div key={i} className="absolute inset-0 flex items-start justify-center" style={{ transform: `rotate(${i * 120}deg)` }}>
              <div className="w-3 h-3 rounded-full mt-1" style={{ background: c, boxShadow: `0 0 10px ${c}` }} />
            </div>
          ))}
          <div className="relative w-16 h-16 rounded-2xl bg-surface border border-border-strong flex items-center justify-center shadow-card">
            <span className="display text-2xl text-primary">Φ</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 mb-3">
          <Sparkles size={13} className="text-primary" />
          <span className="eyebrow text-primary">Физика Боты</span>
        </div>
        <h1 className="display text-[30px] leading-[1.15] text-text-1 text-center mb-3">
          Физиканы<br />оңай үйрен!
        </h1>
        <p className="text-sm text-text-2 text-center leading-relaxed max-w-[280px]">
          Теория, есептер, тесттер және AI репетитор — барлығы қазақ тілінде, бір жерде.
        </p>

        <div className="flex flex-wrap justify-center gap-2 mt-6">
          {['15 лекция', 'AI репетитор', 'Рейтинг', 'Күнделікті сынақ', 'XP жүйесі'].map(t => (
            <span key={t} className="text-xs text-text-2 bg-surface border border-border rounded-full px-3 py-1.5">{t}</span>
          ))}
        </div>
      </div>

      <div className="pb-4">
        <Button onClick={onNext} icon={<ChevronRight size={16} />}>Бастайық</Button>
      </div>
    </div>
  )
}

/* ─── Screen 1: Features ─── */
function Screen1({ onNext, onSkip }) {
  return (
    <div className="flex flex-col h-full px-5">
      <SkipButton onSkip={onSkip} />
      <div className="pt-4 pb-3">
        <p className="eyebrow mb-1">Қолданбада не бар</p>
        <h1 className="display text-2xl text-text-1">Не істей аласың?</h1>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 stagger pb-2">
        {FEATURES.map((f, i) => (
          <div key={i} className="card p-3.5 flex items-start gap-3" style={{ borderLeft: `3px solid ${f.color}` }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${f.color}1C` }}>
              <f.Icon size={18} strokeWidth={1.6} style={{ color: f.color }} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text-1">{f.title}</p>
              <p className="text-xs text-text-2 leading-relaxed mt-0.5">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-3 pb-4">
        <Button onClick={onNext} icon={<ChevronRight size={16} />}>Келесі</Button>
      </div>
    </div>
  )
}

/* ─── Screen 2: Level ─── */
function Screen2({ selectedLevel, setSelectedLevel, onStart, saving }) {
  return (
    <div className="flex flex-col h-full px-5">
      <div className="pt-8 pb-3">
        <p className="eyebrow text-primary mb-1">Соңғы қадам</p>
        <h1 className="display text-2xl text-text-1 mb-1">Деңгейіңді таңда</h1>
        <p className="text-sm text-text-2">Есептер мен тесттер осы деңгейге бейімделеді. Кейін профильде өзгертуге болады.</p>
      </div>

      <div className="flex-1 space-y-2.5 pt-2 stagger">
        {LEVELS.map(lvl => {
          const sel = selectedLevel === lvl.id
          return (
            <button key={lvl.id} type="button"
              onClick={() => { WebApp.HapticFeedback.impactOccurred('light'); setSelectedLevel(lvl.id) }}
              className={`w-full text-left rounded-2xl p-4 border transition-all pressable ${sel ? 'bg-surface-2 border-primary/50' : 'card border-border'}`}
              style={sel ? { boxShadow: `0 0 0 1px ${lvl.color}55, 0 8px 24px rgba(0,0,0,0.35)` } : undefined}>
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: lvl.color, boxShadow: `0 0 8px ${lvl.color}` }} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-text-1">{lvl.title}</div>
                  <div className="text-xs text-text-2 mt-0.5">{lvl.desc} · {lvl.sub}</div>
                </div>
                <span className={`w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${sel ? 'bg-primary border-primary text-primary-ink' : 'border-border-strong text-transparent'}`}>
                  <Check size={14} strokeWidth={2.5} />
                </span>
              </div>
            </button>
          )
        })}
      </div>

      <div className="pt-3 pb-4">
        <Button onClick={onStart} disabled={!selectedLevel} loading={saving} icon={<ChevronRight size={16} />}>Бастау</Button>
      </div>
    </div>
  )
}

export default function Onboarding({ onComplete }) {
  const [screen, setScreen] = useState(0)
  const [selectedLevel, setSelectedLevel] = useState(null)
  const [saving, setSaving] = useState(false)
  const { user, setUser } = useUserStore()
  const touchStartX = useRef(null)

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX }
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return
    const delta = touchStartX.current - e.changedTouches[0].clientX
    if (delta > 60 && screen < 2) setScreen(s => s + 1)
    if (delta < -60 && screen > 0) setScreen(s => s - 1)
    touchStartX.current = null
  }

  const handleStart = async () => {
    if (!selectedLevel || saving) return
    setSaving(true)
    if (user?.id) {
      try {
        await usersAPI.setLevel(user.id, selectedLevel)
        setUser({ ...user, level: selectedLevel })
      } catch { /* level is a preference; never block the first launch on it */ }
    }
    WebApp.HapticFeedback.notificationOccurred('success')
    localStorage.setItem('onboarding_completed', 'true')
    setSaving(false)
    onComplete()
  }

  const skip = () => setScreen(2)

  const screens = [
    <Screen0 key="s0" onNext={() => setScreen(1)} onSkip={skip} />,
    <Screen1 key="s1" onNext={() => setScreen(2)} onSkip={skip} />,
    <Screen2 key="s2" selectedLevel={selectedLevel} setSelectedLevel={setSelectedLevel} onStart={handleStart} saving={saving} />,
  ]

  return (
    <div className="h-screen flex flex-col" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div className="flex-1 min-h-0 animate-fade-in" key={screen}>
        {screens[screen]}
      </div>
      <div className="safe-bottom">
        <Dots total={3} current={screen} onClick={setScreen} />
      </div>
    </div>
  )
}
