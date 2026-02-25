const fs = require('fs');
const path = require('path');

const catalogPath = path.join(__dirname, 'data', 'enriched_catalog.json');
let catalog = [];

try {
    catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
} catch (e) {
    console.error("Could not read catalog", e);
    process.exit(1);
}

const brands = [
    { name: 'Plix', category: 'Health', image: 'https://cdn.shopify.com/s/files/1/0212/8207/files/PLIX_Logo_Color_1_180x.png' },
    { name: 'Bold Care', category: 'Health', image: 'https://images.crunchbase.com/image/upload/c_pad,f_auto,q_auto:eco,dpr_1/eec52wukngv8ozgksndu' },
    { name: 'Man Matters', category: 'Personal Care', image: 'https://manmatters.com/wp-content/uploads/2021/08/MM-Logo-1.png' },
    { name: 'Kapiva', category: 'Health', image: 'https://cdn.shopify.com/s/files/1/2277/6369/files/Kapiva_Logo_Black.png' },
    { name: 'True Elements', category: 'Snacks', image: 'https://play-lh.googleusercontent.com/B94U0q2I2hQO4cR9Ue818e6Ywq5cM8U6I4U4_wU7Z6Y5aJ9LpL_yJkL5-1k-X8Z_Q' },
    { name: 'MuscleBlaze', category: 'Health', image: 'https://upload.wikimedia.org/wikipedia/commons/4/4b/MuscleBlaze_Logo.png' },
    { name: 'Slurrp Farm', category: 'Snacks', image: 'https://slurrpfarm.com/cdn/shop/files/Slurrp_farm_logo_colour.png' },
    { name: 'Arata', category: 'Personal Care', image: 'https://www.arata.in/cdn/shop/files/Arata-Logo-Black-1.png' },
    { name: 'Dot & Key', category: 'Beauty', image: 'https://www.dotandkey.com/cdn/shop/files/Dot-and-Key-Logo.png' },
    { name: 'SUGAR Pop', category: 'Beauty', image: 'https://images.crunchbase.com/image/upload/c_pad,f_auto,q_auto:eco,dpr_1/v1488188267/jkvb2oijqzqw7m11u0vq.png' }
];

let maxId = catalog.reduce((max, item) => {
    if (item.id && item.id.startsWith('prod_')) {
        const num = parseInt(item.id.replace('prod_', ''), 10);
        return num > max ? num : max;
    }
    return max;
}, 0);

let counter = maxId + 1;

brands.forEach(brand => {
    for (let i = 1; i <= 3; i++) {
        const isDash24 = i <= 2;
        // Massive inventory for Dash24, 0 for Brand dropship
        const inventory = isDash24 ? Math.floor(Math.random() * 501) + 500 : 0;

        catalog.push({
            id: `prod_${counter++}`,
            name: `${brand.name} ${isDash24 ? 'Essential' : 'Premium'} Product ${i}`,
            brand: brand.name,
            category: brand.category,
            price: Math.floor(Math.random() * 500) + 200,
            image_url: brand.image,
            stock: inventory,
            localAvailable: true,
            lastPurchased: 5,
            consumptionCycle: 30,
            rating: +(Math.random() * (5.0 - 4.0) + 4.0).toFixed(1),
            ai_intent_layers: {
                clarification: `Looking for ${brand.name} things`,
                risk: `Standard risk profile`,
                outcome: `Good results expected`
            },
            fulfilledBy: isDash24 ? 'Dash24' : 'Brand',
            node_inventory: {
                'Prestige Koramangala': inventory,
                'Brigade Indiranagar': inventory,
                'Sobha HSR': inventory
            }
        });
    }
});

// Retrofit older items
catalog.forEach(item => {
    if (!item.fulfilledBy) {
        item.fulfilledBy = 'Dash24';
    }
    if (!item.node_inventory) {
        item.node_inventory = {
            'Prestige Koramangala': item.stock || 100,
            'Brigade Indiranagar': item.stock || 100,
            'Sobha HSR': item.stock || 100
        };
    }
});

fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2));
console.log('Appended 30 products successfully.');
