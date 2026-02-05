import { useEffect } from 'react'
import axios from 'axios'
import { useAuthStore } from '@/store/auth.store'

export function useRefreshCurrentUser() {
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)
  const setAuth = useAuthStore((state) => state.setAuth)

  useEffect(() => {
    if (!user?.id || !token) return

    let cancelled = false
    axios
      .get(`/api/users/${user.id}`)
      .then((res) => {
        if (cancelled) return
        const incoming = res.data
        if (!incoming?.id) return

        const shouldUpdate =
          incoming.isVip !== user.isVip ||
          incoming.role !== user.role ||
          incoming.name !== user.name ||
          incoming.email !== user.email

        if (shouldUpdate) {
          setAuth({ ...user, ...incoming }, token)
        }
      })
      .catch(() => {
        // Silent fail: don't block UI if refresh fails
      })

    return () => {
      cancelled = true
    }
  }, [user?.id, token])
}
