import './globals.css'
import { JetBrains_Mono } from 'next/font/google'
import Providers from '@/components/Providers'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ChatWidget from '@/components/chat/ChatWidget'
import BCLocationBanner from '@/components/location/BCLocationBanner'
import { Toaster } from 'sonner'
import ErrorBoundary from '@/components/ErrorBoundary'
import React from 'react'

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const metadata = {
  title: 'Fixwell Services | Professional Home Services',
  description: 'Book cleaning, repairs, and more with trusted, verified professionals. Choose from Basic, Plus, or Premier plans.',
  metadataBase: new URL('https://roasted-key-production.up.railway.app'),
  charset: 'utf-8',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
  },
  openGraph: {
    title: 'Household Services',
    description: 'Book cleaning, repairs, and more with trusted, verified professionals.',
    url: 'https://yourdomain.com',
    siteName: 'Household Services',
    images: [
      {
        url: 'https://yourdomain.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Household Services',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Household Services',
    description: 'Book cleaning, repairs, and more with trusted, verified professionals.',
    images: ['https://yourdomain.com/og-image.jpg'],
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <script dangerouslySetInnerHTML={{
          __html: `
            // Suppress DOMNodeInserted deprecation warnings
            const originalWarn = console.warn;
            console.warn = function(...args) {
              if (args[0] && typeof args[0] === 'string' && args[0].includes('DOMNodeInserted')) {
                return;
              }
              originalWarn.apply(console, args);
            };
          `
        }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Household Services",
              "url": "https://yourdomain.com",
              "logo": "https://yourdomain.com/logo.png",
              "sameAs": [
                "https://facebook.com/yourpage",
                "https://twitter.com/yourpage"
              ]
            }),
          }}
        />
      </head>
      <body className={`${jetbrainsMono.className} min-h-screen bg-background text-foreground antialiased`}>
        <ErrorBoundary>
          <Providers>
            <div className="flex min-h-screen flex-col">
              <Header />
              <BCLocationBanner />
              <main className="flex-1">
                {children}
              </main>
              <Footer />
            </div>
            <ChatWidget />
            <Toaster position="top-right" richColors />
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  )
} 