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

        const PAGE_LIMIT = 100;
        const MAX_RECORDS = 2000; // safety cap

        let allLocations: any[] = [];
        let skip = 0;
        let pageNum = 0;

        // Fetch pages sequentially until we get an empty page or hit the cap.
        // GHL's search API can return variable page sizes, so we can't rely on
        // "first page < limit" to decide there are no more results.
        while (allLocations.length < MAX_RECORDS) {
            pageNum++;
            const page = await client.searchLocations({
                skip,
                limit: PAGE_LIMIT,
                query,
            });

            const batch = page.locations ?? [];
            console.log(`[locations] Page ${pageNum} (skip=${skip}): ${batch.length} results`);

            if (batch.length === 0) break;

            allLocations = allLocations.concat(batch);

            // If the API returned a total and we've met it, stop
            const total = page.total ?? (page as any).count;
            if (total && allLocations.length >= total) break;

            // If we got fewer than requested AND the API didn't provide a total,
            // fetch one more page to confirm there really aren't more.
            // But if that page is also short/empty we'll stop on the next iteration.
            skip += batch.length;
        }

        console.log(`[locations] FINAL: ${allLocations.length} locations returned`);

        return NextResponse.json({
            locations: allLocations,
            total: allLocations.length,
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
