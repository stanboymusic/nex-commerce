import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/styles/globals.css'
import Script from 'next/script'
import OneSignalInit from '@/components/notifications/OneSignalInit'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'NexAdmin | NexCommerce',
  description: 'Sistema administrativo de NexCommerce',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <Script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" strategy="afterInteractive" />
        <OneSignalInit />
        {children}
      </body>
    </html>
  )
}
