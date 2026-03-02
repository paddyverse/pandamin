import { NextRequest, NextResponse } from 'next/server';
import { getGHLClient } from '@/lib/ghl-client';
import { GHLError } from '@/lib/ghl-types';
import { UpdateLocationSchema } from '@/lib/validators';
import { ZodError } from 'zod';

interface Params {
    params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        const client = getGHLClient();
        const data = await client.getLocation(id);
        return NextResponse.json(data);
    } catch (err) {
        console.error('[GET /api/locations/[id]]', err);
        if (err instanceof GHLError) {
            return NextResponse.json(
                { error: err.message },
                { status: err.statusCode }
            );
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        const body = await request.json();
        const validated = UpdateLocationSchema.parse(body);

        const client = getGHLClient();
        const data = await client.updateLocation(id, validated);
        return NextResponse.json(data);
    } catch (err) {
        console.error('[PUT /api/locations/[id]]', err);
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

export async function DELETE(_request: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        const client = getGHLClient();
        await client.deleteLocation(id);
        return NextResponse.json(
            { success: true, message: 'Location deleted (24hr grace period applies)' },
            { status: 200 }
        );
    } catch (err) {
        console.error('[DELETE /api/locations/[id]]', err);
        if (err instanceof GHLError) {
            return NextResponse.json(
                { error: err.message },
                { status: err.statusCode }
            );
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
