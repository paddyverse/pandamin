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

        let allLocations: any[] = firstPage.locations ?? [];
        const totalParams = firstPage.total ?? 0;

        // 2. Determine actual limit applied by the API (HighLevel caps at 20 for searches, 100 for plain lists)
        // If we got fewer results than total, we use what we actually received as the step size.
        const actualLimit = allLocations.length > 0 && allLocations.length < limit
            ? allLocations.length
            : limit;

        const hasMoreByTotal = totalParams > 0 && allLocations.length < totalParams;
        // If HighLevel omits `total` (often true for unfiltered queries), we fallback to fetching more if we received a full page.
        const hasMoreByFullPage = totalParams === 0 && allLocations.length === actualLimit;

        // 3. If there are more results than what we got in the first page, fetch the rest in parallel bursts
        if ((hasMoreByTotal || hasMoreByFullPage) && actualLimit > 0) {
            const maxAdditionalPages = 15; // Safety cap
            let numPagesToFetch = maxAdditionalPages;

            if (hasMoreByTotal) {
                const requiredPages = Math.ceil((totalParams - allLocations.length) / actualLimit);
                numPagesToFetch = Math.min(requiredPages, maxAdditionalPages);
            }

            const promises = [];

            for (let i = 1; i <= numPagesToFetch; i++) {
                promises.push(
                    client.searchLocations({ skip: i * actualLimit, limit: actualLimit, query })
                        .catch((err) => {
                            console.error(`[GET /api/locations] Failed to fetch page ${i}:`, err);
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
