'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

const STORAGE_KEY = 'wh_saved_login'

export default function LoginPage() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Load saved credentials on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const { email: savedEmail, password: savedPassword } = JSON.parse(saved)
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPhone(savedEmail ?? '')
        setPassword(savedPassword ?? '')
        setRemember(true)
      }
    } catch {
      // ignore
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (remember) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ email: phone, password }))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }

    const supabase = createClient()
    const fakeEmail = `${phone}@warehouse.local`
    const { error: authError } = await supabase.auth.signInWithPassword({ email: fakeEmail, password })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    router.replace('/')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center overflow-hidden relative">
      {/* Dot-grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(rgba(0,0,0,0.12) 1.5px, transparent 1.5px)',
          backgroundSize: '20px 20px',
        }}
      />
      <div className="absolute -top-48 -left-48 w-[500px] h-[500px] rounded-full bg-black/[0.03] blur-3xl pointer-events-none" />
      <div className="absolute -bottom-48 -right-48 w-[500px] h-[500px] rounded-full bg-black/[0.03] blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-[360px] mx-5">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-[18px] flex items-center justify-center shadow-lg mb-4 overflow-hidden bg-white/10">
            <img src="/logo.svg" alt="Warehouse Tracker Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Warehouse OPs</h1>
          <p className="text-sm text-foreground/50 mt-1">Field Operations Platform</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl shadow-2xl shadow-black/[0.08] p-6">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-foreground/40 text-center mb-6">
            Secure Sign In
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="phone" className="text-xs font-medium text-foreground/60">
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="1234567890"
                required
                autoComplete="tel"
                pattern="[0-9]*"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full bg-background border border-border rounded-lg px-3.5 py-2.5 text-sm text-foreground placeholder:text-foreground/25 outline-none focus:border-foreground/30 focus:ring-2 focus:ring-foreground/[0.07] transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs font-medium text-foreground/60">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3.5 py-2.5 text-sm text-foreground placeholder:text-foreground/25 outline-none focus:border-foreground/30 focus:ring-2 focus:ring-foreground/[0.07] transition-all"
              />
            </div>

            {/* Remember me */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none w-fit">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-4 h-4 rounded border transition-all ${remember ? 'bg-foreground border-foreground' : 'bg-background border-border'}`}>
                  {remember && (
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-background absolute top-0.5 left-0.5">
                      <polyline points="2 6 5 9 10 3" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-xs text-foreground/50">Remember my details</span>
            </label>

            {error && (
              <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-px">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-1 bg-foreground text-background text-sm font-semibold py-2.5 rounded-lg hover:opacity-80 active:opacity-70 transition-opacity disabled:opacity-40"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-[10px] text-foreground/25 text-center mt-5 leading-relaxed">
            Access is role-restricted. Contact your supervisor if you cannot log in.
          </p>
        </div>
      </div>
    </div>
  )
}
