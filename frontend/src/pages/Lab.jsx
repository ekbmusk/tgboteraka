import { useState } from 'react'
import WebApp from '@twa-dev/sdk'
import { ExternalLink, Target, Wrench, ChevronDown, ChevronUp } from 'lucide-react'
import TopBar from '../components/TopBar'

const LABS = [
  {
    id: 1,
    title: 'Шағын денелердің өлшемдерін анықтау',
    titleRu: 'Определение размеров малых тел',
    goal: 'Шағын денелердің өлшемдерін қатарлар тәсілімен анықтау.',
    equipment: 'Оқушы сызғышы, бұршақ, тары (немесе дөңгелек моншақтар).',
    url: 'https://efizika.ru/html5/266/index.html',
  },
  {
    id: 2,
    title: 'Көлбеу жазықтық арқылы үйкеліс коэффициентін анықтау',
    titleRu: 'Определение коэффициента трения при помощи наклонной плоскости',
    goal: 'Әртүрлі материалдардан жасалған беттерде ағаш бруcтің үйкеліс коэффициентін анықтау.',
    equipment: 'Көлбеу жазықтықта денелердің қозғалысын зерттеу құралы, штатив, ағаш брусок, транспортир, секундомер.',
    url: 'http://efizika.ru/html5/05/index.html',
  },
  {
    id: 3,
    title: 'Механикалық энергияның сақталу заңын тексеру',
    titleRu: 'Проверка закона сохранения механической энергии',
    goal: 'Энергияның сақталу заңының әділдігін тексеру.',
    equipment: 'Қозғалыс тәуелсіздігін көрсету құралы, сызғыштар, отвес, ақ және көшірме қағаз, штатив, транспортир.',
    url: 'https://efizika.ru/html5/06/index.html',
  },
  {
    id: 4,
    title: 'Атвуд машинасы арқылы еркін түсу үдеуін анықтау',
    titleRu: 'Определение ускорения свободного падения на телах Солнечной системы при помощи машины Атвуда',
    goal: 'Динамика және бірқалыпты үдемелі қозғалыс заңдарын қолдана отырып, Күн жүйесінің денелеріндегі еркін түсу үдеуін анықтау.',
    equipment: 'Штатив, блок, жіп, басқару блогы, жүктер жиынтығы.',
    url: 'http://efizika.ru/html5/08/index.html',
  },
  {
    id: 5,
    title: 'Баллистикалық маятник. Серпімсіз соқтығысу',
    titleRu: 'Баллистический маятник. Неупругий удар',
    goal: 'Оқтың маятник денесіне тигеннен кейін маятниктің ауытқу бұрышы бойынша оқтың жылдамдығын анықтау.',
    equipment: 'Баллистикалық маятник, пистолет моделі, оқ.',
    url: 'https://efizika.ru/html5/21/index.html',
  },
  {
    id: 6,
    title: 'Серіппені градустау және динамометрмен күш өлшеу',
    titleRu: 'Градуирование пружины и измерение сил динамометром',
    goal: 'Қатаң серіппе көмегімен динамометр шкаласын градустауды үйрену және кез келген бөлу бағасы бар шкала алу.',
    equipment: 'Динамометр, 102 г жүктер жиынтығы, штатив, тастау батырмасы.',
    url: 'http://efizika.ru/html5/38/index.html',
  },
  {
    id: 7,
    title: 'Серпімді маятник арқылы оқтың жылдамдығын анықтау',
    titleRu: 'Определение скорости пули c помощью пружинного маятника. Неупругий удар',
    goal: 'Серпімді маятниктің абсолютті серпімсіз соққыдан кейін тепе-теңдік қалпынан ауытқу амплитудасы бойынша оқтың жылдамдығын анықтау.',
    equipment: 'Пистолет моделі, оқ, екі штатив, маятник денесі, серіппе, сызғыш, басқару блогы.',
    url: 'https://efizika.ru/html5/133/index.html',
  },
  {
    id: 8,
    title: 'Баллистикалық маятник. Серпімді соқтығысу',
    titleRu: 'Баллистический маятник. Упругий удар',
    goal: 'Оқтың маятник денесіне тигеннен кейін маятниктің ауытқу бұрышы бойынша оқтың жылдамдығын анықтау.',
    equipment: 'Баллистикалық маятник, пистолет моделі, оқ.',
    url: 'https://efizika.ru/html5/131/index.html',
  },
  {
    id: 9,
    title: 'Обербек приборында қатты дененің айналмалы қозғалысын зерттеу',
    titleRu: 'Изучение вращательного движения твёрдого тела на приборе Обербека',
    goal: 'Қатты денелердің айналмалы қозғалысының негізгі динамика заңын қолдана отырып, инерция моментін динамикалық тәсілмен анықтауды меңгеру.',
    equipment: 'Обербек приборы жүктермен және сызғышпен, секундомер, таразы, штангенциркуль.',
    url: 'https://efizika.ru/html5/169/index.html',
  },
  {
    id: 10,
    title: 'Абсолют серпімді және абсолют серпімсіз соқтығысуларды зерттеу',
    titleRu: 'Изучение абсолютно упругого и абсолютно неупругого ударов',
    goal: 'Абсолют серпімді және абсолют серпімсіз соқтығысулар кезіндегі импульс пен энергияның сақталу заңдарын тексеру.',
    equipment: 'Баллистикалық маятник, пистолет моделі, оқ, басқару блогы.',
    url: 'https://efizika.ru/html5/275/index.html',
  },
  {
    id: 11,
    title: 'Дененің бетке үйкеліс коэффициентін анықтау',
    titleRu: 'Определение коэффициента трения тела о поверхность',
    goal: 'Аяз атаның бетке үйкеліс коэффициентін анықтау.',
    equipment: 'Көлбеу жазықтық, Аяз ата, басқару блогы.',
    url: 'http://efizika.ru/html5/287/index.html',
  },
  {
    id: 12,
    title: 'Жіп маятнигінің тербеліс периоды мен жиілігінің ұзындыққа тәуелділігін зерттеу',
    titleRu: 'Исследование зависимости периода и частоты свободных колебаний нитяного маятника от его длины',
    goal: 'Жіп маятнигінің еркін тербелісінің периоды мен жиілігі оның ұзындығына қалай тәуелді екенін анықтау.',
    equipment: 'Муфтасы мен қысқышы бар штатив, ұзындығы 130 см жіпке бекітілген шарик, сызғыш, секундомер.',
    url: 'https://efizika.ru/html5/301/index.html',
  },
  {
    id: 13,
    title: 'Көлбеу жазықтық бойымен денені көтергендегі ПӘК-ті анықтау',
    titleRu: 'Определение КПД при подъёме тела по наклонной плоскости',
    goal: 'Қарапайым механизм (көлбеу жазықтық) көмегімен орындалған пайдалы жұмыстың толық жұмыстан аз екеніне тәжірибе жүзінде көз жеткізу. ПӘК-тің көлбеу жазықтық бұрышына қалай тәуелді екенін анықтау.',
    equipment: 'Тақта, динамометр, өлшеу сызғышы, брусок, муфтасы мен қысқышы бар штатив.',
    url: 'http://efizika.ru/html5/16/index.html',
  },
  {
    id: 14,
    title: 'Көлденең лақтырылған дененің қозғалысын зерттеу',
    titleRu: 'Изучение движения тела, брошенного горизонтально',
    goal: 'Көлденең лақтырылған дененің қозғалысы мысалында қозғалыстардың тәуелсіздік заңын тексеру.',
    equipment: 'Баллистикалық пистолет, шарик, тікбұрышты декарттық координаталар жүйесі, басқару блогы.',
    url: 'http://efizika.ru/html5/118/index.html',
  },
  {
    id: 15,
    title: 'Сұйыққа батырылған денеге әсер ететін итеруші күшті анықтау',
    titleRu: 'Определение выталкивающей силы, действующей на погружённое в жидкость тело',
    goal: 'Сұйыққа батырылған денеге әсер ететін итеруші күштің сұйықтық тығыздығына және дененің батырылған бөлігінің көлеміне тәуелділігін зерттеу.',
    equipment: 'Стрелкалы динамометр, муфтасы мен қысқышы бар штатив, әртүрлі материалдан жасалған кездейсоқ көлемді денелер, тығыздығы өзгертілетін ыдыстағы сұйықтық.',
    url: 'http://efizika.ru/html5/34/index.html',
  },
]

export default function Lab() {
  const [expanded, setExpanded] = useState(null)

  const toggleExpand = (id) => {
    WebApp.HapticFeedback.impactOccurred('light')
    setExpanded(expanded === id ? null : id)
  }

  const openLab = (url) => {
    WebApp.HapticFeedback.impactOccurred('medium')
    WebApp.openLink(url)
  }

  return (
    <div className="min-h-screen page-enter">
      <TopBar />
      <div className="px-4 pt-3 pb-6">
        <h1 className="display text-2xl text-text-1 mb-1">Зертхана</h1>
        <p className="text-sm text-text-2 mb-4">{LABS.length} виртуалды зертханалық жұмыс</p>

        <div className="space-y-2.5 stagger">
          {LABS.map((lab, idx) => {
            const isOpen = expanded === lab.id
            return (
              <div key={lab.id} className={`card rounded-2xl overflow-hidden transition-colors ${isOpen ? 'border-[#B39DFF]/40' : ''}`}>
                <button
                  type="button"
                  onClick={() => toggleExpand(lab.id)}
                  aria-expanded={isOpen}
                  className="w-full text-left p-4 flex items-start gap-3 pressable"
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 display text-sm tnum"
                    style={{ background: 'rgba(179,157,255,0.14)', color: '#B39DFF', border: '1px solid rgba(179,157,255,0.25)' }}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-1 leading-snug">{lab.title}</p>
                    <p className="text-2xs text-text-3 mt-1 truncate">{lab.titleRu}</p>
                  </div>
                  {isOpen
                    ? <ChevronUp size={16} className="text-text-3 flex-shrink-0 mt-1" />
                    : <ChevronDown size={16} className="text-text-3 flex-shrink-0 mt-1" />}
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 space-y-2.5 animate-slide-up">
                    <div className="bg-surface-2 border border-border rounded-xl p-3">
                      <p className="eyebrow text-secondary mb-1 flex items-center gap-1.5"><Target size={11} /> Мақсаты</p>
                      <p className="text-sm text-text-2 leading-relaxed">{lab.goal}</p>
                    </div>
                    <div className="bg-surface-2 border border-border rounded-xl p-3">
                      <p className="eyebrow text-primary mb-1 flex items-center gap-1.5"><Wrench size={11} /> Құралдар</p>
                      <p className="text-sm text-text-2 leading-relaxed">{lab.equipment}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openLab(lab.url)}
                      className="w-full bg-primary text-primary-ink rounded-xl py-3 flex items-center justify-center gap-2 pressable text-sm font-semibold shadow-glow-primary"
                    >
                      <ExternalLink size={16} />
                      Зертхананы ашу
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
