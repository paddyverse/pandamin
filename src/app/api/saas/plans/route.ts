import { NextResponse } from 'next/server';
import { getGHLClient } from '@/lib/ghl-client';
import { GHLError } from '@/lib/ghl-types';

export async function GET(request: Request) {
    try {
        // Enforce location matching to prevent unauthorized access
        const { searchParams } = new URL(request.url);
        const urlLoc = searchParams.get('location_id');
        const headerLoc = request.headers.get('x-ghl-location-id');
        const cookieLoc = request.headers.get('cookie')?.match(/ghl_location_id=([^;]+)/)?.[1];

        const locationId = urlLoc || headerLoc || cookieLoc;
        const ALLOWED = process.env.ALLOWED_LOCATION_ID;

        if (ALLOWED && locationId !== ALLOWED) {
            return NextResponse.json({ error: 'Unauthorized location' }, { status: 403 });
        }

        const client = getGHLClient();
        const data = await client.getPlans();
        return NextResponse.json(data);
    } catch (err) {
        console.error('[GET /api/saas/plans]', err);
        if (err instanceof GHLError) {
            return NextResponse.json(
                { error: err.message },
                { status: err.statusCode }
            );
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
