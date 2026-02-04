'use client'

import { useEffect } from 'react'
import { useAdminStore } from '@/store/admin.store'

declare global {
  interface Window {
    OneSignal?: any
  }
}

export default function OneSignalUserSync() {
  const { admin } = useAdminStore()

  useEffect(() => {
    if (!admin) return
    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID
    if (!appId) return
    if (!window.OneSignal) return

    window.OneSignal.push(function () {
      try {
        window.OneSignal.login(admin.id)
        window.OneSignal.User?.addTags?.({ role: 'ADMIN' })
      } catch (_) {
        // ignore onesignal errors
      }
    })
  }, [admin])

  return null
}
