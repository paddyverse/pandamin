import { NextRequest } from 'next/server';
import { getGHLClient } from '@/lib/ghl-client';
import { BulkDeleteSchema } from '@/lib/validators';
import { ZodError } from 'zod';

/**
 * POST /api/bulk/delete
 *
 * Accepts { locationIds: string[] }, streams Server-Sent Events (SSE)
 * with per-location progress, then emits a [DONE] event.
 *
 * Event format:
 *   data: {"index":0,"id":"abc","status":"deleted","progress":50}
 */
export async function POST(request: NextRequest) {
    let locationIds: string[] = [];

    try {
        const body = await request.json();
        const validated = BulkDeleteSchema.parse(body);
        locationIds = validated.locationIds;
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
                    await client.deleteLocation(id);
                    controller.enqueue(
                        encode({
                            index: i,
                            id,
                            status: 'deleted',
                            progress: Math.round(((i + 1) / total) * 100),
                        })
                    );
                } catch (err) {
                    const message =
                        err instanceof Error ? err.message : 'Unknown error';
                    console.error(`[bulk/delete] Failed to delete ${id}:`, message);
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
