'use client'

import { useState } from 'react'
import { useAuth, useNavigation } from '@/lib/store'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Flag } from 'lucide-react'

interface FlagDialogProps {
  videoId: string
}

const flagReasons = [
  { value: 'spam', label: 'Spam or misleading' },
  { value: 'nudity', label: 'Nudity or sexual content' },
  { value: 'hate_speech', label: 'Hate speech' },
  { value: 'violence', label: 'Violence or harmful content' },
  { value: 'misinformation', label: 'Misinformation' },
  { value: 'other', label: 'Other' },
]

export function FlagDialog({ videoId }: FlagDialogProps) {
  const { user } = useAuth()
  const { navigate } = useNavigation()
  const [selectedReason, setSelectedReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleFlag = async () => {
    if (!selectedReason || !user) return
    setLoading(true)
    try {
      const res = await fetch(`/api/v1/videos/${videoId}/flag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: selectedReason }),
      })
      if (res.ok) {
        setSuccess(true)
        setTimeout(() => {
          setOpen(false)
          setSuccess(false)
          setSelectedReason('')
        }, 2000)
      }
    } catch (error) {
      console.error('Flag error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <button
        onClick={() => navigate({ page: 'login' })}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-medium transition-colors"
        title="Log in to report this video"
        aria-label="Report"
      >
        <Flag className="h-4 w-4" />
      </button>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-medium transition-colors active:scale-95 duration-100"
          title="Report this video"
          aria-label="Report"
        >
          <Flag className="h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100">
        <DialogHeader>
          <DialogTitle>Report Video</DialogTitle>
          <DialogDescription className="text-zinc-700 dark:text-zinc-300">
            Select a reason for reporting this video
          </DialogDescription>
        </DialogHeader>
        {success ? (
          <div className="py-4 text-center text-emerald-600">
            <p>Thank you for your report. We will review it shortly.</p>
          </div>
        ) : (
          <div className="space-y-2 py-2">
            {flagReasons.map((reason) => (
              <button
                key={reason.value}
                onClick={() => setSelectedReason(reason.value)}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors ${
                  selectedReason === reason.value
                    ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-transparent'
                }`}
              >
                {reason.label}
              </button>
            ))}
            <Button
              onClick={handleFlag}
              disabled={!selectedReason || loading}
              className="w-full mt-4 bg-red-600 hover:bg-red-500 text-white"
            >
              {loading ? (
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Submit Report'
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
