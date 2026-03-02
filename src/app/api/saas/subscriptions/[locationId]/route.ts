import { NextRequest, NextResponse } from 'next/server';
import { getGHLClient } from '@/lib/ghl-client';
import { GHLError } from '@/lib/ghl-types';
import { UpdateSubscriptionSchema } from '@/lib/validators';
import { ZodError } from 'zod';

interface Params {
    params: Promise<{ locationId: string }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
    try {
        const { locationId } = await params;
        const client = getGHLClient();
        const data = await client.getLocationSubscription(locationId);
        return NextResponse.json(data);
    } catch (err) {
        console.error('[GET /api/saas/subscriptions/[locationId]]', err);
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
        const validated = UpdateSubscriptionSchema.parse(body);

        const client = getGHLClient();
        const data = await client.updateSubscription(locationId, validated);
        return NextResponse.json(data);
    } catch (err) {
        console.error('[PUT /api/saas/subscriptions/[locationId]]', err);
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
