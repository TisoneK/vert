import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import { Providers } from "./providers";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/site-metadata";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // metadataBase lets Next resolve relative OG/Twitter image URLs and
  // canonical links against the real site origin. Per-route generateMetadata
  // (watch/channel/category/tag) supplies the per-item title/description/
  // og:image/og:video; this is the site-level default + template. See ADR-25.
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  icons: {
    // "V" on a violet rounded square — brand mark
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect fill='%237c3aed' rx='20' width='100' height='100'/><text x='50' y='72' font-size='60' font-weight='bold' text-anchor='middle' fill='white' font-family='system-ui,sans-serif'>V</text></svg>",
  },
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
};

// viewport-fit=cover lets the webview extend into the notch / home-indicator
// areas on iPhone X+, which is required for env(safe-area-inset-*) values
// used by the mobile bottom nav and drawer to actually take effect.
// In Next.js 13+ this must be a separate Viewport export, not inside Metadata.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent flash of light mode on page load: read stored theme
            before React hydrates. next-themes relies on this class being
            present on the <html> element from the start. The script handles
            three cases: explicit 'dark', explicit 'light' (do nothing), and
            'system'/null (check prefers-color-scheme). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (theme === 'dark' || ((!theme || theme === 'system') && systemDark)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Providers>
            {children}
            <Toaster />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
