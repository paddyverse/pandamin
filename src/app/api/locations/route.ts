import { NextRequest, NextResponse } from 'next/server';
import { getGHLClient } from '@/lib/ghl-client';
import { GHLError } from '@/lib/ghl-types';
import { CreateLocationSchema } from '@/lib/validators';
import { ZodError } from 'zod';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;
        const query = searchParams.get('search') ?? undefined;

        const client = getGHLClient();

        const limit = 100;

        // 1. Fetch initial page 
        const firstPage = await client.searchLocations({
            skip: 0,
            limit,
            query,
        });

        // ── DIAGNOSTIC LOGGING ──
        const firstPageKeys = Object.keys(firstPage);
        const firstPageCount = firstPage.locations?.length ?? 0;
        console.log(`[DIAG] First page keys: ${JSON.stringify(firstPageKeys)}`);
        console.log(`[DIAG] First page locations count: ${firstPageCount}`);
        console.log(`[DIAG] First page .total: ${firstPage.total}`);
        console.log(`[DIAG] First page .count: ${(firstPage as any).count}`);
        console.log(`[DIAG] First page .meta: ${JSON.stringify((firstPage as any).meta)}`);
        console.log(`[DIAG] Query param: ${query ?? '(none)'}`);
        // ── END DIAGNOSTIC ──

        let allLocations: any[] = firstPage.locations ?? [];
        const totalFromApi = firstPage.total;
        const countFromApi = (firstPage as any).count;

        // Use whichever total indicator is available
        const knownTotal = totalFromApi ?? countFromApi ?? 0;

        // 2. Determine actual limit applied by the API
        const actualLimit = allLocations.length;

        // 3. Decide if we need more pages
        const hasMoreByTotal = knownTotal > 0 && allLocations.length < knownTotal;
        const hasMoreByFullPage = knownTotal === 0 && actualLimit > 0 && actualLimit >= limit;

        console.log(`[DIAG] knownTotal=${knownTotal}, actualLimit=${actualLimit}, hasMoreByTotal=${hasMoreByTotal}, hasMoreByFullPage=${hasMoreByFullPage}`);

        // 4. Fetch remaining pages in parallel
        if ((hasMoreByTotal || hasMoreByFullPage) && actualLimit > 0) {
            const maxAdditionalPages = 15;
            let numPagesToFetch: number;

            if (hasMoreByTotal) {
                const remaining = knownTotal - allLocations.length;
                numPagesToFetch = Math.min(Math.ceil(remaining / actualLimit), maxAdditionalPages);
            } else {
                numPagesToFetch = maxAdditionalPages;
            }

            console.log(`[DIAG] Fetching ${numPagesToFetch} additional pages with step=${actualLimit}`);

            const promises = [];
            for (let i = 1; i <= numPagesToFetch; i++) {
                const skipVal = i * actualLimit;
                promises.push(
                    client.searchLocations({ skip: skipVal, limit: actualLimit, query })
                        .then((res) => {
                            console.log(`[DIAG] Page ${i} (skip=${skipVal}): got ${res.locations?.length ?? 0} locations`);
                            return res;
                        })
                        .catch((err) => {
                            console.error(`[DIAG] Page ${i} (skip=${skipVal}) FAILED:`, err.message ?? err);
                            return { locations: [] };
                        })
                );
            }

            const results = await Promise.all(promises);
            for (const res of results) {
                if (res.locations && res.locations.length > 0) {
                    allLocations = allLocations.concat(res.locations);
                }
            }
        }

        console.log(`[DIAG] FINAL total locations returned: ${allLocations.length}`);

        return NextResponse.json({
            locations: allLocations,
            total: allLocations.length
        });
    } catch (err) {
        console.error('[GET /api/locations]', err);
        if (err instanceof GHLError) {
            return NextResponse.json(
                { error: err.message },
                { status: err.statusCode }
            );
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validated = CreateLocationSchema.parse(body);

        const client = getGHLClient();
        const data = await client.createLocation(validated);

        return NextResponse.json(data, { status: 201 });
    } catch (err) {
        console.error('[POST /api/locations]', err);
        if (err instanceof ZodError) {
            return NextResponse.json(
                { error: 'Validation failed', details: err.flatten() },
                { status: 400 }
            );
        }
        if (err instanceof GHLError) {
            return NextResponse.json(
                { error: err.message },
                { status: err.statusCode }
            );
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
