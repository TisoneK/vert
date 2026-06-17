import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vert — Portrait Video Platform",
  description: "The video platform built exclusively for portrait and vertical content. Discover, watch, and share vert videos.",
  keywords: ["Vert", "portrait video", "vertical video", "video platform", "short video", "mobile video"],
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect fill='%237c3aed' rx='20' width='100' height='100'/><text x='50' y='68' font-size='55' font-weight='bold' text-anchor='middle' fill='white'>V</text></svg>",
  },
  openGraph: {
    title: "Vert — Portrait Video Platform",
    description: "The video platform built exclusively for portrait and vertical content",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
