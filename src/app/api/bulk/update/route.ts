import { NextRequest } from 'next/server';
import { getGHLClient } from '@/lib/ghl-client';
import { BulkUpdateSchema } from '@/lib/validators';
import { ZodError } from 'zod';

/**
 * POST /api/bulk/update
 *
 * Accepts { locationIds: string[], updates: Partial<UpdateLocationData> },
 * streams Server-Sent Events (SSE) with per-location progress.
 *
 * Event format:
 *   data: {"index":0,"id":"abc","status":"updated","progress":50}
 */
export async function POST(request: NextRequest) {
    let locationIds: string[] = [];
    let updates: Record<string, unknown> = {};

    try {
        const body = await request.json();
        const validated = BulkUpdateSchema.parse(body);
        locationIds = validated.locationIds;
        updates = validated.updates;
    } catch (err) {
        if (err instanceof ZodError) {
            return new Response(
                JSON.stringify({ error: 'Validation failed', details: err.flatten() }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }
        return new Response(
            JSON.stringify({ error: 'Invalid request body' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }

    const total = locationIds.length;
    const client = getGHLClient();

    const stream = new ReadableStream({
        async start(controller) {
            const encode = (data: unknown) =>
                new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`);

            for (let i = 0; i < total; i++) {
                const id = locationIds[i];
                try {
                    await client.updateLocation(id, updates);
                    controller.enqueue(
                        encode({
                            index: i,
                            id,
                            status: 'updated',
                            progress: Math.round(((i + 1) / total) * 100),
                        })
                    );
                } catch (err) {
                    const message =
                        err instanceof Error ? err.message : 'Unknown error';
                    console.error(`[bulk/update] Failed to update ${id}:`, message);
                    controller.enqueue(
                        encode({
                            index: i,
                            id,
                            status: 'error',
                            error: message,
                            progress: Math.round(((i + 1) / total) * 100),
                        })
                    );
                }
            }

            // Signal completion
            controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
            controller.close();
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
            'X-Accel-Buffering': 'no',
        },
    });
}
