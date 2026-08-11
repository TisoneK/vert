import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    // Type errors should fail the build — don't let them ship silently
    // and surface as runtime bugs instead.
    ignoreBuildErrors: false,
  },
  // React StrictMode helps catch potential issues during development
  // by double-invoking certain functions and lifecycle methods.
  // It was previously disabled without documented reason; re-enabled
  // to catch bugs like setState during render (see REVIEW.md M-8).
  reactStrictMode: true,
  // Configure next/image to allow optimization of Vercel Blob URLs.
  // Without this, <Image> components refuse to load remote images and
  // you get "hostname not configured" errors.
  //
  // The hostname pattern `*.public.blob.vercel-storage.com` matches
  // all Vercel Blob stores in this account. We use the wildcard form
  // because each store has a unique subdomain (e.g. 7omh3o8afcek9nbu).
  images: {
    // Serve next-gen formats. AVIF first (best compression), WebP fallback,
    // then the original. The Vercel Image Optimization CDN (and the local
    // dev optimizer via sharp) transcodes + resizes on the fly and caches
    // the result, so a 445KB source PNG reaches the browser as a small
    // AVIF/WebP sized for the device. See .context ADR-5.
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
      // Also allow common avatar/thumbnail CDNs in case users link
      // external images (Google avatars, etc.)
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  // Include the admin migration SQL files in the standalone server
  // output. Without this, Next.js's file tracer won't include
  // prisma/migrations/admin/ (since we read it via fs, not via import),
  // and the migration runner would find no files in production.
  outputFileTracingIncludes: {
    "/api/v1/admin/db-migrations": ["./prisma/migrations/admin/*.sql"],
    "/api/v1/admin/db-migrations/[id]/apply": ["./prisma/migrations/admin/*.sql"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Strict-Transport-Security: force HTTPS for 2 years, including subdomains.
          // Vercel already sets this, but we set it explicitly so the policy
          // is documented in the repo (and survives any reverse-proxy change).
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          // X-Content-Type-Options: stop browsers from MIME-sniffing responses
          // away from the declared Content-Type (e.g. serving text/plain as HTML).
          { key: "X-Content-Type-Options", value: "nosniff" },
          // X-Frame-Options: prevent clickjacking by framing the site.
          // DENY is appropriate — Vert has no legit embedder.
          { key: "X-Frame-Options", value: "DENY" },
          // Referrer-Policy: only send the origin (not the full URL) to other sites.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Permissions-Policy: disable camera/microphone/geolocation APIs the
          // app doesn't use, so a compromised script can't silently turn them on.
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // Content-Security-Policy: a defense-in-depth layer against injected
          // scripts and clickjacking (review 2026-08-11 [L13]). Deliberately
          // conservative so it doesn't break existing behavior:
          //   - script-src is locked to same-origin + inline/eval. Next.js
          //     injects inline bootstrap scripts and the root layout ships an
          //     inline no-flash theme script, so 'unsafe-inline' is required
          //     until a nonce-based setup is introduced; the real value here is
          //     blocking scripts from *external* hosts.
          //   - img-src/media-src/connect-src stay permissive over https: so
          //     user-provided avatars (arbitrary hosts, see ADR-12), Vercel Blob
          //     media, HLS segment fetches, and Google OAuth keep working.
          //   - frame-ancestors 'none' mirrors X-Frame-Options for modern UAs.
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "media-src 'self' blob: https:",
              "font-src 'self' data:",
              "connect-src 'self' https:",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "object-src 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
