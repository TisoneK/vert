'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Bell, BellOff } from 'lucide-react'
import { formatSubscribers } from '@/lib/utils-vert'

interface SubscribeButtonProps {
  channelId: string
  initialSubscribed: boolean
  subscriberCount: number
}

export function SubscribeButton({ channelId, initialSubscribed, subscriberCount: initialCount }: SubscribeButtonProps) {
  const { user } = useAuth()
  const [subscribed, setSubscribed] = useState(initialSubscribed)
  const [subscriberCount, setSubscriberCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)
  const [animating, setAnimating] = useState(false)

  const handleToggle = async () => {
    if (!user) return
    setAnimating(true)
    setLoading(true)
    try {
      if (subscribed) {
        const res = await fetch(`/api/v1/channels/${channelId}/subscribe`, { method: 'DELETE' })
        if (res.ok) {
          setSubscribed(false)
          setSubscriberCount((c) => c - 1)
        }
      } else {
        const res = await fetch(`/api/v1/channels/${channelId}/subscribe`, { method: 'POST' })
        if (res.ok) {
          setSubscribed(true)
          setSubscriberCount((c) => c + 1)
        }
      }
    } catch (error) {
      console.error('Subscribe error:', error)
    } finally {
      setLoading(false)
      setTimeout(() => setAnimating(false), 300)
    }
  }

  // This is your own channel — subscribing to yourself isn't a real action.
  if (user?.channelId === channelId) {
    return null
  }

  if (!user) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="border-zinc-200 text-zinc-600 cursor-default text-xs"
      >
        {formatSubscribers(subscriberCount)}
      </Button>
    )
  }

  return (
    <Button
      onClick={handleToggle}
      disabled={loading}
      size="sm"
      className={`font-medium text-sm active:scale-95 transition-transform duration-100 ${
        animating ? 'animate-subscribe-pulse' : ''
      } ${
        subscribed
          ? 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900 border border-zinc-300'
          : 'bg-violet-600 hover:bg-violet-700 text-white'
      }`}
    >
      {subscribed ? (
        <>
          <BellOff className="h-3.5 w-3.5 mr-1.5" />
          Subscribed
        </>
      ) : (
        <>
          <Bell className="h-3.5 w-3.5 mr-1.5" />
          Subscribe
        </>
      )}
    </Button>
  )
}
