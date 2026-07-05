'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, CheckCircle2 } from 'lucide-react'

export function ContactPage() {
  const { user } = useAuth()
  const [name, setName] = useState(user?.username || '')
  const [email, setEmail] = useState(user?.email || '')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !message.trim()) return

    setLoading(true)
    try {
      // TODO: wire to a real endpoint (e.g. /api/v1/contact) once email
      // infrastructure is set up. For now the form just simulates submission.
      await new Promise((resolve) => setTimeout(resolve, 800))
      setSubmitted(true)
    } catch (error) {
      console.error('Contact form error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
        <CheckCircle2 className="h-10 w-10 text-zinc-900 mb-4" />
        <h1 className="text-xl font-bold text-zinc-900">Message sent</h1>
        <p className="text-zinc-500 text-sm mt-2 text-center max-w-sm">
          Thanks for reaching out. We&apos;ll get back to you by email.
        </p>
        <Button
          variant="outline"
          onClick={() => {
            setSubmitted(false)
            setMessage('')
          }}
          className="mt-6 border-zinc-200 text-zinc-700 hover:text-zinc-900"
        >
          Send another
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto p-4 md:p-6">
      <h1 className="text-xl font-bold text-zinc-900 mb-2">Contact</h1>
      <p className="text-zinc-500 text-sm mb-6">
        Found a bug, have a question, or want to say hi? Send a message.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-800 mb-1.5">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Your name"
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-800 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-800 mb-1.5">Message</label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            placeholder="What's on your mind?"
            className="bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400 min-h-[120px] resize-none text-sm focus-visible:ring-violet-600"
          />
        </div>

        <Button
          type="submit"
          disabled={loading || !name.trim() || !email.trim() || !message.trim()}
          className="bg-zinc-900 hover:bg-zinc-800 text-white font-medium px-6"
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
