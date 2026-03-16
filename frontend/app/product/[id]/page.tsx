import { createClient } from '@supabase/supabase-js';
import ProductClient from './ProductClient';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function ProductPage({ params }: { params: { id: string } }) {
  const { data: productData, error } = await supabase
    .from('products')
    .select('*, brands(name)')
    .eq('id', params.id)
    .single();

  if (error || !productData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
        <h2 className="text-xl font-bold mb-4">Product Not Found</h2>
        {/* Simple back link */}
        <a href="/" className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold">Go Home</a>
      </div>
    );
  }

  const product = {
    ...productData,
    brand: productData.brands?.name || 'Dash24',
    fulfilledBy: productData.is_fbb ? 'Brand' : 'Dash24',
    stock: productData.stock_inventory || 0,
    deliveryBucket: productData.delivery_time || (productData.is_fbb ? 'standard' : 'quick')
  };

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