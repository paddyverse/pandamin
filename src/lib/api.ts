/**
 * Shared fetch utility for all /api/* calls.
 * Handles Content-Type, response.ok check, and error extraction.
 */
export async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
    const res = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            ...(options?.headers ?? {}),
        },
        ...options,
    });

    if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(
            (body as { error?: string }).error ?? `HTTP ${res.status}: ${res.statusText}`
        );
    }

    return res.json() as Promise<T>;
}
