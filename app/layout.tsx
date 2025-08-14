import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import { AuthProvider } from '@/components/AuthProvider'
import { CartProvider } from '@/components/CartProvider'
import { WishlistProvider } from '@/components/WishlistProvider'
import { LoyaltyProvider } from '@/components/LoyaltyProvider'
import { BottomNavigation } from '@/components/BottomNavigation'
import { MobileHeader } from '@/components/MobileHeader'
import { NotificationProvider } from '@/components/NotificationProvider'

import { ServiceWorkerProvider } from '@/components/ServiceWorkerProvider'
import { PWAInstallProvider } from '@/components/PWAInstallProvider'


import { NavbarVisibilityProvider } from '@/components/NavbarVisibilityProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Smarto - Smart Home & Electronics Store',
  description: 'Leading smart home and electronics store in Moldova. Discover the latest smart devices, gadgets, and technology for your home.',
  keywords: 'smart home, electronics, gadgets, Moldova, smart devices, automation',
  authors: [{ name: 'Smarto Team' }],
  applicationName: 'Smarto v1.1.8',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Smarto',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'Smarto',
    title: 'Smarto - Smart Home Store',
    description: 'Leading smart home and electronics store in Moldova',
    images: '/icons/icon-512x512.svg',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Smarto - Smart Home Store',
    description: 'Leading smart home and electronics store in Moldova',
    images: '/icons/icon-512x512.svg',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.svg', sizes: '192x192', type: 'image/svg+xml' },
      { url: '/icons/icon-512x512.svg', sizes: '512x512', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.svg', sizes: '180x180', type: 'image/svg+xml' },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('smarto-ui-theme') || 'system';
                  var systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  var finalTheme = theme === 'system' ? systemTheme : theme;
                  document.documentElement.classList.add(finalTheme);
                } catch (e) {
                  // Fallback to system theme if localStorage is not available
                  var systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  document.documentElement.classList.add(systemTheme);
                }
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider defaultTheme="system">
          <ServiceWorkerProvider>
            <PWAInstallProvider>
              <NavbarVisibilityProvider>
                <NotificationProvider>
                <AuthProvider>
                  <CartProvider>
                    <WishlistProvider>
                      <LoyaltyProvider>
        
                        
                        <MobileHeader />
                        {children}
                        <BottomNavigation />
                      </LoyaltyProvider>
                    </WishlistProvider>
                  </CartProvider>
                </AuthProvider>
                </NotificationProvider>
              </NavbarVisibilityProvider>
            </PWAInstallProvider>
          </ServiceWorkerProvider>
        </ThemeProvider>
      </body>
    </html>
  )
} 