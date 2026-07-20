import type { Metadata, Viewport } from 'next'
import '@fontsource/google-sans/georgian.css'
import '@fontsource/google-sans/latin.css'
import { ProductionAnalytics } from '@/components/production-analytics'
import './globals.css'

export const metadata: Metadata = {
  title: 'Recruiter.ge — Find your next role',
  description:
    'Recruiter.ge is a premium, minimal job board. Browse curated roles with a focused, distraction-free experience.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#ffffff',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ka" className="h-full bg-background">
      <body className="h-full overflow-hidden font-sans antialiased">
        {children}
        <ProductionAnalytics />
      </body>
    </html>
  )
}
