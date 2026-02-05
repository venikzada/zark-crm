import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// This endpoint sends the daily digest to users via WhatsApp
// Can be called by a cron job (e.g., Vercel Cron)
export async function GET(request: NextRequest) {
    // Verify cron secret (for security)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        );
    }

    const supabase = await createClient();

    try {
        // Get all users with WhatsApp integration and daily digest enabled
        const { data: integrations, error: intError } = await supabase
            .from('user_integrations')
            .select(`
        user_id,
        provider_user_id,
        metadata
      `)
            .eq('provider', 'whatsapp');

        if (intError) throw intError;

        const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
        const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

        if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
            return NextResponse.json(
                { error: 'WhatsApp not configured' },
                { status: 500 }
            );
        }

        const results = [];

        for (const integration of integrations || []) {
            // Get today's tasks for this user
            const today = new Date().toISOString().split('T')[0];

            const { data: tasks } = await supabase
                .from('tasks')
                .select(`
          id,
          title,
          priority,
          due_date,
          column:columns(name)
        `)
                .eq('assignee_id', integration.user_id)
                .eq('is_archived', false)
                .lte('due_date', today)
                .order('priority', { ascending: false });

            if (!tasks || tasks.length === 0) continue;

            // Build message
            const priorityEmoji: Record<string, string> = {
                urgent: '🔴',
                high: '🟠',
                medium: '🟡',
                low: '🟢',
            };

            let message = `*📋 Suas tarefas para hoje:*\n\n`;

            tasks.forEach((task, index) => {
                const emoji = priorityEmoji[task.priority] || '⚪';
                message += `${index + 1}. ${emoji} *${task.title}*\n`;
                if (task.due_date) {
                    message += `   📅 ${new Date(task.due_date).toLocaleDateString('pt-BR')}\n`;
                }
            });

            message += `\n_Total: ${tasks.length} tarefa(s)_`;
            message += `\n\nResponda "Ver" para abrir no app.`;

            // Send WhatsApp message
            const phoneNumber = (integration.metadata as any)?.phone_number || integration.provider_user_id;

            try {
                const response = await fetch(
                    `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            messaging_product: 'whatsapp',
                            to: phoneNumber.replace(/\D/g, ''),
                            type: 'text',
                            text: { body: message },
                        }),
                    }
                );

                const result = await response.json();
                results.push({
                    user_id: integration.user_id,
                    success: !result.error,
                    tasks_count: tasks.length,
                });
            } catch (err) {
                results.push({
                    user_id: integration.user_id,
                    success: false,
                    error: String(err),
                });
            }
        }

        return NextResponse.json({
            success: true,
            processed: results.length,
            results,
        });

    } catch (err) {
        console.error('Daily digest error:', err);
        return NextResponse.json(
            { error: 'Server error' },
            { status: 500 }
        );
    }
}

// Manual trigger for testing
export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json(
            { error: 'Not authenticated' },
            { status: 401 }
        );
    }

    // Get user's WhatsApp integration
    const { data: integration } = await supabase
        .from('user_integrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('provider', 'whatsapp')
        .single();

    if (!integration) {
        return NextResponse.json(
            { error: 'WhatsApp not connected' },
            { status: 400 }
        );
    }

    // Get today's tasks
    const today = new Date().toISOString().split('T')[0];

    const { data: tasks } = await supabase
        .from('tasks')
        .select(`
      id,
      title,
      priority,
      due_date
    `)
        .eq('assignee_id', user.id)
        .eq('is_archived', false)
        .lte('due_date', today);

    // Build message
    const priorityEmoji: Record<string, string> = {
        urgent: '🔴',
        high: '🟠',
        medium: '🟡',
        low: '🟢',
    };

    let message = `*📋 Suas tarefas para hoje:*\n\n`;

    (tasks || []).forEach((task, index) => {
        const emoji = priorityEmoji[task.priority] || '⚪';
        message += `${index + 1}. ${emoji} *${task.title}*\n`;
    });

    if (!tasks || tasks.length === 0) {
        message = `*✅ Você não tem tarefas pendentes para hoje!*\n\nAproveite seu dia!`;
    } else {
        message += `\n_Total: ${tasks.length} tarefa(s)_`;
    }

    const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
    const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
        // Return preview for demo
        return NextResponse.json({
            success: true,
            demo: true,
            message,
            tasks_count: tasks?.length || 0,
        });
    }

    // Send actual message
    const phoneNumber = (integration.metadata as any)?.phone_number;

    await fetch(
        `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: phoneNumber.replace(/\D/g, ''),
                type: 'text',
                text: { body: message },
            }),
        }
    );

    return NextResponse.json({
        success: true,
        message: 'Digest sent',
        tasks_count: tasks?.length || 0,
    });
}
