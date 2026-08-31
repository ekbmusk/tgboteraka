import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import WebApp from '@twa-dev/sdk'
import { BookOpen, Calculator, Brain, BarChart2, MessageCircle, Trophy, Lightbulb, FlaskConical } from 'lucide-react'
import TopBar from '../components/TopBar'

const SECTIONS = [
  { Icon: BookOpen, title: 'Теория', color: '#5EC8FF', desc: '15 лекция және 6 тақырып бойынша формулалар жинағы. Формулалар KaTeX арқылы көрсетіледі.' },
  { Icon: Calculator, title: 'Есептер', color: '#FF7A5C', desc: 'Жеңіл, орташа, күрделі деңгейлер. Сандық жауапты пернетақтамен енгіз; кейбір есептерді AI тексеріп, шешімін түсіндіреді.' },
  { Icon: Brain, title: 'Тест', color: '#3DDC97', desc: '10 сұрақ, әр сұраққа 20 секунд. Аяқтағанда қателеріңді түсіндірмесімен қайта қарайсың. Нәтиже рейтингке қосылады.' },
  { Icon: FlaskConical, title: 'Зертхана', color: '#B39DFF', desc: '15 виртуалды зертханалық жұмыс: мақсаты, құралдары және симуляцияға сілтеме.' },
  { Icon: MessageCircle, title: 'AI репетитор', color: '#5EC8FF', desc: 'Физика бойынша кез келген сұраққа қазақ тілінде жауап береді, формулаларды жазып түсіндіреді.' },
  { Icon: BarChart2, title: 'Прогресс', color: '#3DDC97', desc: 'Тақырыптар бойынша үлгерім, жолақ, орташа нәтиже және соңғы тесттер.' },
  { Icon: Trophy, title: 'Рейтинг', color: '#FFB020', desc: 'Апта / ай / барлық уақыт кестелері. Тест тапсырған сайын XP жиналады.' },
]

export default function Help() {
  const navigate = useNavigate()
  useEffect(() => {
    WebApp.BackButton.show()
    WebApp.BackButton.onClick(() => navigate('/'))
    return () => WebApp.BackButton.hide()
  }, [])

  return (
    <div className="min-h-screen page-enter">
      <TopBar showBack onBack={() => navigate('/')} title="Көмек" />
      <div className="px-4 pt-3 pb-6">
        <h1 className="display text-2xl text-text-1 mb-1">Көмек</h1>
        <p className="text-sm text-text-2 mb-5">Қолданба нұсқаулығы</p>

        <div className="space-y-2.5 stagger">
          {SECTIONS.map((s, i) => (
            <div key={i} className="card p-4 flex gap-3.5 items-start" style={{ borderLeft: `3px solid ${s.color}` }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${s.color}1C` }}>
                <s.Icon size={20} strokeWidth={1.6} style={{ color: s.color }} />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-text-1 mb-1 text-sm">{s.title}</h3>
                <p className="text-sm text-text-2 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-2xl p-4 border border-primary/25 bg-primary-dim flex gap-3">
          <Lightbulb size={18} strokeWidth={1.6} className="text-primary flex-shrink-0 mt-0.5" />
          <p className="text-sm text-text-2 leading-relaxed">
            <span className="text-primary font-semibold">Кеңес: </span>
            Күн сайын кем дегенде 1 тест тапсыр — жолағың сақталады, XP өседі, рейтингің жоғарылайды.
          </p>
        </div>

        <div className="mt-6 text-center text-2xs text-text-3">Физика Боты · Қазақстан</div>
      </div>
    </div>
  )
}
