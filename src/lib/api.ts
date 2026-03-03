/**
 * Shared fetch utility for all /api/* calls.
 * Handles Content-Type, response.ok check, and error extraction.
 */
export async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    // If running in the browser, attach the location_id
    if (typeof window !== 'undefined') {
        const searchParams = new URLSearchParams(window.location.search);
        let locId = searchParams.get('location_id');

        // Save to sessionStorage so it persists across Next.js client-side navigations
        if (locId) {
            sessionStorage.setItem('ghl_location_id', locId);
        } else {
            locId = sessionStorage.getItem('ghl_location_id');
        }

        if (locId) {
            headers['x-ghl-location-id'] = locId;
        }

        const authSession = sessionStorage.getItem('auth_session');
        if (authSession) {
            headers['x-auth-session'] = authSession;
        }
    }

    const res = await fetch(url, {
        ...options,
        headers: {
            ...headers,
            ...(options?.headers as Record<string, string> ?? {}),
        },
    });

    if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(
            (body as { error?: string }).error ?? `HTTP ${res.status}: ${res.statusText}`
        );
    }

    return res.json() as Promise<T>;
}
