// @ts-nocheck
import Link from 'next/link';

// Simulating a backend fetch for the SSR page
const getProductByName = (productName: string) => {
  const catalog = [
    { name: "Protein Shake", brand: "The Whole Truth", price: 1499, mrp: 1799, rating: 4.6, image_url: "https://placehold.co/600x600/f8f9fa/1e3a8a.png?text=Protein+Shake" },
    { name: "Ashwagandha Gummies", brand: "What's Up Wellness", price: 899, mrp: 999, rating: 4.5, image_url: "https://whatsupwellness.in/cdn/shop/files/stress_51da983c-837f-429d-b235-fb15692d44c0.png?v=1769849561&width=640" },
    { name: "Amla Juice (1L)", brand: "Kapiva", price: 349, mrp: 399, rating: 4.3, image_url: "https://placehold.co/600x600/f8f9fa/1e3a8a.png?text=Amla+Juice" }
  ];
  // Decodes the URL (e.g., "Protein%20Shake" -> "Protein Shake")
  return catalog.find(p => p.name === decodeURIComponent(productName));
};

export default function ProductPage({ params }: { params: { id: string } }) {
  const product = getProductByName(params.id);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl font-medium">
        Product not found.
      </div>
    );
  }

  // THIS IS THE SECRET WEAPON: Hidden JSON-LD Schema for AI & Google Bots
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": product.image_url,
    "brand": { "@type": "Brand", "name": product.brand },
    "offers": {
      "@type": "Offer",
      "priceCurrency": "INR",
      "price": product.price,
      "availability": "https://schema.org/InStock",
      "shippingDetails": {
        "@type": "OfferShippingDetails",
        "deliveryTime": {
          "@type": "ShippingDeliveryTime",
          "transitTime": { "@type": "QuantitativeValue", "minValue": 0, "maxValue": 1, "unitCode": "HUR" }
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-10">
      {/* Invisible script block that AI reads immediately upon crawl */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm p-12 flex gap-12">
        <div className="w-1/2 bg-gray-50 rounded-2xl flex items-center justify-center p-8 border border-gray-100">
          <img src={product.image_url} alt={product.name} className="w-full h-auto object-contain mix-blend-multiply" />
        </div>
        
        <div className="w-1/2 flex flex-col justify-center">
          <p className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-3">{product.brand}</p>
          <h1 className="text-4xl font-bold mb-4 tracking-tight">{product.name}</h1>
          
          <div className="flex items-center gap-4 mb-8">
            <span className="text-3xl font-extrabold text-gray-900">₹{product.price}</span>
            <span className="text-lg text-gray-400 line-through font-medium">₹{product.mrp}</span>
          </div>
          
          <div className="bg-[#EEF2FF] border border-[#1E3A8A]/10 rounded-2xl p-6 mb-10">
            <p className="font-bold text-[#1E3A8A] mb-1 flex items-center gap-2">
              <span className="text-lg">⚡</span> Instant Commerce Active
            </p>
            <p className="text-sm text-[#1E3A8A]/80 leading-relaxed">
              Stocked in a local Dash24 dark store. Delivered to your door in under 60 minutes.
            </p>
          </div>

          <Link href="/" className="bg-gray-900 text-white text-center py-4 rounded-full font-semibold hover:bg-gray-800 transition-colors shadow-md">
            ← Back to Dash24 Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}