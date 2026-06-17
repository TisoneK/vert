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
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 text-sm font-medium transition-colors"
        title="Log in to report this video"
      >
        <Flag className="h-3.5 w-3.5" />
        <span>Report</span>
      </button>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 text-sm font-medium transition-colors active:scale-95 duration-100">
          <Flag className="h-3.5 w-3.5" />
          <span>Report</span>
        </button>
      </DialogTrigger>
      <DialogContent className="bg-white border-zinc-200 text-zinc-900">
        <DialogHeader>
          <DialogTitle>Report Video</DialogTitle>
          <DialogDescription className="text-zinc-700">
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
                    ? 'bg-violet-100 text-violet-600 border border-violet-200'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 border border-transparent'
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
