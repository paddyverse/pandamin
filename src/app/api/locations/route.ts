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

        // 2. If we hit the limit, there might be more... grab the next 15 pages in parallel
        // (15 pages * 100 limit = 1500 accounts in one ~1s burst, avoiding the 10s timeout)
        if (allLocations.length === limit) {
            const maxPages = 15;
            const promises = [];

            for (let i = 1; i < maxPages; i++) {
                promises.push(
                    client.searchLocations({ skip: i * limit, limit, query })
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
                } else {
                    break;
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
