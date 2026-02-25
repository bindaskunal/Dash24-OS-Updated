const fs = require('fs');
const path = require('path');

const brandsCsv = fs.readFileSync(path.join(__dirname, '../frontend/data/brands_template.csv'), 'utf8');
const productsCsv = fs.readFileSync(path.join(__dirname, '../frontend/data/products_template.csv'), 'utf8');

const parseCsv = (csv) => {
    const lines = csv.split('\n').filter(l => l.trim() !== '');
    const headers = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).map(line => {
        const values = line.split(',');
        return headers.reduce((obj, header, i) => {
            obj[header] = values[i] ? values[i].trim() : '';
            return obj;
        }, {});
    });
};

const brandsData = parseCsv(brandsCsv);
const productsData = parseCsv(productsCsv);

const BRAND_LOGOS = {};
brandsData.forEach(b => {
    if (b['Brand Name'] && b['Logo URL']) {
        BRAND_LOGOS[b['Brand Name']] = b['Logo URL'];
    }
});

const crypto = require('crypto');

const generateRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const generateRandomRating = () => (Math.random() * (5.0 - 4.0) + 4.0).toFixed(1);

const generateId = (name, brand, idx) => {
    const hash = crypto.createHash('md5').update(name + brand).digest('hex').substring(0, 8).toUpperCase();
    return `01K13EV${hash}X${idx}`;
};

const MASTER_CATALOG = productsData.map((p, idx) => {
    return {
        id: generateId(p['Product Name'], p['Brand'], idx),
        name: p['Product Name'],
        brand: p['Brand'],
        category: p['Category'],
        price: parseInt(p['Price']) || 0,
        mrp: parseInt(p['MRP']) || 0,
        image_url: p['Image URL'] || '',
        rating: parseFloat(generateRandomRating()),
        low: Math.random() > 0.75, // 25% chance of being low stock
        lastPurchased: generateRandomInt(5, 50),
        consumptionCycle: generateRandomInt(15, 60),
        inventory: {
            "Prestige Koramangala": generateRandomInt(0, 20),
            "Brigade Indiranagar": generateRandomInt(0, 20),
            "Sobha HSR": generateRandomInt(0, 20)
        }
    };
}).filter(p => p.name);

fs.writeFileSync(path.join(__dirname, '../frontend/data/catalog.json'), JSON.stringify(MASTER_CATALOG, null, 2));

const constantsTs = `// Automatically generated from CSV models
export const BRAND_LOGOS: Record<string, string> = ${JSON.stringify(BRAND_LOGOS, null, 2)};

export const MASTER_CATALOG = ${JSON.stringify(MASTER_CATALOG, null, 2)};

export const NODE_DATA = {
  "Prestige Koramangala": { nearestDistanceKm: 1.2, brandsInZone: 42, highDemandBrands: 18, demandBrands: ["Minimalist", "The Whole Truth", "What's Up Wellness", "Kapiva"] },
  "Brigade Indiranagar": { nearestDistanceKm: 0.8, brandsInZone: 38, highDemandBrands: 24, demandBrands: ["What's Up Wellness", "Minimalist", "Blue Tokai", "The Whole Truth"] },
  "Sobha HSR": { nearestDistanceKm: 1.6, brandsInZone: 46, highDemandBrands: 12, demandBrands: ["Blue Tokai", "The Whole Truth", "Minimalist", "What's Up Wellness"] },
} as const;

export const QUICK_CATEGORIES = [
  { name: "Top Brands", img: "https://cdn-icons-png.flaticon.com/512/3204/3204040.png" },
  { name: "Beauty", img: "/icon-beauty.PNG" },
  { name: "Electronics", img: "/icon-electronics.png" },
  { name: "Health & Wellness", img: "/icon-health.png" },
  { name: "Wearables", img: "/icon-Wearables.PNG" },
  { name: "Snacks", img: "/icon-Snacks.PNG" },
  { name: "Fashion", img: "/icon-Fashion.PNG" },
];

export const HERO_BANNERS = [
  { brand: "Minimalist", title: "Glow Up Sale", subtitle: "Flat 20% on Serums", label: "Brand Days", productImage: "https://images-static.nykaa.com/media/catalog/product/3/9/394e9c5MINIM00000008_a.jpg?tr=w-344,h-344,cm-pad_resize", hasCTA: true, link: "/products?category=Beauty" },
  { brand: "The Whole Truth", title: "Clean Protein", subtitle: "Zero Added Sugar", label: "New Launch", productImage: "https://www.jiomart.com/images/product/original/rvekvhwpxb/the-whole-truth_light-cocoa-whey-protein-isolate-concentrate-24g-protein-product-images-orvekvhwpxb-p606367622-0-202311282004.jpg?im=Resize=(420,420)", hasCTA: true, link: "/products?category=Health" },
  { brand: "What's Up Wellness", title: "Sleep Gummies", subtitle: "Buy 1 Get 1 Free", label: "Flash Deal", productImage: "https://whatsupwellness.in/cdn/shop/files/stress_51da983c-837f-429d-b235-fb15692d44c0.png?v=1769849561&width=640", hasCTA: true, link: "/products?category=Health" },
];
`;

fs.writeFileSync(path.join(__dirname, '../frontend/src/data/constants.ts'), constantsTs);
console.log('Successfully ingested ' + MASTER_CATALOG.length + ' products and ' + Object.keys(BRAND_LOGOS).length + ' brands.');
