import { NextRequest, NextResponse } from 'next/server';
import { getGHLClient } from '@/lib/ghl-client';
import { GHLError } from '@/lib/ghl-types';
import { CreateLocationSchema } from '@/lib/validators';
import { ZodError } from 'zod';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;
        const query = searchParams.get('search') ?? undefined;
        // If caller just wants a small slice (e.g. dashboard count-only call), honour it.
        const clientLimit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : null;

        const client = getGHLClient();

        const PAGE_LIMIT = 100;
        const MAX_RECORDS = 2000; // safety cap

        let allLocations: any[] = [];
        let skip = 0;
        let pageNum = 0;
        let grandTotal: number | null = null; // real total from GHL API

        // Fetch pages sequentially until we get an empty page or hit our cap.
        // We always advance by PAGE_LIMIT (not batch.length) so that GHL's
        // server-side filtering never causes the offset to drift off-track.
        while (allLocations.length < MAX_RECORDS) {
            // If caller passed an explicit limit (e.g. limit=1 from dashboard), honour it.
            if (clientLimit !== null && allLocations.length >= clientLimit) break;

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

            // Track the real total from the API (first page that reports it)
            const apiTotal = page.total ?? (page as any).count;
            if (apiTotal && grandTotal === null) grandTotal = apiTotal;

            // If the api reported a total and we've collected it all, stop.
            if (grandTotal !== null && allLocations.length >= grandTotal) break;

            // Always advance by the fixed page size so offsets stay aligned.
            skip += PAGE_LIMIT;
        }

        // Trim to clientLimit if specified
        if (clientLimit !== null && allLocations.length > clientLimit) {
            allLocations = allLocations.slice(0, clientLimit);
        }

        console.log(`[locations] FINAL: ${allLocations.length} locations returned (API total: ${grandTotal ?? 'unknown'})`);

        return NextResponse.json({
            locations: allLocations,
            // Return the real API total so the dashboard count is accurate,
            // even when clientLimit caused us to fetch only a subset.
            total: grandTotal ?? allLocations.length,
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
