import { NextResponse } from 'next/server';
import { getGHLClient } from '@/lib/ghl-client';
import { GHLError } from '@/lib/ghl-types';

export async function GET() {
    try {
        const client = getGHLClient();

        let allAccounts: any[] = [];
        let page = 1;
        const maxPages = 50;

        let activeCount = 0;
        let inactiveCount = 0;
        const planCounts: Record<string, number> = {};

        // Auto-paginate safely up to 50 pages
        while (page <= maxPages) {
            const data = await client.getSaasSubAccounts(page);
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
            page++;
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
