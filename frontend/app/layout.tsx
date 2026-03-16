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
import FloatingCartBar from '../src/components/FloatingCartBar'

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
    "brand": {
      "@type": "Brand",
      "name": product.brand || "Dash24"
    },
    "image": [
      product.image_url || "https://dash24.com/default-product.jpg"
    ],
    "offers": {
      "@type": "Offer",
      "price": product.price,
      "priceCurrency": "INR",
      "availability": "https://schema.org/InStock",
      "itemCondition": "https://schema.org/NewCondition",
      "shippingDetails": {
        "@type": "OfferShippingDetails",
        "shippingRate": {
          "@type": "MonetaryAmount",
          "value": 49,
          "currency": "INR"
        },
        "shippingDestination": {
          "@type": "DefinedRegion",
          "addressCountry": "IN"
        },
        "deliveryTime": {
          "@type": "ShippingDeliveryTime",
          "handlingTime": {
            "@type": "QuantitativeValue",
            "minValue": 0,
            "maxValue": 0,
            "unitCode": "H"
          },
          "transitTime": {
            "@type": "QuantitativeValue",
            "minValue": 0,
            "maxValue": 1,
            "unitCode": "H"
          }
        }
      },
      "hasMerchantReturnPolicy": {
        "@type": "MerchantReturnPolicy",
        "applicableCountry": "IN",
        "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
        "merchantReturnDays": 7,
        "returnMethod": "https://schema.org/ReturnByMail",
        "returnFees": "https://schema.org/FreeReturn"
      }
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
              <FloatingCartBar />
            </CartProvider>
          </LocationProvider>
        </AuthProvider>
      </body>
    </html>
  )
}