'use client'

import { useEffect } from 'react'
import { apiClient } from '@/lib/apiClient'
import { useAdminStore } from '@/store/admin.store'

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

export default function PushSubscriptionManager() {
  const { token } = useAdminStore()

  useEffect(() => {
    if (!token) return
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

    const register = async () => {
      try {
        const { data } = await apiClient.get('/push/public-key')
        const publicKey = data?.publicKey
        if (!publicKey) return

        const permission = Notification.permission === 'default'
          ? await Notification.requestPermission()
          : Notification.permission
        if (permission !== 'granted') return

        const registration = await navigator.serviceWorker.register('/sw.js')
        let subscription = await registration.pushManager.getSubscription()
        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey)
          })
        }

        await apiClient.post('/push/subscribe', { subscription })
      } catch (error) {
        console.error('ADMIN_PUSH_SUBSCRIBE_ERROR:', error)
      }
    }

    register()
  }, [token])

  return null
}
