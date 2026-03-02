import { NextResponse } from 'next/server';
import { getGHLClient } from '@/lib/ghl-client';
import { GHLError } from '@/lib/ghl-types';

export async function GET() {
    try {
        const client = getGHLClient();
        const data = await client.getPlans();
        return NextResponse.json(data);
    } catch (err) {
        console.error('[GET /api/saas/plans]', err);
        if (err instanceof GHLError) {
            return NextResponse.json(
                { error: err.message },
                { status: err.statusCode }
            );
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
