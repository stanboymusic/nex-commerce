'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/apiClient'
import { useAdminStore } from '@/store/admin.store'
import { LogIn, Mail, Lock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const setAdmin = useAdminStore((state) => state.setAdmin)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await api.post('/auth/login', { email, password })

      if (response.data.user.role !== 'ADMIN') {
        setError('Solo administradores pueden acceder')
        return
      }

      setAdmin(response.data.user, response.data.token)

      // Set the token cookie for middleware access (still useful for local requests)
      document.cookie = `token=${response.data.token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`

      router.push('/dashboard')
      router.refresh()
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } }
        setError(axiosErr.response?.data?.error || 'Error al iniciar sesión')
      } else {
        setError('Error al iniciar sesión')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-muted">
      <Card className="max-w-md w-full p-8 shadow-2xl" footer={
        <p className="text-center text-sm text-text-medium">
          ¿No eres administrador?{' '}
          <a href="https://nex-users.vercel.app" className="text-purple hover:underline font-bold">
            Ir a tienda
          </a>
        </p>
      }>
        <div className="text-center mb-8">
          <div className="bg-purple/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogIn className="h-8 w-8 text-purple" />
          </div>
          <h1 className="text-3xl font-bold text-oxford tracking-tight">NexAdmin</h1>
          <p className="text-text-medium text-sm mt-2 font-medium">Acceso exclusivo para administradores</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-lg text-error text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Correo Electrónico"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@nexcommerce.com"
            leftIcon={<Mail className="h-5 w-5" />}
            required
          />

          <Input
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            leftIcon={<Lock className="h-5 w-5" />}
            required
          />

          <Button
            type="submit"
            isLoading={loading}
            className="w-full text-lg py-6"
            leftIcon={!loading && <LogIn className="h-5 w-5" />}
          >
            Iniciar Sesión
          </Button>
        </form>
      </Card>
    </div>
  )
}
