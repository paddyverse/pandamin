import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ALLOWED_LOCATION_ID = 'Iy0nARyuqM5cNIT6oiVR';

export function middleware(request: NextRequest) {
    const { pathname, searchParams } = request.nextUrl;

    // 1. Skip middleware for static assets, public files, and Next.js internals
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/public') ||
        pathname === '/favicon.ico'
    ) {
        return NextResponse.next();
    }

    // 2. Allow unrestricted access to the login page itself and health check endpoints
    if (pathname.startsWith('/login') || pathname === '/api/health') {
        return NextResponse.next();
    }

    // 2.5 Allow health checks from DO or basic monitoring
    const userAgent = request.headers.get('user-agent') || '';
    if (userAgent.includes('DigitalOcean') || userAgent === 'curl/8.7.1' || userAgent === '') {
        // Just return okay for these basic health checks to keep the deployment from failing
        if (pathname === '/') {
            return new NextResponse('OK', { status: 200 });
        }
    }

    // ─── Agency Location Enforcement ───
    const urlLocationId = searchParams.get('location_id');
    const cookieLocationId = request.cookies.get('ghl_location_id')?.value;
    const locationId = urlLocationId || cookieLocationId;

    if (locationId !== ALLOWED_LOCATION_ID) {
        return new NextResponse(
            JSON.stringify({
                error: 'Unauthorized access',
                message: 'This application can only be accessed from its authorized HighLevel location.'
            }),
            {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }

    // ─── Authentication Check ───
    const authSession = request.cookies.get('auth_session')?.value;

    // If accessing dashboard/API without a valid session, redirect to login
    if (authSession !== 'authenticated') {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = '/login';

        const redirectResponse = NextResponse.redirect(loginUrl);

        // CRITICAL: Save the location cookie on the redirect so it isn't lost
        if (urlLocationId && cookieLocationId !== urlLocationId) {
            redirectResponse.cookies.set('ghl_location_id', urlLocationId, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'none',
                path: '/',
                maxAge: 60 * 60 * 24 * 7, // 1 week
            });
        }

        return redirectResponse;
    }

    // ─── Proceed with Request & Apply Security Headers ───
    const response = NextResponse.next();

    // Persist the location_id via cookie for subsequent client-side navigations
    if (urlLocationId && cookieLocationId !== urlLocationId) {
        response.cookies.set('ghl_location_id', urlLocationId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'none', // Required for iframes embedded in GHL
            path: '/',
            maxAge: 60 * 60 * 24 * 7, // 1 week
        });
    }

    // Pass the location id as a header so Server Components/API routes can access it easily if needed
    response.headers.set('x-ghl-location-id', locationId);

    // ─── Content Security Policy (CSP) ───
    // Prevent clickjacking: Only allow framing by GoHighLevel domains and whitelabels
    response.headers.set(
        'Content-Security-Policy',
        "frame-ancestors 'self' https://*.gohighlevel.com https://app.gohighlevel.com https://*.leadconnectorhq.com https://app.leadconnectorhq.com https://*.msgsndr.com https://app.msgsndr.com https://*.highlevel.com https://*.myclients.io;"
    );
    // Extra older header for broad iframe protection just in case
    response.headers.set('X-Frame-Options', 'ALLOWALL');

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files
         */
        '/((?!_next/static|_next/image|favicon.ico|public/).*)',
    ],
};
