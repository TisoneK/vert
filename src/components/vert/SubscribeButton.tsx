'use client'

import { useState } from 'react'
import { useAuth, useNavigation } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Bell, BellOff } from 'lucide-react'

interface SubscribeButtonProps {
  channelId: string
  initialSubscribed: boolean
}

export function SubscribeButton({ channelId, initialSubscribed }: SubscribeButtonProps) {
  const { user } = useAuth()
  const { navigate } = useNavigation()
  const [subscribed, setSubscribed] = useState(initialSubscribed)
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
        }
      } else {
        const res = await fetch(`/api/v1/channels/${channelId}/subscribe`, { method: 'POST' })
        if (res.ok) {
          setSubscribed(true)
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
        onClick={() => navigate({ page: 'login' })}
        className="border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:border-violet-500 hover:text-violet-600 dark:hover:text-violet-400 text-xs"
        aria-label="Log in to subscribe"
      >
        Subscribe
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
          ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-100 border border-zinc-300 dark:border-zinc-600'
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
