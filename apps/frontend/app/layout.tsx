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
import { Metadata } from 'next'

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Fixwell Services - Professional Household Services',
    template: '%s | Fixwell Services'
  },
  description: 'Book cleaning, repairs, and more with trusted, verified professionals. Choose from Starter Plan, HomeCare Plan, or Priority Plan.',
  keywords: ['household services', 'cleaning', 'maintenance', 'repair', 'professional services', 'home care'],
  authors: [{ name: 'Fixwell Services' }],
  creator: 'Fixwell Services',
  publisher: 'Fixwell Services',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://fixwell-services-platform-production.up.railway.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://fixwell-services-platform-production.up.railway.app',
    title: 'Fixwell Services - Professional Household Services',
    description: 'Book cleaning, repairs, and more with trusted, verified professionals. Choose from Starter Plan, HomeCare Plan, or Priority Plan.',
    siteName: 'Fixwell Services',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Fixwell Services - Professional Household Services',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fixwell Services - Professional Household Services',
    description: 'Book cleaning, repairs, and more with trusted, verified professionals. Choose from Starter Plan, HomeCare Plan, or Priority Plan.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
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