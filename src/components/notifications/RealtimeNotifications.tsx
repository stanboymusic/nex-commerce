'use client'

import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { useAuthStore } from '@/store/auth.store'
import { Bell } from 'lucide-react'

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
  const { user, token } = useAuthStore()
  const [toasts, setToasts] = useState<Toast[]>([])
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const initializedRef = useRef(false)

  useEffect(() => {
    if (!user || !token) return

    const key = 'nex_users_last_event'

    const fetchEvents = async () => {
      try {
        const response = await axios.get('/api/orders', {
          headers: { Authorization: `Bearer ${token}` }
        })

        const orders = response.data || []
        const events = orders.flatMap((order: any) =>
          (order.statusHistory || []).map((event: any) => ({
            id: event.id,
            title: event.message || 'Actualización de pedido',
            message: `Orden #${order.id.slice(-6).toUpperCase()}`,
            createdAt: new Date(event.createdAt || event.created).getTime()
          }))
        )

        if (!initializedRef.current) {
          const latest = events.reduce((max: number, ev: any) => Math.max(max, ev.createdAt || 0), 0)
          localStorage.setItem(key, String(latest || Date.now()))
          initializedRef.current = true
          return
        }

        const lastSeen = Number(localStorage.getItem(key) || 0)
        const fresh = events.filter((ev: any) => ev.createdAt && ev.createdAt > lastSeen)
        if (fresh.length) {
          const maxSeen = fresh.reduce((max: number, ev: any) => Math.max(max, ev.createdAt), lastSeen)
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

    fetchEvents()
    pollingRef.current = setInterval(fetchEvents, 20000)

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [user, token])

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

  if (!user) return null

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
