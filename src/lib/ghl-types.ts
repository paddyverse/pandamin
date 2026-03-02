// ─── Location ────────────────────────────────────────────────────────────────

export interface GHLLocationSettings {
    allowDuplicateContact?: boolean;
    allowDuplicateOpportunity?: boolean;
    allowFacebookNameMerge?: boolean;
    disableContactTimezone?: boolean;
}

export interface GHLLocation {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    website?: string;
    timezone?: string;
    settings?: GHLLocationSettings;
    dateAdded?: string;
    companyId: string;
}

export interface GHLLocationSearchResponse {
    locations: GHLLocation[];
    count: number;
    total: number;
}

// ─── SaaS Plans ──────────────────────────────────────────────────────────────

export interface GHLSaasPlan {
    id: string;
    name: string;
    description?: string;
    price: number;
    features: string[];
    trialDays?: number;
    currency?: string;
}

export interface GHLPlansResponse {
    plans: GHLSaasPlan[];
}

// ─── SaaS Subscription ───────────────────────────────────────────────────────

export interface GHLSubscription {
    locationId: string;
    planId: string;
    planName?: string;
    status: 'active' | 'inactive' | 'trialing' | 'past_due' | 'canceled';
    paymentProvider?: string;
    customerId?: string;
    subscriptionId?: string;
    startDate?: string;
    nextBillingDate?: string;
    trialEndDate?: string;
}

// ─── SaaS Sub-Accounts ───────────────────────────────────────────────────────

export interface GHLSaasSubAccount {
    locationId: string;
    locationName: string;
    planId: string;
    planName?: string;
    active: boolean;
}

// ─── Rebilling ───────────────────────────────────────────────────────────────

export interface GHLRebillingConfig {
    enabled: boolean;
    markup?: number;
    phoneEnabled?: boolean;
    emailEnabled?: boolean;
    smsEnabled?: boolean;
    callsEnabled?: boolean;
    premiumActionsEnabled?: boolean;
    conversationsEnabled?: boolean;
    workflowActionsEnabled?: boolean;
}

// ─── Custom Menus ────────────────────────────────────────────────────────────

export type GHLMenuOpenMode = 'iframe' | 'new_tab' | 'same_tab';
export type GHLMenuShowTo = 'all' | 'admins' | 'users';

export interface GHLCustomMenu {
    id: string;
    companyId: string;
    name: string;
    url: string;
    iconUrl?: string;
    openMode: GHLMenuOpenMode;
    showOnAllLocations: boolean;
    locationIds: string[];
    showTo: GHLMenuShowTo;
}

// ─── Errors ───────────────────────────────────────────────────────────────────

export interface GHLApiError {
    statusCode: number;
    message: string;
    error?: string;
}

export class GHLError extends Error {
    public readonly statusCode: number;
    public readonly error?: string;

    constructor(data: GHLApiError) {
        super(data.message);
        this.name = 'GHLError';
        this.statusCode = data.statusCode;
        this.error = data.error;
    }
}

// ─── Query / Request Params ───────────────────────────────────────────────────

export interface SearchParams {
    skip?: number;
    limit?: number;
    order?: 'asc' | 'desc';
    query?: string;
}

export interface CreateLocationData {
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    website?: string;
    timezone?: string;
    settings?: Partial<GHLLocationSettings>;
}

export type UpdateLocationData = Partial<CreateLocationData>;

export interface UpdateSubscriptionData {
    planId: string;
}

export interface UpdateRebillingData {
    enabled: boolean;
    markup?: number;
    phoneEnabled?: boolean;
    emailEnabled?: boolean;
    smsEnabled?: boolean;
    callsEnabled?: boolean;
    premiumActionsEnabled?: boolean;
    conversationsEnabled?: boolean;
    workflowActionsEnabled?: boolean;
}

export interface CreateCustomMenuData {
    name: string;
    url: string;
    iconUrl?: string;
    openMode?: GHLMenuOpenMode;
    showOnAllLocations?: boolean;
    locationIds?: string[];
    showTo?: GHLMenuShowTo;
}

export type UpdateCustomMenuData = Partial<CreateCustomMenuData>;

// ─── Bulk Results ────────────────────────────────────────────────────────────

export interface BulkOperationResult {
    locationId: string;
    status: 'success' | 'error';
    error?: string;
}
