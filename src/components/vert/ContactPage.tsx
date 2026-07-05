'use client'

import { useState } from 'react'
import { useAuth, useNavigation } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, CheckCircle2, ArrowLeft, Mail, MessageSquare, User } from 'lucide-react'

export function ContactPage() {
  const { user } = useAuth()
  const { navigate } = useNavigation()
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
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 animate-vert-fade-in">
        <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-5">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-zinc-900">Message sent</h1>
        <p className="text-zinc-500 text-sm mt-2 text-center max-w-sm">
          Thanks for reaching out. We&apos;ll get back to you by email shortly.
        </p>
        <div className="flex items-center gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => {
              setSubmitted(false)
              setMessage('')
            }}
            className="border-zinc-200 text-zinc-700 hover:text-zinc-900"
          >
            Send another
          </Button>
          <Button
            onClick={() => navigate({ page: 'home' })}
            className="bg-violet-600 hover:bg-violet-700 text-white font-medium"
          >
            Back to home
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto p-4 md:p-6 animate-vert-fade-in">
      {/* Back link */}
      <button
        onClick={() => navigate({ page: 'home' })}
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors mb-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 rounded"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 tracking-tight">Contact</h1>
        <p className="text-zinc-500 text-sm mt-2 leading-relaxed">
          Found a bug, have a question, or want to say hi? Send us a message and
          we&apos;ll get back to you.
        </p>
      </div>

      {/* Quick info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-50 border border-zinc-100">
          <div className="w-9 h-9 rounded-lg bg-white border border-zinc-200 flex items-center justify-center shrink-0">
            <Mail className="h-4 w-4 text-violet-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Email</p>
            <p className="text-sm font-medium text-zinc-900 truncate">hello@vert.app</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-50 border border-zinc-100">
          <div className="w-9 h-9 rounded-lg bg-white border border-zinc-200 flex items-center justify-center shrink-0">
            <MessageSquare className="h-4 w-4 text-violet-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Response time</p>
            <p className="text-sm font-medium text-zinc-900 truncate">Usually within 24h</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="contact-name" className="block text-sm font-medium text-zinc-800 mb-1.5">
              Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
              <input
                id="contact-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Your name"
                className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent transition-colors"
              />
            </div>
          </div>
          <div>
            <label htmlFor="contact-email" className="block text-sm font-medium text-zinc-800 mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
              <input
                id="contact-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent transition-colors"
              />
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="contact-message" className="block text-sm font-medium text-zinc-800 mb-1.5">
            Message
          </label>
          <Textarea
            id="contact-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            placeholder="What's on your mind?"
            className="bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400 min-h-[140px] resize-none text-sm focus-visible:ring-violet-600"
          />
        </div>

        <Button
          type="submit"
          disabled={loading || !name.trim() || !email.trim() || !message.trim()}
          className="bg-violet-600 hover:bg-violet-700 text-white font-medium px-6 active:scale-95 transition-transform duration-100"
        >
          {loading ? (
            <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Send message
            </>
          )}
        </Button>
      </form>
    </div>
  )
}
