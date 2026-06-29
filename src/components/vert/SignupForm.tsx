'use client'

import { useState } from 'react'
import { useAuth, useNavigation } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UserPlus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { signIn } from 'next-auth/react'
import { Logo } from './Logo'

export function SignupForm() {
  const { navigate } = useNavigation()
  const { setUser } = useAuth()
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
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
          const sessionRes = await fetch('/api/auth/session-info')
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
    <div className="flex items-center justify-center min-h-[80vh] p-4 animate-vert-fade-in">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo size={48} className="mx-auto mb-4" />
          <h1 className="text-xl font-bold text-zinc-900">Create your channel</h1>
          <p className="text-zinc-500 text-sm mt-1">Join Vert and start sharing portrait video</p>
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
              className="bg-zinc-100 border-zinc-300 text-zinc-800 placeholder:text-zinc-400 focus-visible:ring-violet-600"
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
              className="bg-zinc-100 border-zinc-300 text-zinc-800 placeholder:text-zinc-400 focus-visible:ring-violet-600"
              required
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-zinc-600 mb-2 block text-sm">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="bg-zinc-100 border-zinc-300 text-zinc-800 placeholder:text-zinc-400 focus-visible:ring-violet-600"
              required
            />
          </div>

          <div>
            <Label htmlFor="confirm-password" className="text-zinc-600 mb-2 block text-sm">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              className="bg-zinc-100 border-zinc-300 text-zinc-800 placeholder:text-zinc-400 focus-visible:ring-violet-600"
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
          <p className="text-zinc-700 text-sm">
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
