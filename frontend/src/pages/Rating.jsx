import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import WebApp from '@twa-dev/sdk'
import { Trophy, Medal, Brain, RefreshCw, Crown } from 'lucide-react'
import TopBar from '../components/TopBar'
import EmptyState from '../components/EmptyState'
import Avatar from '../components/Avatar'
import { ratingAPI } from '../api/rating'
import { useUserStore } from '../store/userStore'

const PERIODS = [{ id: 'week', label: 'Апта' }, { id: 'month', label: 'Ай' }, { id: 'all', label: 'Барлығы' }]
const USER_ID_FALLBACK = /^User\s+\d+$/i
const PODIUM_COLORS = ['#FFB020', '#C9CED9', '#D08A5B']

function leaderName(leader) {
  const full = `${leader?.first_name?.trim() || ''} ${leader?.last_name?.trim() || ''}`.trim()
  if (full) return full
  const username = leader?.username?.trim()?.replace(/^@+/, '')
  if (username) return `@${username}`
  const apiName = (leader?.full_name || '').trim()
  if (apiName && !USER_ID_FALLBACK.test(apiName)) return apiName
  return 'Пайдаланушы'
}

function avatarUser(leader, name) {
  return { first_name: leader?.first_name || name, username: leader?.username, full_name: name, photo_url: leader?.photo_url }
}

function Podium({ top, meId }) {
  // Visual order 2 · 1 · 3
  const order = [top[1], top[0], top[2]]
  const heights = ['h-16', 'h-24', 'h-12']
  const ranks = [2, 1, 3]
  return (
    <div className="grid grid-cols-3 gap-2 items-end px-1 mb-4 stagger">
      {order.map((leader, i) => {
        if (!leader) return <div key={i} />
        const name = leaderName(leader)
        const isMe = leader.telegram_id === meId
        const color = PODIUM_COLORS[ranks[i] - 1]
        return (
          <div key={leader.telegram_id} className="flex flex-col items-center">
            {ranks[i] === 1 && <Crown size={18} className="text-primary mb-1" />}
            <Avatar user={avatarUser(leader, name)} size={ranks[i] === 1 ? 'lg' : 'md'} className="mb-1.5" />
            <p className={`text-xs font-semibold truncate max-w-full ${isMe ? 'text-primary' : 'text-text-1'}`}>{name}</p>
            <p className="text-2xs text-text-2 tnum mb-2">{leader.score} XP</p>
            <div className={`w-full ${heights[i]} rounded-t-xl border border-b-0 flex items-start justify-center pt-2`}
              style={{ background: `${color}1A`, borderColor: `${color}55` }}>
              <span className="display text-lg tnum" style={{ color }}>{ranks[i]}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function Rating() {
  const navigate = useNavigate()
  const { user } = useUserStore()
  const [leaders, setLeaders] = useState([])
  const [myRank, setMyRank] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [period, setPeriod] = useState('week')

  useEffect(() => {
    WebApp.BackButton.show()
    WebApp.BackButton.onClick(() => navigate('/'))
    return () => WebApp.BackButton.hide()
  }, [])

  const load = () => {
    setLoading(true); setError(null)
    ratingAPI.getLeaderboard({ period, telegram_id: user?.id })
      .then(d => { setLeaders(d.leaderboard ?? []); setMyRank(d.my_rank) })
      .catch(() => setError('Рейтинг жүктелмеді'))
      .finally(() => setLoading(false))
  }
  useEffect(load, [period, user?.id])

  const top = leaders.slice(0, 3)
  const rest = leaders.slice(3)
  const inTop = leaders.some(l => l.telegram_id === user?.id)

  return (
    <div className="min-h-screen page-enter">
      <TopBar showBack onBack={() => navigate('/')} title="Рейтинг" />
      <div className="px-4 pt-3 pb-6">
        <h1 className="display text-2xl text-text-1 mb-1">Рейтинг</h1>
        <p className="text-sm text-text-2 mb-4">Үздік оқушылар</p>

        <div className="flex gap-1 p-1 rounded-2xl bg-surface-2 border border-border mb-5">
          {PERIODS.map(p => (
            <button key={p.id} type="button" onClick={() => { setPeriod(p.id); WebApp.HapticFeedback.impactOccurred('light') }}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${p.id === period ? 'bg-primary text-primary-ink shadow-glow-primary' : 'text-text-2'}`}>
              {p.label}
            </button>
          ))}
        </div>

        {myRank && !inTop && (
          <div className="card p-4 mb-4 flex items-center justify-between" style={{ borderLeft: '3px solid #FFB020' }}>
            <div className="flex items-center gap-3">
              <Medal size={20} strokeWidth={1.6} className="text-primary" />
              <div>
                <p className="text-sm font-semibold text-text-1">Менің орным — #{myRank.rank}</p>
                <p className="text-xs text-text-2 tnum">{myRank.score} XP</p>
              </div>
            </div>
            <Trophy size={20} strokeWidth={1.6} className="text-primary/60" />
          </div>
        )}

        {error ? (
          <EmptyState Icon={RefreshCw} tone="danger" title={error} actionLabel="Қайталау" onAction={load} />
        ) : loading ? (
          <div className="space-y-2">{[0, 1, 2, 3, 4].map(i => <div key={i} className="skeleton h-16 rounded-2xl" />)}</div>
        ) : leaders.length === 0 ? (
          <EmptyState
            Icon={Trophy} tone="primary"
            title="Рейтинг әлі бос"
            description="Осы кезеңде тест тапсырған ешкім жоқ. Алғашқы болып шық!"
            actionLabel="Тест тапсыру" onAction={() => navigate('/test')}
          />
        ) : (
          <>
            <Podium top={top} meId={user?.id} />
            {rest.length > 0 && (
              <div className="card divide-y divide-border stagger">
                {rest.map((leader, i) => {
                  const isMe = leader.telegram_id === user?.id
                  const name = leaderName(leader)
                  const username = leader?.username?.trim()?.replace(/^@+/, '')
                  return (
                    <div key={leader.telegram_id} className={`flex items-center gap-3 px-4 py-3 ${isMe ? 'bg-primary-dim' : ''}`}>
                      <span className="w-6 text-center text-sm font-bold text-text-3 tnum flex-shrink-0">{i + 4}</span>
                      <Avatar size="md" user={avatarUser(leader, name)} className="flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        {username ? (
                          <a href={`https://t.me/${username}`} target="_blank" rel="noreferrer"
                            className={`text-sm font-semibold truncate block ${isMe ? 'text-primary' : 'text-text-1'}`}>@{username}</a>
                        ) : (
                          <p className={`text-sm font-semibold truncate ${isMe ? 'text-primary' : 'text-text-1'}`}>{name}</p>
                        )}
                        <p className="text-2xs text-text-3 flex items-center gap-1"><Brain size={10} strokeWidth={1.6} /> {leader.tests_taken} тест</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-text-1 tnum">{leader.score}</p>
                        <p className="text-[10px] text-text-3">XP</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
