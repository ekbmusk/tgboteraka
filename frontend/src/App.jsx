import { Component, useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import WebApp from '@twa-dev/sdk'
import { RefreshCw } from 'lucide-react'
import { useUserStore } from './store/userStore'
import client from './api/client'
import BottomNav from './components/BottomNav'
import ToastHost from './components/Toast'
import Button from './components/Button'
import Onboarding from './pages/Onboarding'
import Home from './pages/Home'
import Theory from './pages/Theory'
import Problems from './pages/Problems'
import Test from './pages/Test'
import Progress from './pages/Progress'
import Rating from './pages/Rating'
import AskAI from './pages/AskAI'
import Help from './pages/Help'
import Lab from './pages/Lab'
import Admin, { ADMIN_IDS } from './pages/Admin'

const CHROME = '#0A0D14'

/** Last line of defence: a render crash shows a retry card instead of a blank screen. */
class ErrorBoundary extends Component {
  state = { error: null }
  static getDerivedStateFromError(error) { return { error } }
  componentDidCatch(error) { console.error('[ui]', error) }
  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-8 text-center">
        <p className="display text-lg text-text-1 mb-2">Бірдеңе бұзылды</p>
        <p className="text-sm text-text-2 mb-6">Экранды қайта жүктеп көріңіз.</p>
        <div className="w-48">
          <Button icon={<RefreshCw size={16} />} onClick={() => window.location.reload()}>Қайта жүктеу</Button>
        </div>
      </div>
    )
  }
}

/** Each route starts at the top; a chat that was scrolled to the bottom must not leak into the next page. */
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [pathname])
  return null
}

function AppInner() {
  const { user } = useUserStore()
  const isAdmin = user && (user.is_admin || ADMIN_IDS.includes(user.id))

  return (
    <div className="min-h-screen text-text-1 flex flex-col">
      <ScrollToTop />
      <div className="flex-1 pb-nav">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/theory" element={<Theory />} />
          <Route path="/problems" element={<Problems />} />
          <Route path="/test" element={<Test />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/rating" element={<Rating />} />
          <Route path="/ask-ai" element={<AskAI />} />
          <Route path="/help" element={<Help />} />
          <Route path="/lab" element={<Lab />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </div>
      <BottomNav isAdmin={isAdmin} />
      <ToastHost />
    </div>
  )
}

export default function App() {
  const { setUser } = useUserStore()
  const [onboardingDone, setOnboardingDone] = useState(
    () => localStorage.getItem('onboarding_completed') === 'true'
  )

  useEffect(() => {
    WebApp.ready()
    WebApp.expand()
    try {
      WebApp.setHeaderColor(CHROME)
      WebApp.setBackgroundColor(CHROME)
    } catch { /* older clients */ }

    const tgUser = WebApp.initDataUnsafe?.user
    if (tgUser) {
      const baseURL = import.meta.env.VITE_API_URL || '/api'
      const proxyAvatarUrl = `${baseURL}/users/${tgUser.id}/avatar`
      const user = {
        ...tgUser,
        photo_url: tgUser.photo_url || tgUser.photoUrl || proxyAvatarUrl,
      }
      setUser(user)
      client.post('/users/register', {
        telegram_id: user.id,
        username: user.username ?? null,
        photo_url: (tgUser.photo_url || tgUser.photoUrl) ?? null,
        first_name: user.first_name ?? null,
        last_name: user.last_name ?? null,
        language_code: user.language_code ?? 'kk',
      }, { silent: true })
        .then((registered) => {
          if (!registered) return
          setUser({
            ...user,
            ...registered,
            id: user.id,
            first_name: registered.first_name ?? user.first_name,
            last_name: registered.last_name ?? user.last_name,
            username: registered.username ?? user.username,
            photo_url: user.photo_url || registered.photo_url || proxyAvatarUrl,
          })
        })
        .catch(() => { })
    }
  }, [])

  if (!onboardingDone) {
    return (
      <ErrorBoundary>
        <Onboarding onComplete={() => setOnboardingDone(true)} />
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppInner />
      </BrowserRouter>
    </ErrorBoundary>
  )
}
