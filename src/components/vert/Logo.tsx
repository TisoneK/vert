/**
 * Vert logo mark — a geometric "V" inside a violet gradient square.
 *
 * Used in the header, landing page, auth pages, and favicon.
 * The gradient gives it depth without needing an image asset.
 */
export function Logo({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <div
      className={`relative shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-violet-500 to-violet-700" />
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 w-full h-full p-[22%]"
        fill="none"
      >
        <path
          d="M15 25 L50 75 L85 25"
          stroke="white"
          strokeWidth="14"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

/**
 * Logo with wordmark — the mark + "Vert" text.
 * Used in the header and auth pages.
 */
export function LogoWithText({ size = 28, className = '' }: { size?: number; className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Logo size={size} />
      <span className="text-lg font-bold text-zinc-900 tracking-tight">Vert</span>
    </div>
  )
}
