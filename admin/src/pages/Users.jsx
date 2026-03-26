import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { adminAPI } from '../api/admin'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'

const formatUsername = (username) => (username ? `@${username}` : '-')
const formatDate = (iso) => {
  if (!iso) return '-'
  const d = new Date(iso)
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

const TABS = ['Жалпы', 'Тесттер', 'Прогресс', 'AI Чат']

function UserActivityModal({ userId, onClose }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState(0)

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    adminAPI.getUserActivity(userId)
      .then(setData)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [userId])

  if (!userId) return null

  const user = data?.user
  const summary = data?.summary

  return (
    <Modal open={true} onClose={onClose} title="Пайдаланушы мониторингі" width="max-w-4xl">
      {loading ? (
        <div className="text-center py-8 text-text-2">Жүктелуде...</div>
      ) : !data ? (
        <div className="text-center py-8 text-text-2">Деректер табылмады</div>
      ) : (
        <div className="space-y-4">
          {/* User header */}
          <div className="flex items-center gap-4 p-4 bg-surface rounded-xl border border-border">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-lg font-bold text-primary">
              {(user.first_name || '?')[0]}
            </div>
            <div className="flex-1">
              <p className="font-bold text-text-1">
                {[user.first_name, user.last_name].filter(Boolean).join(' ') || 'Белгісіз'}
              </p>
              <p className="text-sm text-text-2">{formatUsername(user.username)} &middot; ID: {user.telegram_id}</p>
            </div>
            <div className="text-right text-sm">
              <p className="text-text-2">Тіркелген: {formatDate(user.created_at)}</p>
              <p className="text-text-2">Соңғы белсенділік: {formatDate(user.last_activity)}</p>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="card p-3 text-center">
              <p className="text-2xl font-bold text-primary">{summary.total_tests}</p>
              <p className="text-xs text-text-2">Тесттер</p>
            </div>
            <div className="card p-3 text-center">
              <p className="text-2xl font-bold text-success">{summary.avg_score}%</p>
              <p className="text-xs text-text-2">Орташа балл</p>
            </div>
            <div className="card p-3 text-center">
              <p className="text-2xl font-bold text-warning">{user.streak}</p>
              <p className="text-xs text-text-2">Streak</p>
            </div>
            <div className="card p-3 text-center">
              <p className="text-2xl font-bold text-secondary">{summary.total_problems_solved}</p>
              <p className="text-xs text-text-2">Есептер</p>
            </div>
            <div className="card p-3 text-center">
              <p className="text-2xl font-bold text-info">{summary.ai_questions_asked}</p>
              <p className="text-xs text-text-2">AI сұрақтар</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-border">
            {TABS.map((t, i) => (
              <button
                key={t}
                onClick={() => setTab(i)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  i === tab ? 'border-primary text-primary' : 'border-transparent text-text-2 hover:text-text-1'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="min-h-[300px]">
            {tab === 0 && (
              <div className="grid gap-3 md:grid-cols-2">
                <div className="card p-4">
                  <p className="text-sm font-semibold text-text-1 mb-2">Профиль</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-text-2">Деңгей</span><span className="font-medium">{user.level}</span></div>
                    <div className="flex justify-between"><span className="text-text-2">Ұпай</span><span className="font-medium">{user.score}</span></div>
                    <div className="flex justify-between"><span className="text-text-2">Белсенді</span><span className={user.is_active ? 'text-success' : 'text-danger'}>{user.is_active ? 'Иә' : 'Жоқ'}</span></div>
                    <div className="flex justify-between"><span className="text-text-2">Ban</span><span className={user.is_banned ? 'text-danger' : 'text-success'}>{user.is_banned ? 'Иә' : 'Жоқ'}</span></div>
                  </div>
                </div>
                <div className="card p-4">
                  <p className="text-sm font-semibold text-text-1 mb-2">Тақырыптар прогресі</p>
                  {data.topic_progress.length > 0 ? (
                    <div className="space-y-2">
                      {data.topic_progress.map((tp) => (
                        <div key={tp.topic_id}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-text-2 truncate max-w-[60%]">{tp.topic_name}</span>
                            <span className="text-text-1 font-medium">{tp.completion_percent}%</span>
                          </div>
                          <div className="w-full h-2 bg-surface-2 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${tp.completion_percent}%`,
                                background: tp.completion_percent >= 70 ? '#43E97B' : tp.completion_percent >= 40 ? '#FFD93D' : '#6C63FF',
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-text-2">Прогресс жоқ</p>
                  )}
                </div>
              </div>
            )}

            {tab === 1 && (
              <div className="overflow-x-auto">
                {data.test_history.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-text-2 text-left">
                        <th className="py-2 px-3">#</th>
                        <th className="py-2 px-3">Күні</th>
                        <th className="py-2 px-3">Сұрақтар</th>
                        <th className="py-2 px-3">Дұрыс</th>
                        <th className="py-2 px-3">Нәтиже</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.test_history.map((t, i) => (
                        <tr key={t.id} className="border-b border-border/50 hover:bg-surface">
                          <td className="py-2 px-3 text-text-2">{i + 1}</td>
                          <td className="py-2 px-3">{formatDate(t.date)}</td>
                          <td className="py-2 px-3">{t.total_questions}</td>
                          <td className="py-2 px-3">{t.correct_answers}</td>
                          <td className="py-2 px-3">
                            <span className={`font-semibold ${t.percentage >= 70 ? 'text-success' : t.percentage >= 40 ? 'text-warning' : 'text-danger'}`}>
                              {t.percentage}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-center py-8 text-text-2">Тест тарихы жоқ</p>
                )}
              </div>
            )}

            {tab === 2 && (
              <div className="space-y-3">
                {data.topic_progress.length > 0 ? (
                  data.topic_progress.map((tp) => (
                    <div key={tp.topic_id} className="card p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold text-sm text-text-1">{tp.topic_name}</p>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          tp.completion_percent >= 70 ? 'bg-success/10 text-success' :
                          tp.completion_percent >= 40 ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary'
                        }`}>
                          {tp.completion_percent}%
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-surface-2 rounded-full overflow-hidden mb-2">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${tp.completion_percent}%`,
                            background: tp.completion_percent >= 70 ? '#43E97B' : tp.completion_percent >= 40 ? '#FFD93D' : '#6C63FF',
                          }}
                        />
                      </div>
                      <div className="flex gap-4 text-xs text-text-2">
                        <span>Шешілген есептер: <strong className="text-text-1">{tp.problems_solved}</strong></span>
                        <span>Соңғы жаңарту: {formatDate(tp.last_updated)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-8 text-text-2">Прогресс деректері жоқ</p>
                )}
              </div>
            )}

            {tab === 3 && (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {data.chat_history.length > 0 ? (
                  data.chat_history.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                        msg.role === 'user'
                          ? 'bg-primary/20 text-text-1 rounded-tr-sm'
                          : 'bg-surface border border-border text-text-2 rounded-tl-sm'
                      }`}>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        <p className="text-[10px] text-text-3 mt-1">{formatDate(msg.date)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-8 text-text-2">AI чат тарихы жоқ</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}

export default function Users() {
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [items, setItems] = useState([])
  const [filters, setFilters] = useState({ level: '', active: '', search: '' })
  const [activityUserId, setActivityUserId] = useState(null)

  const columns = useMemo(
    () => [
      { key: 'id', label: 'ID', sortable: true },
      { key: 'first_name', label: 'Аты' },
      { key: 'username', label: 'Username', render: (row) => formatUsername(row.username) },
      { key: 'score', label: 'Ұпай', sortable: true },
      { key: 'streak', label: 'Streak' },
      { key: 'level', label: 'Деңгей' },
      {
        key: 'is_active',
        label: 'Белсенді',
        render: (row) => (
          <span className={row.is_active ? 'text-success' : 'text-text-2'}>{row.is_active ? 'Иә' : 'Жоқ'}</span>
        ),
      },
    ],
    []
  )

  const load = async () => {
    try {
      const params = { page, page_size: 10 }
      if (filters.level) params.level = filters.level
      if (filters.active !== '') params.active = filters.active
      if (filters.search.trim()) params.q = filters.search.trim()

      const data = await adminAPI.getUsers(params)
      setItems(data.items || data.results || [])
      setTotal(data.total || data.meta?.total || 0)
    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(() => {
    load()
  }, [page, filters.level, filters.active, filters.search])

  const toggleBan = async (row) => {
    try {
      await adminAPI.toggleUserBan(row.id, { banned: !row.is_banned })
      toast.success('Ban статусы жаңарды')
      load()
    } catch (error) {
      toast.error(error.message)
    }
  }

  const toggleNotifications = async (row) => {
    try {
      await adminAPI.toggleNotifications(row.id, { notifications_enabled: !row.notifications_enabled })
      toast.success('Хабарландыру статусы жаңарды')
      load()
    } catch (error) {
      toast.error(error.message)
    }
  }

  const exportCSV = async () => {
    try {
      const blob = await adminAPI.exportUsers()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'users_export.csv'
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      toast.error(error.message)
    }
  }

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="grid gap-2 md:grid-cols-5">
          <input
            className="input md:col-span-2"
            placeholder="Аты немесе username..."
            value={filters.search}
            onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
          />
          <select
            className="input"
            value={filters.level}
            onChange={(event) => setFilters((prev) => ({ ...prev, level: event.target.value }))}
          >
            <option value="">Барлық деңгей</option>
            <option value="easy">Жеңіл</option>
            <option value="medium">Орта</option>
            <option value="hard">Күрделі</option>
          </select>
          <select
            className="input"
            value={filters.active}
            onChange={(event) => setFilters((prev) => ({ ...prev, active: event.target.value }))}
          >
            <option value="">Барлығы</option>
            <option value="true">Белсенді</option>
            <option value="false">Белсенді емес</option>
          </select>
          <button className="btn-secondary" onClick={exportCSV} type="button">
            CSV экспорт
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={items}
        page={page}
        pageSize={10}
        total={total}
        onPageChange={setPage}
        actions={(row) => (
          <div className="flex flex-wrap gap-2">
            <button className="btn-primary !px-3 !py-1.5" onClick={() => setActivityUserId(row.id)}>
              Мониторинг
            </button>
            <button className="btn-secondary !px-3 !py-1.5" onClick={() => toggleNotifications(row)}>
              {row.notifications_enabled ? 'Notif off' : 'Notif on'}
            </button>
            <button
              className={`rounded-lg px-3 py-1.5 text-white ${row.is_banned ? 'bg-success' : 'bg-danger'}`}
              onClick={() => toggleBan(row)}
            >
              {row.is_banned ? 'Unban' : 'Ban'}
            </button>
          </div>
        )}
      />

      <UserActivityModal
        userId={activityUserId}
        onClose={() => setActivityUserId(null)}
      />
    </div>
  )
}
