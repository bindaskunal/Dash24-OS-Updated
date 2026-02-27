import ENRICHED_CATALOG from '../../../data/enriched_catalog.json';
import { MASTER_CATALOG } from '../../../src/data/constants';
import ProductClient from './ProductClient';

export default function ProductPage({ params }: { params: { id: string } }) {
  // Try to find in enriched catalog first
  let product: any = ENRICHED_CATALOG.find((p: any) => p.id === params.id);

  // Fallback to master catalog
  if (!product) {
    product = (MASTER_CATALOG as any[]).find((p: any) => p.id === params.id) as any;
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
        <h2 className="text-xl font-bold mb-4">Product Not Found</h2>
        {/* Simple back link */}
        <a href="/" className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold">Go Home</a>
      </div>
    );
  }

  // Inject the required JSON-LD schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": product.image_url,
    "description": product.description || `Buy ${product.name} from Dash24`,
    "brand": {
      "@type": "Brand",
      "name": product.brand || "Dash24"
    },
    // The user specifically requested 1158 price, 49 shipping rate, and 1-hour transit time in the JSON-LD
    "offers": {
      "@type": "Offer",
      "url": `https://dash24.com/product/${params.id}`,
      "priceCurrency": "INR",
      "price": "1158",
      "priceValidUntil": "2026-12-31",
      "itemCondition": "https://schema.org/NewCondition",
      "availability": "https://schema.org/InStock",
      "shippingDetails": {
        "@type": "OfferShippingDetails",
        "shippingRate": {
          "@type": "MonetaryAmount",
          "value": "49",
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
            "unitCode": "d"
          },
          "transitTime": {
            "@type": "QuantitativeValue",
            "minValue": 1,
            "maxValue": 1,
            "unitCode": "H"
          }
        }
      }
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductClient product={product} params={params} />
    </>
  );
}