import React from "react"
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { Analytics } from '@vercel/analytics/next'
import { LanguageProvider } from '@/components/language-provider'
import { CatalogueProvider } from '@/components/catalogue-provider'
import { StoreProvider } from '@/components/store-provider'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { ConditionalChrome } from '@/components/conditional-chrome'
import { FloatingWhatsApp } from '@/components/floating-whatsapp'
import { SkipLink } from '@/components/skip-link'
import { Toaster } from '@/components/ui/sonner'
import { getDictionary } from '@/lib/dictionaries'
import { getServerLocale } from '@/lib/server-locale'
import { getAllProducts, getAllCategories } from '@/lib/products'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const t = getDictionary(await getServerLocale())

  return {
    title: t.meta.siteTitle,
    description: t.meta.siteDescription,
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
}

// Every page reads the live catalogue / auth state from the database, so render
// on request rather than baking pages at build time. Keeps the store in sync
// with admin edits without a redeploy.
export const dynamic = 'force-dynamic'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: '#6d4aff',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Read the saved language on the server so the first paint is already in the
  // right language — no English flash before the client picks it up.
  const locale = await getServerLocale()

  // Fetch the catalogue once on the server and hydrate the client context, so
  // every client component reads products from the real database.
  const [products, categories] = await Promise.all([
    getAllProducts(),
    getAllCategories(),
  ])

  return (
    <ClerkProvider>
      <html lang={locale}>
        <body className={`font-sans antialiased`}>
          <LanguageProvider initialLocale={locale}>
            <CatalogueProvider products={products} categories={categories}>
              <StoreProvider>
                <SkipLink />
                <ConditionalChrome>
                  <SiteHeader />
                </ConditionalChrome>
                <main id="main-content">{children}</main>
                <ConditionalChrome>
                  <SiteFooter />
                </ConditionalChrome>
                <FloatingWhatsApp />
              </StoreProvider>
            </CatalogueProvider>
          </LanguageProvider>
          <Toaster />
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  )
}
