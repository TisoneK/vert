const OPTIMIZED_IMAGE_HOSTS = [
  'lh3.googleusercontent.com',
]

export function isNextImageSafeUrl(value: string): boolean {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:') return false

    return OPTIMIZED_IMAGE_HOSTS.includes(url.hostname)
      || url.hostname.endsWith('.public.blob.vercel-storage.com')
  } catch {
    return false
  }
}
