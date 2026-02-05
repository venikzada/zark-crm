import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Google Calendar API base URL
const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

// Sync tasks to Google Calendar
export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json(
            { error: 'Not authenticated' },
            { status: 401 }
        );
    }

    // Get user's Google Calendar integration
    const { data: integration } = await supabase
        .from('user_integrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('provider', 'google_calendar')
        .single();

    if (!integration) {
        return NextResponse.json(
            { error: 'Google Calendar not connected' },
            { status: 400 }
        );
    }

    // Check if token is expired and refresh if needed
    let accessToken = integration.access_token;
    const expiresAt = new Date(integration.expires_at);

    if (expiresAt <= new Date()) {
        // Refresh token
        const refreshed = await refreshGoogleToken(integration.refresh_token);
        if (!refreshed) {
            return NextResponse.json(
                { error: 'Failed to refresh token' },
                { status: 401 }
            );
        }
        accessToken = refreshed.access_token;

        // Update tokens in database
        await supabase
            .from('user_integrations')
            .update({
                access_token: refreshed.access_token,
                expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
            })
            .eq('id', integration.id);
    }

    const body = await request.json();
    const { action, taskId, calendarId = 'primary' } = body;

    if (action === 'sync_task') {
        // Get task details
        const { data: task } = await supabase
            .from('tasks')
            .select('*')
            .eq('id', taskId)
            .single();

        if (!task) {
            return NextResponse.json(
                { error: 'Task not found' },
                { status: 404 }
            );
        }

        // Create calendar event
        const eventData = {
            summary: task.title,
            description: task.description || '',
            start: {
                date: task.due_date,
            },
            end: {
                date: task.due_date,
            },
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'popup', minutes: 30 },
                    { method: 'email', minutes: 60 },
                ],
            },
            colorId: getPriorityColor(task.priority),
        };

        const response = await fetch(
            `${GOOGLE_CALENDAR_API}/calendars/${calendarId}/events`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(eventData),
            }
        );

        const event = await response.json();

        if (event.error) {
            return NextResponse.json(
                { error: event.error.message },
                { status: 400 }
            );
        }

        // Store event ID in task metadata
        await supabase
            .from('tasks')
            .update({
                metadata: {
                    google_calendar_event_id: event.id,
                },
            })
            .eq('id', taskId);

        return NextResponse.json({
            success: true,
            event_id: event.id,
            event_link: event.htmlLink,
        });
    }

    if (action === 'get_calendars') {
        // List user's calendars
        const response = await fetch(
            `${GOOGLE_CALENDAR_API}/users/me/calendarList`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            }
        );

        const calendars = await response.json();

        if (calendars.error) {
            return NextResponse.json(
                { error: calendars.error.message },
                { status: 400 }
            );
        }

        return NextResponse.json({
            calendars: calendars.items.map((cal: any) => ({
                id: cal.id,
                name: cal.summary,
                primary: cal.primary || false,
                color: cal.backgroundColor,
            })),
        });
    }

    if (action === 'sync_all') {
        // Get all tasks with due dates
        const { data: tasks } = await supabase
            .from('tasks')
            .select('*')
            .eq('assignee_id', user.id)
            .eq('is_archived', false)
            .not('due_date', 'is', null);

        const results = [];

        for (const task of tasks || []) {
            // Skip if already synced
            if ((task.metadata as any)?.google_calendar_event_id) continue;

            const eventData = {
                summary: task.title,
                description: task.description || '',
                start: { date: task.due_date },
                end: { date: task.due_date },
                colorId: getPriorityColor(task.priority),
            };

            try {
                const response = await fetch(
                    `${GOOGLE_CALENDAR_API}/calendars/${calendarId}/events`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(eventData),
                    }
                );

                const event = await response.json();

                if (!event.error) {
                    await supabase
                        .from('tasks')
                        .update({
                            metadata: { google_calendar_event_id: event.id },
                        })
                        .eq('id', task.id);

                    results.push({ task_id: task.id, success: true });
                }
            } catch (err) {
                results.push({ task_id: task.id, success: false });
            }
        }

        return NextResponse.json({
            success: true,
            synced: results.filter(r => r.success).length,
            total: tasks?.length || 0,
        });
    }

    return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
    );
}

// Helper to refresh Google token
async function refreshGoogleToken(refreshToken: string) {
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
        return null;
    }

    try {
        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: GOOGLE_CLIENT_ID,
                client_secret: GOOGLE_CLIENT_SECRET,
                refresh_token: refreshToken,
                grant_type: 'refresh_token',
            }),
        });

        const tokens = await response.json();

        if (tokens.error) {
            return null;
        }

        return tokens;
    } catch {
        return null;
    }
}

// Map priority to Google Calendar color
function getPriorityColor(priority: string): string {
    const colorMap: Record<string, string> = {
        urgent: '11', // Red
        high: '6',    // Orange
        medium: '5',  // Yellow
        low: '10',    // Green
    };
    return colorMap[priority] || '7'; // Default cyan
}
