import { NextResponse } from 'next/server';
import { getGHLClient } from '@/lib/ghl-client';
import { GHLError } from '@/lib/ghl-types';

export async function GET(request: Request) {
    try {
        // Enforce location matching to prevent unauthorized access to these SaaS lists
        const { searchParams } = new URL(request.url);
        const urlLoc = searchParams.get('location_id');
        const headerLoc = request.headers.get('x-ghl-location-id');
        const cookieLoc = request.headers.get('cookie')?.match(/ghl_location_id=([^;]+)/)?.[1];

        const locationId = urlLoc || headerLoc || cookieLoc;
        const ALLOWED = process.env.ALLOWED_LOCATION_ID;

        // If a location ID is specifically provided through headers/url/cookie, ensure it matches.
        // If it's completely missing, we assume middleware.ts caught any unauthorized access via session cookies, 
        // because the first RSC render won't have the client-side x-ghl-location-id header yet.
        if (ALLOWED && locationId && locationId !== ALLOWED) {
            return NextResponse.json({ error: 'Unauthorized location' }, { status: 403 });
        }

        const client = getGHLClient();

        let allAccounts: any[] = [];
        const limit = 20;
        let skip = 0;
        const maxPages = 50;
        const querySearch = searchParams.get('query') || undefined;

        let activeCount = 0;
        let inactiveCount = 0;
        const planCounts: Record<string, number> = {};

        // Auto-paginate safely up to 50 pages (or up to 1000 records)
        for (let i = 0; i < maxPages; i++) {
            // getSaasSubAccounts now takes an object { skip, limit, query }
            const data = await client.getSaasSubAccounts({ skip, limit, query: querySearch });
            const locations = data.locations ?? [];
            if (locations.length === 0) break;

            allAccounts = allAccounts.concat(locations);

            // Compute statistics server-side to save frontend CPU
            for (const loc of locations) {
                if (loc.active) {
                    activeCount++;
                    if (loc.planId) {
                        planCounts[loc.planId] = (planCounts[loc.planId] || 0) + 1;
                    }
                } else {
                    inactiveCount++;
                }
            }

            // Assume if we got less than 20 results (standard GHL limit), it's the last page
            if (locations.length < 20) break;
            skip += limit;
        }

        return NextResponse.json({
            accounts: allAccounts,
            total: allAccounts.length,
            metadata: {
                activeAccounts: activeCount,
                inactiveAccounts: inactiveCount,
                planCounts,
            }
        });
    } catch (err) {
        console.error('[GET /api/saas/accounts]', err);
        if (err instanceof GHLError) {
            return NextResponse.json(
                { error: err.message },
                { status: err.statusCode }
            );
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
