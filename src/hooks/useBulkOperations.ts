import { useCallback, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { fetchApi } from '@/lib/api';
import { QUERY_KEYS } from '@/lib/constants';
import type { BulkOperationResult } from '@/lib/ghl-types';

// ─── SSE helper ───────────────────────────────────────────────────────────────

interface BulkOperationProgress {
    completed: number;
    total: number;
    results: BulkOperationResult[];
}

/**
 * POSTs to url and reads the SSE stream for per-location progress events.
 * Each SSE event: data: { locationId, status, error?, completed, total, done }
 */
async function runSseOperation(
    url: string,
    body: Record<string, unknown>,
    onProgress: (p: BulkOperationProgress) => void,
    signal: AbortSignal
): Promise<BulkOperationResult[]> {
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal,
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
    }

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    const results: BulkOperationResult[] = [];

    if (!reader) throw new Error('No response body');

    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split('\n\n');
        buffer = chunks.pop() ?? '';

        for (const chunk of chunks) {
            const dataLine = chunk.split('\n').find((l) => l.startsWith('data: '));
            if (!dataLine) continue;

            try {
                const event = JSON.parse(dataLine.slice(6)) as {
                    locationId?: string;
                    status?: 'success' | 'error';
                    error?: string;
                    completed?: number;
                    total?: number;
                };

                if (event.locationId) {
                    const result: BulkOperationResult = {
                        locationId: event.locationId,
                        status: event.status ?? 'error',
                        error: event.error,
                    };
                    results.push(result);
                    onProgress({
                        completed: event.completed ?? results.length,
                        total: event.total ?? results.length,
                        results: [...results],
                    });
                }
            } catch {
                // ignore malformed SSE lines
            }
        }
    }

    return results;
}

// ─── useBulkDelete ────────────────────────────────────────────────────────────

export function useBulkDelete() {
    const queryClient = useQueryClient();
    const [progress, setProgress] = useState<BulkOperationProgress>({
        completed: 0, total: 0, results: [],
    });
    const [isRunning, setIsRunning] = useState(false);
    const abortRef = useRef<AbortController | null>(null);

    const start = useCallback(async (locationIds: string[]) => {
        const controller = new AbortController();
        abortRef.current = controller;
        setIsRunning(true);
        setProgress({ completed: 0, total: locationIds.length, results: [] });

        const toastId = toast.loading(`Deleting ${locationIds.length} accounts…`);

        try {
            const results = await runSseOperation(
                '/api/bulk/delete',
                { locationIds },
                setProgress,
                controller.signal
            );

            const failed = results.filter((r) => r.status !== 'success').length;
            toast.dismiss(toastId);
            if (failed === 0) {
                toast.success(`Deleted ${locationIds.length} accounts`);
            } else {
                toast.warning(`Deleted ${locationIds.length - failed} accounts; ${failed} failed`);
            }
            void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.locations });
        } catch (err) {
            toast.dismiss(toastId);
            if ((err as Error).name !== 'AbortError') {
                toast.error((err as Error).message);
            }
        } finally {
            setIsRunning(false);
            abortRef.current = null;
        }
    }, [queryClient]);

    const cancel = useCallback(() => abortRef.current?.abort(), []);

    return { progress, isRunning, start, cancel };
}

// ─── useBulkUpdate ────────────────────────────────────────────────────────────

export function useBulkUpdate() {
    const queryClient = useQueryClient();
    const [progress, setProgress] = useState<BulkOperationProgress>({
        completed: 0, total: 0, results: [],
    });
    const [isRunning, setIsRunning] = useState(false);
    const abortRef = useRef<AbortController | null>(null);

    const start = useCallback(async (
        locationIds: string[],
        updates: Record<string, unknown>
    ) => {
        const controller = new AbortController();
        abortRef.current = controller;
        setIsRunning(true);
        setProgress({ completed: 0, total: locationIds.length, results: [] });

        const toastId = toast.loading(`Updating ${locationIds.length} accounts…`);

        try {
            const results = await runSseOperation(
                '/api/bulk/update',
                { locationIds, updates },
                setProgress,
                controller.signal
            );

            const failed = results.filter((r) => r.status !== 'success').length;
            toast.dismiss(toastId);
            if (failed === 0) {
                toast.success(`Updated ${locationIds.length} accounts`);
            } else {
                toast.warning(`Updated ${locationIds.length - failed} accounts; ${failed} failed`);
            }
            void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.locations });
        } catch (err) {
            toast.dismiss(toastId);
            if ((err as Error).name !== 'AbortError') {
                toast.error((err as Error).message);
            }
        } finally {
            setIsRunning(false);
            abortRef.current = null;
        }
    }, [queryClient]);

    const cancel = useCallback(() => abortRef.current?.abort(), []);

    return { progress, isRunning, start, cancel };
}

// ─── useBulkEnableSaas ────────────────────────────────────────────────────────

export function useBulkEnableSaas() {
    const queryClient = useQueryClient();

    return useMutation<
        { results: BulkOperationResult[] },
        Error,
        { locationIds: string[]; planId?: string }
    >({
        mutationFn: (body) =>
            fetchApi('/api/saas/bulk-enable', {
                method: 'POST',
                body: JSON.stringify(body),
            }),
        onSuccess: (data) => {
            const failed = data.results.filter((r) => r.status !== 'success').length;
            if (failed === 0) {
                toast.success(`SaaS enabled for ${data.results.length} accounts`);
            } else {
                toast.warning(`Enabled ${data.results.length - failed}; ${failed} failed`);
            }
            void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.saasAccounts });
            void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.locations });
        },
        onError: (err) => {
            toast.error(err.message);
        },
    });
}
