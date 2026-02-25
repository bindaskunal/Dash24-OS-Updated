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
`;

fs.writeFileSync(path.join(__dirname, '../frontend/src/data/constants.ts'), constantsTs);
console.log('Successfully ingested ' + MASTER_CATALOG.length + ' products and ' + Object.keys(BRAND_LOGOS).length + ' brands.');
