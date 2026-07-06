'use client'

import { VertApp } from '@/components/vert/VertApp'

/**
 * /admin — admin dashboard.
 * Renders the VertApp shell, which parses the URL and shows the AdminDashboard
 * view. Requires admin role — VertApp shows a 403 if the user isn't an admin.
 */
export default function AdminRoutePage() {
  return <VertApp />
}
