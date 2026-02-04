'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/apiClient'
import { useAdminStore } from '@/store/admin.store'
import { Bell, BellOff } from 'lucide-react'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export default function NotificationToggle() {
  const { token } = useAdminStore()
  const [supported, setSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const isSupported = 'serviceWorker' in navigator && 'PushManager' in window
    setSupported(isSupported)
    if (typeof Notification !== 'undefined') {
      setPermission(Notification.permission)
    }
  }, [])

  useEffect(() => {
    if (!supported || !token) return
    const init = async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration()
        const sub = await reg?.pushManager.getSubscription()
        setEnabled(!!sub)
      } catch (_) {
        setEnabled(false)
      }
    }
    init()
  }, [supported, token])

  const enablePush = async () => {
    if (!token || !supported) return
    setLoading(true)
    try {
      const { data } = await apiClient.get('/push/public-key')
      const publicKey = data?.publicKey
      if (!publicKey) {
        alert('Push no configurado en el servidor.')
        return
      }

      const perm = Notification.permission === 'default'
        ? await Notification.requestPermission()
        : Notification.permission
      setPermission(perm)
      if (perm !== 'granted') return

      const registration = await navigator.serviceWorker.register('/sw.js')
      let subscription = await registration.pushManager.getSubscription()
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey)
        })
      }

      await apiClient.post('/push/subscribe', { subscription })
      setEnabled(true)
    } catch (error) {
      console.error('ADMIN_PUSH_ENABLE_ERROR:', error)
    } finally {
      setLoading(false)
    }
  }

  const disablePush = async () => {
    if (!token || !supported) return
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.getRegistration()
      const sub = await reg?.pushManager.getSubscription()
      if (sub) {
        await apiClient.post('/push/unsubscribe', { endpoint: sub.endpoint })
        await sub.unsubscribe()
      }
      setEnabled(false)
    } catch (error) {
      console.error('ADMIN_PUSH_DISABLE_ERROR:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!token) return null

  if (!supported) {
    return (
      <span className="text-xs text-gray-400 font-semibold">Notificaciones no compatibles</span>
    )
  }

  if (permission === 'denied') {
    return (
      <span className="text-xs text-red-500 font-semibold">Notificaciones bloqueadas</span>
    )
  }

  return (
    <button
      onClick={enabled ? disablePush : enablePush}
      disabled={loading}
      className={`inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${enabled ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-gray-50 text-gray-600 border-gray-200'}`}
      title={enabled ? 'Desactivar notificaciones' : 'Activar notificaciones'}
    >
      {enabled ? <Bell className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
      {enabled ? 'Notificaciones activas' : 'Activar notificaciones'}
    </button>
  )
}
