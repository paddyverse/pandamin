/**
 * Token-bucket rate limiter for GHL API calls.
 * Ensures we stay within 100 requests per 10-second window.
 */
export class RateLimiter {
    private readonly maxRequests: number;
    private readonly windowMs: number;
    private timestamps: number[] = [];

    constructor(maxRequests: number = 100, windowMs: number = 10_000) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
    }

    /**
     * Waits until a request slot is available within the rate limit window,
     * then claims it. Non-blocking to the rest of the app — only the caller awaits.
     */
    async waitForSlot(): Promise<void> {
        return new Promise((resolve) => {
            const attempt = () => {
                const now = Date.now();
                // Remove timestamps outside the current window
                this.timestamps = this.timestamps.filter(
                    (ts) => now - ts < this.windowMs
                );

                if (this.timestamps.length < this.maxRequests) {
                    this.timestamps.push(now);
                    resolve();
                } else {
                    // Calculate how long until the oldest request expires
                    const oldest = this.timestamps[0];
                    const waitMs = this.windowMs - (now - oldest) + 1;
                    setTimeout(attempt, waitMs);
                }
            };

            attempt();
        });
    }
}
