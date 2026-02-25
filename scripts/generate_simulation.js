const fs = require('fs');
const path = require('path');

const CATALOG = require('../frontend/data/enriched_catalog.json');

const NODES = ["Prestige Koramangala", "Brigade Indiranagar", "Sobha HSR"];
const CHANNELS = [
    { name: "AI Semantic Search", share: 0.20, cac: 0, type: "web" },
    { name: "In-Transit Piggyback", share: 0.20, cac: 0, type: "web" },
    { name: "Gamification & Pulse Points", share: 0.20, cac: 0, type: "mobile_app" },
    { name: "Hyperlocal BTL / Offline", share: 0.15, cac: 60, type: "mixed" },
    { name: "Auto-Deliver Subscriptions", share: 0.15, cac: 0, type: "mobile_app" },
    { name: "Paid Digital", share: 0.10, cac: 850, type: "web" }
];

const INTENT_KEYWORDS = [
    ['sluggish', 'afternoon energy'],
    ['acne', 'summer skincare'],
    ['quick protein', 'post workout'],
    ['midnight craving', 'no sugar'],
    ['healthy snacks', 'office desk'],
    ['running low', 'coffee beans']
];

function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomChannel() {
    const r = Math.random();
    let curr = 0;
    for (const c of CHANNELS) {
        curr += c.share;
        if (r <= curr) return c;
    }
    return CHANNELS[0];
}

function generateOrders(totalOrders = 10000) {
    const orders = [];
    const now = Date.now();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

    for (let i = 0; i < totalOrders; i++) {
        // Random time in last 30 days
        const timestamp = now - Math.floor(Math.random() * thirtyDaysMs);
        const node = getRandomItem(NODES);
        const isRepeat = Math.random() < 0.65; // Let's say 65% of all orders are repeat

        // Device logic
        let device = "web";
        if (!isRepeat && Math.random() < 0.60) device = "web";
        else if (isRepeat && Math.random() < 0.80) device = "mobile_app";
        else device = isRepeat ? "web" : "mobile_app";

        // Channel logic constraints
        let channelObj = getRandomChannel();

        // Items logic (1 to 4 items)
        const numItems = Math.floor(Math.random() * 4) + 1;
        const items = [];
        let orderGmv = 0;
        let orderMargin = 0;
        let dash24Revenue = 0;

        for (let j = 0; j < numItems; j++) {
            const product = getRandomItem(CATALOG);
            const qty = Math.floor(Math.random() * 2) + 1;
            const itemRevenue = product.price * qty;

            orderGmv += itemRevenue;

            // Fulfillment Margin Logic
            const marginPct = (product.fulfilledBy === 'Dash24' || product.fulfilledBy === undefined) ? 0.25 : 0.10;
            const marginValue = itemRevenue * marginPct;
            orderMargin += marginValue;
            dash24Revenue += marginValue;

            items.push({
                product_id: product.id,
                name: product.name,
                brand: product.brand,
                category: product.category,
                price: product.price,
                quantity: qty,
                fulfilledBy: product.fulfilledBy || 'Dash24',
                margin_pct: marginPct,
                margin_value: marginValue
            });
        }

        const intentCaptured = (channelObj.name === "AI Semantic Search") ? getRandomItem(INTENT_KEYWORDS) : null;

        orders.push({
            order_id: `ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            timestamp,
            date: new Date(timestamp).toISOString(),
            node,
            is_repeat: isRepeat,
            device,
            channel: channelObj.name,
            cac: isRepeat ? 0 : channelObj.cac, // CAC only applies to acquisition (mostly)
            intent_captured: intentCaptured,
            items,
            metrics: {
                gmv: orderGmv,
                dash24_revenue: dash24Revenue,
                blended_margin_pct: orderMargin / orderGmv,
            }
        });
    }

    // Sort chronologically
    orders.sort((a, b) => a.timestamp - b.timestamp);
    return orders;
}

const simulatedOrders = generateOrders();
const outPath = path.join(__dirname, '../frontend/data/simulated_orders.json');
fs.writeFileSync(outPath, JSON.stringify(simulatedOrders, null, 2));

console.log(`Generated 10,000 simulated orders to ${outPath}`);
