import { NextRequest, NextResponse } from 'next/server';
import { getGHLClient } from '@/lib/ghl-client';
import { GHLError } from '@/lib/ghl-types';
import { BulkEnableSaasSchema } from '@/lib/validators';
import { ZodError } from 'zod';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validated = BulkEnableSaasSchema.parse(body);

        const client = getGHLClient();
        const data = await client.bulkEnableSaas(
            validated.locationIds,
            validated.planId
        );
        return NextResponse.json(data);
    } catch (err) {
        console.error('[POST /api/saas/bulk-enable]', err);
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
