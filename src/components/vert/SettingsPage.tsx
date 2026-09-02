'use client'

import { useState, useEffect } from 'react'
import { useAuth, useNavigation } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Lock, Trash2, AlertTriangle, Loader2, Check, Eye, EyeOff, Settings as SettingsIcon, Sun, Moon } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { signOut } from 'next-auth/react'
import { useTheme } from 'next-themes'

export function SettingsPage() {
  const { user } = useAuth()
  const { navigate } = useNavigation()
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  // Delete account state
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleteStage, setDeleteStage] = useState<'idle' | 'confirm' | 'deleting'>('idle')

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) navigate({ page: 'login' })
  }, [user, navigate])

  if (!user) return null

  // Password change availability is enforced server-side by passwordHash;
  // the session payload deliberately doesn't expose it, and a local
  // email heuristic can't be authoritative.

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast({ title: 'Passwords do not match', description: 'New password and confirmation must match', variant: 'destructive' })
      return
    }
    if (newPassword.length < 6) {
      toast({ title: 'Password too short', description: 'Must be at least 6 characters', variant: 'destructive' })
      return
    }

    setChangingPassword(true)
    try {
      const res = await fetch('/api/v1/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (res.ok) {
        toast({ title: 'Password changed', description: 'Your password has been updated.' })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        toast({ title: 'Failed', description: data.error, variant: 'destructive' })
      }
    } catch (error) {
      console.error('Change password error:', error)
      toast({ title: 'Failed', description: 'Network error', variant: 'destructive' })
    } finally {
      setChangingPassword(false)
    }
  }

  async function handleDeleteAccount() {
    if (deleteStage === 'idle') {
      setDeleteStage('confirm')
      return
    }

    if (deleteStage === 'confirm') {
      // Final confirmation
      if (!confirm('This is your last chance. Your account and ALL your content will be permanently deleted. Are you absolutely sure?')) {
        setDeleteStage('idle')
        setDeletePassword('')
        setDeleteConfirm(false)
        return
      }

      setDeleteStage('deleting')
      try {
        const res = await fetch('/api/v1/auth/delete-account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            password: deletePassword || undefined,
            confirm: true,
          }),
        })
        const data = await res.json()
        if (res.ok) {
          toast({ title: 'Account deleted', description: 'Sorry to see you go.' })
          // Sign out and redirect to home
          await signOut({ redirect: false })
          navigate({ page: 'home' })
        } else {
          toast({ title: 'Failed', description: data.error, variant: 'destructive' })
          setDeleteStage('confirm')
        }
      } catch (error) {
        console.error('Delete account error:', error)
        toast({ title: 'Failed', description: 'Network error', variant: 'destructive' })
        setDeleteStage('confirm')
      }
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto animate-vert-fade-in">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <SettingsIcon className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Account Settings</h1>
      </div>

      {/* Account info */}
      <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 text-lg font-bold shrink-0">
            {user.username[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-zinc-900 dark:text-zinc-100">{user.username}</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">{user.email}</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
              Role: <span className="font-medium">{user.role}</span>
              {user.channelId && ' · Has channel'}
            </p>
          </div>
        </div>
      </div>

      {/* Appearance — dark mode toggle */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          {theme === 'dark' ? (
            <Moon className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
          ) : (
            <Sun className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
          )}
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Appearance</h2>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-700 dark:text-zinc-300">Theme</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {theme === 'dark' ? 'Dark mode is active' : theme === 'light' ? 'Light mode is active' : 'System theme'}
            </p>
          </div>
          <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
            <button
              onClick={() => setTheme('light')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                theme === 'light'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <Sun className="h-4 w-4" />
              Light
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                theme === 'dark'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <Moon className="h-4 w-4" />
              Dark
            </button>
            <button
              onClick={() => setTheme('system')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                theme === 'system'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              System
            </button>
          </div>
        </div>
      </div>

      {/* Change password section */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Change Password</h2>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          {/* Current password */}
          <div>
            <Label htmlFor="current-password" className="text-zinc-600 dark:text-zinc-400 mb-1.5 block text-sm">
              Current Password
            </Label>
            <div className="relative">
              <Input
                id="current-password"
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your current password"
                className="bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus-visible:ring-violet-600 pr-10"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                aria-label={showCurrent ? 'Hide password' : 'Show password'}
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* New password */}
          <div>
            <Label htmlFor="new-password" className="text-zinc-600 dark:text-zinc-400 mb-1.5 block text-sm">
              New Password
            </Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus-visible:ring-violet-600 pr-10"
                required
                minLength={6}
                maxLength={200}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                aria-label={showNew ? 'Hide password' : 'Show password'}
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Confirm new password */}
          <div>
            <Label htmlFor="confirm-new-password" className="text-zinc-600 dark:text-zinc-400 mb-1.5 block text-sm">
              Confirm New Password
            </Label>
            <Input
              id="confirm-new-password"
              type={showNew ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your new password"
              className="bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus-visible:ring-violet-600"
              required
              autoComplete="new-password"
            />
          </div>

          <Button
            type="submit"
            disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
            className="bg-violet-600 hover:bg-violet-700 text-white font-medium active:scale-95 transition-transform duration-100"
          >
            {changingPassword ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                Changing…
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-1.5" />
                Change Password
              </>
            )}
          </Button>
        </form>
      </div>

      {/* Danger zone */}
      <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg p-5">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <h2 className="text-sm font-semibold text-red-900 dark:text-red-400">Danger Zone</h2>
        </div>
        <p className="text-xs text-red-700 dark:text-red-300 mb-4">
          Deleting your account is permanent and cannot be undone. Your channel, videos,
          comments, votes, and playlists will all be removed.
        </p>

        {deleteStage === 'idle' ? (
          <Button
            variant="outline"
            onClick={() => setDeleteStage('confirm')}
            className="border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-700 dark:hover:text-red-300"
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            Delete my account
          </Button>
        ) : (
          <div className="space-y-3 bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-900 rounded-lg p-4">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {deleteStage === 'deleting'
                ? 'Deleting your account…'
                : 'Confirm account deletion'}
            </p>

            {/* Password verification (skip for OAuth users — they have no password) */}
            <div>
              <Label htmlFor="delete-password" className="text-zinc-600 dark:text-zinc-400 mb-1.5 block text-sm">
                Enter your password to confirm
              </Label>
              <Input
                id="delete-password"
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Your account password"
                className="bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus-visible:ring-red-600"
                disabled={deleteStage === 'deleting'}
                autoComplete="current-password"
              />
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                Leave blank if you sign in with Google.
              </p>
            </div>

            {/* Confirm checkbox */}
            <label className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.checked)}
                disabled={deleteStage === 'deleting'}
                className="mt-0.5"
              />
              <span>
                I understand this action is permanent and all my content will be deleted.
              </span>
            </label>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDeleteStage('idle')
                  setDeletePassword('')
                  setDeleteConfirm(false)
                }}
                disabled={deleteStage === 'deleting'}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleDeleteAccount}
                disabled={!deleteConfirm || deleteStage === 'deleting'}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deleteStage === 'deleting' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-1.5" />
                    Permanently delete
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
