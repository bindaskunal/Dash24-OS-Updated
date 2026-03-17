import { NextResponse } from 'next/server';

export async function GET() {
    // These tags simulate live neighborhood demand in Prestige Whitefield
    const trendingTags = [
        "🔥 Yoga Bar Dark Chocolate",
        "☕ Sleepy Owl Cold Brew",
        "🌙 Night Munchies",
        "🔋 CultSport Sipper",
        "🥑 Fresh Avocados"
    ];

    return NextResponse.json({ trending: trendingTags }, { status: 200 });
}