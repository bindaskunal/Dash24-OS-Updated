import './globals.css'
import { Inter } from 'next/font/google'
import MobileBottomNav from '../src/components/MobileBottomNav'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata = {
  title: 'Dash24',
  description: 'Intelligent Commerce Infrastructure',
}

import { LocationProvider } from '../src/context/LocationContext'
import { CartProvider } from '../src/context/CartContext'
import { AuthProvider } from '../lib/auth'
import GlobalHeader from '../src/components/GlobalHeader'
import CartDrawer from '../src/components/CartDrawer'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased bg-background text-foreground">
        <AuthProvider>
          <LocationProvider>
            <CartProvider>
              <GlobalHeader />
              <main className="pb-[80px] md:pb-0">
                {children}
              </main>
              <MobileBottomNav />
              <div style={{ position: 'fixed', inset: 0, zIndex: 99999, pointerEvents: 'none' }}>
                <div style={{ pointerEvents: 'auto' }}>
                  <CartDrawer />
                </div>
              </div>
            </CartProvider>
          </LocationProvider>
        </AuthProvider>
      </body>
    </html>
  )
}