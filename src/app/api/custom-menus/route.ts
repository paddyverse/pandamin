import { NextRequest, NextResponse } from 'next/server';
import { getGHLClient } from '@/lib/ghl-client';
import { GHLError } from '@/lib/ghl-types';
import { CreateCustomMenuSchema } from '@/lib/validators';
import { ZodError } from 'zod';

export async function GET() {
    try {
        const client = getGHLClient();
        const data = await client.getCustomMenus();
        return NextResponse.json(data);
    } catch (err) {
        console.error('[GET /api/custom-menus]', err);
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
        const validated = CreateCustomMenuSchema.parse(body);

        const client = getGHLClient();
        const data = await client.createCustomMenu(validated);
        return NextResponse.json(data, { status: 201 });
    } catch (err) {
        console.error('[POST /api/custom-menus]', err);
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
