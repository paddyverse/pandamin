import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';
import { QUERY_KEYS, STALE_TIMES } from '@/lib/constants';
import type {
    GHLPlansResponse,
    GHLSaasSubAccount,
} from '@/lib/ghl-types';

interface SaasAccountsResponse {
    accounts: GHLSaasSubAccount[];
    total: number;
    metadata: {
        activeAccounts: number;
        inactiveAccounts: number;
        planCounts: Record<string, number>;
    };
}

export function useSaasPlans() {
    return useQuery<GHLPlansResponse>({
        queryKey: QUERY_KEYS.saasPlans,
        queryFn: () => fetchApi<GHLPlansResponse>('/api/saas/plans'),
        staleTime: STALE_TIMES.saasPlans,
    });
}

export function useSaasAccounts(query?: string) {
    return useQuery<SaasAccountsResponse>({
        queryKey: [QUERY_KEYS.saasAccounts, query],
        queryFn: () => {
            const url = new URL('/api/saas/accounts', window.location.origin);
            if (query) url.searchParams.set('query', query);
            return fetchApi<SaasAccountsResponse>(url.toString().replace(window.location.origin, ''));
        },
        staleTime: STALE_TIMES.locations,
    });
}
