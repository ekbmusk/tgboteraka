import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import WebApp from '@twa-dev/sdk'
import { useUserStore } from './store/userStore'
import client from './api/client'
import BottomNav from './components/BottomNav'
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


function AppInner() {
  const { user } = useUserStore()
  const isAdmin = user && (user.is_admin || ADMIN_IDS.includes(user.id))

  return (
    <div className="min-h-screen bg-bg text-text-1 flex flex-col">
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
    WebApp.setHeaderColor('#0F0F1A')
    WebApp.setBackgroundColor('#0F0F1A')
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
        })
        .then((registered) => {
          if (!registered) return
          setUser({
            ...user,
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
    return <Onboarding onComplete={() => setOnboardingDone(true)} />
  }

  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  )
}
