'use client'

import { useEffect, useRef, useState } from 'react'
import { apiClient } from '@/lib/apiClient'
import { Bell } from 'lucide-react'
import { useAdminStore } from '@/store/admin.store'

interface Toast {
  id: string
  title: string
  message?: string
  createdAt: number
}

function playBeep() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContext) return
    const ctx = new AudioContext()
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.value = 880
    gain.gain.value = 0.05
    oscillator.connect(gain)
    gain.connect(ctx.destination)
    oscillator.start()
    oscillator.stop(ctx.currentTime + 0.12)
    oscillator.onended = () => {
      ctx.close().catch(() => undefined)
    }
  } catch (_) {
    // ignore audio errors
  }
}

export default function RealtimeNotifications() {
  const { token } = useAdminStore()
  const [toasts, setToasts] = useState<Toast[]>([])
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const initializedRef = useRef(false)

  useEffect(() => {
    if (!token) return

    const key = 'nex_admin_last_order'

    const fetchOrders = async () => {
      try {
        const response = await apiClient.get('/admin/orders')
        const orders = response.data || []
        const mapped = orders.map((order: any) => ({
          id: order.id,
          createdAt: new Date(order.created).getTime(),
          title: 'Nueva orden recibida',
          message: `Orden #${order.id.slice(0, 8)}`
        }))

        if (!initializedRef.current) {
          const latest = mapped.reduce((max: number, o: any) => Math.max(max, o.createdAt || 0), 0)
          localStorage.setItem(key, String(latest || Date.now()))
          initializedRef.current = true
          return
        }

        const lastSeen = Number(localStorage.getItem(key) || 0)
        const fresh = mapped.filter((o: any) => o.createdAt && o.createdAt > lastSeen)
        if (fresh.length) {
          const maxSeen = fresh.reduce((max: number, o: any) => Math.max(max, o.createdAt), lastSeen)
          localStorage.setItem(key, String(maxSeen))
          setToasts((prev) => {
            const next = [...fresh, ...prev]
            return next.slice(0, 4)
          })
          playBeep()
        }
      } catch (_) {
        // ignore polling errors
      }
    }

    fetchOrders()
    pollingRef.current = setInterval(fetchOrders, 20000)

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [token])

  useEffect(() => {
    if (!toasts.length) return
    const timers = toasts.map((toast) =>
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id))
      }, 6000)
    )

    return () => {
      timers.forEach(clearTimeout)
    }
  }, [toasts])

  if (!token) return null

  return (
    <div className="fixed left-6 bottom-6 z-50 flex flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="bg-white border border-gray-100 shadow-lg rounded-2xl px-4 py-3 w-[280px] animate-in fade-in slide-in-from-bottom-4"
        >
          <div className="flex items-center gap-2 text-oxford font-bold text-sm">
            <Bell className="h-4 w-4 text-purple" />
            {toast.title}
          </div>
          {toast.message && (
            <p className="text-xs text-gray-500 mt-1">{toast.message}</p>
          )}
        </div>
      ))}
    </div>
  )
}
