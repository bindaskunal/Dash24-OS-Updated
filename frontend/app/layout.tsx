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

import { MASTER_CATALOG } from '../src/data/constants';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const jsonLdData = MASTER_CATALOG.map(product => ({
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "brand": product.brand || "Dash24",
    "offers": {
      "@type": "Offer",
      "price": product.price,
      "priceCurrency": "INR",
      "availability": "https://schema.org/InStock",
      "deliveryLeadTime": "60 minutes"
    }
  }));

  return (
    <html lang="en" className={inter.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
        />
      </head>
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