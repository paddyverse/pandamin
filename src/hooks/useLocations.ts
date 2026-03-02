import {
    useQuery,
    useMutation,
    useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { fetchApi } from '@/lib/api';
import { QUERY_KEYS, STALE_TIMES } from '@/lib/constants';
import type {
    GHLLocation,
    GHLLocationSearchResponse,
    CreateLocationData,
} from '@/lib/ghl-types';

// ─── Convenience aliases ──────────────────────────────────────────────────────
type Location = GHLLocation;

// ─── Params type ─────────────────────────────────────────────────────────────

interface LocationsParams {
    skip?: number;
    limit?: number;
    order?: string;
    search?: string;
}

type LocationsResponse = GHLLocationSearchResponse;

interface UpdateLocationBody extends Partial<CreateLocationData> {
    id: string;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useLocations(params?: LocationsParams) {
    const searchParams = new URLSearchParams();
    if (params?.skip !== undefined) searchParams.set('skip', String(params.skip));
    if (params?.limit !== undefined) searchParams.set('limit', String(params.limit));
    if (params?.order) searchParams.set('order', params.order);
    if (params?.search) searchParams.set('search', params.search);

    const queryString = searchParams.toString();
    const url = `/api/locations${queryString ? `?${queryString}` : ''}`;

    return useQuery<LocationsResponse>({
        queryKey: [...QUERY_KEYS.locations, params],
        queryFn: () => fetchApi<LocationsResponse>(url),
        staleTime: STALE_TIMES.locations,
    });
}

export function useLocation(id: string) {
    return useQuery<Location>({
        queryKey: QUERY_KEYS.location(id),
        queryFn: () => fetchApi<Location>(`/api/locations/${id}`),
        enabled: !!id,
        staleTime: STALE_TIMES.locations,
    });
}

export function useCreateLocation() {
    const queryClient = useQueryClient();

    return useMutation<Location, Error, CreateLocationData>({
        mutationFn: (body) =>
            fetchApi<Location>('/api/locations', {
                method: 'POST',
                body: JSON.stringify(body),
            }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.locations });
            toast.success('Account created');
        },
        onError: (err) => {
            toast.error(err.message);
        },
    });
}

export function useUpdateLocation() {
    const queryClient = useQueryClient();

    return useMutation<
        Location,
        Error,
        UpdateLocationBody,
        { previousLocation?: Location }
    >({
        mutationFn: ({ id, ...body }) =>
            fetchApi<Location>(`/api/locations/${id}`, {
                method: 'PUT',
                body: JSON.stringify(body),
            }),

        onMutate: async ({ id, ...updates }) => {
            await queryClient.cancelQueries({ queryKey: QUERY_KEYS.location(id) });

            const previousLocation = queryClient.getQueryData<Location>(
                QUERY_KEYS.location(id)
            );

            if (previousLocation) {
                queryClient.setQueryData<Location>(QUERY_KEYS.location(id), {
                    ...previousLocation,
                    ...updates,
                });
            }

            return { previousLocation };
        },

        onError: (err, { id }, ctx) => {
            if (ctx?.previousLocation) {
                queryClient.setQueryData(QUERY_KEYS.location(id), ctx.previousLocation);
            }
            toast.error(err.message);
        },

        onSuccess: (_, { id }) => {
            void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.location(id) });
            void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.locations });
            toast.success('Account updated');
        },
    });
}

export function useDeleteLocation() {
    const queryClient = useQueryClient();

    return useMutation<{ success: boolean }, Error, string>({
        mutationFn: (id) =>
            fetchApi<{ success: boolean }>(`/api/locations/${id}`, {
                method: 'DELETE',
            }),

        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: QUERY_KEYS.locations });

            queryClient.setQueriesData<LocationsResponse>(
                { queryKey: QUERY_KEYS.locations },
                (old) => {
                    if (!old) return old;
                    return {
                        ...old,
                        locations: old.locations.filter((l) => l.id !== id),
                        total: old.total - 1,
                        count: old.count - 1,
                    };
                }
            );
        },

        onError: (err) => {
            toast.error(err.message);
            void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.locations });
        },

        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.locations });
            toast.success('Account deleted');
        },
    });
}
