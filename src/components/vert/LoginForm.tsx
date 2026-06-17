'use client'

import { useState } from 'react'
import { useAuth, useNavigation } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LogIn } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { signIn } from 'next-auth/react'

export function LoginForm() {
  const { navigate } = useNavigation()
  const { setUser } = useAuth()
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password')
      } else {
        const sessionRes = await fetch('/api/auth/session-info')
        const sessionData = await sessionRes.json()

        if (sessionData.user) {
          setUser(sessionData.user)
          toast({
            title: 'Welcome back!',
            description: `Logged in as ${sessionData.user.username}`,
          })
          navigate({ page: 'home' })
        } else {
          setError('Failed to retrieve session after login')
        }
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
          <span className="text-2xl font-bold text-zinc-900">Vert</span>
          <h1 className="text-xl font-bold text-zinc-900 mt-3">Welcome Back</h1>
          <p className="text-zinc-700 text-sm mt-1">Log in to your Vert account</p>
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
            <Label htmlFor="password" className="text-zinc-600 mb-2 block text-sm">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
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
            disabled={loading || !email || !password}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-medium active:scale-95 transition-transform duration-100"
          >
            {loading ? (
              <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="h-4 w-4 mr-2" />
                Log In
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-zinc-700 text-sm">
            Don&apos;t have an account?{' '}
            <button
              onClick={() => navigate({ page: 'signup' })}
              className="text-violet-600 hover:text-violet-700 font-medium"
            >
              Sign Up
            </button>
          </p>
        </div>

        <div className="mt-8 p-4 bg-zinc-50 rounded-lg border border-zinc-200">
          <p className="text-zinc-700 text-xs mb-2">Demo Accounts:</p>
          <div className="space-y-1 text-xs text-zinc-700">
            <p>Admin: admin@vert.com / admin123</p>
            <p>User: user1@vert.com / password123</p>
          </div>
        </div>
      </div>
    </div>
  )
}
