import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
    console.log('[WeatherSync] Full Autonomous Cycle Triggered');
    try {
        const apiKey = process.env.OPENWEATHER_API_KEY;
        if (!apiKey) throw new Error('OPENWEATHER_API_KEY missing');

        // 1. Fetch real-time weather for Bengaluru
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=Bengaluru,IN&appid=${apiKey}&units=metric`;
        const weatherRes = await fetch(weatherUrl);
        if (!weatherRes.ok) throw new Error(`Weather API failed: ${weatherRes.statusText}`);

        const weatherData = await weatherRes.json();
        const condition = weatherData.weather?.[0]?.main || 'Clear';

        // 2. Evaluate Surge Logic
        const rainConditions = ['Rain', 'Drizzle', 'Thunderstorm'];
        const shouldSurge = rainConditions.includes(condition);

        // 3. Mutation: Update Supabase store_settings (Bypass RLS)
        // Sequential upserts to avoid environment-specific batching issues
        await supabaseAdmin.from('store_settings').upsert({ key: 'is_surge_active', value: shouldSurge }, { onConflict: 'key' });
        await supabaseAdmin.from('store_settings').upsert({ key: 'last_weather_sync', value: new Date().toISOString() }, { onConflict: 'key' });
        await supabaseAdmin.from('store_settings').upsert({ key: 'last_weather_condition', value: condition }, { onConflict: 'key' });

        return NextResponse.json({
            success: true,
            city: 'Bengaluru',
            condition,
            is_surge_active: shouldSurge,
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('[WeatherSync Error]:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
