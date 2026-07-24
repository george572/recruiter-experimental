import type { Metadata, Viewport } from 'next'
import '@fontsource/google-sans/georgian.css'
import '@fontsource/google-sans/latin.css'
import { FeedbackPrompt } from '@/components/feedback-prompt'
import { GoogleAnalytics } from '@/components/google-analytics'
import { ProductionAnalytics } from '@/components/production-analytics'
import { VisitorBootstrap } from '@/components/visitor-bootstrap'
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  SITE_LOCALE,
  SITE_NAME,
  SITE_KEYWORDS,
  SITE_URL,
} from '@/lib/seo'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: SITE_KEYWORDS,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: SITE_LOCALE,
    url: SITE_URL,
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  category: 'jobs',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/apple-icon.png',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#ffffff',
}

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode
  modal: React.ReactNode
}>) {
  return (
    <html lang="ka" className="light h-full bg-background" style={{ colorScheme: "light" }}>
      <body className="h-full overflow-hidden font-sans antialiased">
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("audience-theme");var d=t==="dark";var r=document.documentElement;r.classList.toggle("dark",d);r.classList.toggle("light",!d);r.style.colorScheme=d?"dark":"light";}catch(e){document.documentElement.classList.add("light");document.documentElement.style.colorScheme="light";}})();`,
          }}
        />
        {children}
        {modal}
        <VisitorBootstrap />
        <FeedbackPrompt />
        <GoogleAnalytics />
        <ProductionAnalytics />
      </body>
    </html>
  )
}
