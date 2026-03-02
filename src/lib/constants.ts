/**
 * PandaDash GHL Agency Dashboard — Global Constants
 */

// ─── GHL API ────────────────────────────────────────────────────────────────
export const GHL_BASE_URL = 'https://services.leadconnectorhq.com';
export const GHL_API_VERSION = '2021-07-28';

// ─── Rate Limiting ───────────────────────────────────────────────────────────
export const RATE_LIMIT = {
    MAX_REQUESTS: 100,
    WINDOW_MS: 10_000,
} as const;

// ─── Pagination ──────────────────────────────────────────────────────────────
export const PAGINATION = {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
} as const;

// ─── TanStack Query Keys ─────────────────────────────────────────────────────
export const QUERY_KEYS = {
    locations: ['locations'] as const,
    location: (id: string) => ['locations', id] as const,
    saasPlans: ['saasPlans'] as const,
    saasAccounts: ['saasAccounts'] as const,
    subscription: (id: string) => ['subscription', id] as const,
    rebilling: (id: string) => ['rebilling', id] as const,
} as const;

// ─── Stale Times (ms) ────────────────────────────────────────────────────────
export const STALE_TIMES = {
    locations: 2 * 60 * 1000,      // 2 minutes
    saasPlans: 10 * 60 * 1000,     // 10 minutes
    subscriptions: 5 * 60 * 1000,  // 5 minutes
} as const;
