'use client'

import { useEffect } from 'react'

declare global {
  interface Window {
    OneSignal?: any
  }
}

export default function OneSignalInit() {
  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID
    if (!appId) return

    window.OneSignal = window.OneSignal || []
    window.OneSignal.push(function () {
      window.OneSignal.init({
        appId,
        allowLocalhostAsSecureOrigin: true,
        notifyButton: { enable: false }
      })
    })
  }, [])

  return null
}
