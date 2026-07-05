'use client'

import { fetchWithRetry } from '@/lib/fetch-retry'
import { useState } from 'react'
import { useAuth, useNavigation } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UserPlus, Eye, EyeOff } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { signIn } from 'next-auth/react'

export function SignupForm() {
  const { navigate } = useNavigation()
  const { setUser } = useAuth()
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password }),
      })

      const data = await res.json()

      if (res.ok) {
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        })

        if (result?.ok) {
          const sessionRes = await fetchWithRetry('/api/auth/session-info')
          const sessionData = await sessionRes.json()

          if (sessionData.user) {
            setUser(sessionData.user)
            toast({
              title: 'Account created!',
              description: `Welcome to Vert, ${sessionData.user.username}!`,
            })
            navigate({ page: 'home' })
          }
        } else {
          toast({
            title: 'Account created!',
            description: 'Please log in with your new credentials.',
          })
          navigate({ page: 'login' })
        }
      } else {
        setError(data.error || 'Registration failed')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md bg-white border border-zinc-200 shadow-sm rounded-2xl p-8">
        <div className="text-center mb-8">
          <button
            onClick={() => navigate({ page: 'home' })}
            className="text-2xl font-bold text-zinc-900 tracking-tight"
          >
            Vert
          </button>
          <h1 className="text-xl font-bold text-zinc-900 mt-4">Create your channel</h1>
          <p className="text-zinc-500 text-sm mt-1">Join Vert and start sharing portrait video</p>
        </div>

        {/* Google sign-in */}
        <button
          onClick={() => signIn('google', { callbackUrl: '/' })}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-zinc-300 rounded-lg text-sm font-medium text-zinc-700 bg-white hover:bg-zinc-50 transition-colors active:scale-95 duration-100"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-zinc-200" />
          <span className="text-xs text-zinc-400">or</span>
          <div className="flex-1 h-px bg-zinc-200" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-zinc-600 mb-2 block text-sm">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="bg-zinc-50 border-zinc-200 text-zinc-800 placeholder:text-zinc-400 focus-visible:ring-violet-600"
              required
            />
          </div>

          <div>
            <Label htmlFor="username" className="text-zinc-600 mb-2 block text-sm">Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username"
              className="bg-zinc-50 border-zinc-200 text-zinc-800 placeholder:text-zinc-400 focus-visible:ring-violet-600"
              required
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-zinc-600 mb-2 block text-sm">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="bg-zinc-50 border-zinc-200 text-zinc-800 placeholder:text-zinc-400 focus-visible:ring-violet-600 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-zinc-400 hover:text-zinc-700 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="confirm-password" className="text-zinc-600 mb-2 block text-sm">Confirm Password</Label>
            <Input
              id="confirm-password"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              className="bg-zinc-50 border-zinc-200 text-zinc-800 placeholder:text-zinc-400 focus-visible:ring-violet-600"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || !email || !username || !password || !confirmPassword}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-medium active:scale-95 transition-transform duration-100"
          >
            {loading ? (
              <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Create Account
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-zinc-500 text-sm">
            Already have an account?{' '}
            <button
              onClick={() => navigate({ page: 'login' })}
              className="text-violet-600 hover:text-violet-700 font-medium"
            >
              Log In
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
