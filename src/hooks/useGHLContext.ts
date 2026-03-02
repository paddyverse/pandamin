'use client';

import { useSearchParams } from 'next/navigation';

export interface GHLContext {
    locationId: string | null;
    userFirstName: string | null;
    userLastName: string | null;
}

/**
 * Parses GHL iframe URL parameters injected by GoHighLevel.
 * GHL injects: ?location_id=xxx&user_fname=Jane&user_lname=Doe
 */
export function useGHLContext(): GHLContext {
    const params = useSearchParams();

    return {
        locationId: params.get('location_id'),
        userFirstName: params.get('user_fname'),
        userLastName: params.get('user_lname'),
    };
}
