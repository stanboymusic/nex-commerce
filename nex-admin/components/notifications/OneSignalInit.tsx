'use client'

import { useEffect } from 'react'

export default function OneSignalInit() {
  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID
    if (!appId) return
    const safariWebId = process.env.NEXT_PUBLIC_ONESIGNAL_SAFARI_WEB_ID
    ;(window as any).OneSignalDeferred = (window as any).OneSignalDeferred || []
    ;(window as any).OneSignalDeferred.push(async function (OneSignal: any) {
      await OneSignal.init({
        appId,
        safari_web_id: safariWebId || undefined,
        allowLocalhostAsSecureOrigin: true,
        notifyButton: { enable: true }
      })
    })
  }, [])

  return null
}
