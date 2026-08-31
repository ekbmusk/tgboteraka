import { useState, useEffect, useRef } from 'react'
import WebApp from '@twa-dev/sdk'
import { Send, Bot, Sparkles, Trash2 } from 'lucide-react'
import TopBar from '../components/TopBar'
import FormulaRenderer from '../components/FormulaRenderer'
import { aiAPI } from '../api/ai'
import { useUserStore } from '../store/userStore'
import { toast } from '../components/Toast'

const EXAMPLES = [
  'Ньютонның 2-заңын түсіндір',
  'Кинетикалық энергия формуласы',
  'Омның заңы дегеніміз не?',
  'Жарық жылдамдығы неше?',
  'Импульс пен энергияның айырмашылығы',
  'Еркін түсу үдеуі неге 9,8?',
]

const WELCOME = { role: 'assistant', content: 'Сәлем! Мен физика репетиторымын. Кез келген физика сұрағыңды қазақша жаз — формулалармен түсіндіремін.' }

function Bubble({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex mb-3 ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-secondary-dim border border-secondary/30 flex items-center justify-center mr-2 flex-shrink-0 mt-auto">
          <Bot size={15} strokeWidth={1.8} className="text-secondary" />
        </div>
      )}
      <div className={`max-w-[84%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
        isUser ? 'bg-primary text-primary-ink rounded-br-md' : 'card text-text-1 rounded-bl-md'}`}>
        {isUser
          ? <span className="whitespace-pre-wrap">{msg.content}</span>
          : <FormulaRenderer text={msg.content} />}
      </div>
    </div>
  )
}

export default function AskAI() {
  const { user } = useUserStore()
  const [messages, setMessages] = useState([WELCOME])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!user?.id) return
    aiAPI.getHistory(user.id).then(history => {
      if (history.length > 0) setMessages(history)
    }).catch(() => { })
  }, [user?.id])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [messages, loading])

  const send = async (text) => {
    const content = (text || input).trim()
    if (!content || loading) return
    setInput('')
    WebApp.HapticFeedback.impactOccurred('light')
    setMessages(m => [...m, { role: 'user', content }])
    setLoading(true)
    try {
      const res = await aiAPI.askQuestion({ question: content, telegram_id: user?.id })
      setMessages(m => [...m, { role: 'assistant', content: res.answer }])
    } catch (e) {
      setMessages(m => [...m, { role: 'assistant', content: `Қате орын алды: ${e.message}. Қайтадан көріңіз.` }])
    } finally { setLoading(false) }
  }

  const clear = async () => {
    WebApp.HapticFeedback.impactOccurred('medium')
    setMessages([WELCOME])
    if (user?.id) {
      try { await aiAPI.clearHistory(user.id) } catch { toast.error('Тарих өшірілмеді') }
    }
  }

  const fresh = messages.length <= 1

  return (
    <div className="flex flex-col h-screen page-enter">
      <TopBar
        right={!fresh && (
          <button type="button" onClick={clear} aria-label="Тарихты өшіру"
            className="w-9 h-9 rounded-full bg-surface-2 border border-border flex items-center justify-center pressable">
            <Trash2 size={15} strokeWidth={1.8} className="text-text-2" />
          </button>
        )}
      />

      <div className="flex-1 overflow-y-auto px-4 py-3 no-scrollbar">
        {messages.map((msg, i) => <Bubble key={i} msg={msg} />)}

        {fresh && (
          <div className="mt-2 animate-fade-in">
            <div className="flex items-center gap-1.5 mb-2.5 px-1">
              <Sparkles size={13} strokeWidth={1.6} className="text-primary" />
              <p className="eyebrow">Мысал сұрақтар</p>
            </div>
            <div className="flex flex-wrap gap-2 stagger">
              {EXAMPLES.map((q, i) => (
                <button key={i} type="button" onClick={() => send(q)}
                  className="text-xs text-text-1 bg-surface-2 border border-border rounded-full px-3 py-2 pressable">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="flex justify-start mb-3 animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-secondary-dim border border-secondary/30 flex items-center justify-center mr-2 flex-shrink-0">
              <Bot size={15} strokeWidth={1.8} className="text-secondary" />
            </div>
            <div className="card rounded-2xl rounded-bl-md px-4 py-3.5">
              <div className="flex gap-1.5">{[0, 1, 2].map(i => (
                <div key={i} className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: `${i * 0.18}s` }} />
              ))}</div>
            </div>
          </div>
        )}
        <div ref={endRef} className="h-1" />
      </div>

      <div className="px-4 pt-2 glass" style={{ borderLeft: 'none', borderRight: 'none', borderBottom: 'none', paddingBottom: 'calc(76px + max(8px, env(safe-area-inset-bottom)))' }}>
        <div className="flex items-end gap-2">
          <div className="flex-1 bg-surface-2 border border-border-strong rounded-2xl px-4 py-3 focus-within:border-secondary/60 transition-colors">
            <input ref={inputRef} type="text" value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Физика сұрағыңды жаз…"
              enterKeyHint="send"
              className="w-full bg-transparent text-text-1 text-sm outline-none placeholder:text-text-3" />
          </div>
          <button type="button" onClick={() => send()} disabled={!input.trim() || loading} aria-label="Жіберу"
            className="w-11 h-11 rounded-2xl bg-primary text-primary-ink flex items-center justify-center shadow-glow-primary disabled:opacity-30 disabled:shadow-none pressable flex-shrink-0">
            <Send size={18} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  )
}
