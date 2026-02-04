'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth.store'

declare global {
  interface Window {
    OneSignal?: any
  }
}

export default function OneSignalUserSync() {
  const { user } = useAuthStore()

  useEffect(() => {
    if (!user) return
    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID
    if (!appId) return
    if (!window.OneSignal) return

    window.OneSignal.push(function () {
      try {
        window.OneSignal.login(user.id)
        window.OneSignal.User?.addTags?.({ role: user.role || 'USER' })
      } catch (_) {
        // ignore onesignal errors
      }
    })
  }, [user])

  return null
}
