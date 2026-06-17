'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Mail,
  MessageSquare,
  Send,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
} from 'lucide-react'

export function ContactPage() {
  const { user } = useAuth()
  const [name, setName] = useState(user?.username || '')
  const [email, setEmail] = useState(user?.email || '')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [category, setCategory] = useState('general')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const categories = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'bug', label: 'Bug Report' },
    { value: 'feature', label: 'Feature Request' },
    { value: 'content', label: 'Content Issue' },
    { value: 'account', label: 'Account Problem' },
    { value: 'partnership', label: 'Partnership / Business' },
    { value: 'copyright', label: 'Copyright / DMCA' },
    { value: 'other', label: 'Other' },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !message.trim()) return

    setLoading(true)
    try {
      // In production this would POST to an API endpoint
      // For now, simulate submission
      await new Promise((resolve) => setTimeout(resolve, 1000))
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
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-zinc-900">Message Sent!</h2>
        <p className="text-zinc-700 text-sm mt-2 text-center max-w-md">
          Thank you for reaching out. We typically respond within 24–48 hours. Check your email for a confirmation.
        </p>
        <Button
          onClick={() => {
            setSubmitted(false)
            setMessage('')
            setSubject('')
            setCategory('general')
          }}
          className="mt-6 bg-violet-600 hover:bg-violet-700 text-white font-medium active:scale-95 transition-transform duration-100"
        >
          Send Another Message
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 animate-vert-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
          <Mail className="h-5 w-5 text-violet-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Contact Us</h1>
          <p className="text-zinc-700 text-sm">We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        {/* Contact form */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name & Email row */}
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

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-zinc-800 mb-1.5">Category</label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      category === cat.value
                        ? 'bg-violet-100 text-violet-700 border border-violet-200'
                        : 'bg-zinc-100 text-zinc-600 border border-transparent hover:bg-zinc-200 hover:text-zinc-800'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-zinc-800 mb-1.5">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                placeholder="Brief summary of your message"
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent transition-colors"
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-zinc-800 mb-1.5">Message</label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                placeholder="Tell us more about your inquiry..."
                className="bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400 min-h-[120px] resize-none text-sm focus-visible:ring-violet-600"
              />
            </div>

            <Button
              type="submit"
              disabled={loading || !name.trim() || !email.trim() || !message.trim()}
              className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 text-white font-medium active:scale-95 transition-transform duration-100 px-6"
            >
              {loading ? (
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Sidebar info */}
        <div className="space-y-4">
          {/* Response time card */}
          <div className="bg-white border border-zinc-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-zinc-900 mb-3">What to expect</h3>
            <div className="flex items-start gap-3 mb-3">
              <Clock className="h-4 w-4 text-violet-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-zinc-800">Response Time</p>
                <p className="text-xs text-zinc-700">We aim to respond within 24–48 hours during business days.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MessageSquare className="h-4 w-4 text-violet-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-zinc-800">Multiple Channels</p>
                <p className="text-xs text-zinc-700">You can also reach us through the channels below for urgent matters.</p>
              </div>
            </div>
          </div>

          {/* Contact info card */}
          <div className="bg-white border border-zinc-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-zinc-900 mb-3">Other Ways to Reach Us</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-zinc-600 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-zinc-800">Email</p>
                  <p className="text-xs text-violet-600">support@vert.video</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-zinc-600 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-zinc-800">Phone</p>
                  <p className="text-xs text-zinc-700">Mon–Fri, 9am–5pm EST</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-zinc-600 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-zinc-800">Office</p>
                  <p className="text-xs text-zinc-700">San Francisco, CA</p>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ hint */}
          <div className="bg-violet-50 border border-violet-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-zinc-900 mb-1">Frequently Asked</h3>
            <p className="text-xs text-zinc-700 mb-3">
              Many common questions are answered in our Help center. You might find what you need right away.
            </p>
            <button className="text-xs font-medium text-violet-600 hover:text-violet-700 transition-colors">
              Visit Help Center →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
