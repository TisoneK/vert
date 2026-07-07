import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vert",
  description: "Watch and share portrait video.",
  icons: {
    // "V" on a violet rounded square — brand mark
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect fill='%237c3aed' rx='20' width='100' height='100'/><text x='50' y='72' font-size='60' font-weight='bold' text-anchor='middle' fill='white' font-family='system-ui,sans-serif'>V</text></svg>",
  },
  openGraph: {
    title: "Vert",
    description: "Watch and share portrait video.",
    type: "website",
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
            present on the <html> element from the start. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark' || (!theme && matchMedia('(prefers-color-scheme: dark)').matches)) {
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
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
