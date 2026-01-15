'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth.store'
import { useCartStore } from '@/store/cart.store'
import axios from 'axios'
import { LogIn, Loader2, Mail, Lock, Phone, MessageSquare } from 'lucide-react'

function LoginContent() {
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email')
  const [step, setStep] = useState<'request' | 'verify'>('request')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'
  const setAuth = useAuthStore(state => state.setAuth)
  const loadCart = useCartStore(state => state.loadFromBackend)

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await axios.post('/api/auth/login', { email, password })
      setAuth(response.data.user, response.data.token)

      if (response.data.user.role === 'ADMIN') {
        window.location.href = 'https://nex-admin.vercel.app'
      } else {
        await loadCart()
        router.push(redirect || '/catalog')
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || 'Error al iniciar sesión')
      } else {
        setError('Error al iniciar sesión')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await axios.post('/api/auth/otp/send', { phone })
      setStep('verify')
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || 'Error al enviar OTP')
      } else {
        setError('Error al enviar OTP')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await axios.post('/api/auth/otp/verify', { phone, code })
      setAuth(response.data.user, response.data.token)

      if (response.data.user.role === 'ADMIN') {
        window.location.href = 'https://nex-admin.vercel.app'
      } else {
        await loadCart()
        router.push(redirect || '/catalog')
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || 'Código inválido o expirado')
      } else {
        setError('Código inválido o expirado')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 bg-muted">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <div className="bg-oxford/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogIn className="h-8 w-8 text-oxford" />
          </div>
          <h1 className="text-2xl font-bold text-oxford">Acceso a NexCommerce</h1>
          <p className="text-gray-500 text-sm mt-2">Elige tu método preferido de ingreso</p>
        </div>

        {/* Method Toggle */}
        <div className="flex bg-muted p-1 rounded-xl mb-8">
          <button
            onClick={() => { setLoginMethod('email'); setError(null); }}
            className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${loginMethod === 'email' ? 'bg-white text-oxford shadow-sm' : 'text-gray-500'}`}
          >
            Email
          </button>
          <button
            onClick={() => { setLoginMethod('phone'); setError(null); }}
            className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${loginMethod === 'phone' ? 'bg-white text-oxford shadow-sm' : 'text-gray-500'}`}
          >
            Teléfono
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 mb-6">
            {error}
          </div>
        )}

        {loginMethod === 'email' ? (
          <form onSubmit={handleEmailLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-oxford mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-almond transition-all text-oxford"
                  placeholder="tu@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-oxford mb-2">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-almond transition-all text-oxford"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-oxford text-white py-4 rounded-xl font-bold text-lg hover:bg-navy transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Entrar'}
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            {step === 'request' ? (
              <form onSubmit={handleSendOTP} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-oxford mb-2">Número de Teléfono</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-almond transition-all text-oxford"
                      placeholder="+58 412..."
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-oxford text-white py-4 rounded-xl font-bold text-lg hover:bg-navy transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Enviar Código'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-6">
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-500">Hemos enviado un código a {phone}</p>
                  <button
                    type="button"
                    onClick={() => setStep('request')}
                    className="text-xs text-navy font-bold hover:underline mt-1"
                  >
                    Cambiar número
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-bold text-oxford mb-2">Código de Verificación</label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-almond transition-all text-center text-2xl tracking-widest font-bold text-oxford"
                      placeholder="000000"
                      maxLength={6}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-oxford text-white py-4 rounded-xl font-bold text-lg hover:bg-navy transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Verificar y Entrar'}
                </button>
              </form>
            )}
          </div>
        )}

        <p className="text-center mt-8 text-sm text-gray-600">
          ¿No tienes cuenta? <Link href="/register" className="text-navy font-bold hover:underline">Regístrate</Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}
