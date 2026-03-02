import { GHL_BASE_URL, GHL_API_VERSION, RATE_LIMIT } from '@/lib/constants';
import { RateLimiter } from '@/lib/rate-limiter';
import {
    GHLError,
    GHLLocation,
    GHLLocationSearchResponse,
    GHLPlansResponse,
    GHLSaasPlan,
    GHLSubscription,
    GHLSaasSubAccount,
    GHLCustomMenu,
    BulkOperationResult,
    SearchParams,
    CreateLocationData,
    UpdateLocationData,
    UpdateSubscriptionData,
    UpdateRebillingData,
    CreateCustomMenuData,
    UpdateCustomMenuData,
} from '@/lib/ghl-types';

// ─── GHL Client ───────────────────────────────────────────────────────────────

class GHLClient {
    private readonly token: string;
    private readonly companyId: string;
    private readonly rateLimiter: RateLimiter;

    constructor() {
        const token = process.env.GHL_PRIVATE_TOKEN;
        const companyId = process.env.GHL_COMPANY_ID;

        if (!token) {
            throw new Error('GHL_PRIVATE_TOKEN environment variable is not set');
        }
        if (!companyId) {
            throw new Error('GHL_COMPANY_ID environment variable is not set');
        }

        this.token = token;
        this.companyId = companyId;
        this.rateLimiter = new RateLimiter(
            RATE_LIMIT.MAX_REQUESTS,
            RATE_LIMIT.WINDOW_MS
        );
    }

    /**
     * Core request method with rate limiting, auth headers, error handling,
     * and exponential backoff retry on 429 responses.
     */
    private async request<T>(
        path: string,
        options: RequestInit = {},
        retries = 3
    ): Promise<T> {
        await this.rateLimiter.waitForSlot();

        const url = `${GHL_BASE_URL}${path}`;
        const headers: Record<string, string> = {
            Authorization: `Bearer ${this.token}`,
            Version: GHL_API_VERSION,
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...(options.headers as Record<string, string>),
        };

        const response = await fetch(url, {
            ...options,
            headers,
        });

        // Rate limited — exponential backoff retry
        if (response.status === 429 && retries > 0) {
            const retryAfter = parseInt(
                response.headers.get('Retry-After') ?? '1',
                10
            );
            const backoffMs = retryAfter * 1000 || Math.pow(2, 4 - retries) * 1000;
            console.warn(
                `[GHLClient] 429 rate limited on ${path}, retrying in ${backoffMs}ms (${retries} retries left)`
            );
            await new Promise((resolve) => setTimeout(resolve, backoffMs));
            return this.request<T>(path, options, retries - 1);
        }

        if (!response.ok) {
            let errorBody: Record<string, unknown> = {};
            try {
                errorBody = await response.json();
            } catch {
                // Ignore JSON parse errors on error responses
            }

            const message =
                (errorBody.message as string) ||
                (errorBody.msg as string) ||
                `HTTP ${response.status} ${response.statusText}`;

            console.error(`[GHLClient] Error on ${options.method ?? 'GET'} ${path}:`, {
                status: response.status,
                message,
                body: errorBody,
            });

            throw new GHLError({
                statusCode: response.status,
                message,
                error: errorBody.error as string | undefined,
            });
        }

        // 204 No Content
        if (response.status === 204) {
            return undefined as unknown as T;
        }

        return response.json() as Promise<T>;
    }

    // ─── Locations ─────────────────────────────────────────────────────────────

    async searchLocations(params: SearchParams = {}): Promise<GHLLocationSearchResponse> {
        const query = new URLSearchParams({
            companyId: this.companyId,
            skip: String(params.skip ?? 0),
            limit: String(params.limit ?? 20),
        });
        if (params.order) query.set('order', params.order);
        if (params.query) query.set('query', params.query);

        return this.request<GHLLocationSearchResponse>(
            `/locations/search?${query.toString()}`
        );
    }

    async getLocation(locationId: string): Promise<{ location: GHLLocation }> {
        return this.request<{ location: GHLLocation }>(`/locations/${locationId}`);
    }

    async createLocation(data: CreateLocationData): Promise<{ location: GHLLocation }> {
        return this.request<{ location: GHLLocation }>('/locations', {
            method: 'POST',
            body: JSON.stringify({ ...data, companyId: this.companyId }),
        });
    }

    async updateLocation(
        locationId: string,
        data: UpdateLocationData
    ): Promise<{ location: GHLLocation }> {
        return this.request<{ location: GHLLocation }>(`/locations/${locationId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteLocation(locationId: string): Promise<void> {
        return this.request<void>(`/locations/${locationId}`, {
            method: 'DELETE',
        });
    }

    // ─── SaaS Plans ────────────────────────────────────────────────────────────

    async getPlans(): Promise<GHLPlansResponse> {
        return this.request<GHLPlansResponse>(
            `/saas/agency-plans/${this.companyId}`
        );
    }

    // ─── SaaS Subscriptions ────────────────────────────────────────────────────

    async getLocationSubscription(locationId: string): Promise<GHLSubscription> {
        return this.request<GHLSubscription>(
            `/saas/location-subscription/${locationId}`
        );
    }

    async updateSubscription(
        locationId: string,
        data: UpdateSubscriptionData
    ): Promise<GHLSubscription> {
        return this.request<GHLSubscription>(
            `/saas/update-subscription/${locationId}`,
            {
                method: 'PUT',
                body: JSON.stringify({ ...data, companyId: this.companyId }),
            }
        );
    }

    // ─── SaaS Sub-Accounts ─────────────────────────────────────────────────────

    async getSaasSubAccounts(): Promise<{ locations: GHLSaasSubAccount[] }> {
        const query = new URLSearchParams({ companyId: this.companyId });
        return this.request<{ locations: GHLSaasSubAccount[] }>(
            `/saas/sub-accounts?${query.toString()}`
        );
    }

    // ─── Bulk Enable SaaS ──────────────────────────────────────────────────────

    async bulkEnableSaas(
        locationIds: string[],
        planId: string
    ): Promise<{ success: boolean; results: BulkOperationResult[] }> {
        return this.request(`/saas/bulk-enable`, {
            method: 'POST',
            body: JSON.stringify({
                locationIds,
                planId,
                companyId: this.companyId,
            }),
        });
    }

    // ─── Rebilling ─────────────────────────────────────────────────────────────

    async updateRebilling(
        locationId: string,
        data: UpdateRebillingData
    ): Promise<{ success: boolean }> {
        return this.request(`/saas/update-rebilling/${locationId}`, {
            method: 'PUT',
            body: JSON.stringify({ ...data, companyId: this.companyId }),
        });
    }

    // ─── Bulk Delete (sequential with results) ─────────────────────────────────

    async bulkDeleteLocations(
        locationIds: string[]
    ): Promise<BulkOperationResult[]> {
        const results: BulkOperationResult[] = [];

        for (const locationId of locationIds) {
            try {
                await this.deleteLocation(locationId);
                results.push({ locationId, status: 'success' });
            } catch (err) {
                const message =
                    err instanceof GHLError ? err.message : 'Unknown error';
                results.push({ locationId, status: 'error', error: message });
            }
        }

        return results;
    }

    // ─── Custom Menus ──────────────────────────────────────────────────────────

    async getCustomMenus(): Promise<{ customMenus: GHLCustomMenu[] }> {
        const query = new URLSearchParams({ companyId: this.companyId });
        return this.request<{ customMenus: GHLCustomMenu[] }>(
            `/custom-menus/?${query.toString()}`
        );
    }

    async createCustomMenu(
        data: CreateCustomMenuData
    ): Promise<{ customMenu: GHLCustomMenu }> {
        return this.request<{ customMenu: GHLCustomMenu }>('/custom-menus/', {
            method: 'POST',
            body: JSON.stringify({ ...data, companyId: this.companyId }),
        });
    }

    async updateCustomMenu(
        menuId: string,
        data: UpdateCustomMenuData
    ): Promise<{ customMenu: GHLCustomMenu }> {
        return this.request<{ customMenu: GHLCustomMenu }>(
            `/custom-menus/${menuId}`,
            {
                method: 'PUT',
                body: JSON.stringify(data),
            }
        );
    }

    async deleteCustomMenu(menuId: string): Promise<void> {
        return this.request<void>(`/custom-menus/${menuId}`, {
            method: 'DELETE',
        });
    }

    // ─── SaaS Plan helper ──────────────────────────────────────────────────────

    async getPlanById(planId: string): Promise<GHLSaasPlan | undefined> {
        const { plans } = await this.getPlans();
        return plans.find((p) => p.id === planId);
    }
}

// ─── Singleton Export ─────────────────────────────────────────────────────────
// Instantiated lazily so it doesn't blow up during build if env vars are missing.

let _client: GHLClient | null = null;

export function getGHLClient(): GHLClient {
    if (!_client) {
        _client = new GHLClient();
    }
    return _client;
}

// Convenience default export
export const ghlClient = {
    get instance() {
        return getGHLClient();
    },
};
