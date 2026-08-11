import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit'

/**
 * POST /api/v1/contact
 *
 * Real contact-message intake. Replaces the old client-only `setTimeout`
 * simulation on the Contact page, which showed "Message sent" while sending
 * nothing (review 2026-08-11 [H2], ADR-27).
 *
 * Delivery: the app has no email provider and no Contact DB table (schema
 * changes need owner approval), so the message is captured to the server log
 * (readable in Vercel logs) and, if CONTACT_WEBHOOK_URL is set, POSTed to that
 * webhook (Slack/Discord/email relay/etc.) — best-effort, non-blocking. The UI
 * only shows success on a real 2xx here, so the confirmation is truthful.
 *
 * No PII beyond what the sender chose to submit is stored anywhere persistent.
 */

const MAX_NAME = 100
const MAX_EMAIL = 320
const MAX_MESSAGE = 5000

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    const rl = rateLimit(req, RATE_LIMITS.contact, `ip:${ip}`)
    if (!rl.ok) return rl.response!

    const body = await req.json().catch(() => ({}))
    const { name, email, message } = body

    // Reject non-strings before length checks so a JSON number can't slip past.
    if (
      typeof name !== 'string' ||
      typeof email !== 'string' ||
      typeof message !== 'string'
    ) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      )
    }

    const trimmedName = name.trim()
    const trimmedEmail = email.trim().toLowerCase()
    const trimmedMessage = message.trim()

    if (!trimmedName || !trimmedEmail || !trimmedMessage) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail) || trimmedEmail.length > MAX_EMAIL) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }
    if (trimmedName.length > MAX_NAME) {
      return NextResponse.json({ error: 'Name is too long' }, { status: 400 })
    }
    if (trimmedMessage.length > MAX_MESSAGE) {
      return NextResponse.json(
        { error: `Message is too long (max ${MAX_MESSAGE} characters)` },
        { status: 400 }
      )
    }

    const payload = {
      type: 'contact',
      name: trimmedName,
      email: trimmedEmail,
      message: trimmedMessage,
      at: new Date().toISOString(),
    }

    // Capture to the server log so the owner can read submissions in Vercel logs.
    console.log('[contact]', JSON.stringify(payload))

    // Optional forward — set CONTACT_WEBHOOK_URL to relay to Slack/Discord/email.
    // Best-effort: a webhook failure must not fail the user's submission.
    const webhook = process.env.CONTACT_WEBHOOK_URL
    if (webhook) {
      try {
        await fetch(webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } catch (err) {
        console.error('[contact] webhook forward failed:', err)
      }
    }

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
