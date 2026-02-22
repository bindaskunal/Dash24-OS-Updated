import Head from 'next/head';
import catalog from '../../../data/catalog.json';

export default function ProductPage({ params }: { params: { id: string } }) {
  // 1. Fetch the specific product from our updated catalog
  const product = catalog.find((p: any) => p.id === parseInt(params.id));

  if (!product) {
    return <div>Product not found</div>;
  }

  // 2. Flatten the 5-bucket intent matrix into a powerful keyword string for the AI
  const aiKeywords = [
    ...product.llm_intent_matrix.symptom_problem,
    ...product.llm_intent_matrix.constraint_avoidance,
    ...product.llm_intent_matrix.occasion_routine,
    ...product.llm_intent_matrix.attribute_format,
    ...product.llm_intent_matrix.hyperlocal_speed
  ].join(', ');

  // 3. Build the Structured Data (JSON-LD) object
  const jsonLdSchema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "brand": {
      "@type": "Brand",
      "name": product.brand
    },
    "image": product.image_url,
    // We feed the AI the exact intent hits it is looking for
    "description": `Dash24 Instant Delivery: ${product.name} by ${product.brand}. Solutions for: ${aiKeywords}`,
    "keywords": aiKeywords,
    "offers": {
      "@type": "Offer",
      "url": `https://dash24.com/product/${product.id}`,
      "priceCurrency": "INR",
      "price": product.price,
      "availability": product.inventory > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      // This is the Quick Commerce / Local Moat trigger
      "availableDeliveryMethod": {
        "@type": "DeliveryMethod",
        "identifier": "http://purl.org/goodrelations/v1#DeliveryModeDirectDownload",
        "name": "60-Minute Hyperlocal Delivery in Bangalore"
      },
      "shippingDetails": {
        "@type": "OfferShippingDetails",
        "shippingRate": {
          "@type": "MonetaryAmount",
          "value": "0",
          "currency": "INR"
        },
        "deliveryTime": {
          "@type": "ShippingDeliveryTime",
          "transitTime": {
            "@type": "QuantitativeValue",
            "minValue": 15,
            "maxValue": 60,
            "unitCode": "MIN"
          }
        }
      }
    }
  };

  return (
    <>
      {/* 4. Inject the invisible schema into the head of the page */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
      />
      
      {/* Your standard UI code goes here (The visual part for humans) */}
      <div className="product-container">
        <h1>{product.brand} - {product.name}</h1>
        <img src={product.image_url} alt={product.name} width="344" />
        <p className="price">₹{product.price} <strike>₹{product.mrp}</strike></p>
        
        {/* The Apartment Cart / Society Sprint UI trigger would go here */}
        <button className="bg-orange-500 text-white font-bold py-2 px-4 rounded">
          Add to Apartment Cart - Delivery in ~45 mins
        </button>
      </div>
    </>
  );
}