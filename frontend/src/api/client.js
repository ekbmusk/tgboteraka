import axios from 'axios'
import WebApp from '@twa-dev/sdk'
import { toast } from '../components/Toast'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
})

// Attach Telegram initData to every request for auth
client.interceptors.request.use((config) => {
  const initData = WebApp.initData
  if (initData) {
    config.headers['X-Telegram-Init-Data'] = initData
  }
  return config
})

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

client.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const cfg = error?.config || {}
    const status = error?.response?.status
    const isNetwork = !error?.response && error?.code !== 'ERR_CANCELED'

    // One quiet retry for idempotent requests that never reached the server —
    // Telegram WebViews drop the first request after a wake-up surprisingly often.
    if (isNetwork && cfg.method === 'get' && !cfg.__retried) {
      cfg.__retried = true
      await sleep(600)
      return client.request(cfg)
    }

    const detail = error?.response?.data?.detail
    let message
    if (isNetwork) {
      message = typeof navigator !== 'undefined' && navigator.onLine === false
        ? 'Интернет байланысы жоқ'
        : 'Сервермен байланыс жоқ. Қайталап көріңіз.'
    } else if (status >= 500) {
      message = 'Сервер қатесі. Кейінірек қайталаңыз.'
    } else {
      message = (typeof detail === 'string' && detail) || error?.message || 'Желі қатесі'
    }

    // Pages handle 4xx themselves (validation, not found); infrastructure failures get a toast.
    if (!cfg.silent && (isNetwork || status >= 500)) {
      isNetwork ? toast.offline(message) : toast.error(message)
    }

    const err = new Error(message)
    err.status = status
    err.isNetwork = isNetwork
    err.detail = detail
    return Promise.reject(err)
  }
)

export default client
