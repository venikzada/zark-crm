import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL + '/api/auth/google/callback';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
        return NextResponse.redirect(
            new URL('/dashboard/settings?error=google_auth_failed', request.url)
        );
    }

    if (!code) {
        return NextResponse.redirect(
            new URL('/dashboard/settings?error=no_code', request.url)
        );
    }

    try {
        // Exchange code for tokens
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                code,
                client_id: GOOGLE_CLIENT_ID,
                client_secret: GOOGLE_CLIENT_SECRET,
                redirect_uri: REDIRECT_URI,
                grant_type: 'authorization_code',
            }),
        });

        const tokens = await tokenResponse.json();

        if (tokens.error) {
            console.error('Google token error:', tokens.error);
            return NextResponse.redirect(
                new URL('/dashboard/settings?error=token_exchange_failed', request.url)
            );
        }

        // Get user info from Google
        const userInfoResponse = await fetch(
            'https://www.googleapis.com/oauth2/v2/userinfo',
            {
                headers: {
                    Authorization: `Bearer ${tokens.access_token}`,
                },
            }
        );

        const googleUser = await userInfoResponse.json();

        // Get current user from Supabase
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.redirect(
                new URL('/login?error=not_authenticated', request.url)
            );
        }

        // Store tokens in user_integrations table
        const { error: dbError } = await supabase
            .from('user_integrations')
            .upsert({
                user_id: user.id,
                provider: 'google_calendar',
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token,
                expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
                provider_user_id: googleUser.id,
                provider_email: googleUser.email,
                metadata: {
                    name: googleUser.name,
                    picture: googleUser.picture,
                },
            }, {
                onConflict: 'user_id,provider',
            });

        if (dbError) {
            console.error('Database error:', dbError);
            return NextResponse.redirect(
                new URL('/dashboard/settings?error=database_error', request.url)
            );
        }

        // Redirect back to settings with success
        return NextResponse.redirect(
            new URL('/dashboard/settings?success=google_connected', request.url)
        );

    } catch (err) {
        console.error('Google OAuth error:', err);
        return NextResponse.redirect(
            new URL('/dashboard/settings?error=server_error', request.url)
        );
    }
}
