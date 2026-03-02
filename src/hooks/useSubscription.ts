import {
    useQuery,
    useMutation,
    useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { fetchApi } from '@/lib/api';
import { QUERY_KEYS, STALE_TIMES } from '@/lib/constants';
import type {
    GHLSubscription,
    UpdateSubscriptionData,
    UpdateRebillingData,
} from '@/lib/ghl-types';

type Subscription = GHLSubscription;

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useSubscription(locationId: string) {
    return useQuery<Subscription>({
        queryKey: QUERY_KEYS.subscription(locationId),
        queryFn: () => fetchApi<Subscription>(`/api/saas/subscriptions/${locationId}`),
        enabled: !!locationId,
        staleTime: STALE_TIMES.subscriptions,
    });
}

export function useUpdateSubscription() {
    const queryClient = useQueryClient();

    return useMutation<Subscription, Error, UpdateSubscriptionData & { locationId: string }>({
        mutationFn: ({ locationId, ...body }) =>
            fetchApi<Subscription>(`/api/saas/subscriptions/${locationId}`, {
                method: 'PUT',
                body: JSON.stringify(body),
            }),
        onSuccess: (_, { locationId }) => {
            void queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.subscription(locationId),
            });
            void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.saasAccounts });
            toast.success('Subscription updated');
        },
        onError: (err) => {
            toast.error(err.message);
        },
    });
}

export function useUpdateRebilling() {
    const queryClient = useQueryClient();

    return useMutation<
        { success: boolean },
        Error,
        UpdateRebillingData & { locationId: string },
        { previousSubscription?: Subscription }
    >({
        mutationFn: ({ locationId, ...body }) =>
            fetchApi<{ success: boolean }>(`/api/saas/rebilling/${locationId}`, {
                method: 'PUT',
                body: JSON.stringify(body),
            }),

        onMutate: async ({ locationId, enabled }) => {
            await queryClient.cancelQueries({
                queryKey: QUERY_KEYS.subscription(locationId),
            });

            const previousSubscription = queryClient.getQueryData<Subscription>(
                QUERY_KEYS.subscription(locationId)
            );

            return { previousSubscription };
        },

        onError: (err, { locationId }, ctx) => {
            if (ctx?.previousSubscription) {
                queryClient.setQueryData(
                    QUERY_KEYS.subscription(locationId),
                    ctx.previousSubscription
                );
            }
            toast.error(err.message);
        },

        onSuccess: (_, { locationId }) => {
            void queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.subscription(locationId),
            });
            toast.success('Rebilling updated');
        },
    });
}
