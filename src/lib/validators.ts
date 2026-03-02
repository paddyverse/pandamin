import { z } from 'zod';

// ─── Location Schemas ────────────────────────────────────────────────────────

export const CreateLocationSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100),
    phone: z.string().optional(),
    email: z.string().email('Invalid email address').optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().default('US'),
    postalCode: z.string().optional(),
    website: z.string().url('Invalid URL').optional(),
    timezone: z.string().optional(),
    settings: z
        .object({
            allowDuplicateContact: z.boolean().optional(),
            allowDuplicateOpportunity: z.boolean().optional(),
            allowFacebookNameMerge: z.boolean().optional(),
            disableContactTimezone: z.boolean().optional(),
        })
        .optional(),
});

export const UpdateLocationSchema = CreateLocationSchema.partial();

// ─── Bulk Operation Schemas ──────────────────────────────────────────────────

export const BulkDeleteSchema = z.object({
    locationIds: z
        .array(z.string().min(1))
        .min(1, 'At least one location ID is required'),
});

export const BulkUpdateSchema = z.object({
    locationIds: z
        .array(z.string().min(1))
        .min(1, 'At least one location ID is required'),
    updates: UpdateLocationSchema,
});

// ─── SaaS Schemas ────────────────────────────────────────────────────────────

export const BulkEnableSaasSchema = z.object({
    locationIds: z
        .array(z.string().min(1))
        .min(1, 'At least one location ID is required'),
    planId: z.string().min(1, 'Plan ID is required'),
});

export const UpdateSubscriptionSchema = z.object({
    planId: z.string().min(1, 'Plan ID is required'),
});

export const UpdateRebillingSchema = z.object({
    enabled: z.boolean(),
    markup: z.number().min(0).max(500).optional(),
    phoneEnabled: z.boolean().optional(),
    emailEnabled: z.boolean().optional(),
    smsEnabled: z.boolean().optional(),
    callsEnabled: z.boolean().optional(),
    premiumActionsEnabled: z.boolean().optional(),
    conversationsEnabled: z.boolean().optional(),
    workflowActionsEnabled: z.boolean().optional(),
});

// ─── Custom Menu Schemas ──────────────────────────────────────────────────────

export const CreateCustomMenuSchema = z.object({
    name: z.string().min(1, 'Name is required').max(50),
    url: z.string().url('Must be a valid URL'),
    iconUrl: z.string().url('Must be a valid URL').optional(),
    openMode: z.enum(['iframe', 'new_tab', 'same_tab']).default('iframe'),
    showOnAllLocations: z.boolean().default(false),
    locationIds: z.array(z.string()).default([]),
    showTo: z.enum(['all', 'admins', 'users']).default('all'),
});

export const UpdateCustomMenuSchema = CreateCustomMenuSchema.partial();

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type CreateLocationInput = z.infer<typeof CreateLocationSchema>;
export type UpdateLocationInput = z.infer<typeof UpdateLocationSchema>;
export type BulkDeleteInput = z.infer<typeof BulkDeleteSchema>;
export type BulkUpdateInput = z.infer<typeof BulkUpdateSchema>;
export type BulkEnableSaasInput = z.infer<typeof BulkEnableSaasSchema>;
export type UpdateSubscriptionInput = z.infer<typeof UpdateSubscriptionSchema>;
export type UpdateRebillingInput = z.infer<typeof UpdateRebillingSchema>;
export type CreateCustomMenuInput = z.infer<typeof CreateCustomMenuSchema>;
export type UpdateCustomMenuInput = z.infer<typeof UpdateCustomMenuSchema>;
