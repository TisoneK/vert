'use client'

import { useState } from 'react'
import { useAuth, useNavigation } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, CheckCircle2, ArrowLeft } from 'lucide-react'

export function ContactPage() {
  const { user } = useAuth()
  const { navigate } = useNavigation()
  const [name, setName] = useState(user?.username || '')
  const [email, setEmail] = useState(user?.email || '')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !message.trim()) return

    setLoading(true)
    setError('')
    try {
      // Real submission — the endpoint validates, rate-limits, and captures the
      // message server-side (see /api/v1/contact). We only show the success
      // state on a genuine 2xx so the confirmation is truthful. (ADR-27)
      const res = await fetch('/api/v1/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      })
      if (res.ok) {
        setSubmitted(true)
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Could not send your message. Please try again.')
      }
    } catch {
      setError('Could not send your message. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
        <CheckCircle2 className="h-10 w-10 text-zinc-900 dark:text-zinc-100 mb-4" />
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Message sent</h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-2 text-center max-w-sm">
          Thanks for reaching out — we&apos;ve received your message and will follow up if it needs a reply.
        </p>
        <Button
          variant="outline"
          onClick={() => {
            setSubmitted(false)
            setMessage('')
          }}
          className="mt-6 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          Send another
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto p-4 md:p-6">
      {/* Back link */}
      <button
        onClick={() => navigate({ page: 'home' })}
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Contact</h1>
      <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6">
        Found a bug, have a question, or want to say hi? Send a message.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200 mb-1.5">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Your name"
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-base md:text-sm text-zinc-900 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-base md:text-sm text-zinc-900 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200 mb-1.5">Message</label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            placeholder="What's on your mind?"
            className="bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 min-h-[120px] resize-none text-sm focus-visible:ring-violet-600"
          />
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40 rounded-lg p-3">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        <Button
          type="submit"
          disabled={loading || !name.trim() || !email.trim() || !message.trim()}
          className="bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-medium px-6"
        >
          {loading ? (
            <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Send
            </>
          )}
        </Button>
      </form>
    </div>
  )
}
