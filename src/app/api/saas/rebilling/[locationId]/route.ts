import { NextRequest, NextResponse } from 'next/server';
import { getGHLClient } from '@/lib/ghl-client';
import { GHLError } from '@/lib/ghl-types';
import { UpdateRebillingSchema } from '@/lib/validators';
import { ZodError } from 'zod';

interface Params {
    params: Promise<{ locationId: string }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
    try {
        const { locationId } = await params;
        const client = getGHLClient();
        // Rebilling config is nested in the subscription response
        const subscription = await client.getLocationSubscription(locationId);
        return NextResponse.json(subscription);
    } catch (err) {
        console.error('[GET /api/saas/rebilling/[locationId]]', err);
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
        const { locationId } = await params;
        const body = await request.json();
        const validated = UpdateRebillingSchema.parse(body);

        const client = getGHLClient();
        const data = await client.updateRebilling(locationId, validated);
        return NextResponse.json(data);
    } catch (err) {
        console.error('[PUT /api/saas/rebilling/[locationId]]', err);
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
