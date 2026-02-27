import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
    const userAgent = req.headers.get('user-agent') || '';

    // Explicitly Whitelist AI Crawlers for Merchant Listings & LLM-SEO
    const aiBots = [
        'OAI-SearchBot',
        'ChatGPT-User',
        'GPTBot',
        'Google-Extended',
        'PerplexityBot',
        'ClaudeBot',
    ];

    const isAiBot = aiBots.some((bot) => userAgent.includes(bot));

    if (isAiBot) {
        const response = NextResponse.next();
        // Neutralize restrictive headers for headless bots
        response.headers.set('x-middleware-cache', 'no-cache');
        response.headers.set('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
        // Important: Prevent rate limiting triggers on Vercel Edge for these specific bots
        return response;
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
